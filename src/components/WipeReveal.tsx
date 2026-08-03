import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'

type TagName = 'h1' | 'h2' | 'h3' | 'div' | 'span' | 'p'

type Props = {
  as?: TagName
  className?: string
  /** Stagger delay before the first line wipe starts (seconds). */
  delay?: number
  /** Extra delay between lines when the title wraps (seconds). */
  lineDelay?: number
  /** IntersectionObserver rootMargin. */
  rootMargin?: string
  children: React.ReactNode
}

function readText(children: React.ReactNode) {
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  return null
}

function measureWrappedLines(probe: HTMLElement, text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return [text]

  probe.replaceChildren()
  const wordNodes: HTMLSpanElement[] = []
  words.forEach((word, i) => {
    if (i > 0) probe.appendChild(document.createTextNode(' '))
    const span = document.createElement('span')
    span.className = 'wipe-reveal__word'
    span.textContent = word
    probe.appendChild(span)
    wordNodes.push(span)
  })

  const lines: string[][] = []
  let currentTop = Number.NaN
  let current: string[] = []
  for (const node of wordNodes) {
    const top = node.offsetTop
    if (!Number.isFinite(currentTop) || Math.abs(top - currentTop) <= 2) {
      current.push(node.textContent || '')
      currentTop = top
    } else {
      lines.push(current)
      current = [node.textContent || '']
      currentTop = top
    }
  }
  if (current.length) lines.push(current)
  return lines.map((line) => line.join(' '))
}

function measureLines(probe: HTMLElement, text: string) {
  const segments = text.split(/\n/).map((part) => part.trim()).filter(Boolean)
  if (segments.length <= 1) return measureWrappedLines(probe, text)
  return segments.flatMap((segment) => measureWrappedLines(probe, segment))
}

/**
 * Spur-style line wipe: blue bar sweeps L→R per visual line, then text shows.
 * Multi-line titles get one bar each, staggered. Plays once on viewport enter.
 */
export default function WipeReveal({
  as: Tag = 'div',
  className,
  delay = 0,
  lineDelay = 0.12,
  rootMargin = '0px 0px -12% 0px',
  children,
}: Props) {
  const ref = useRef<HTMLElement | null>(null)
  const probeRef = useRef<HTMLSpanElement | null>(null)
  const text = readText(children)
  const [lines, setLines] = useState<string[] | null>(null)

  useLayoutEffect(() => {
    if (!text) {
      setLines([String(children ?? '')])
      return
    }
    const probe = probeRef.current
    const root = ref.current
    if (!probe || !root) return

    const run = () => {
      if (root.classList.contains('is-in')) return
      const box = root.parentElement ?? root
      const avail = box.clientWidth
      if (avail < 80) return
      probe.style.width = `${avail}px`
      const next = measureLines(probe, text)
      setLines((prev) =>
        prev && prev.length === next.length && prev.every((line, i) => line === next[i])
          ? prev
          : next
      )
    }

    run()
    const ro = new ResizeObserver(run)
    // Observe the parent column only — observing the fit-content root
    // feeds back into wrapping and splits short titles incorrectly.
    if (root.parentElement) ro.observe(root.parentElement)
    else ro.observe(root)
    return () => ro.disconnect()
  }, [text, children])

  useEffect(() => {
    const el = ref.current
    if (!el || !lines?.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      el.classList.add('is-in', 'is-reduced')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          el.classList.add('is-in')
          io.unobserve(el)
        }
      },
      { threshold: 0.35, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [lines, rootMargin])

  return (
    <Tag
      ref={ref as never}
      className={['wipe-reveal', className].filter(Boolean).join(' ')}
      style={{ ['--wipe-delay' as string]: `${delay}s` }}
    >
      {text ? (
        <span ref={probeRef} className="wipe-reveal__probe" aria-hidden="true" />
      ) : null}

      {(lines ?? []).map((line, i) => (
        <span
          key={`${i}-${line}`}
          className="wipe-reveal__row"
          style={{ ['--wipe-line-delay' as string]: `${delay + i * lineDelay}s` }}
        >
          <span className="wipe-reveal__text">{line}</span>
          <span className="wipe-reveal__bar" aria-hidden="true" />
        </span>
      ))}
    </Tag>
  )
}
