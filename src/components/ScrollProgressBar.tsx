import React, { useEffect, useRef, useState } from 'react'
import { useTextScramble } from './textScramble'

const SECTIONS: { id: string; label: string }[] = [
  { id: 'top', label: 'Home' },
  { id: 'clients', label: 'Clients' },
  { id: 'scenarios', label: 'Solutions' },
  { id: 'markets', label: 'Markets' },
  { id: 'cases', label: 'Cases' },
  { id: 'industry-proof', label: 'Awards' },
  { id: 'news', label: 'News' },
  { id: 'demo', label: 'Contact' },
]

const PAD = 16
const LERP = 0.14

function SectionScramble({ label }: { label: string }) {
  const rootRef = useRef<HTMLSpanElement | null>(null)
  const labelRef = useRef<HTMLSpanElement | null>(null)
  useTextScramble(rootRef, labelRef, label, {
    hover: true,
    onView: true,
    viewMargin: '0px',
  })

  return (
    <span ref={rootRef} className="scroll-progress__section group">
      <span ref={labelRef} className="scroll-progress__section-label">
        {label}
      </span>
    </span>
  )
}

function readProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  if (max <= 0) return 0
  return Math.max(0, Math.min(1, window.scrollY / max))
}

function readActiveSection() {
  const probe = window.scrollY + window.innerHeight * 0.28
  let active = SECTIONS[0]
  for (const section of SECTIONS) {
    const el = document.getElementById(section.id)
    if (!el) continue
    const top = el.getBoundingClientRect().top + window.scrollY
    if (top <= probe) active = section
  }
  return active.label
}

function labelLeftForProgress(progress: number, labelW: number) {
  const vw = window.innerWidth
  const tipX = progress * vw
  let left = tipX - labelW
  if (left < PAD) left = PAD
  if (left + labelW > vw - PAD) left = Math.max(PAD, vw - PAD - labelW)
  return left
}

/** Sample page under the progress tip — light sections use `.section--light`. */
function isOverLightBackground(sampleX: number) {
  const x = Math.max(0, Math.min(window.innerWidth - 1, sampleX))
  const y = Math.max(0, window.innerHeight - 20)
  const hits = document.elementsFromPoint(x, y)
  return hits.some((el) => {
    if (!(el instanceof Element)) return false
    if (el.closest('.scroll-progress')) return false
    return Boolean(el.closest('.section--light'))
  })
}

/**
 * Thin 8px blue scroll fill; label rides the tip smoothly and
 * switches blue/black from the section background under the bar.
 * Visible after the hero is scrolled past; hidden again in the footer.
 */
export default function ScrollProgressBar() {
  const [section, setSection] = useState(SECTIONS[0].label)
  const [onLight, setOnLight] = useState(false)
  const [visible, setVisible] = useState(false)
  const copyRef = useRef<HTMLDivElement | null>(null)
  const fillRef = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(0)
  const xRef = useRef(PAD)
  const targetXRef = useRef(PAD)
  const rafRef = useRef(0)

  useEffect(() => {
    let running = true

    const isPastHero = () => {
      const hero = document.getElementById('top')
      if (!hero) return window.scrollY > 40
      // Hero mostly left the viewport — bar can appear.
      return hero.getBoundingClientRect().bottom <= window.innerHeight * 0.18
    }

    const isInFooter = () => {
      const footer = document.querySelector('footer.footer')
      if (!footer) return false
      // Hide once the footer enters the lower part of the viewport.
      return footer.getBoundingClientRect().top <= window.innerHeight * 0.92
    }

    const frame = () => {
      if (!running) return
      rafRef.current = requestAnimationFrame(frame)

      const show = isPastHero() && !isInFooter()
      setVisible((prev) => (prev === show ? prev : show))

      const p = readProgress()
      progressRef.current = p
      if (fillRef.current) fillRef.current.style.width = `${p * 100}%`

      const nextSection = readActiveSection()
      setSection((prev) => (prev === nextSection ? prev : nextSection))

      const copy = copyRef.current
      const labelW = copy?.offsetWidth || 120
      targetXRef.current = labelLeftForProgress(p, labelW)
      xRef.current += (targetXRef.current - xRef.current) * LERP
      if (Math.abs(targetXRef.current - xRef.current) < 0.15) {
        xRef.current = targetXRef.current
      }
      if (copy) {
        copy.style.transform = `translate3d(${xRef.current}px, 0, 0)`
      }

      const tipX = p * window.innerWidth
      const light = isOverLightBackground(tipX)
      setOnLight((prev) => (prev === light ? prev : light))
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      className={[
        'scroll-progress',
        onLight ? 'is-on-light' : '',
        visible ? 'is-visible' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      aria-label={visible ? `Altenar: ${section}` : undefined}
    >
      <div ref={copyRef} className="scroll-progress__copy">
        <span className="scroll-progress__brand">Altenar:</span>
        <SectionScramble key={section} label={section} />
      </div>
      <div className="scroll-progress__track" aria-hidden="true">
        <div ref={fillRef} className="scroll-progress__fill" />
      </div>
    </div>
  )
}
