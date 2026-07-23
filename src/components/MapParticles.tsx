import React, { useEffect, useRef } from 'react'

type MapParticle = {
  /** Current canvas position. */
  x: number
  y: number
  /** Assembled target (map lattice cell). */
  tx: number
  ty: number
  /** Scatter anchor for the fly-in. */
  scatterX: number
  scatterY: number
  /** Retarget tween source. */
  fromX: number
  fromY: number
  r: number
  g: number
  b: number
  a: number
  stagger: number
  arcNormal: number
  arcLift: number
  arcBias: number
  flightPhase: number
  dead: boolean
}

type Props = {
  /** Lattice pitch — match hero/client swarms (default 4). */
  particleGap?: number
  particleSize?: number
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t))
}

function curvedSwarmPoint(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  t: number,
  arcNormal: number,
  arcLift: number,
  arcBias: number,
  phase: number
) {
  const dx = endX - startX
  const dy = endY - startY
  const distance = Math.max(1, Math.hypot(dx, dy))
  const nx = -dy / distance
  const ny = dx / distance
  const bend = arcNormal * Math.min(340, Math.max(90, distance * 0.3))
  const controlX = startX + dx * arcBias + nx * bend
  const controlY = startY + dy * arcBias + ny * bend - arcLift
  const inv = 1 - t
  const envelope = Math.sin(Math.PI * t)
  const flutter = Math.sin(t * Math.PI * 3 + phase) * envelope * 8

  return {
    x: inv * inv * startX + 2 * inv * t * controlX + t * t * endX + nx * flutter,
    y: inv * inv * startY + 2 * inv * t * controlY + t * t * endY + ny * flutter,
  }
}

type SampledPoint = { x: number; y: number; r: number; g: number; b: number; a: number }

/**
 * World map assembled from particles — same swarm recipe as the client and
 * footer logos. Only the country layer is replaced with lattice dots; the
 * interactive marker layer stays live SVG above the canvas. Map state
 * changes (tabs / selection) re-sample the countries and morph the dots.
 */
