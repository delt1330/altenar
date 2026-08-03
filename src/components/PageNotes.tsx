import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  createNoteId,
  DesignNote,
  loadDesignNotes,
  notesSharingEnabled,
  readCachedAuthor,
  saveDesignNotes,
  writeCachedAuthor,
} from '../lib/designNotesStore'

type Draft = {
  x: number
  y: number
  text: string
}

const PAGE_MARGIN = 12
const CARD_WIDTH = 280

function docSize() {
  const el = document.documentElement
  return {
    width: Math.max(el.scrollWidth, el.clientWidth, 1),
    height: Math.max(el.scrollHeight, el.clientHeight, 1),
  }
}

function toPageFraction(clientX: number, clientY: number) {
  const { width, height } = docSize()
  const x = (clientX + window.scrollX) / width
  const y = (clientY + window.scrollY) / height
  return {
    x: Math.min(0.995, Math.max(0.005, x)),
    y: Math.min(0.995, Math.max(0.005, y)),
  }
}

function pinStyle(note: Pick<DesignNote, 'x' | 'y'>): React.CSSProperties {
  const { width, height } = docSize()
  return {
    left: `${note.x * width}px`,
    top: `${note.y * height}px`,
  }
}

/** Prefer side with more room so the card starts on-page. */
function cardAnchorClass(x: number, y: number) {
  const h = x > 0.58 ? 'is-left' : 'is-right'
  const v = y > 0.72 ? 'is-above' : 'is-below'
  return `${h} ${v}`
}

function clampCardToPage(card: HTMLElement) {
  const { width: docW, height: docH } = docSize()
  const rect = card.getBoundingClientRect()
  const left = rect.left + window.scrollX
  const top = rect.top + window.scrollY
  const right = left + rect.width
  const bottom = top + rect.height

  let dx = 0
  let dy = 0
  if (right > docW - PAGE_MARGIN) dx -= right - (docW - PAGE_MARGIN)
  if (left + dx < PAGE_MARGIN) dx += PAGE_MARGIN - (left + dx)
  if (bottom > docH - PAGE_MARGIN) dy -= bottom - (docH - PAGE_MARGIN)
  if (top + dy < PAGE_MARGIN) dy += PAGE_MARGIN - (top + dy)

  card.style.transform = dx || dy ? `translate(${dx}px, ${dy}px)` : ''
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}

function NoteCard({
  x,
  y,
  children,
  className = '',
}: {
  x: number
  y: number
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const { width: docW } = docSize()
  const maxWidth = Math.max(
    160,
    Math.min(CARD_WIDTH, docW - PAGE_MARGIN * 2)
  )

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
    clampCardToPage(el)
  }, [x, y, children, maxWidth, docW])

  return (
    <div
      ref={ref}
      className={['page-note__card', cardAnchorClass(x, y), className]
        .filter(Boolean)
        .join(' ')}
      style={{ width: maxWidth, maxWidth }}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  )
}

