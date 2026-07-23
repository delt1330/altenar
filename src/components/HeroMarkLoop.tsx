import React, { useEffect, useRef } from 'react'

type Pt = { x: number; y: number }

type HeroParticle = {
  x: number
  y: number
  fromX: number
  fromY: number
  toX: number
  toY: number
  scatterX: number
  scatterY: number
  markX: number
  markY: number
  wordX: number
  wordY: number
  /** Offset from viewport-stage center (logo stays screen-centered). */
  markLocalX: number
  markLocalY: number
  wordLocalX: number
  wordLocalY: number
  r: number
  g: number
  b: number
  fromR: number
  fromG: number
  fromB: number
  toR: number
  toG: number
  toB: number
  a: number
  stagger: number
  arcNormal: number
  arcLift: number
  arcBias: number
  flightPhase: number
  vx: number
  vy: number
  /** Visible during full-screen scatter (~half) to keep the field quiet. */
  scatterKeep: boolean
}

type Phase =
  | 'assembleMark'
  | 'holdMark'
  | 'scatterWhite'
  | 'holdScatterWhite'
  | 'assembleWord'
  | 'holdWord'
  | 'scatterBlue'
  | 'holdScatterBlue'

type Props = {
  markSrc: string
  wordmarkSrc: string
  particleSize?: number
  particleGap?: number
  assembleMs?: number
  holdMs?: number
  scatterMs?: number
  /** Pause in scattered field before the next assemble. */
  scatterHoldMs?: number
  repulsionForce?: number
  repulsionRadius?: number
}

const BLUE = { r: 0, g: 158, b: 227 }
const WHITE = { r: 243, g: 244, b: 245 }

function easeInOut(t: number) {
  // Smootherstep — gentler accel/decel than quadratic ease.
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t))
}

/** Visible viewport slice of the hero, in host-local coordinates. */
function getViewportStage(host: HTMLElement) {
  const box = host.getBoundingClientRect()
  const W = Math.max(2, Math.round(box.width))
  const H = Math.max(2, Math.round(box.height))
  const top = Math.max(0, Math.round(-box.top))
  const bottom = Math.min(H, Math.round(window.innerHeight - box.top))
  if (bottom - top < 32) {
    // Hero mostly off-screen — fall back to full-host center.
    return { W, H, stageTop: 0, stageW: W, stageH: H, cx: W / 2, cy: H / 2 }
  }
  const stageH = Math.max(2, bottom - top)
  return {
    W,
    H,
    stageTop: top,
    stageW: W,
    stageH,
    cx: W / 2,
    cy: top + stageH / 2,
  }
}