export default function MapParticles({ particleGap = 4, particleSize = 10 }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<MapParticle[]>([])
  const startedRef = useRef(false)
  const assembledRef = useRef(false)
  const rangeRef = useRef({ start: 0, end: 1 })
  const smoothProgressRef = useRef(0)
  const latchedProgressRef = useRef(0)
  const particleUiReadyRef = useRef(false)
  const morphStartRef = useRef(0)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const stage = root.closest('.map-stage') as HTMLElement | null
    if (!stage) return

    const gap = Math.max(2, Math.round(particleGap))
    // Same rhythm as hero/client canvases: particleSize/4 CSS px squares.
    const ps = Math.max(2, Math.round(particleSize / 4))
    const MORPH_MS = 700

    const getSvg = () => stage.querySelector('svg.rsm-svg') as SVGSVGElement | null

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const box = stage.getBoundingClientRect()
      canvas.width = Math.max(2, Math.round(box.width * dpr))
      canvas.height = Math.max(2, Math.round(box.height * dpr))
    }
    resize()

    /**
     * Rasterize the current country layer (computed colors, current zoom
     * transform, no markers) and sample it on the shared lattice.
     */
    const sampleCountries = async (): Promise<SampledPoint[] | null> => {
      const svg = getSvg()
      if (!svg) return null
      const paths = svg.querySelectorAll('path')
      if (!paths.length) return null
      const svgRect = svg.getBoundingClientRect()
      const stageRect = stage.getBoundingClientRect()
      const W = Math.max(2, Math.round(svgRect.width))
      const H = Math.max(2, Math.round(svgRect.height))
      const offX = svgRect.left - stageRect.left
      const offY = svgRect.top - stageRect.top

      const clone = svg.cloneNode(true) as SVGSVGElement
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      clone.setAttribute('width', String(W))
      clone.setAttribute('height', String(H))
      // Countries only — the marker layer stays live above the canvas.
      clone.querySelectorAll('.rsm-marker').forEach((el) => el.remove())
      // CSS variables don't resolve inside an <img> — inline computed paint.
      const clonePaths = clone.querySelectorAll('path')
      paths.forEach((orig, i) => {
        const target = clonePaths[i]
        if (!target) return
        const cs = getComputedStyle(orig)
        target.setAttribute('fill', cs.fill)
        target.setAttribute('stroke', cs.stroke)
        target.setAttribute('stroke-width', cs.strokeWidth)
        target.removeAttribute('style')
      })

      const url =
        'data:image/svg+xml;charset=utf-8,' +
        encodeURIComponent(new XMLSerializer().serializeToString(clone))
      const img = await new Promise<HTMLImageElement | null>((resolve) => {
        const im = new Image()
        im.onload = () => resolve(im)
        im.onerror = () => resolve(null)
        im.src = url
      })
      if (!img) return null

      const off = document.createElement('canvas')
      off.width = W
      off.height = H
      const oc = off.getContext('2d')
      if (!oc) return null
      oc.drawImage(img, 0, 0, W, H)
      let px: Uint8ClampedArray
      try {
        px = oc.getImageData(0, 0, W, H).data
      } catch {
        return null
      }

      const pts: SampledPoint[] = []
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          const i = (y * W + x) * 4
          const a = px[i + 3]
          if (a < 8) continue
          // Active countries carry the blue fill; the rest are neutral land.
          const isActive = px[i + 2] > px[i] + 40
          pts.push({
            x: x + offX,
            y: y + offY,
            // Active countries stay brand blue; inactive land is white @ 80%.
            r: isActive ? 0 : 255,
            g: isActive ? 158 : 255,
            b: isActive ? 227 : 255,
            a: isActive ? 0.85 : 0.8,
          })
        }
      }
      return pts.length ? pts : null
    }

    /** Serpentine row order keeps index pairing spatially local. */
    const localOrder = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const ra = Math.round(a.y / 24)
      const rb = Math.round(b.y / 24)
      if (ra !== rb) return ra - rb
      return ra % 2 === 0 ? a.x - b.x : b.x - a.x
    }

    const updateRange = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const vh = window.innerHeight
      const top = stage.getBoundingClientRect().top + scrollY
      rangeRef.current = {
        start: top - vh * 0.75,
        end: top - vh * 0.2,
      }
    }

    const markParticleReady = (ready: boolean) => {
      stage.classList.toggle('is-particle-ready', ready)
    }

    const buildParticles = (pts: SampledPoint[]) => {
      const box = stage.getBoundingClientRect()
      const cx = box.width * 0.5
      const cy = box.height * 0.5
      const sorted = [...pts].sort(localOrder)
      particlesRef.current = sorted.map((pt, i) => {
        const scatterAngle = Math.random() * Math.PI * 2
        const scatterDist = 140 + Math.random() * 320
        const sx = cx + Math.cos(scatterAngle) * scatterDist
        const sy = cy + Math.sin(scatterAngle) * scatterDist
        return {
          x: sx,
          y: sy,
          tx: pt.x,
          ty: pt.y,
          scatterX: sx,
          scatterY: sy,
          fromX: sx,
          fromY: sy,
          r: pt.r,
          g: pt.g,
          b: pt.b,
          a: pt.a,
          stagger: ((i % 19) / 19) * 0.38 + Math.random() * 0.06,
          arcNormal: (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65),
          arcLift: 28 + Math.random() * 70,
          arcBias: 0.25 + Math.random() * 0.5,
          flightPhase: Math.random() * Math.PI * 2,
          dead: false,
        }
      })
    }

    /** Morph the existing swarm to a freshly sampled map state. */
    const retarget = (pts: SampledPoint[]) => {
      const particles = particlesRef.current
      if (!particles.length) {
        buildParticles(pts)
        return
      }
      const now = performance.now()
      const sortedTargets = [...pts].sort(localOrder)
      const order = particles
        .map((p, i) => ({ p, i }))
        .sort((a, b) => localOrder({ x: a.p.tx, y: a.p.ty }, { x: b.p.tx, y: b.p.ty }))
      const n = Math.min(order.length, sortedTargets.length)
      for (let k = 0; k < order.length; k++) {
        const p = order[k].p
        p.fromX = p.x
        p.fromY = p.y
        if (k < n) {
          // Spread targets evenly when counts differ so density stays uniform.
          const t = sortedTargets[Math.floor((k * sortedTargets.length) / order.length)]
          p.tx = t.x
          p.ty = t.y
          p.r = t.r
          p.g = t.g
          p.b = t.b
          p.a = t.a
          p.dead = false
        } else {
          p.dead = true
        }
      }
      morphStartRef.current = now
    }

    let raf = 0
    let previousFrame = performance.now()
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const now = performance.now()
      const dt = Math.min(50, Math.max(1, now - previousFrame))
      previousFrame = now
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const box = stage.getBoundingClientRect()
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, box.width, box.height)

      const particles = particlesRef.current
      if (!particles.length) return

      const scrollY = window.scrollY || window.pageYOffset
      const { start, end } = rangeRef.current
      // One-way latch: once the map is built it stays built.
      const rawProgress = clamp01((scrollY - start) / Math.max(1, end - start))
      latchedProgressRef.current = Math.max(latchedProgressRef.current, rawProgress)
      const follow = 1 - Math.exp(-dt / 190)
      smoothProgressRef.current +=
        (latchedProgressRef.current - smoothProgressRef.current) * follow
      const progress = clamp01(smoothProgressRef.current)
      if (!assembledRef.current && latchedProgressRef.current >= 0.999 && progress > 0.985) {
        assembledRef.current = true
      }

      // Solid countries while scattered; lattice dots while assembling.
      if (progress >= 0.1 && !particleUiReadyRef.current) {
        particleUiReadyRef.current = true
        markParticleReady(true)
      }

      const morphT = assembledRef.current
        ? clamp01((now - morphStartRef.current) / MORPH_MS)
        : 1
      const morphEase = morphT * morphT * (3 - 2 * morphT)

      for (const p of particles) {
        let x = p.x
        let y = p.y
        let alpha = 1
        if (!assembledRef.current) {
          const local = clamp01((progress - p.stagger * 0.4) / (1 - p.stagger * 0.4))
          const t = easeInOut(local)
          const point = curvedSwarmPoint(
            p.scatterX,
            p.scatterY,
            p.tx,
            p.ty,
            t,
            p.arcNormal,
            p.arcLift,
            p.arcBias,
            p.flightPhase
          )
          x = point.x
          y = point.y
          alpha = 0.2 + 0.8 * clamp01((progress - p.stagger * 0.15) / 0.85)
        } else {
          x = p.fromX + (p.tx - p.fromX) * morphEase
          y = p.fromY + (p.ty - p.fromY) * morphEase
          if (morphT >= 1) {
            x = p.tx
            y = p.ty
          }
          alpha = p.dead ? 1 - morphEase : 1
        }
        p.x = x
        p.y = y
        if (alpha <= 0.01) continue

        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * p.a})`
        ctx.fillRect(Math.round(x - ps / 2), Math.round(y - ps / 2), ps, ps)
      }
    }
    draw()

    let starting = false
    const startFlow = async () => {
      if (startedRef.current || starting) return
      starting = true
      try {
        const pts = await sampleCountries()
        if (!pts) return
        startedRef.current = true
        updateRange()
        buildParticles(pts)
      } finally {
        starting = false
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.04) {
            void startFlow()
          }
        }
      },
      { threshold: [0.01, 0.05, 0.1], rootMargin: '0px 0px 20% 0px' }
    )
    io.observe(stage)

    // Map state changes (tabs, selection, zoom) mutate the SVG — re-sample
    // after the fill transitions settle and morph the dots to the new state.
    let mutateTimer = 0
    let resampling = false
    const scheduleResample = () => {
      if (!startedRef.current) return
      window.clearTimeout(mutateTimer)
      mutateTimer = window.setTimeout(async () => {
        if (resampling) return
        resampling = true
        try {
          const pts = await sampleCountries()
          if (pts) retarget(pts)
        } finally {
          resampling = false
        }
      }, 650)
    }
    const mo = new MutationObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as Element
        // Ignore the marker layer (pulse/badge churn) — countries only.
        if (target.closest?.('.rsm-marker')) continue
        scheduleResample()
        return
      }
    })
    const svgEl = getSvg()
    if (svgEl) {
      mo.observe(svgEl, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'transform', 'd', 'fill'],
      })
    }

    const onScroll = () => {
      if (startedRef.current && !assembledRef.current) updateRange()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onResize = () => {
      resize()
      if (startedRef.current) scheduleResample()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(mutateTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      io.disconnect()
      mo.disconnect()
      markParticleReady(false)
      particlesRef.current = []
    }
  }, [particleGap, particleSize])

  return (
    <div ref={rootRef} className="map-particles" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
