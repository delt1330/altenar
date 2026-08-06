/** Client for the local Noun Project proxy (`/api/noun` → api.thenounproject.com). */

export type NounIcon = {
  id: number | string
  term?: string
  thumbnail_url?: string
  icon_url?: string
  permalink?: string
  license_description?: string
  creator?: { name?: string; permalink?: string }
  tags?: string[]
  svg_url?: string
  icon_url_svg?: string
}

export type NounIconSearchResponse = {
  icons?: NounIcon[]
  next_page?: string
  prev_page?: string
  total?: number
  error?: string
  detail?: string
}

export type NounUsageResponse = {
  monthly?: {
    usage?: { icon?: number; service?: number }
    cost?: {
      icon?: number
      service?: number
      total_monthly_percentage?: number
    }
  }
  error?: string
  detail?: string
}

function proxyUrl(path: string, params?: Record<string, string | number | undefined>) {
  const base = '/api/noun'
  const url = new URL(path.startsWith('/') ? path : `/${path}`, 'http://local')
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === '') continue
      url.searchParams.set(k, String(v))
    }
  }
  return `${base}${url.pathname}${url.search}`
}

async function nounGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const res = await fetch(proxyUrl(path, params))
  const data = (await res.json()) as T & { error?: string; detail?: string }
  if (!res.ok) {
    throw new Error(data.error || data.detail || `Noun Project error ${res.status}`)
  }
  return data
}

/** Search icons: GET /v2/icon?query=… */
export function searchNounIcons(
  query: string,
  opts: {
    limit?: number
    styles?: 'line' | 'solid' | 'line,solid'
    includeSvg?: boolean
    thumbnailSize?: 42 | 84 | 200
    limitToPublicDomain?: boolean
  } = {},
) {
  return nounGet<NounIconSearchResponse>('/v2/icon', {
    query,
    limit: opts.limit ?? 12,
    styles: opts.styles,
    include_svg: opts.includeSvg ? 1 : undefined,
    thumbnail_size: opts.thumbnailSize ?? 200,
    limit_to_public_domain: opts.limitToPublicDomain ? 1 : undefined,
  })
}

/** Single icon: GET /v2/icon/:id */
export function getNounIcon(iconId: string | number, thumbnailSize: 42 | 84 | 200 = 200) {
  return nounGet<{ icon?: NounIcon }>(`/v2/icon/${iconId}`, {
    thumbnail_size: thumbnailSize,
  })
}

/** Quota: GET /v2/client/usage */
export function getNounUsage() {
  return nounGet<NounUsageResponse>('/v2/client/usage')
}
