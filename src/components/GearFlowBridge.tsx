import React, { useEffect, useRef } from 'react'
import {
  sampleGearPoints as sampleGearPointsRaw,
  projectGearLocal as projectGearLocalRaw,
  sampleClientLogoPoints as sampleClientLogoPointsRaw,
} from './originkit/SvgParticles'

const sampleGearPoints = sampleGearPointsRaw as (
  W: number,
  H: number,
  gap: number,
  count: number,
  stage?: { x: number; y: number; w: number; h: number } | null
) => {
  points: {
    homeX: number
    homeY: number
    localX?: number
    localY?: number
    localZ?: number
  }[]
  rect: { x: number; y: number; w: number; h: number }
  stage: { x: number; y: number; w: number; h: number }
}

const projectGearLocal = projectGearLocalRaw as (
  localX: number,
  localY: number,
  localZ: number,
  spin: number,
  stage: { x: number; y: number; w: number; h: number }
) => { homeX: number; homeY: number }

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

type LogoTargetConfig = {
  id: string
  imageUrl: string
}

type LogoRuntime = {
  id: string
  imageUrl: string
  img: HTMLImageElement | null
  stage: { x: number; y: number; w: number; h: number }
}

type FlowParticle = {
  logoIndex: number
  pageX: number
  pageY: number
  /** Scatter anchor relative to logo cell center. */
  scatterAngle: number
  scatterDist: number
  heroPageX: number
  heroPageY: number
  /** Assembled logo home (updated on resize). */
  logoPageX: number
  logoPageY: number
  logoLocalX: number
  logoLocalY: number
  localX: number
  localY: number
  localZ: number
  gearPageX: number
  gearPageY: number
  departPageX: number
  departPageY: number
  r: number
  g: number
  b: number
  a: number
  colorIdx: number
  stagger: number
  logoArcNormal: number
  logoArcLift: number
  logoArcBias: number
  gearArcNormal: number
  gearArcLift: number
  gearArcBias: number
  flightPhase: number
  hoverT: number
}

type Props = {
  scenariosId?: string
  /** Drawn square size in CSS px (default 1.5). */
  particleSize?: number
  /** Empty space between particle edges in CSS px (default 1). Lattice pitch = size + gap. */
  particleGap?: number
  color?: string
  logoTargets?: LogoTargetConfig[]
}

