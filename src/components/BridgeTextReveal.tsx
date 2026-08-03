import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'

type Props = {
  text: string
  className?: string
  /** Particle square CSS px (default 1.5 — same as client logos). */
  particleSize?: number
  /** Empty gap between particle edges CSS px (default 1). */
  particleGap?: number
  color?: string
}

function clamp01(t: number) {
  return Math.max(0, Math.min(1, t))
}

/**
 * Bridge statement: text is already “assembled” as a particle lattice
 * (background-clip on real DOM glyphs), then solid text loads sequentially
 * along reading order (character by character / line by line).
 */
export default function BridgeTextReveal({
  text,
  className = 'bridge-statement',
  particleSize = 1.5,
  particleGap = 1,
  color = '#009ee3',
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const chars = useMemo(() => Array.from(text), [text])
  const [liveCount, setLiveCount] = useState(0)

  const pitch = Math.max(0.5, Number(particleSize) || 1) + Math.max(0, Number(particleGap) || 0)
  const cell = Math.max(0.5, Number(particleSize) || 1)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setLiveCount(chars.length)
      return
    }

    const readProgress = () => {
      const section = wrap.closest('section') || wrap
      const rect = section.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // Same scroll window as the old L→R letter fill.
      const start = vh * 0.88
      const end = vh * 0.28
      return clamp01((start - rect.top) / Math.max(1, start - end))
    }

    let uiFrame = 0
    const syncLive = () => {
      uiFrame = 0
      setLiveCount(Math.floor(readProgress() * chars.length))
    }
    const requestLive = () => {
      if (uiFrame) return
      uiFrame = window.requestAnimationFrame(syncLive)
    }

    syncLive()
    window.addEventListener('scroll', requestLive, { passive: true })
    window.addEventListener('resize', requestLive)

    return () => {
      if (uiFrame) window.cancelAnimationFrame(uiFrame)
      window.removeEventListener('scroll', requestLive)
      window.removeEventListener('resize', requestLive)
    }
  }, [chars.length])

  const maskSvg = useMemo(() => {
    const s = cell
    const p = pitch
    // Square particle cell matching logo lattice (filled rect, empty gap).
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${p}" height="${p}"><rect width="${s}" height="${s}" fill="${color}"/></svg>`
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
  }, [cell, pitch, color])

  return (
    <div
      ref={wrapRef}
      className="bridge-statement-wrap"
      style={
        {
          '--bridge-particle-fill': maskSvg,
          '--bridge-particle-pitch': `${pitch}px`,
          '--bridge-live': color,
        } as React.CSSProperties
      }
    >
      <p className={className} aria-label={text}>
        <span className="bridge-statement__sr">{text}</span>
        <span className="bridge-statement__chars" aria-hidden="true">
          {chars.map((ch, i) => (
            <span
              key={`${i}-${ch}`}
              className={[
                'bridge-statement__char',
                i < liveCount ? 'is-solid' : 'is-ghost',
              ].join(' ')}
            >
              {ch}
            </span>
          ))}
        </span>
      </p>
    </div>
  )
}