function curvedPoint(
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
  const bend = arcNormal * Math.min(280, Math.max(70, distance * 0.28))
  const controlX = startX + dx * arcBias + nx * bend
  const controlY = startY + dy * arcBias + ny * bend - arcLift
  const inv = 1 - t
  const flutter = Math.sin(t * Math.PI * 2 + phase) * Math.sin(Math.PI * t) * 3.5
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

/**
 * Lattice from bright silhouette on dark/transparent art
 * (e.g. altenar-mark-only.svg: white paths on black fill).
 * Avoids sampleClientLogoPoints invert filter, which flattens black-backed SVGs.
 */
function sampleBrightSilhouette(
  img: HTMLImageElement,
  W: number,
  H: number,
  gap: number,
  padRatio = 0.28
) {
  const boxW = Math.max(2, Math.round(W))
  const boxH = Math.max(2, Math.round(H))
  const padX = boxW * padRatio
  const padY = boxH * padRatio
  const availW = Math.max(2, boxW - padX * 2)
  const availH = Math.max(2, boxH - padY * 2)
  const iW = img.naturalWidth || img.width || 1
  const iH = img.naturalHeight || img.height || 1
  const scale = Math.min(availW / iW, availH / iH)
  const dw = iW * scale
  const dh = iH * scale
  const dx = (boxW - dw) / 2
  const dy = (boxH - dh) / 2
  const step = Math.max(2, Math.round(gap))

  const off = document.createElement('canvas')
  off.width = boxW
  off.height = boxH
  const oc = off.getContext('2d')
  if (!oc) return [] as Pt[]
  oc.clearRect(0, 0, boxW, boxH)
  oc.drawImage(img, dx, dy, dw, dh)
  let px: ImageData['data']
  try {
    px = oc.getImageData(0, 0, boxW, boxH).data
  } catch {
    return [] as Pt[]
  }

  const out: Pt[] = []
  const x0 = Math.floor(dx / step) * step
  const y0 = Math.floor(dy / step) * step
  const x1 = Math.ceil(dx + dw)
  const y1 = Math.ceil(dy + dh)
  for (let y = y0; y <= y1; y += step) {
    for (let x = x0; x <= x1; x += step) {
      if (x < 0 || y < 0 || x >= boxW || y >= boxH) continue
      const i = (y * boxW + x) * 4
      const a = px[i + 3]
      const lum = px[i] + px[i + 1] + px[i + 2]
      // Keep bright mark pixels; drop black fill / empty cells.
      if (a < 24 || lum < 200) continue
      out.push({ x, y })
    }
  }
  return out
}

function localOrder(a: Pt, b: Pt) {
  const ra = Math.round(a.y / 24)
  const rb = Math.round(b.y / 24)
  if (ra !== rb) return ra - rb
  return ra % 2 === 0 ? a.x - b.x : b.x - a.x
}

function pairTargets(from: Pt[], to: Pt[]): Pt[] {
  const src = [...from].sort(localOrder)
  const dst = [...to].sort(localOrder)
  const n = Math.max(src.length, dst.length)
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    const s = src[Math.min(i, src.length - 1)]
    const d = dst[Math.floor((i * dst.length) / n)] || dst[dst.length - 1]
    out.push({ x: d.x, y: d.y })
    void s
  }
  return out
}

function copyMaskVisibility(x: number, y: number, zones: { left: number; right: number; top: number; bottom: number; feather: number }[]) {
  let vis = 1
  for (const z of zones) {
    const dx = Math.max(z.left - x, 0, x - z.right)
    const dy = Math.max(z.top - y, 0, y - z.bottom)
    const d = Math.hypot(dx, dy)
    if (d <= 0) {
      vis = 0
      break
    }
    // Smoothstep only inside the feather band; beyond feather → fully visible.
    if (d < z.feather) {
      const t = d / z.feather
      const local = t * t * (3 - 2 * t)
      vis = Math.min(vis, local)
    }
  }
  return vis
}

/**
 * Hero center loop: scatter blue → assemble mark → hold → scatter/white →
 * hold scattered 5s → assemble ALTENAR wordmark → hold → scatter/blue →
 * hold scattered 5s → repeat. Mouse repulsion stays active.
 */