function parseHex(c: string) {
  const h = c.replace('#', '')
  if (h.length < 6) return { r: 0, g: 158, b: 227 }
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
    x:
      inv * inv * startX +
      2 * inv * t * controlX +
      t * t * endX +
      nx * flutter,
    y:
      inv * inv * startY +
      2 * inv * t * controlY +
      t * t * endY +
      ny * flutter,
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

function measureGearStagePage(section: HTMLElement) {
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  const secRect = section.getBoundingClientRect()
  const head = section.querySelector('.section-head') as HTMLElement | null
  const grid = section.querySelector('.product-grid') as HTMLElement | null
  const headRect = head?.getBoundingClientRect()
  const gridRect = grid?.getBoundingClientRect()

  const topClient = (headRect?.top ?? secRect.top) - 36
  const bottomClient = (gridRect?.top ?? secRect.top + secRect.height * 0.55) + 20
  const band = Math.max(200, bottomClient - topClient)
  const h = band * 1.35
  const w = Math.min(secRect.width * 0.72, window.innerWidth * 0.58)
  const leftClient = secRect.left + (secRect.width - w) * 0.5
  const y = topClient + scrollY + (band - h) * 0.2
  return {
    x: leftClient + scrollX,
    y,
    w,
    h: Math.max(280, h),
  }
}

/**
 * Independent client-logo particle swarm (hero-style lattice).
 * Scroll assemble ↔ reverse-scroll scatter. Not tied to hero handoff.
 */
export default function GearFlowBridge({
  scenariosId = 'scenarios',
  particleSize = 1.5,
  particleGap = 1,
  color = '#ffffff',
  logoTargets = [],
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<FlowParticle[]>([])
  const logosRef = useRef<LogoRuntime[]>([])
  const startedRef = useRef(false)
  const gearStageRef = useRef({ x: 0, y: 0, w: 1, h: 1 })
  const rangesRef = useRef({
    logoStart: 0,
    logoEnd: 1,
    gearStart: 1,
    gearEnd: 2,
  })
  const spinRef = useRef(0)
  const hoveredLogoIndexRef = useRef(-1)
  const departedToGearRef = useRef(false)
  const smoothLogoProgressRef = useRef(0)
  const smoothGearProgressRef = useRef(0)
  const latchedLogoProgressRef = useRef(0)
  const particleUiReadyRef = useRef(false)
  const colorRef = useRef(parseHex(color))
  colorRef.current = parseHex(color)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const psCss = Math.max(0.5, Number(particleSize) || 1)
    const gapBetween = Math.max(0, Number(particleGap) || 0)
    // Device-pixel metrics keep size/gap uniform (no subpixel AA bleed).
    const dpr0 = window.devicePixelRatio || 1
    const psDev = Math.max(1, Math.round(psCss * dpr0))
    const gapDev = gapBetween > 0 ? Math.max(1, Math.round(gapBetween * dpr0)) : 0
    const pitchDev = psDev + gapDev
    const ps = psDev / dpr0
    const gap = pitchDev / dpr0

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
        const mark =
          (cell?.querySelector('.client-logo-img') as HTMLElement | null) ||
          (cell?.querySelector('.client-logo-mark') as HTMLElement | null) ||
          cell
        const box = measurePageBox(mark)
        if (box) logo.stage = box
      }
    }

    const updateRanges = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const clients = document.getElementById('clients')
      const clientsRect = clients?.getBoundingClientRect()
      const section = document.getElementById(scenariosId)
      if (section) gearStageRef.current = measureGearStagePage(section)
      refreshLogoStages()

      // Progress is driven by where #clients sits in the viewport:
      // top ≈ 70% vh → scattered; top ≈ 12% vh → fully assembled.
      // Reverse scroll (section moves down) lowers progress and disperses.
      const vh = window.innerHeight
      const clientsDocTop =
        clientsRect != null ? scrollY + clientsRect.top : scrollY
      const logoStart = clientsDocTop - vh * 0.7
      const logoEnd = clientsDocTop - vh * 0.12

      rangesRef.current = {
        logoStart,
        logoEnd: Math.max(logoStart + 120, logoEnd),
        gearStart: Number.POSITIVE_INFINITY,
        gearEnd: Number.POSITIVE_INFINITY,
      }
    }

    const resetFlow = () => {
      particlesRef.current = []
      startedRef.current = false
      spinRef.current = 0
      departedToGearRef.current = false
      smoothLogoProgressRef.current = 0
      smoothGearProgressRef.current = 0
      latchedLogoProgressRef.current = 0
      particleUiReadyRef.current = false
      hoveredLogoIndexRef.current = -1
      for (const logo of logosRef.current) {
        document.getElementById(logo.id)?.classList.remove('is-particle-ready')
      }
    }

    const applyLogoHomes = () => {
      refreshLogoStages()
      const byLogo = new Map<number, FlowParticle[]>()
      for (const p of particlesRef.current) {
        const list = byLogo.get(p.logoIndex) || []
        list.push(p)
        byLogo.set(p.logoIndex, list)
      }
      for (const [logoIndex, group] of byLogo) {
        const logo = logosRef.current[logoIndex]
        if (!logo?.img || !group.length) continue
        const localW = Math.max(2, Math.round(logo.stage.w))
        const localH = Math.max(2, Math.round(logo.stage.h))
        const sampled = sampleClientLogoPoints(
          logo.img,
          localW,
          localH,
          gap,
          group.length,
          0.06
        )
        group.forEach((p, i) => {
          const home = sampled.points[i] || sampled.points[sampled.points.length - 1]
          if (!home) return
          p.logoLocalX = home.homeX
          p.logoLocalY = home.homeY
          p.logoPageX = logo.stage.x + home.homeX
          p.logoPageY = logo.stage.y + home.homeY
        })
      }
    }

    const applyGearHomes = () => {
      const stage = gearStageRef.current
      const n = particlesRef.current.length
      if (!n) return
      const localW = Math.max(2, Math.round(stage.w))
      const localH = Math.max(2, Math.round(stage.h))
      const sampled = sampleGearPoints(localW, localH, 2, n, {
        x: 0,
        y: 0,
        w: localW,
        h: localH,
      })
      const localStage = { x: 0, y: 0, w: localW, h: localH }
      particlesRef.current.forEach((p, i) => {
        const home = sampled.points[i] || sampled.points[sampled.points.length - 1]
        p.localX = home.localX ?? 0
        p.localY = home.localY ?? 0
        p.localZ = home.localZ ?? 0.14
        const projected = projectGearLocal(
          p.localX,
          p.localY,
          p.localZ,
          spinRef.current,
          localStage
        )
        p.gearPageX = stage.x + projected.homeX
        p.gearPageY = stage.y + projected.homeY
      })
    }

    const markParticleReady = (ready: boolean) => {
      for (const logo of logosRef.current) {
        document.getElementById(logo.id)?.classList.toggle('is-particle-ready', ready)
      }
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
      const { logoStart, logoEnd, gearStart, gearEnd } = rangesRef.current

      // One-way latch: assemble progresses forward only. Once the logos
      // are built from particles they stay built on reverse scroll.
      const rawLogoProgress = clamp01(
        (scrollY - logoStart) / Math.max(1, logoEnd - logoStart)
      )
      latchedLogoProgressRef.current = Math.max(
        latchedLogoProgressRef.current,
        rawLogoProgress
      )
      const targetLogoProgress = latchedLogoProgressRef.current
      const targetGearProgress = clamp01(
        (scrollY - gearStart) / Math.max(1, gearEnd - gearStart)
      )
      const follow = 1 - Math.exp(-dt / 190)
      smoothLogoProgressRef.current +=
        (targetLogoProgress - smoothLogoProgressRef.current) * follow
      smoothGearProgressRef.current +=
        (targetGearProgress - smoothGearProgressRef.current) * follow
      const logoProgress = clamp01(smoothLogoProgressRef.current)
      const gearProgress = clamp01(smoothGearProgressRef.current)

      refreshLogoStages()

      // Keep scatter anchors tied to current logo cells (wide cloud, reversible).
      for (const p of particles) {
        const logo = logosRef.current[p.logoIndex]
        if (!logo) continue
        p.logoPageX = logo.stage.x + p.logoLocalX
        p.logoPageY = logo.stage.y + p.logoLocalY
        const cx = logo.stage.x + logo.stage.w * 0.5
        const cy = logo.stage.y + logo.stage.h * 0.5
        p.heroPageX = cx + Math.cos(p.scatterAngle) * p.scatterDist
        p.heroPageY = cy + Math.sin(p.scatterAngle) * p.scatterDist
      }

      // Solid logos while fully scattered; particle silhouettes while assembling.
      if (logoProgress <= 0.06 && particleUiReadyRef.current) {
        particleUiReadyRef.current = false
        markParticleReady(false)
      } else if (logoProgress >= 0.12 && !particleUiReadyRef.current) {
        particleUiReadyRef.current = true
        markParticleReady(true)
      }

      const stage = gearStageRef.current
      const localStage = { x: 0, y: 0, w: Math.max(2, stage.w), h: Math.max(2, stage.h) }
      const assemblingGear = gearProgress > 0.02
      const gearAssembled = gearProgress >= 0.985

      if (gearAssembled) spinRef.current += 0.0045

      if (assemblingGear && !departedToGearRef.current) {
        for (const p of particles) {
          p.departPageX = p.logoPageX
          p.departPageY = p.logoPageY
        }
        departedToGearRef.current = true
        applyGearHomes()
      }
      if (!assemblingGear && departedToGearRef.current) {
        departedToGearRef.current = false
      }

      if (assemblingGear) {
        for (const p of particles) {
          const projected = projectGearLocal(
            p.localX,
            p.localY,
            p.localZ,
            spinRef.current,
            localStage
          )
          p.gearPageX = stage.x + projected.homeX
          p.gearPageY = stage.y + projected.homeY
        }
      }

      const hovered = hoveredLogoIndexRef.current

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      for (const p of particles) {
        let pageX = p.pageX
        let pageY = p.pageY

        if (assemblingGear) {
          const local = clamp01((gearProgress - p.stagger * 0.45) / (1 - p.stagger * 0.45))
          const t = easeInOut(local)
          const point = curvedSwarmPoint(
            p.departPageX,
            p.departPageY,
            p.gearPageX,
            p.gearPageY,
            t,
            p.gearArcNormal,
            p.gearArcLift,
            p.gearArcBias,
            p.flightPhase + 1.7
          )
          pageX = point.x
          pageY = point.y
          p.hoverT += (0 - p.hoverT) * 0.12
        } else {
          // Scatter ↔ assemble driven by scroll (reversible).
          const local = clamp01((logoProgress - p.stagger * 0.4) / (1 - p.stagger * 0.4))
          const t = easeInOut(local)
          const point = curvedSwarmPoint(
            p.heroPageX,
            p.heroPageY,
            p.logoPageX,
            p.logoPageY,
            t,
            p.logoArcNormal,
            p.logoArcLift,
            p.logoArcBias,
            p.flightPhase
          )
          pageX = point.x
          pageY = point.y

          const wantHover = hovered === p.logoIndex && logoProgress > 0.75 ? 1 : 0
          p.hoverT += (wantHover - p.hoverT) * 0.14
        }

        p.pageX = pageX
        p.pageY = pageY

        const x = pageX - scrollX
        const y = pageY - scrollY
        if (x < -24 || y < -24 || x > vw + 24 || y > vh + 24) continue

        const ht = p.hoverT
        const alpha = assemblingGear
          ? 0.55 + 0.4 * clamp01((gearProgress - p.stagger * 0.25) / 0.7)
          : 0.2 + 0.8 * clamp01((logoProgress - p.stagger * 0.15) / 0.85)
        const hoverFade = 1 - easeInOut(ht)

        ctx.fillStyle = `rgba(${base.r},${base.g},${base.b},${(p.a / 255) * alpha * hoverFade})`
        // Integer device pixels: preserves uniform 1css gap with 1.5css size.
        ctx.fillRect(
          Math.floor(x * dpr - psDev / 2 + 1e-9),
          Math.floor(y * dpr - psDev / 2 + 1e-9),
          psDev,
          psDev
        )
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    draw()

    let starting = false
    const startFlow = async () => {
      if (startedRef.current || starting) return
      starting = true

      try {
        const configs = logoTargets.length
          ? logoTargets
          : Array.from(document.querySelectorAll<HTMLElement>('.logo-cell[data-logo-id]')).map(
              (el) => ({
                id: el.dataset.logoId || el.id,
                imageUrl: el.dataset.logoSrc || '',
              })
            )

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
            const mark =
              (cell?.querySelector('.client-logo-img') as HTMLElement | null) ||
              (cell?.querySelector('.client-logo-mark') as HTMLElement | null) ||
              cell
            const stage = measurePageBox(mark) || { x: 0, y: 0, w: 160, h: 80 }
            logos.push({ id: cfg.id, imageUrl: cfg.imageUrl, img, stage })
          })
        )
        logosRef.current = logos.filter((l) => l.img)
        if (!logosRef.current.length) {
          starting = false
          return
        }

        startedRef.current = true
        departedToGearRef.current = false
        spinRef.current = 0
        smoothLogoProgressRef.current = 0
        smoothGearProgressRef.current = 0
        latchedLogoProgressRef.current = 0
        updateRanges()

        const brand = colorRef.current
        const next: FlowParticle[] = []

        logosRef.current.forEach((logo, logoIndex) => {
          if (!logo.img) return
          const localW = Math.max(2, Math.round(logo.stage.w))
          const localH = Math.max(2, Math.round(logo.stage.h))
          // Full lattice — no thinning (hero-style density).
          const sampled = sampleClientLogoPoints(logo.img, localW, localH, gap, 0, 0.06)

          sampled.points.forEach((home, i) => {
            const logoPageX = logo.stage.x + home.homeX
            const logoPageY = logo.stage.y + home.homeY
            const scatterAngle = Math.random() * Math.PI * 2
            // Far cloud so reverse scroll clearly disperses the silhouette.
            const scatterDist = 140 + Math.random() * 320
            const cx = logo.stage.x + logo.stage.w * 0.5
            const cy = logo.stage.y + logo.stage.h * 0.5
            const startX = cx + Math.cos(scatterAngle) * scatterDist
            const startY = cy + Math.sin(scatterAngle) * scatterDist

            next.push({
              logoIndex,
              pageX: startX,
              pageY: startY,
              scatterAngle,
              scatterDist,
              heroPageX: startX,
              heroPageY: startY,
              logoPageX,
              logoPageY,
              logoLocalX: home.homeX,
              logoLocalY: home.homeY,
              localX: 0,
              localY: 0,
              localZ: 0.14,
              gearPageX: startX,
              gearPageY: startY,
              departPageX: startX,
              departPageY: startY,
              r: brand.r,
              g: brand.g,
              b: brand.b,
              a: home.a ?? 255,
              colorIdx: i % 10,
              stagger: ((i % 19) / 19) * 0.38 + Math.random() * 0.06,
              logoArcNormal:
                (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.65),
              logoArcLift: 28 + Math.random() * 70,
              logoArcBias: 0.25 + Math.random() * 0.5,
              gearArcNormal:
                (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.7),
              gearArcLift: 45 + Math.random() * 150,
              gearArcBias: 0.28 + Math.random() * 0.44,
              flightPhase: Math.random() * Math.PI * 2,
              hoverT: 0,
            })
          })
        })

        particlesRef.current = next
        particleUiReadyRef.current = true
        markParticleReady(true)
      } finally {
        starting = false
      }
    }

    const clients = document.getElementById('clients')
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
    if (clients) io.observe(clients)

    const onScroll = () => {
      if (startedRef.current) updateRanges()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    const onResize = () => {
      resize()
      if (!startedRef.current || !particlesRef.current.length) return
      updateRanges()
      applyLogoHomes()
      applyGearHomes()
    }
    window.addEventListener('resize', onResize)

    const resolveLogoIndex = (el: HTMLElement | null) => {
      if (!el) return -1
      const cell = el.closest('.logo-cell') as HTMLElement | null
      if (!cell) return -1
      const id = cell.id || cell.dataset.logoId
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
      const from = t.closest('.logo-cell') as HTMLElement | null
      if (!from) return
      if (related?.closest?.('.logo-cell') === from) return
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
      io.disconnect()
      resetFlow()
    }
  }, [scenariosId, particleSize, particleGap, logoTargets])

  return (
    <div className="gear-flow-bridge" aria-hidden="true">
      <canvas ref={canvasRef} className="gear-flow-bridge__canvas" />
    </div>
  )
}