export default function PageNotes() {
  const [active, setActive] = useState(false)
  const [notes, setNotes] = useState<DesignNote[]>([])
  const [sha, setSha] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>(
    'idle'
  )
  const [error, setError] = useState<string | null>(null)
  const [author, setAuthor] = useState(() => readCachedAuthor() || 'You')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [docTick, setDocTick] = useState(0)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const sharing = notesSharingEnabled()
  const saveTimer = useRef<number | null>(null)
  const notesRef = useRef(notes)
  const shaRef = useRef(sha)
  notesRef.current = notes
  shaRef.current = sha

  const refreshDocMetrics = useCallback(() => {
    setDocTick((n) => n + 1)
  }, [])

  const persist = useCallback(async (nextNotes: DesignNote[]) => {
    setStatus('saving')
    setError(null)
    try {
      const result = await saveDesignNotes(
        { version: 1, notes: nextNotes },
        shaRef.current
      )
      shaRef.current = result.sha
      setSha(result.sha)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }, [])

  const queuePersist = useCallback(
    (nextNotes: DesignNote[]) => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        void persist(nextNotes)
      }, 280)
    },
    [persist]
  )

  const reload = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const result = await loadDesignNotes()
      setNotes(result.file.notes)
      setSha(result.sha)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Load failed')
    }
  }, [])

  useEffect(() => {
    void reload()
    const onResize = () => refreshDocMetrics()
    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(() => refreshDocMetrics())
    ro.observe(document.documentElement)
    return () => {
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [reload, refreshDocMetrics])

  useEffect(() => {
    if (!active || !sharing) return
    const id = window.setInterval(() => {
      void reload()
    }, 20000)
    return () => window.clearInterval(id)
  }, [active, sharing, reload])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (
        event.key === 'c' ||
        event.key === 'C' ||
        event.key === 'с' ||
        event.key === 'С'
      ) {
        event.preventDefault()
        setActive((v) => {
          const next = !v
          if (!next) {
            setDraft(null)
            setOpenId(null)
          } else {
            void reload()
            refreshDocMetrics()
          }
          return next
        })
        return
      }
      if (event.key === 'Escape') {
        setDraft(null)
        setOpenId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reload, refreshDocMetrics])

  const onLayerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!active) return
    if (event.target !== layerRef.current) return
    const point = toPageFraction(event.clientX, event.clientY)
    setOpenId(null)
    setDraft({ ...point, text: '' })
  }

  const commitDraft = () => {
    if (!draft) return
    const text = draft.text.trim()
    if (!text) {
      setDraft(null)
      return
    }
    const name = author.trim() || 'You'
    writeCachedAuthor(name)
    const now = new Date().toISOString()
    const note: DesignNote = {
      id: createNoteId(),
      x: draft.x,
      y: draft.y,
      text,
      author: name,
      createdAt: now,
      updatedAt: now,
    }
    const next = [...notesRef.current, note]
    setNotes(next)
    setDraft(null)
    setOpenId(note.id)
    queuePersist(next)
  }

  const updateNoteText = (id: string, text: string) => {
    const next = notesRef.current.map((note) =>
      note.id === id
        ? { ...note, text, updatedAt: new Date().toISOString() }
        : note
    )
    setNotes(next)
    queuePersist(next)
  }

  const deleteNote = (id: string) => {
    const next = notesRef.current.filter((note) => note.id !== id)
    setNotes(next)
    if (openId === id) setOpenId(null)
    queuePersist(next)
  }

  // docTick forces pin/card reposition after layout/resize.
  void docTick

  return (
    <>
      <div
        className={[
          'page-notes-hint',
          active ? 'is-active' : '',
          status === 'error' ? 'is-error' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="status"
      >
        <span className="page-notes-hint__key">C</span>
        <span>
          {active
            ? sharing
              ? 'Notes on · shared via GitHub'
              : 'Notes on · local only (add GitHub token to share)'
            : 'Notes'}
        </span>
        {active && status === 'saving' ? (
          <span className="page-notes-hint__meta">Saving…</span>
        ) : null}
        {active && status === 'loading' ? (
          <span className="page-notes-hint__meta">Sync…</span>
        ) : null}
        {active && error ? (
          <span className="page-notes-hint__meta" title={error}>
            Sync error
          </span>
        ) : null}
      </div>

      {active ? (
        <div
          ref={layerRef}
          className="page-notes-layer"
          onClick={onLayerClick}
          style={{ height: `${docSize().height}px` }}
        >
          {notes.map((note, index) => {
            const open = openId === note.id
            return (
              <div
                key={note.id}
                className={['page-note', open ? 'is-open' : '']
                  .filter(Boolean)
                  .join(' ')}
                style={pinStyle(note)}
              >
                <button
                  type="button"
                  className="page-note__pin"
                  aria-label={`Note ${index + 1}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    setDraft(null)
                    setOpenId((id) => (id === note.id ? null : note.id))
                  }}
                >
                  {index + 1}
                </button>
                {open ? (
                  <NoteCard x={note.x} y={note.y}>
                    <div className="page-note__card-head">
                      <span className="page-note__author">{note.author}</span>
                      <button
                        type="button"
                        className="page-note__delete"
                        onClick={() => deleteNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <textarea
                      className="page-note__text"
                      value={note.text}
                      rows={4}
                      onChange={(event) =>
                        updateNoteText(note.id, event.target.value)
                      }
                    />
                  </NoteCard>
                ) : null}
              </div>
            )
          })}

          {draft ? (
            <div
              className="page-note is-open is-draft"
              style={pinStyle(draft)}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="page-note__pin" aria-hidden="true">
                +
              </div>
              <NoteCard x={draft.x} y={draft.y}>
                <div className="page-note__card-head">
                  <input
                    className="page-note__author-input"
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="Your name"
                    aria-label="Author name"
                  />
                  <button
                    type="button"
                    className="page-note__delete"
                    onClick={() => setDraft(null)}
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  className="page-note__text"
                  value={draft.text}
                  rows={4}
                  autoFocus
                  placeholder="Leave a note…"
                  onChange={(event) =>
                    setDraft((d) => (d ? { ...d, text: event.target.value } : d))
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      event.preventDefault()
                      commitDraft()
                    }
                  }}
                />
                <div className="page-note__card-foot">
                  <button
                    type="button"
                    className="page-note__submit"
                    onClick={commitDraft}
                  >
                    Post
                  </button>
                </div>
              </NoteCard>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
