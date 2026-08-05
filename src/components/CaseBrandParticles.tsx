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

type LogoTarget = {
  id: string
  imageUrl: string
  /** Override global particleSize for this logo (CSS px). */
  particleSize?: number
  /** Override global particleGap for this logo (CSS px). */
  particleGap?: number
  /** Grow silhouette before sampling (CSS px radius). */
  dilate?: number
}

type LogoRuntime = {
  id: string
  imageUrl: string
  img: HTMLImageElement | null
  stage: { x: number; y: number; w: number; h: number }
  particleSize: number
  particleGap: number
  dilate: number
  psDev: number
  gap: number
  sampledW: number
  sampledH: number
}

type CaseParticle = {
  logoIndex: number
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
  hoverT: number
  psDev: number
}

const DEFAULT_MARK_SELECTORS = [
  '.case-brand__mark',
  '.case-brand__img',
  '.case-brand',
]

type Props = {
  logoTargets?: LogoTarget[]
  /** Drawn square size in CSS px (default 1.5). */
  particleSize?: number
  /** Empty space between particle edges in CSS px (default 1). Lattice pitch = size + gap. */
  particleGap?: number
  /** Dark ink on light cases section (match solid case logos). */
  color?: string
  /** Section that drives assemble range + IntersectionObserver. */
  sectionId?: string
  /** Row/card selector for hover resolve (e.g. `.case`, `.award-card`). */
  rowSelector?: string
  /** Fallback DOM scrape when logoTargets is empty. */
  fallbackSelector?: string
  /** Stage measure preference: first match wins. */
  markSelectors?: string[]
  className?: string
  canvasClassName?: string
}

