export type DesignNote = {
  id: string
  /** 0–1 across document width (incl. scroll). */
  x: number
  /** 0–1 across document height (incl. scroll). */
  y: number
  text: string
  author: string
  createdAt: string
  updatedAt: string
}

export type DesignNotesFile = {
  version: 1
  notes: DesignNote[]
}

export type NotesSyncStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'local-only'
  | 'error'

const CACHE_KEY = 'altenar-design-notes-v1'
const AUTHOR_KEY = 'altenar-design-notes-author'

function owner() {
  return (
    (import.meta.env.VITE_NOTES_GITHUB_OWNER as string | undefined)?.trim() ||
    'delt1330'
  )
}

function repo() {
  return (
    (import.meta.env.VITE_NOTES_GITHUB_REPO as string | undefined)?.trim() ||
    'altenar'
  )
}

function branch() {
  return (
    (import.meta.env.VITE_NOTES_GITHUB_BRANCH as string | undefined)?.trim() ||
    'main'
  )
}

function path() {
  return (
    (import.meta.env.VITE_NOTES_GITHUB_PATH as string | undefined)?.trim() ||
    'design-notes.json'
  )
}

function token() {
  return (import.meta.env.VITE_NOTES_GITHUB_TOKEN as string | undefined)?.trim() || ''
}

export function notesSharingEnabled() {
  return Boolean(token())
}

export function readCachedAuthor() {
  try {
    return localStorage.getItem(AUTHOR_KEY)?.trim() || ''
  } catch {
    return ''
  }
}

export function writeCachedAuthor(name: string) {
  try {
    localStorage.setItem(AUTHOR_KEY, name.trim())
  } catch {
    /* ignore */
  }
}

function readCache(): DesignNotesFile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DesignNotesFile
    if (!parsed || !Array.isArray(parsed.notes)) return null
    return { version: 1, notes: parsed.notes }
  } catch {
    return null
  }
}

function writeCache(file: DesignNotesFile) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(file))
  } catch {
    /* ignore */
  }
}

function emptyFile(): DesignNotesFile {
  return { version: 1, notes: [] }
}

function encodeContent(file: DesignNotesFile) {
  const json = `${JSON.stringify(file, null, 2)}\n`
  // btoa fails on unicode — notes may contain Cyrillic.
  return btoa(unescape(encodeURIComponent(json)))
}

function decodeContent(base64: string) {
  const json = decodeURIComponent(escape(atob(base64)))
  return JSON.parse(json) as DesignNotesFile
}

type GithubContentsResponse = {
  sha: string
  content?: string
  encoding?: string
}

async function githubFetch(url: string, init?: RequestInit) {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(init?.headers as Record<string, string> | undefined),
  }
  const t = token()
  if (t) headers.Authorization = `Bearer ${t}`
  return fetch(url, { ...init, headers })
}

function contentsUrl() {
  return `https://api.github.com/repos/${owner()}/${repo()}/contents/${path()}?ref=${encodeURIComponent(branch())}`
}

function putUrl() {
  return `https://api.github.com/repos/${owner()}/${repo()}/contents/${path()}`
}

export async function loadDesignNotes(): Promise<{
  file: DesignNotesFile
  sha: string | null
  mode: 'remote' | 'local'
}> {
  const cached = readCache() ?? emptyFile()

  if (!notesSharingEnabled()) {
    return { file: cached, sha: null, mode: 'local' }
  }

  const res = await githubFetch(contentsUrl())
  if (res.status === 404) {
    return { file: cached.notes.length ? cached : emptyFile(), sha: null, mode: 'remote' }
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub read failed (${res.status}): ${err}`)
  }
  const data = (await res.json()) as GithubContentsResponse
  if (!data.content) {
    return { file: emptyFile(), sha: data.sha, mode: 'remote' }
  }
  const file = decodeContent(data.content.replace(/\n/g, ''))
  const normalized: DesignNotesFile = {
    version: 1,
    notes: Array.isArray(file.notes) ? file.notes : [],
  }
  writeCache(normalized)
  return { file: normalized, sha: data.sha, mode: 'remote' }
}

export async function saveDesignNotes(
  file: DesignNotesFile,
  sha: string | null
): Promise<{ sha: string | null; mode: 'remote' | 'local' }> {
  writeCache(file)

  if (!notesSharingEnabled()) {
    return { sha: null, mode: 'local' }
  }

  const body: Record<string, string> = {
    message: `chore(notes): update design notes (${file.notes.length})`,
    content: encodeContent(file),
    branch: branch(),
  }
  if (sha) body.sha = sha

  const res = await githubFetch(putUrl(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.status === 409 || res.status === 422) {
    // Conflict — reload and retry once with latest sha.
    const latest = await loadDesignNotes()
    const merged: DesignNotesFile = {
      version: 1,
      notes: mergeNotes(latest.file.notes, file.notes),
    }
    writeCache(merged)
    const retryBody: Record<string, string> = {
      message: `chore(notes): update design notes (${merged.notes.length})`,
      content: encodeContent(merged),
      branch: branch(),
    }
    if (latest.sha) retryBody.sha = latest.sha
    const retry = await githubFetch(putUrl(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(retryBody),
    })
    if (!retry.ok) {
      const err = await retry.text()
      throw new Error(`GitHub save failed (${retry.status}): ${err}`)
    }
    const data = (await retry.json()) as { content?: { sha?: string } }
    return { sha: data.content?.sha ?? latest.sha, mode: 'remote' }
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GitHub save failed (${res.status}): ${err}`)
  }

  const data = (await res.json()) as { content?: { sha?: string } }
  return { sha: data.content?.sha ?? sha, mode: 'remote' }
}

/** Prefer newer updatedAt when ids collide. */
function mergeNotes(remote: DesignNote[], local: DesignNote[]): DesignNote[] {
  const map = new Map<string, DesignNote>()
  for (const note of remote) map.set(note.id, note)
  for (const note of local) {
    const prev = map.get(note.id)
    if (!prev || note.updatedAt >= prev.updatedAt) map.set(note.id, note)
  }
  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function createNoteId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
