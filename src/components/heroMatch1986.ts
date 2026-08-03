/**
 * ARG–ENG World Cup 1986 hero match frames.
 * Frame 1 is sampled from the artist reference board (local-maxima lattice).
 */

export type MatchParticle = {
  homeX: number
  homeY: number
  r: number
  g: number
  b: number
  a: number
}

type RGB = { r: number; g: number; b: number; a?: number }

const ARG: RGB = { r: 0, g: 174, b: 239 }
const ENG: RGB = { r: 237, g: 28, b: 36 }
const YEL: RGB = { r: 255, g: 242, b: 0 }
const WHT: RGB = { r: 243, g: 244, b: 245 }
const INK: RGB = { r: 18, g: 20, b: 24 }

function quantize(r: number, g: number, b: number): RGB | null {
  const L = r + g + b
  if (L < 90) return null
  if (b > 120 && b >= r + 8 && g > 55) return ARG
  if (r > 140 && r > g + 35 && r > b + 35) return ENG
  if (r > 160 && g > 135 && b < 145) return YEL
  if (L > 380) return WHT
  if (L < 200) return INK
  if (Math.abs(r - g) < 45 && Math.abs(g - b) < 45 && L > 250) return WHT
  if (b > r) return ARG
  if (r > b + 20) return ENG
  return WHT
}

/**
 * Sample a drawn match board from ImageData.
 * Keeps only local luma maxima so soft JPEG edges don't flood the lattice.
 */
export function sampleMatchImageData(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  gap: number
): { points: MatchParticle[]; rect: { x: number; y: number; w: number; h: number } } {
  const step = Math.max(3, Math.round(gap || 4))
  // Fit source into dest with letterbox.
  const scale = Math.min((destW * 0.92) / srcW, (destH * 0.88) / srcH)
  const usedW = Math.round(srcW * scale)
  const usedH = Math.round(srcH * scale)
  const ox = Math.floor((destW - usedW) / 2)
  const oy = Math.floor((destH - usedH) / 2)

  // Work in source pixel space with a pitch derived from step/scale.
  const pitch = Math.max(4, Math.round(step / Math.max(scale, 0.01)))
  const rad = Math.max(1, Math.floor(pitch * 0.35))
  const points: MatchParticle[] = []

  const lumaAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= srcW || y >= srcH) return -1
    const i = (y * srcW + x) * 4
    return data[i] + data[i + 1] + data[i + 2]
  }

  for (let y = rad; y < srcH - rad; y += pitch) {
    for (let x = rad; x < srcW - rad; x += pitch) {
      // Peak color in neighborhood
      let bestL = -1
      let br = 0
      let bg = 0
      let bb = 0
      let bx = x
      let by = y
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          const xx = x + dx
          const yy = y + dy
          const i = (yy * srcW + xx) * 4
          const L = data[i] + data[i + 1] + data[i + 2]
          if (L > bestL) {
            bestL = L
            br = data[i]
            bg = data[i + 1]
            bb = data[i + 2]
            bx = xx
            by = yy
          }
        }
      }
      if (bestL < 140) continue
      // Local maximum gate — reject soft edge samples.
      const cL = lumaAt(bx, by)
      if (
        cL < lumaAt(bx - 1, by) ||
        cL < lumaAt(bx + 1, by) ||
        cL < lumaAt(bx, by - 1) ||
        cL < lumaAt(bx, by + 1)
      ) {
        continue
      }
      const q = quantize(br, bg, bb)
      if (!q) continue
      // Drop lone dark ink unless surrounded by white (ball patches).
      if (q === INK) {
        let nearW = false
        for (let dy = -2; dy <= 2 && !nearW; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const i = ((by + dy) * srcW + (bx + dx)) * 4
            if (i < 0 || i >= data.length) continue
            if (quantize(data[i], data[i + 1], data[i + 2]) === WHT) {
              nearW = true
              break
            }
          }
        }
        if (!nearW) continue
      }
      points.push({
        homeX: ox + bx * scale,
        homeY: oy + by * scale,
        r: q.r,
        g: q.g,
        b: q.b,
        a: 255,
      })
    }
  }

  return {
    points,
    rect: { x: ox, y: oy, w: usedW, h: usedH },
  }
}

/** Kept for programmatic frames 2+ later. */
export function sampleMatchFrame(
  W: number,
  H: number,
  gap: number,
  _frameId = 1
): { points: MatchParticle[]; rect: { x: number; y: number; w: number; h: number } } {
  return {
    points: [],
    rect: { x: 0, y: 0, w: W, h: H },
  }
}