function parseHex(c: string) {
  const h = c.replace('#', '')
  if (h.length < 6) return { r: 21, g: 22, b: 27 }
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

function latticeFromCss(sizeCss: number, gapCss: number, dpr: number) {
  const psDev = Math.max(1, Math.round(Math.max(0.5, sizeCss) * dpr))
  const gapDev = gapCss > 0 ? Math.max(1, Math.round(gapCss * dpr)) : 0
  const pitchDev = psDev + gapDev
  return {
    psDev,
    gap: pitchDev / dpr,
  }
}

function sampleLogo(
  img: HTMLImageElement,
  localW: number,
  localH: number,
  gap: number,
  _dilate: number
) {
  // Same lattice sampling as client logos (GearFlowBridge).
  return sampleClientLogoPoints(img, localW, localH, gap, 0, 0.06)
}

/**
 * Logo lattice swarms (cases / awards): assemble on scroll, solid reveal on row hover.
 */
export default function CaseBrandParticles({
  logoTargets = [],
  particleSize = 1.5,
  particleGap = 1,
  color = '#15161b',
  sectionId = 'cases',
  rowSelector = '.case',
  fallbackSelector = '.case[data-logo-id]',
  markSelectors = DEFAULT_MARK_SELECTORS,
  className = 'case-brand-particles',
  canvasClassName = 'case-brand-particles__canvas',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<CaseParticle[]>([])
  const logosRef = useRef<LogoRuntime[]>([])
  const startedRef = useRef(false)
  const rangeRef = useRef({ start: 0, end: 1 })
  const smoothProgressRef = useRef(0)
  const latchedProgressRef = useRef(0)
  const particleUiReadyRef = useRef(false)
  const hoveredLogoIndexRef = useRef(-1)
  const colorRef = useRef(parseHex(color))
  colorRef.current = parseHex(color)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr0 = window.devicePixelRatio || 1
    const defaultLattice = latticeFromCss(
      Math.max(0.5, Number(particleSize) || 1),
      Math.max(0, Number(particleGap) || 0),
      dpr0
    )

    const resolveMark = (cell: HTMLElement | null) => {
      if (!cell) return null
      for (const sel of markSelectors) {
        const hit = cell.querySelector(sel) as HTMLElement | null
        if (hit) return hit
      }
      return cell
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const refreshLogoStages = () => {
      for (const logo of logosRef.current) {
        const cell = document.getElementById(logo.id)
        const mark = resolveMark(cell)
        const box = measurePageBox(mark)
        if (box) logo.stage = box
      }
    }

    const updateRange = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const section = document.getElementById(sectionId)
      const sectionRect = section?.getBoundingClientRect()
      refreshLogoStages()
      const vh = window.innerHeight
      const sectionDocTop = sectionRect != null ? scrollY + sectionRect.top : scrollY
      const start = sectionDocTop - vh * 0.7
      const end = sectionDocTop - vh * 0.12
      rangeRef.current = {
        start,
        end: Math.max(start + 120, end),
      }
    }

    const markParticleReady = (ready: boolean) => {
      for (const logo of logosRef.current) {
        document.getElementById(logo.id)?.classList.toggle('is-particle-ready', ready)
      }
    }

    const makeParticle = (
      logo: LogoRuntime,
      logoIndex: number,
      home: { homeX: number; homeY: number; a?: number },
      i: number,
      reuse?: CaseParticle
    ): CaseParticle => {
      const cx = logo.stage.x + logo.stage.w * 0.5
      const cy = logo.stage.y + logo.stage.h * 0.5
      const scatterAngle = reuse?.scatterAngle ?? Math.random() * Math.PI * 2
      const scatterDist = reuse?.scatterDist ?? 140 + Math.random() * 320
      const startX = cx + Math.cos(scatterAngle) * scatterDist
      const startY = cy + Math.sin(scatterAngle) * scatterDist
      return {
        logoIndex,
        pageX: reuse?.pageX ?? startX,
        pageY: reuse?.pageY ?? startY,
        scatterAngle,
        scatterDist,
        scatterPageX: startX,
        scatterPageY: startY,
        logoLocalX: home.homeX,
        logoLocalY: home.homeY,
        logoPageX: logo.stage.x + home.homeX,
        logoPageY: logo.stage.y + home.homeY,
        a: home.a ?? 255,
        stagger: reuse?.stagger ?? ((i % 19) / 19) * 0.38 + Math.random() * 0.06,
        arcNormal:
          reuse?.arcNormal ??
          (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65),
        arcLift: reuse?.arcLift ?? 28 + Math.random() * 70,
        arcBias: reuse?.arcBias ?? 0.25 + Math.random() * 0.5,
        flightPhase: reuse?.flightPhase ?? Math.random() * Math.PI * 2,
        hoverT: reuse?.hoverT ?? 0,
        psDev: logo.psDev,
      }
    }

    /** Full lattice rebuild when stage size changes — remap alone keeps the old sparse silhouette. */
    const rebuildLogoParticles = (force = false) => {
      refreshLogoStages()
      const logos = logosRef.current
      if (!logos.length) return

      let needsRebuild = force || !particlesRef.current.length
      if (!needsRebuild) {
        for (const logo of logos) {
          const w = Math.max(2, Math.round(logo.stage.w))
          const h = Math.max(2, Math.round(logo.stage.h))
          if (Math.abs(w - logo.sampledW) > 1 || Math.abs(h - logo.sampledH) > 1) {
            needsRebuild = true
            break
          }
        }
      }
      if (!needsRebuild) return

      const byLogo = new Map<number, CaseParticle[]>()
      for (const p of particlesRef.current) {
        const list = byLogo.get(p.logoIndex) || []
        list.push(p)
        byLogo.set(p.logoIndex, list)
      }

      const next: CaseParticle[] = []
      logos.forEach((logo, logoIndex) => {
        if (!logo.img) return
        const localW = Math.max(2, Math.round(logo.stage.w))
        const localH = Math.max(2, Math.round(logo.stage.h))
        logo.sampledW = localW
        logo.sampledH = localH
        const sampled = sampleLogo(logo.img, localW, localH, logo.gap, logo.dilate)
        const prev = byLogo.get(logoIndex) || []
        sampled.points.forEach((home, i) => {
          next.push(makeParticle(logo, logoIndex, home, i, prev[i]))
        })
      })
      particlesRef.current = next
    }

    const resetFlow = () => {
      particlesRef.current = []
      startedRef.current = false
      smoothProgressRef.current = 0
      latchedProgressRef.current = 0
      particleUiReadyRef.current = false
      hoveredLogoIndexRef.current = -1
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
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const scrollX = window.scrollX || window.pageXOffset
      const scrollY = window.scrollY || window.pageYOffset
      const { start, end } = rangeRef.current
      const raw = clamp01((scrollY - start) / Math.max(1, end - start))
      const target = Math.max(latchedProgressRef.current, raw)
      if (target > latchedProgressRef.current) latchedProgressRef.current = target
      const blend = 1 - Math.exp((-dt / 1000) * 3.2)
      smoothProgressRef.current += (target - smoothProgressRef.current) * blend
      const progress = smoothProgressRef.current
      const particles = particlesRef.current
      if (!particles.length) return

      const base = colorRef.current
      const vw = window.innerWidth
      const vh = window.innerHeight

      for (const p of particles) {
        const logo = logosRef.current[p.logoIndex]
        if (!logo) continue
        const stage = logo.stage
        const cx = stage.x + stage.w * 0.5
        const cy = stage.y + stage.h * 0.5
        p.logoPageX = stage.x + p.logoLocalX
        p.logoPageY = stage.y + p.logoLocalY
        p.scatterPageX = cx + Math.cos(p.scatterAngle) * p.scatterDist
        p.scatterPageY = cy + Math.sin(p.scatterAngle) * p.scatterDist
      }

      if (progress <= 0.06 && particleUiReadyRef.current) {
        particleUiReadyRef.current = false
        markParticleReady(false)
      } else if (progress >= 0.12 && !particleUiReadyRef.current) {
        particleUiReadyRef.current = true
        markParticleReady(true)
      }

      const hovered = hoveredLogoIndexRef.current

      ctx.setTransform(1, 0, 0, 1, 0, 0)
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

        const wantHover = hovered === p.logoIndex && progress > 0.75 ? 1 : 0
        p.hoverT += (wantHover - p.hoverT) * 0.14

        const x = point.x - scrollX
        const y = point.y - scrollY
        if (x < -24 || y < -24 || x > vw + 24 || y > vh + 24) continue

        const alpha = 0.2 + 0.8 * clamp01((progress - p.stagger * 0.15) / 0.85)
        const hoverFade = 1 - easeInOut(p.hoverT)
        ctx.fillStyle = `rgba(${base.r},${base.g},${base.b},${(p.a / 255) * alpha * hoverFade})`
        const size = p.psDev || defaultLattice.psDev
        ctx.fillRect(
          Math.floor(x * dpr - size / 2 + 1e-9),
          Math.floor(y * dpr - size / 2 + 1e-9),
          size,
          size
        )
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    draw()

    const markResizeObserver = new ResizeObserver(() => {
      if (!startedRef.current) return
      updateRange()
      rebuildLogoParticles()
    })
    const observeMarks = () => {
      markResizeObserver.disconnect()
      for (const logo of logosRef.current) {
        const cell = document.getElementById(logo.id)
        const mark = resolveMark(cell)
        if (mark) markResizeObserver.observe(mark)
      }
    }

    let starting = false
    const startFlow = async () => {
      if (startedRef.current || starting) return
      starting = true
      try {
        const configs: LogoTarget[] = logoTargets.length
          ? logoTargets
          : Array.from(document.querySelectorAll<HTMLElement>(fallbackSelector)).map((el) => ({
              id: el.dataset.logoId || el.id,
              imageUrl: el.dataset.logoSrc || '',
            }))

        const logos: LogoRuntime[] = []
        await Promise.all(
          configs.map(async (cfg) => {
            if (!cfg.id || !cfg.imageUrl) return
            let img: HTMLImageElement | null = null
            try {
              img = await loadImage(cfg.imageUrl)
            } catch {
              img = null
            }
            const cell = document.getElementById(cfg.id)
            const mark = resolveMark(cell)
            const stage = measurePageBox(mark) || { x: 0, y: 0, w: 160, h: 80 }
            const sizeCss = cfg.particleSize ?? Math.max(0.5, Number(particleSize) || 1)
            const gapCss = cfg.particleGap ?? Math.max(0, Number(particleGap) || 0)
            const dilate = Math.max(0, cfg.dilate ?? 0)
            const lattice = latticeFromCss(sizeCss, gapCss, dpr0)
            logos.push({
              id: cfg.id,
              imageUrl: cfg.imageUrl,
              img,
              stage,
              particleSize: sizeCss,
              particleGap: gapCss,
              dilate,
              psDev: lattice.psDev,
              gap: lattice.gap,
              sampledW: 0,
              sampledH: 0,
            })
          })
        )
        logosRef.current = logos.filter((l) => l.img)
        if (!logosRef.current.length) return

        startedRef.current = true
        smoothProgressRef.current = 0
        latchedProgressRef.current = 0
        updateRange()
        rebuildLogoParticles(true)
        particleUiReadyRef.current = true
        markParticleReady(true)
        observeMarks()
      } finally {
        starting = false
      }
    }

    const section = document.getElementById(sectionId)
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
    if (section) io.observe(section)

    const onScroll = () => {
      if (startedRef.current) updateRange()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onResize = () => {
      resize()
      if (!startedRef.current || !particlesRef.current.length) return
      updateRange()
      rebuildLogoParticles()
    }
    window.addEventListener('resize', onResize)

    const resolveLogoIndex = (el: HTMLElement | null) => {
      if (!el) return -1
      const row = el.closest(rowSelector) as HTMLElement | null
      if (!row) return -1
      const id = row.id || row.dataset.logoId
      if (!id) return -1
      return logosRef.current.findIndex((l) => l.id === id)
    }

    const onPointerOver = (e: Event) => {
      const idx = resolveLogoIndex(e.target as HTMLElement)
      if (idx >= 0) hoveredLogoIndexRef.current = idx
    }
    const onPointerOut = (e: Event) => {
      const t = e.target as HTMLElement
      const related = (e as MouseEvent).relatedTarget as HTMLElement | null
      const from = t.closest(rowSelector) as HTMLElement | null
      if (!from) return
      if (related?.closest?.(rowSelector) === from) return
      const idx = resolveLogoIndex(from)
      if (idx === hoveredLogoIndexRef.current) hoveredLogoIndexRef.current = -1
    }
    document.addEventListener('pointerover', onPointerOver)
    document.addEventListener('pointerout', onPointerOut)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('pointerover', onPointerOver)
      document.removeEventListener('pointerout', onPointerOut)
      markResizeObserver.disconnect()
      io.disconnect()
      resetFlow()
    }
  }, [
    logoTargets,
    particleSize,
    particleGap,
    sectionId,
    rowSelector,
    fallbackSelector,
    markSelectors,
  ])

  return (
    <div className={className} aria-hidden="true">
      <canvas ref={canvasRef} className={canvasClassName} />
    </div>
  )
}