export default function HeroMarkLoop({
  markSrc,
  wordmarkSrc,
  particleSize = 10,
  particleGap = 4,
  assembleMs = 2600,
  holdMs = 6000,
  scatterMs = 2800,
  scatterHoldMs = 5000,
  repulsionForce = 14,
  repulsionRadius = 110,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const host = root.closest('.hero-stack') as HTMLElement | null
    if (!host) return

    const gap = Math.max(2, Math.round(particleGap))
    const ps = Math.max(2, Math.round(particleSize / 4))
    let particles: HeroParticle[] = []
    let phase: Phase = 'assembleMark'
    let phaseStart = performance.now()
    let raf = 0
    let mouse = { x: -99999, y: -99999, active: false }
    let running = true

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const box = host.getBoundingClientRect()
      canvas.width = Math.max(2, Math.round(box.width * dpr))
      canvas.height = Math.max(2, Math.round(box.height * dpr))
    }
    resize()

    const measureZones = () => {
      const hostBox = host.getBoundingClientRect()
      const sels: { sel: string; pad: number; feather: number }[] = [
        { sel: '.hero-slogan-solid__line', pad: 10, feather: 28 },
        { sel: '.hero-product', pad: 4, feather: 28 },
        { sel: '.hero-cta-col', pad: 4, feather: 36 },
        { sel: '.hero-lead-col', pad: 4, feather: 36 },
      ]
      const zones: { left: number; right: number; top: number; bottom: number; feather: number }[] = []
      for (const { sel, pad, feather } of sels) {
        host.querySelectorAll(sel).forEach((el) => {
          const r = (el as HTMLElement).getBoundingClientRect()
          zones.push({
            left: r.left - hostBox.left - pad,
            right: r.right - hostBox.left + pad,
            top: r.top - hostBox.top - pad,
            bottom: r.bottom - hostBox.top + pad,
            feather,
          })
        })
      }
      return zones
    }

    const makeScatter = (W: number, H: number) => {
      // Fill the full hero field edge-to-edge.
      return {
        x: Math.random() * Math.max(1, W),
        y: Math.random() * Math.max(1, H),
      }
    }

    const beginPhase = (next: Phase, now: number) => {
      phase = next
      phaseStart = now
      const box = host.getBoundingClientRect()
      const W = box.width
      const H = box.height

      if (next === 'assembleMark' || next === 'assembleWord') {
        const useMark = next === 'assembleMark'
        particles.forEach((p) => {
          p.fromX = p.x
          p.fromY = p.y
          p.toX = useMark ? p.markX : p.wordX
          p.toY = useMark ? p.markY : p.wordY
          p.fromR = p.r
          p.fromG = p.g
          p.fromB = p.b
          if (useMark) {
            p.toR = BLUE.r
            p.toG = BLUE.g
            p.toB = BLUE.b
          } else {
            p.toR = WHITE.r
            p.toG = WHITE.g
            p.toB = WHITE.b
          }
        })
      } else if (next === 'scatterWhite' || next === 'scatterBlue') {
        const toBlue = next === 'scatterBlue'
        particles.forEach((p) => {
          const s = makeScatter(W, H)
          p.fromX = p.x
          p.fromY = p.y
          p.toX = s.x
          p.toY = s.y
          p.scatterX = s.x
          p.scatterY = s.y
          p.fromR = p.r
          p.fromG = p.g
          p.fromB = p.b
          if (toBlue) {
            p.toR = BLUE.r
            p.toG = BLUE.g
            p.toB = BLUE.b
          } else {
            p.toR = WHITE.r
            p.toG = WHITE.g
            p.toB = WHITE.b
          }
        })
      } else if (next === 'holdScatterWhite' || next === 'holdScatterBlue') {
        particles.forEach((p) => {
          p.toX = p.scatterX
          p.toY = p.scatterY
        })
      }
    }

    const boot = async () => {
      let markImg: HTMLImageElement
      let wordImg: HTMLImageElement
      try {
        ;[markImg, wordImg] = await Promise.all([
          loadImage(markSrc),
          loadImage(wordmarkSrc),
        ])
      } catch {
        return
      }
      const stage = getViewportStage(host)
      const W = stage.W
      const H = stage.H

      // Sample into the visible viewport stage so the logo sits on screen center.
      const markSorted = sampleBrightSilhouette(
        markImg,
        stage.stageW,
        stage.stageH,
        gap,
        0.3
      ).sort(localOrder)
      const wordSorted = sampleBrightSilhouette(
        wordImg,
        stage.stageW,
        stage.stageH,
        gap,
        0.12
      ).sort(localOrder)
      if (!markSorted.length || !wordSorted.length) {
        return
      }

      const wordMapped = pairTargets(markSorted, wordSorted)
      const n = Math.max(markSorted.length, wordMapped.length)
      const halfW = stage.stageW / 2
      const halfH = stage.stageH / 2

      const next: HeroParticle[] = []
      for (let i = 0; i < n; i++) {
        const mark = markSorted[Math.min(i, markSorted.length - 1)]
        const word = wordMapped[Math.min(i, wordMapped.length - 1)]
        const markLocalX = mark.x - halfW
        const markLocalY = mark.y - halfH
        const wordLocalX = word.x - halfW
        const wordLocalY = word.y - halfH
        const scatter = makeScatter(W, H)
        next.push({
          x: scatter.x,
          y: scatter.y,
          fromX: scatter.x,
          fromY: scatter.y,
          toX: stage.cx + markLocalX,
          toY: stage.cy + markLocalY,
          scatterX: scatter.x,
          scatterY: scatter.y,
          markX: stage.cx + markLocalX,
          markY: stage.cy + markLocalY,
          wordX: stage.cx + wordLocalX,
          wordY: stage.cy + wordLocalY,
          markLocalX,
          markLocalY,
          wordLocalX,
          wordLocalY,
          r: BLUE.r,
          g: BLUE.g,
          b: BLUE.b,
          fromR: BLUE.r,
          fromG: BLUE.g,
          fromB: BLUE.b,
          toR: BLUE.r,
          toG: BLUE.g,
          toB: BLUE.b,
          a: 255,
          stagger: ((i % 19) / 19) * 0.35 + Math.random() * 0.05,
          arcNormal: (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 0.7),
          arcLift: 24 + Math.random() * 70,
          arcBias: 0.22 + Math.random() * 0.5,
          flightPhase: Math.random() * Math.PI * 2,
          vx: 0,
          vy: 0,
          scatterKeep: Math.random() < 0.52,
        })
      }
      particles = next
      beginPhase('assembleMark', performance.now())
    }
    void boot()

    const onMove = (e: MouseEvent) => {
      const box = host.getBoundingClientRect()
      mouse = {
        x: e.clientX - box.left,
        y: e.clientY - box.top,
        active: true,
      }
    }
    const onLeave = () => {
      mouse = { x: -99999, y: -99999, active: false }
    }
    host.addEventListener('mousemove', onMove)
    host.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', resize)

    const draw = (now: number) => {
      if (!running) return
      raf = requestAnimationFrame(draw)
      const ctx = canvas.getContext('2d', { alpha: true })
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      const box = host.getBoundingClientRect()
      const W = box.width
      const H = box.height
      // Keep backing store in sync (resize can clear mid-boot).
      const needW = Math.max(2, Math.round(W * dpr))
      const needH = Math.max(2, Math.round(H * dpr))
      if (canvas.width !== needW || canvas.height !== needH) {
        canvas.width = needW
        canvas.height = needH
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (!particles.length) return

      // Keep assembled mark/wordmark locked to the visible screen center.
      const stage = getViewportStage(host)
      const pinToViewport =
        phase === 'assembleMark' ||
        phase === 'holdMark' ||
        phase === 'assembleWord' ||
        phase === 'holdWord'
      for (const p of particles) {
        p.markX = stage.cx + p.markLocalX
        p.markY = stage.cy + p.markLocalY
        p.wordX = stage.cx + p.wordLocalX
        p.wordY = stage.cy + p.wordLocalY
        if (pinToViewport) {
          const useMark = phase === 'assembleMark' || phase === 'holdMark'
          p.toX = useMark ? p.markX : p.wordX
          p.toY = useMark ? p.markY : p.wordY
        }
      }

      const duration =
        phase === 'holdMark' || phase === 'holdWord'
          ? holdMs
          : phase === 'holdScatterWhite' || phase === 'holdScatterBlue'
            ? scatterHoldMs
            : phase === 'scatterWhite' || phase === 'scatterBlue'
              ? scatterMs
              : assembleMs
      const rawT = clamp01((now - phaseStart) / Math.max(1, duration))
      const t = easeInOut(rawT)
      const zones = measureZones()
      const assembling =
        phase === 'assembleMark' ||
        phase === 'assembleWord' ||
        phase === 'scatterWhite' ||
        phase === 'scatterBlue'
      const holding =
        phase === 'holdMark' ||
        phase === 'holdWord' ||
        phase === 'holdScatterWhite' ||
        phase === 'holdScatterBlue'
      const scattering = phase === 'scatterWhite' || phase === 'scatterBlue'
      const scatterHolding =
        phase === 'holdScatterWhite' || phase === 'holdScatterBlue'

      for (const p of particles) {
        if (assembling) {
          const denom = Math.max(0.001, 1 - p.stagger * 0.35)
          const local = clamp01((rawT - p.stagger * 0.35) / denom)
          const eased = easeInOut(local)
          const point = curvedPoint(
            p.fromX,
            p.fromY,
            p.toX,
            p.toY,
            eased,
            p.arcNormal,
            p.arcLift,
            p.arcBias,
            p.flightPhase
          )
          p.x = point.x
          p.y = point.y
          p.r = Math.round(p.fromR + (p.toR - p.fromR) * eased)
          p.g = Math.round(p.fromG + (p.toG - p.fromG) * eased)
          p.b = Math.round(p.fromB + (p.toB - p.fromB) * eased)
        } else if (holding) {
          p.x = p.toX
          p.y = p.toY
          p.r = p.toR
          p.g = p.toG
          p.b = p.toB
        }

        // Soft mouse repulsion (never teleports).
        if (mouse.active) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.hypot(dx, dy) || 1
          if (dist < repulsionRadius) {
            const force = ((repulsionRadius - dist) / repulsionRadius) * repulsionForce * 0.35
            p.vx += (dx / dist) * force
            p.vy += (dy / dist) * force
          }
        }
        p.vx *= 0.86
        p.vy *= 0.86
        p.x += p.vx
        p.y += p.vy
        // Spring back toward phase target while holding / finishing assemble.
        if (holding || (assembling && rawT > 0.88)) {
          p.x += (p.toX - p.x) * 0.05
          p.y += (p.toY - p.y) * 0.05
        }

        const vis = copyMaskVisibility(p.x, p.y, zones)
        let sparseMul = 1
        if (!p.scatterKeep) {
          if (scattering) {
            const local = clamp01((rawT - p.stagger * 0.15) / 0.55)
            sparseMul = 1 - easeInOut(local)
          } else if (scatterHolding) {
            sparseMul = 0
          } else if (phase === 'assembleMark' || phase === 'assembleWord') {
            const denom = Math.max(0.001, 1 - p.stagger * 0.35)
            const local = clamp01((rawT - p.stagger * 0.35) / denom)
            sparseMul = easeInOut(local)
          }
        }
        const alpha =
          vis * (0.35 + 0.65 * (holding ? 1 : clamp01(t + 0.35))) * sparseMul
        if (alpha < 0.02) continue
        ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`
        ctx.fillRect(Math.round(p.x - ps / 2), Math.round(p.y - ps / 2), ps, ps)
      }

      if (rawT >= 1) {
        if (phase === 'assembleMark') beginPhase('holdMark', now)
        else if (phase === 'holdMark') beginPhase('scatterWhite', now)
        else if (phase === 'scatterWhite') beginPhase('holdScatterWhite', now)
        else if (phase === 'holdScatterWhite') beginPhase('assembleWord', now)
        else if (phase === 'assembleWord') beginPhase('holdWord', now)
        else if (phase === 'holdWord') beginPhase('scatterBlue', now)
        else if (phase === 'scatterBlue') beginPhase('holdScatterBlue', now)
        else if (phase === 'holdScatterBlue') beginPhase('assembleMark', now)
      }
    }
    raf = requestAnimationFrame(draw)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      host.removeEventListener('mousemove', onMove)
      host.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', resize)
    }
  }, [
    markSrc,
    wordmarkSrc,
    particleSize,
    particleGap,
    assembleMs,
    holdMs,
    scatterMs,
    scatterHoldMs,
    repulsionForce,
    repulsionRadius,
  ])

  return (
    <div ref={rootRef} className="hero-mark-loop" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-mark-loop__canvas" />
    </div>
  )
}
