import React, { useEffect, useRef } from 'react'
import { sampleClientLogoPoints as sampleClientLogoPointsRaw } from './originkit/SvgParticles'

const sampleClientLogoPoints = sampleClientLogoPointsRaw as (
  img: HTMLImageElement,
  W: number,
  H: number,
  gap: number,
  count: number,
  padRatio?: number
) => {
  points: { homeX: number; homeY: number; r: number; g: number; b: number; a: number }[]
  rect: { x: number; y: number; w: number; h: number }
  stage: { x: number; y: number; w: number; h: number }
}

type BrandParticle = {
  pageX: number
  pageY: number
  scatterAngle: number
  scatterDist: number
  scatterPageX: number
  scatterPageY: number
  logoLocalX: number
  logoLocalY: number
  logoPageX: number
  logoPageY: number
  a: number
  stagger: number
  arcNormal: number
  arcLift: number
  arcBias: number
  flightPhase: number
}

type Props = {
  /** Id of the footer brand container holding the solid img. */
  targetId?: string
  particleSize?: number
  /** Lattice pitch — match hero/client swarms (default 4). */
  particleGap?: number
  color?: string
}

function parseHex(c: string) {
  const h = c.replace('#', '')
  if (h.length < 6) return { r: 255, g: 255, b: 255 }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

function measurePageBox(el: HTMLElement | null) {
  if (!el) return null
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  const r = el.getBoundingClientRect()
  return {
    x: r.left + scrollX,
    y: r.top + scrollY,
    w: Math.max(2, r.width),
    h: Math.max(2, r.height),
  }
}

/**
 * Footer brand logo assembled from particles — same recipe as the client
 * logo swarm (GearFlowBridge): white lattice particles fly in on scroll
 * along Bezier arcs, one-way latch keeps the built logo on reverse scroll.
 */
export default function FooterBrandParticles({
  targetId = 'footer-brand',
  particleSize = 10,
  particleGap = 4,
  color = '#ffffff',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<BrandParticle[]>([])
  const startedRef = useRef(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const stageRef = useRef({ x: 0, y: 0, w: 2, h: 2 })
  const rangeRef = useRef({ start: 0, end: 1 })
  const smoothProgressRef = useRef(0)
  const latchedProgressRef = useRef(0)
  const particleUiReadyRef = useRef(false)
  const colorRef = useRef(parseHex(color))
  colorRef.current = parseHex(color)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gap = Math.max(2, Math.round(particleGap))
    // Same rhythm as hero/client canvases: particleSize/4 CSS px squares.
    const ps = Math.max(2, Math.round(particleSize / 4))

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const getSolidImg = () =>
      document.querySelector<HTMLElement>(`#${targetId} img`)

    const refreshStage = () => {
      const box = measurePageBox(getSolidImg())
      if (box) stageRef.current = box
    }

    const updateRange = () => {
      refreshStage()
      const vh = window.innerHeight
      const doc = document.documentElement
      const maxScroll = Math.max(0, doc.scrollHeight - vh)
      const brandDocTop = stageRef.current.y
      // Assemble while the brand scrolls into view; the footer sits at the
      // page bottom, so the end point is clamped to reachable scroll.
      const start = brandDocTop - vh * 0.95
      const end = Math.min(brandDocTop - vh * 0.45, maxScroll - 8)
      rangeRef.current = {
        start: Math.min(start, end - 160),
        end,
      }
    }

    const markParticleReady = (ready: boolean) => {
      document.getElementById(targetId)?.classList.toggle('is-particle-ready', ready)
    }

    const applyHomes = () => {
      refreshStage()
      const img = imgRef.current
      const group = particlesRef.current
      if (!img || !group.length) return
      const stage = stageRef.current
      const sampled = sampleClientLogoPoints(
        img,
        Math.max(2, Math.round(stage.w)),
        Math.max(2, Math.round(stage.h)),
        gap,
        group.length,
        0
      )
      group.forEach((p, i) => {
        const home = sampled.points[i] || sampled.points[sampled.points.length - 1]
        if (!home) return
        p.logoLocalX = home.homeX
        p.logoLocalY = home.homeY
      })
    }

    const resetFlow = () => {
      particlesRef.current = []
      startedRef.current = false
      smoothProgressRef.current = 0
      latchedProgressRef.current = 0
      particleUiReadyRef.current = false
      markParticleReady(false)
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
      const vw = window.innerWidth
      const vh = window.innerHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, vw, vh)

      const particles = particlesRef.current
      if (!particles.length) return

      const base = colorRef.current
      const scrollX = window.scrollX || window.pageXOffset
      const scrollY = window.scrollY || window.pageYOffset
      const { start, end } = rangeRef.current

      // One-way latch: once the brand is built it stays built.
      const rawProgress = clamp01((scrollY - start) / Math.max(1, end - start))
      latchedProgressRef.current = Math.max(latchedProgressRef.current, rawProgress)
      const follow = 1 - Math.exp(-dt / 190)
      smoothProgressRef.current +=
        (latchedProgressRef.current - smoothProgressRef.current) * follow
      const progress = clamp01(smoothProgressRef.current)

      refreshStage()
      const stage = stageRef.current
      const cx = stage.x + stage.w * 0.5
      const cy = stage.y + stage.h * 0.5
      for (const p of particles) {
        p.logoPageX = stage.x + p.logoLocalX
        p.logoPageY = stage.y + p.logoLocalY
        p.scatterPageX = cx + Math.cos(p.scatterAngle) * p.scatterDist
        p.scatterPageY = cy + Math.sin(p.scatterAngle) * p.scatterDist
      }

      // Solid logo while scattered; particle silhouette while assembling.
      if (progress <= 0.06 && particleUiReadyRef.current) {
        particleUiReadyRef.current = false
        markParticleReady(false)
      } else if (progress >= 0.12 && !particleUiReadyRef.current) {
        particleUiReadyRef.current = true
        markParticleReady(true)
      }

      for (const p of particles) {
        const local = clamp01((progress - p.stagger * 0.4) / (1 - p.stagger * 0.4))
        const t = easeInOut(local)
        const point = curvedSwarmPoint(
          p.scatterPageX,
          p.scatterPageY,
          p.logoPageX,
          p.logoPageY,
          t,
          p.arcNormal,
          p.arcLift,
          p.arcBias,
          p.flightPhase
        )
        p.pageX = point.x
        p.pageY = point.y

        const x = point.x - scrollX
        const y = point.y - scrollY
        if (x < -24 || y < -24 || x > vw + 24 || y > vh + 24) continue

        const alpha = 0.2 + 0.8 * clamp01((progress - p.stagger * 0.15) / 0.85)
        ctx.fillStyle = `rgba(${base.r},${base.g},${base.b},${(p.a / 255) * alpha})`
        ctx.fillRect(Math.round(x - ps / 2), Math.round(y - ps / 2), ps, ps)
      }
    }
    draw()

    let starting = false
    const startFlow = async () => {
      if (startedRef.current || starting) return
      starting = true
      try {
        const solid = getSolidImg() as HTMLImageElement | null
        if (!solid?.src) return
        let img: HTMLImageElement | null = null
        try {
          img = await loadImage(solid.src)
        } catch {
          img = null
        }
        if (!img) return
        imgRef.current = img

        startedRef.current = true
        smoothProgressRef.current = 0
        latchedProgressRef.current = 0
        updateRange()

        const stage = stageRef.current
        const sampled = sampleClientLogoPoints(
          img,
          Math.max(2, Math.round(stage.w)),
          Math.max(2, Math.round(stage.h)),
          gap,
          0,
          0
        )
        const cx = stage.x + stage.w * 0.5
        const cy = stage.y + stage.h * 0.5
        const next: BrandParticle[] = sampled.points.map((home, i) => {
          const scatterAngle = Math.random() * Math.PI * 2
          const scatterDist = 140 + Math.random() * 320
          const startX = cx + Math.cos(scatterAngle) * scatterDist
          const startY = cy + Math.sin(scatterAngle) * scatterDist
          return {
            pageX: startX,
            pageY: startY,
            scatterAngle,
            scatterDist,
            scatterPageX: startX,
            scatterPageY: startY,
            logoLocalX: home.homeX,
            logoLocalY: home.homeY,
            logoPageX: stage.x + home.homeX,
            logoPageY: stage.y + home.homeY,
            a: home.a ?? 255,
            stagger: ((i % 19) / 19) * 0.38 + Math.random() * 0.06,
            arcNormal: (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65),
            arcLift: 28 + Math.random() * 70,
            arcBias: 0.25 + Math.random() * 0.5,
            flightPhase: Math.random() * Math.PI * 2,
          }
        })
        particlesRef.current = next
      } finally {
        starting = false
      }
    }

    const target = document.getElementById(targetId)
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
    if (target) io.observe(target)

    const onScroll = () => {
      if (startedRef.current) updateRange()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onResize = () => {
      resize()
      if (!startedRef.current || !particlesRef.current.length) return
      updateRange()
      applyHomes()
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
      resetFlow()
    }
  }, [targetId, particleSize, particleGap])

  return (
    <div className="footer-brand-particles" aria-hidden="true">
      <canvas ref={canvasRef} className="footer-brand-particles__canvas" />
    </div>
  )
}
