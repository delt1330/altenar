export type DesignNoteMessage = {
  id: string
  text: string
  author: string
  createdAt: string
}

export type DesignNote = {
  id: string
  /** 0–1 across document width (incl. scroll). */
  x: number
  /** 0–1 across document height (incl. scroll). */
  y: number
  /** Thread root author (first message). */
  author: string
  createdAt: string
  updatedAt: string
  /** Ordered thread messages (Figma-style). */
  messages: DesignNoteMessage[]
  /** @deprecated legacy single-body notes — normalized on load. */
  text?: string
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
    return normalizeNotesFile({ version: 1, notes: parsed.notes })
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

/** Upgrade legacy `text` notes and drop empty threads. */
export function normalizeNote(raw: DesignNote): DesignNote | null {
  const messages = Array.isArray(raw.messages)
    ? raw.messages
        .filter((m) => m && typeof m.text === 'string' && m.text.trim())
        .map((m) => ({
          id: m.id || createNoteId(),
          text: m.text.trim(),
          author: (m.author || raw.author || 'You').trim() || 'You',
          createdAt: m.createdAt || raw.createdAt || new Date().toISOString(),
        }))
    : []

  if (!messages.length && typeof raw.text === 'string' && raw.text.trim()) {
    messages.push({
      id: createNoteId(),
      text: raw.text.trim(),
      author: (raw.author || 'You').trim() || 'You',
      createdAt: raw.createdAt || new Date().toISOString(),
    })
  }

  if (!messages.length) return null

  const first = messages[0]
  const last = messages[messages.length - 1]
  return {
    id: raw.id,
    x: raw.x,
    y: raw.y,
    author: first.author,
    createdAt: first.createdAt,
    updatedAt: raw.updatedAt || last.createdAt,
    messages,
  }
}

export function normalizeNotesFile(file: DesignNotesFile): DesignNotesFile {
  const notes = (Array.isArray(file.notes) ? file.notes : [])
    .map((note) => normalizeNote(note))
    .filter((note): note is DesignNote => Boolean(note))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { version: 1, notes }
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

function githubErrorMessage(status: number, body: string, action: 'read' | 'save') {
  let message = ''
  try {
    message = String((JSON.parse(body) as { message?: string }).message || '')
  } catch {
    message = body.slice(0, 160)
  }
  if (
    status === 403 &&
    /not accessible by personal access token/i.test(message)
  ) {
    return action === 'save'
      ? 'Token cannot write. Set Contents → Read and write on the PAT, then update NOTES_GITHUB_TOKEN.'
      : 'Token cannot read. Check repository access on the PAT.'
  }
  if (status === 401) {
    return 'GitHub token invalid or expired. Create a new PAT and update .env.local + NOTES_GITHUB_TOKEN.'
  }
  return `GitHub ${action} failed (${status}): ${message || 'unknown error'}`
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
    throw new Error(githubErrorMessage(res.status, err, 'read'))
  }
  const data = (await res.json()) as GithubContentsResponse
  if (!data.content) {
    return { file: emptyFile(), sha: data.sha, mode: 'remote' }
  }
  const file = decodeContent(data.content.replace(/\n/g, ''))
  const normalized = normalizeNotesFile({
    version: 1,
    notes: Array.isArray(file.notes) ? file.notes : [],
  })
  writeCache(normalized)
  return { file: normalized, sha: data.sha, mode: 'remote' }
}

export async function saveDesignNotes(
  file: DesignNotesFile,
  sha: string | null
): Promise<{ sha: string | null; mode: 'remote' | 'local' }> {
  const normalized = normalizeNotesFile(file)
  writeCache(normalized)

  if (!notesSharingEnabled()) {
    return { sha: null, mode: 'local' }
  }

  const body: Record<string, string> = {
    message: `chore(notes): update design notes (${normalized.notes.length})`,
    content: encodeContent(normalized),
    branch: branch(),
  }
  if (sha) body.sha = sha

  const res = await githubFetch(putUrl(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (res.status === 409 || res.status === 422) {
    // Conflict — reload and retry a few times with latest sha.
    let latestSha = sha
    let mergedNotes = normalized.notes
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const latest = await loadDesignNotes()
      const merged: DesignNotesFile = {
        version: 1,
        notes: mergeNotes(latest.file.notes, mergedNotes),
      }
      writeCache(merged)
      mergedNotes = merged.notes
      latestSha = latest.sha
      const retryBody: Record<string, string> = {
        message: `chore(notes): update design notes (${merged.notes.length})`,
        content: encodeContent(merged),
        branch: branch(),
      }
      if (latestSha) retryBody.sha = latestSha
      const retry = await githubFetch(putUrl(), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retryBody),
      })
      if (retry.ok) {
        const data = (await retry.json()) as { content?: { sha?: string } }
        return { sha: data.content?.sha ?? latestSha, mode: 'remote' }
      }
      if (retry.status !== 409 && retry.status !== 422) {
        const err = await retry.text()
        throw new Error(githubErrorMessage(retry.status, err, 'save'))
      }
    }
    throw new Error(
      'GitHub save failed (409): could not resolve conflict after retries'
    )
  }

  if (!res.ok) {
    const err = await res.text()
    throw new Error(githubErrorMessage(res.status, err, 'save'))
  }

  const data = (await res.json()) as { content?: { sha?: string } }
  return { sha: data.content?.sha ?? sha, mode: 'remote' }
}

/** Prefer newer updatedAt when ids collide; union messages by id. */
function mergeNotes(remote: DesignNote[], local: DesignNote[]): DesignNote[] {
  const map = new Map<string, DesignNote>()
  for (const note of remote) map.set(note.id, note)
  for (const note of local) {
    const prev = map.get(note.id)
    if (!prev) {
      map.set(note.id, note)
      continue
    }
    const messages = mergeMessages(prev.messages, note.messages)
    const newer = note.updatedAt >= prev.updatedAt ? note : prev
    map.set(note.id, {
      ...newer,
      messages,
      updatedAt:
        messages[messages.length - 1]?.createdAt ||
        newer.updatedAt,
    })
  }
  return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function mergeMessages(
  a: DesignNoteMessage[],
  b: DesignNoteMessage[]
): DesignNoteMessage[] {
  const map = new Map<string, DesignNoteMessage>()
  for (const msg of a) map.set(msg.id, msg)
  for (const msg of b) {
    const prev = map.get(msg.id)
    if (!prev || msg.createdAt >= prev.createdAt) map.set(msg.id, msg)
  }
  return [...map.values()].sort((x, y) => x.createdAt.localeCompare(y.createdAt))
}

export function createNoteId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
