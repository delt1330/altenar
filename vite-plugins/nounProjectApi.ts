import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import crypto from 'node:crypto'

const API_ORIGIN = 'https://api.thenounproject.com'
const PROXY_PREFIXES = ['/api/noun', '/altenar/api/noun']

type EnvBag = Record<string, string>

function percentEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  )
}

/** OAuth 1.0a one-legged (consumer key/secret only) for Noun Project. */
export function nounProjectOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
): string {
  const target = new URL(url)
  const oauth: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_version: '1.0',
  }

  const params: Array<[string, string]> = []
  target.searchParams.forEach((v, k) => params.push([k, v]))
  for (const [k, v] of Object.entries(oauth)) params.push([k, v])
  params.sort((a, b) =>
    a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0]),
  )

  const paramString = params
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&')
  const baseUrl = `${target.origin}${target.pathname}`
  const baseString = [
    method.toUpperCase(),
    percentEncode(baseUrl),
    percentEncode(paramString),
  ].join('&')
  const signingKey = `${percentEncode(consumerSecret)}&`
  oauth.oauth_signature = crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64')

  return (
    'OAuth ' +
    Object.entries(oauth)
      .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
      .join(', ')
  )
}

function matchProxyPath(urlPath: string): string | null {
  for (const prefix of PROXY_PREFIXES) {
    if (urlPath === prefix || urlPath.startsWith(`${prefix}/`)) {
      return urlPath.slice(prefix.length) || '/'
    }
  }
  return null
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  const payload = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(payload)
}

async function handleNounProxy(
  req: IncomingMessage,
  res: ServerResponse,
  env: EnvBag,
): Promise<boolean> {
  const rawUrl = req.url || '/'
  const incoming = new URL(rawUrl, 'http://localhost')
  const apiPath = matchProxyPath(incoming.pathname)
  if (apiPath == null) return false

  if ((req.method || 'GET').toUpperCase() !== 'GET') {
    sendJson(res, 405, { error: 'Only GET is supported for Noun Project proxy' })
    return true
  }

  const key = (env.NOUN_PROJECT_KEY || '').trim()
  const secret = (env.NOUN_PROJECT_SECRET || '').trim()
  if (!key || !secret) {
    sendJson(res, 503, {
      error:
        'Noun Project credentials missing. Set NOUN_PROJECT_KEY and NOUN_PROJECT_SECRET in .env.local',
    })
    return true
  }

  const upstream = new URL(apiPath, API_ORIGIN)
  upstream.search = incoming.search

  try {
    const authorization = nounProjectOAuthHeader(
      'GET',
      upstream.toString(),
      key,
      secret,
    )
    const upstreamRes = await fetch(upstream.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
      },
    })
    const text = await upstreamRes.text()
    res.statusCode = upstreamRes.status
    res.setHeader(
      'Content-Type',
      upstreamRes.headers.get('content-type') || 'application/json; charset=utf-8',
    )
    res.setHeader('Cache-Control', 'no-store')
    res.end(text)
  } catch (err) {
    sendJson(res, 502, {
      error: 'Noun Project upstream request failed',
      detail: err instanceof Error ? err.message : String(err),
    })
  }
  return true
}

/** Dev/preview middleware: `/api/noun/*` → Noun Project API (OAuth1, secrets stay server-side). */
export function nounProjectApiPlugin(env: EnvBag): Plugin {
  const attach = (middlewares: {
    use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void
  }) => {
    middlewares.use((req, res, next) => {
      void handleNounProxy(req, res, env).then((handled) => {
        if (!handled) next()
      })
    })
  }

  return {
    name: 'noun-project-api',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
  }
}
