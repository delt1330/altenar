import React, { useEffect, useRef } from 'react'

type RGB = readonly [number, number, number]
type Cell = { col: number; row: number; color: RGB }
type Point = { x: number; y: number }
type Spark = Point & {
  vx: number
  vy: number
  life: number
  color: RGB
}

const COLORS = {
  argentina: [0, 174, 239] as RGB,
  england: [237, 28, 36] as RGB,
  clock: [255, 242, 0] as RGB,
  white: [243, 244, 245] as RGB,
  ink: [18, 20, 24] as RGB,
  black: [0, 0, 0] as RGB,
  live: [0, 158, 227] as RGB,
}

const PARTICLE_SIZE = 3
const PARTICLE_GAP = 1
const PITCH = PARTICLE_SIZE + PARTICLE_GAP
/** Wait for header / slogan wipe / lead / CTA to settle. */
const INTRO_UI_WAIT_MS = 2000
const INTRO_LOADER_ASSEMBLE_MS = 2800
const INTRO_BAR_FILL_MS = 4200
const INTRO_MATCH_CROSSFADE_MS = 2400

const INTRO_LOADING_BASE = 'LOADING'

type IntroKind = 'loading' | 'bar'

type IntroParticle = {
  homeX: number
  homeY: number
  startX: number
  startY: number
  color: RGB
  /** If set, color lerps from startColor → color with assemble progress. */
  startColor?: RGB
  /** Midpoint for explode → reassemble morph. */
  burstX?: number
  burstY?: number
  /** 0–1 delay so the burst peels apart, not all at once. */
  burstDelay?: number
  kind: IntroKind
}

type IntroPhase =
  | 'ui-wait'
  | 'loader-assembling'
  | 'loader-filling'
  | 'match-crossfade'
  | 'done'

type IntroCell = Cell & { kind: IntroKind }

const FONT: Record<string, string[]> = {
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
  ':': ['0', '1', '0', '0', '0', '1', '0'],
  '.': ['0', '0', '0', '0', '0', '1', '0'],
  ',': ['00', '00', '00', '00', '01', '01', '10'],
  '0': ['111', '101', '101', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '010', '010', '111'],
  '2': ['111', '001', '001', '111', '100', '100', '111'],
  '3': ['111', '001', '001', '111', '001', '001', '111'],
  '4': ['101', '101', '101', '111', '001', '001', '001'],
  '5': ['111', '100', '100', '111', '001', '001', '111'],
  '6': ['111', '100', '100', '111', '101', '101', '111'],
  '7': ['111', '001', '001', '010', '010', '010', '010'],
  '8': ['111', '101', '101', '111', '101', '101', '111'],
  '9': ['111', '101', '101', '111', '001', '001', '111'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
}

const BALL_MASK = [
  '000001111100000',
  '000111111111000',
  '001111111111100',
  '011111111111110',
  '011111111111110',
  '111111111111111',
  '111111111111111',
  '111111111111111',
  '111111111111111',
  '111111111111111',
  '011111111111110',
  '011111111111110',
  '001111111111100',
  '000111111111000',
  '000001111100000',
]

const BALL_PATCH_MASK = [
  '000000000000000',
  '000000111000000',
  '000001111100000',
  '000000111000000',
  '000000000000000',
  '011100000001110',
  '011100111001110',
  '001101111101100',
  '000001111100000',
  '000000111000000',
  '000000000000000',
  '001110000011100',
  '001110000011100',
  '000110000011000',
  '000000000000000',
]

const PIXEL_CURSOR_MASK = [
  '1000000',
  '1100000',
  '1110000',
  '1111000',
  '1111100',
  '1111110',
  '1111111',
  '1111000',
  '1101100',
  '1000110',
  '0000110',
  '0000011',
]

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function goalDepthForCols(cols: number) {
  return clamp(Math.round(cols * 0.045), 8, 11)
}

function snap(value: number) {
  return Math.round(value / PITCH) * PITCH
}

function glyphWidth(char: string) {
  return (FONT[char] || FONT[' '])[0].length
}

function textWidth(text: string, scale = 1, tracking = 1) {
  const chars = Array.from(text.toUpperCase())
  if (!chars.length) return 0
  const logical = chars.reduce((sum, char) => sum + glyphWidth(char), 0)
  return logical * scale + (chars.length - 1) * tracking
}

function addText(
  cells: Cell[],
  text: string,
  col: number,
  row: number,
  color: RGB,
  scale = 1,
  tracking = 1,
  scaleY = scale
) {
  let cursor = col
  for (const rawChar of text.toUpperCase()) {
    const glyph = FONT[rawChar] || FONT[' ']
    const filledCellHeight =
      rawChar === '.' || rawChar === ':'
        ? Math.max(scale, scaleY)
        : scaleY
    for (let gy = 0; gy < glyph.length; gy++) {
      for (let gx = 0; gx < glyph[gy].length; gx++) {
        if (glyph[gy][gx] !== '1') continue
        for (let sy = 0; sy < filledCellHeight; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            cells.push({
              col: cursor + gx * scale + sx,
              row: row + gy * scaleY + sy,
              color,
            })
          }
        }
      }
    }
    cursor += glyph[0].length * scale + tracking
  }
}

function addTextKind(
  cells: IntroCell[],
  text: string,
  col: number,
  row: number,
  color: RGB,
  kind: IntroKind,
  scale = 1,
  tracking = 1
) {
  const bucket: Cell[] = []
  addText(bucket, text, col, row, color, scale, tracking)
  for (const cell of bucket) cells.push({ ...cell, kind })
}

/** Retro battery-style loading bar (outline + optional fill cubes). */
function addProgressBar(
  cells: IntroCell[],
  col: number,
  row: number,
  width: number,
  height: number,
  fill01: number,
  outline: RGB,
  fill: RGB
) {
  const w = Math.max(12, Math.round(width))
  const h = Math.max(4, Math.round(height))
  const nipple = Math.max(1, Math.round(h * 0.45))
  // Left nipple (battery tip).
  for (let y = Math.floor((h - nipple) / 2); y < Math.floor((h - nipple) / 2) + nipple; y++) {
    cells.push({ col, row: row + y, color: outline, kind: 'bar' })
  }
  const bodyCol = col + 1
  const bodyW = w - 1
  // Outline.
  for (let x = 0; x < bodyW; x++) {
    cells.push({ col: bodyCol + x, row, color: outline, kind: 'bar' })
    cells.push({ col: bodyCol + x, row: row + h - 1, color: outline, kind: 'bar' })
  }
  for (let y = 1; y < h - 1; y++) {
    cells.push({ col: bodyCol, row: row + y, color: outline, kind: 'bar' })
    cells.push({
      col: bodyCol + bodyW - 1,
      row: row + y,
      color: outline,
      kind: 'bar',
    })
  }
  // Fill blocks inside (leave 1px padding).
  const innerW = Math.max(0, bodyW - 2)
  const innerH = Math.max(0, h - 2)
  const filled = Math.round(innerW * clamp(fill01, 0, 1))
  for (let x = 0; x < filled; x++) {
    for (let y = 0; y < innerH; y++) {
      cells.push({
        col: bodyCol + 1 + x,
        row: row + 1 + y,
        color: fill,
        kind: 'bar',
      })
    }
  }
}

function addPaddle(
  cells: Cell[],
  col: number,
  top: number,
  width: number,
  height: number,
  color: RGB
) {
  const lastRow = height - 1
  const braces = new Set([
    Math.round(lastRow * 0.25),
    Math.round(lastRow * 0.5),
    Math.round(lastRow * 0.75),
  ])

  for (let y = 0; y < height; y++) {
    const capInset =
      y === 0 || y === lastRow
        ? 2
        : y === 1 || y === lastRow - 1
          ? 1
          : 0
    for (let x = capInset; x < width - capInset; x++) {
      const isEnd = y <= 2 || y >= lastRow - 2
      const isRail = x < 2 || x >= width - 2
      if (isEnd || isRail || braces.has(y)) {
        cells.push({ col: col + x, row: top + y, color })
      }
    }
  }
}

function addPixelCursor(
  cells: Cell[],
  col: number,
  row: number,
  color: RGB
) {
  for (let y = 0; y < PIXEL_CURSOR_MASK.length; y++) {
    for (let x = 0; x < PIXEL_CURSOR_MASK[y].length; x++) {
      if (PIXEL_CURSOR_MASK[y][x] !== '1') continue
      cells.push({ col: col + x, row: row + y, color })
    }
  }
}

function addDashedRect(
  cells: Cell[],
  left: number,
  top: number,
  width: number,
  height: number,
  color: RGB,
  step = 4
) {
  const rectLeft = Math.round(left)
  const rectTop = Math.round(top)
  const rectWidth = Math.max(1, Math.round(width))
  const rectHeight = Math.max(1, Math.round(height))
  const horizontalSegments = Math.max(
    1,
    Math.round(rectWidth / step)
  )
  const verticalSegments = Math.max(
    1,
    Math.round(rectHeight / step)
  )

  for (let index = 0; index <= horizontalSegments; index++) {
    const x = Math.round(
      (index * rectWidth) / horizontalSegments
    )
    cells.push({ col: rectLeft + x, row: rectTop, color })
    cells.push({
      col: rectLeft + x,
      row: rectTop + rectHeight,
      color,
    })
  }
  for (let index = 0; index <= verticalSegments; index++) {
    const y = Math.round(
      (index * rectHeight) / verticalSegments
    )
    cells.push({ col: rectLeft, row: rectTop + y, color })
    cells.push({
      col: rectLeft + rectWidth,
      row: rectTop + y,
      color,
    })
  }
}

function drawCells(
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  originX: number,
  originY: number
) {
  const occupied = new Set<string>()
  for (const cell of cells) {
    const key = `${cell.col},${cell.row}`
    if (occupied.has(key)) continue
    occupied.add(key)
    const x = originX + cell.col * PITCH
    const y = originY + cell.row * PITCH
    const [r, g, b] = cell.color
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE)
  }
}

function easeOutCubic(t: number) {
  const u = clamp(t, 0, 1)
  return 1 - Math.pow(1 - u, 3)
}

function easeInCubic(t: number) {
  const u = clamp(t, 0, 1)
  return u * u * u
}

/**
 * Intro assemble curve: keep the full-screen scatter readable,
 * then ease into the target form (easeOut made the scatter vanish instantly).
 */
function introAssembleT(progress: number) {
  const u = clamp(progress, 0, 1)
  const scatterHold = 0.34
  if (u <= scatterHold) return 0
  return easeInCubic((u - scatterHold) / (1 - scatterHold))
}

/** Same light square grid as `.hero-stack::before` — drawn under match particles. */
function drawBackgroundGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const step = 24
  ctx.strokeStyle = 'rgba(243, 244, 245, 0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= width; x += step) {
    ctx.moveTo(x + 0.5, 0)
    ctx.lineTo(x + 0.5, height)
  }
  for (let y = 0; y <= height; y += step) {
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(width, y + 0.5)
  }
  ctx.stroke()
}

function lerpRgb(from: RGB, to: RGB, t: number): RGB {
  const u = clamp(t, 0, 1)
  return [
    Math.round(from[0] + (to[0] - from[0]) * u),
    Math.round(from[1] + (to[1] - from[1]) * u),
    Math.round(from[2] + (to[2] - from[2]) * u),
  ] as RGB
}

function drawIntroParticles(
  ctx: CanvasRenderingContext2D,
  particles: IntroParticle[],
  progress: number
) {
  const t = introAssembleT(progress)
  for (const p of particles) {
    const x = p.startX + (p.homeX - p.startX) * t
    const y = p.startY + (p.homeY - p.startY) * t
    const [r, g, b] = p.startColor
      ? lerpRgb(p.startColor, p.color, t)
      : p.color
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(
      Math.round(x),
      Math.round(y),
      PARTICLE_SIZE,
      PARTICLE_SIZE
    )
  }
}

/** Loader explodes outward, then particles reassemble into the match. */
function drawBurstMorphParticles(
  ctx: CanvasRenderingContext2D,
  particles: IntroParticle[],
  progress: number
) {
  const u = clamp(progress, 0, 1)
  const explodeEnd = 0.38
  for (const p of particles) {
    const delay = clamp(p.burstDelay ?? 0, 0, 0.28)
    const span = Math.max(0.22, 1 - delay)
    const local = clamp((u - delay) / span, 0, 1)
    const burstX = p.burstX ?? p.startX
    const burstY = p.burstY ?? p.startY
    let x: number
    let y: number
    let color: RGB
    if (local <= explodeEnd) {
      const t = easeOutCubic(local / explodeEnd)
      x = p.startX + (burstX - p.startX) * t
      y = p.startY + (burstY - p.startY) * t
      color = p.startColor ?? p.color
    } else {
      const t = easeOutCubic((local - explodeEnd) / (1 - explodeEnd))
      x = burstX + (p.homeX - burstX) * t
      y = burstY + (p.homeY - burstY) * t
      color = p.startColor ? lerpRgb(p.startColor, p.color, t) : p.color
    }
    const [r, g, b] = color
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(Math.round(x), Math.round(y), PARTICLE_SIZE, PARTICLE_SIZE)
  }
}

function buildIntroParticles(
  cells: IntroCell[],
  originX: number,
  originY: number,
  width: number,
  height: number
): IntroParticle[] {
  const occupied = new Set<string>()
  const particles: IntroParticle[] = []
  for (const cell of cells) {
    const key = `${cell.col},${cell.row}`
    if (occupied.has(key)) continue
    occupied.add(key)
    const homeX = originX + cell.col * PITCH
    const homeY = originY + cell.row * PITCH
    particles.push({
      homeX,
      homeY,
      startX: Math.random() * Math.max(1, width - PARTICLE_SIZE),
      startY: Math.random() * Math.max(1, height - PARTICLE_SIZE),
      color: cell.color,
      kind: cell.kind,
    })
  }
  return particles
}

/** Loader → match: explode outward, then fly into match homes. */
function remorphIntroParticlesBurst(
  previous: IntroParticle[],
  cells: Cell[],
  originX: number,
  originY: number,
  width: number,
  height: number
): IntroParticle[] {
  const occupied = new Set<string>()
  const homes: { x: number; y: number; color: RGB }[] = []
  for (const cell of cells) {
    const key = `${cell.col},${cell.row}`
    if (occupied.has(key)) continue
    occupied.add(key)
    homes.push({
      x: originX + cell.col * PITCH,
      y: originY + cell.row * PITCH,
      color: cell.color,
    })
  }
  if (!homes.length) return previous.slice()

  // Prefer source particles near the loader center so the burst reads clearly.
  const sources = previous.length
    ? previous.slice()
    : homes.map((home) => ({
        homeX: home.x,
        homeY: home.y,
        startX: home.x,
        startY: home.y,
        color: home.color,
        kind: 'loading' as IntroKind,
      }))

  let cx = 0
  let cy = 0
  for (const s of sources) {
    cx += s.homeX
    cy += s.homeY
  }
  cx /= sources.length
  cy /= sources.length

  // Shuffle homes so leftover loader grains don't map in a rigid scanline.
  for (let i = homes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = homes[i]
    homes[i] = homes[j]
    homes[j] = tmp
  }

  const maxBurst = Math.min(width, height) * 0.32
  const out: IntroParticle[] = []
  for (let i = 0; i < homes.length; i++) {
    const from = sources[i % sources.length]
    const home = homes[i]
    const startX = from.homeX
    const startY = from.homeY
    // Radial explode from loader centroid, with jitter so grains fan out.
    const dx = startX - cx
    const dy = startY - cy
    const radial = Math.hypot(dx, dy)
    const baseAngle =
      (radial < 2 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx)) +
      (Math.random() - 0.5) * 1.4
    const dist = 36 + Math.random() * maxBurst
    const burstX = clamp(
      startX + Math.cos(baseAngle) * dist,
      PARTICLE_SIZE,
      Math.max(PARTICLE_SIZE, width - PARTICLE_SIZE)
    )
    const burstY = clamp(
      startY + Math.sin(baseAngle) * dist,
      PARTICLE_SIZE,
      Math.max(PARTICLE_SIZE, height - PARTICLE_SIZE)
    )
    out.push({
      homeX: home.x,
      homeY: home.y,
      startX,
      startY,
      burstX,
      burstY,
      burstDelay: Math.random() * 0.22,
      startColor: from.color,
      color: home.color,
      kind: from.kind,
    })
  }
  return out
}

function loadingLabelForFill(barFill01: number): string {
  const dots = clamp(Math.ceil(clamp(barFill01, 0, 1) * 3) || 1, 1, 3)
  return INTRO_LOADING_BASE + '.'.repeat(dots)
}

/** Centered LOADING + dots (1→3 with bar) + retro progress bar. */
function buildIntroLoaderCells(
  cols: number,
  rows: number,
  readyCenterY: number,
  originY: number,
  barFill01: number
): IntroCell[] {
  const cells: IntroCell[] = []
  const loadingScale = 1
  const tracking = 1
  const glyphRows = 7
  const afterLoadingGap = 7
  const barHeight = 6
  const loadingH = glyphRows * loadingScale
  const blockHeight = loadingH + afterLoadingGap + barHeight

  const centerCol = Math.floor(cols / 2)
  const centerRow = Math.round((readyCenterY - originY) / PITCH)
  const firstRow = clamp(
    centerRow - Math.floor(blockHeight / 2),
    0,
    Math.max(0, rows - blockHeight)
  )

  const label = loadingLabelForFill(barFill01)
  // Keep left edge fixed so dots grow without shifting "LOADING".
  const fullW = textWidth(INTRO_LOADING_BASE + '...', loadingScale, tracking)
  addTextKind(
    cells,
    label,
    centerCol - Math.floor(fullW / 2),
    firstRow,
    COLORS.white,
    'loading',
    loadingScale,
    tracking
  )

  const barRow = firstRow + loadingH + afterLoadingGap
  const barWidth = Math.min(cols - 8, Math.max(40, Math.round(cols * 0.32)))
  addProgressBar(
    cells,
    centerCol - Math.floor(barWidth / 2),
    barRow,
    barWidth,
    barHeight,
    barFill01,
    COLORS.white,
    COLORS.live
  )

  return cells
}

function drawBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  originX: number,
  originY: number
) {
  const centerX = (BALL_MASK[0].length - 1) / 2
  const centerY = (BALL_MASK.length - 1) / 2
  const cos = Math.cos(-rotation)
  const sin = Math.sin(-rotation)
  const baseCol =
    Math.round((snap(x) - originX) / PITCH) -
    Math.floor(BALL_MASK[0].length / 2)
  const baseRow =
    Math.round((snap(y) - originY) / PITCH) -
    Math.floor(BALL_MASK.length / 2)
  for (let row = 0; row < BALL_MASK.length; row++) {
    for (let col = 0; col < BALL_MASK[row].length; col++) {
      if (BALL_MASK[row][col] !== '1') continue
      const isEdge =
        row === 0 ||
        row === BALL_MASK.length - 1 ||
        col === 0 ||
        col === BALL_MASK[row].length - 1 ||
        BALL_MASK[row - 1][col] !== '1' ||
        BALL_MASK[row + 1][col] !== '1' ||
        BALL_MASK[row][col - 1] !== '1' ||
        BALL_MASK[row][col + 1] !== '1'
      const localX = col - centerX
      const localY = row - centerY
      const sampleCol = Math.round(centerX + localX * cos - localY * sin)
      const sampleRow = Math.round(centerY + localX * sin + localY * cos)
      const hasPatch =
        sampleRow >= 0 &&
        sampleRow < BALL_PATCH_MASK.length &&
        sampleCol >= 0 &&
        sampleCol < BALL_PATCH_MASK[sampleRow].length &&
        BALL_PATCH_MASK[sampleRow][sampleCol] === '1'
      const color =
        !isEdge && hasPatch ? COLORS.ink : COLORS.white
      const [r, g, b] = color
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(
        originX + (baseCol + col) * PITCH,
        originY + (baseRow + row) * PITCH,
        PARTICLE_SIZE,
        PARTICLE_SIZE
      )
    }
  }
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  trail: Point[],
  originX: number,
  originY: number
) {
  ctx.fillStyle = 'rgb(243,244,245)'
  for (let i = 2; i < trail.length; i += 5) {
    const p = trail[i]
    const x = originX + Math.round((snap(p.x) - originX) / PITCH) * PITCH
    const y = originY + Math.round((snap(p.y) - originY) / PITCH) * PITCH
    ctx.fillRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE)
  }
}

function drawSparks(
  ctx: CanvasRenderingContext2D,
  sparks: Spark[],
  originX: number,
  originY: number
) {
  for (const spark of sparks) {
    const [r, g, b] = spark.color
    ctx.fillStyle = `rgb(${r},${g},${b})`
    const x =
      originX + Math.round((spark.x - originX) / PITCH) * PITCH
    const y =
      originY + Math.round((spark.y - originY) / PITCH) * PITCH
    ctx.fillRect(x, y, PARTICLE_SIZE, PARTICLE_SIZE)
  }
}

type HeroMatchBoardProps = {
  onPlayChange?: (playing: boolean) => void
}

export default function HeroMatchBoard({
  onPlayChange,
}: HeroMatchBoardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onPlayChangeRef = useRef(onPlayChange)
  onPlayChangeRef.current = onPlayChange

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return

    const GAME_DURATION = 30
    const GOAL_DURATION = 0.9
    const FULL_TIME_BURST_INTERVAL = 0.72
    const buffer = document.createElement('canvas')

    let frame = 0
    let running = true
    let last = performance.now()
    let matchIndex = 0
    let matchTime = 0
    let sceneTime = 0
    let fullTimeSparkAccumulator = 0
    let nextFullTimeBurstSide: 'left' | 'right' = 'left'
    let scene: 'ready' | 'playing' | 'goal' | 'fulltime' =
      'ready'
    let introPhase: IntroPhase = 'ui-wait'
    let introElapsed = 0
    let introParticles: IntroParticle[] = []
    let introBarFillStep = -1
    let notifiedPlaying = false
    let scoreArgentina = 0

    const notifyPlayChange = (playing: boolean) => {
      if (notifiedPlaying === playing) return
      notifiedPlaying = playing
      onPlayChangeRef.current?.(playing)
    }
    let scoreEngland = 0
    let momentum = 0
    let displayedOdds = 2.45
    let marketTeam: 'ARG' | 'ENG' = 'ARG'
    let rally = 0
    let nextServeDirection = 1
    let ball = { x: 0, y: 0, vx: 260, vy: 95 }
    let ballRotation = 0
    let leftPaddleY = 0
    let rightPaddleY = 0
    let leftPaddleVelocity = 0
    let rightPaddleVelocity = 0
    let trail: Point[] = []
    let trailBurst = 0
    let sparks: Spark[] = []
    let pointer = { x: -9999, y: -9999, active: false }
    let controlledSide: 'left' | 'right' = 'right'
    let playAgainHovered = false
    let playAgainHitbox: {
      left: number
      top: number
      right: number
      bottom: number
    } | null = null
    let layout = {
      width: 2,
      height: 2,
      originX: 0,
      originY: 0,
      cols: 2,
      rows: 2,
      leftGoalX: 0,
      rightGoalX: 0,
      goalTop: 0,
      goalBottom: 0,
      readyCenterY: 0,
    }

    const getGeometry = () => {
      const goalTopRow = Math.round(
        (layout.goalTop - layout.originY) / PITCH
      )
      const goalHeight = Math.max(
        30,
        Math.round((layout.goalBottom - layout.goalTop) / PITCH)
      )
      const sideDepth = goalDepthForCols(layout.cols)
      const paddleWidth = 7
      const paddleHeight = Math.max(22, Math.round(goalHeight * 0.42))
      const leftPaddleCol =
        9 + Math.floor((sideDepth - paddleWidth) / 2)
      const rightPaddleCol =
        layout.cols -
        9 -
        sideDepth +
        Math.ceil((sideDepth - paddleWidth) / 2)
      const paddleWidthPx = (paddleWidth - 1) * PITCH + PARTICLE_SIZE
      const paddleHeightPx = (paddleHeight - 1) * PITCH + PARTICLE_SIZE
      const leftPaddleX = layout.originX + leftPaddleCol * PITCH
      const rightPaddleX = layout.originX + rightPaddleCol * PITCH
      const fieldTop = layout.originY + 72
      const fieldBottom =
        layout.originY + layout.rows * PITCH - 72

      return {
        goalTopRow,
        goalHeight,
        paddleWidth,
        paddleHeight,
        paddleWidthPx,
        paddleHeightPx,
        leftPaddleCol,
        rightPaddleCol,
        leftPaddleX,
        rightPaddleX,
        leftPaddleFace: leftPaddleX + paddleWidthPx,
        rightPaddleFace: rightPaddleX,
        leftGoalLine: layout.leftGoalX - 6 * PITCH,
        rightGoalLine: layout.rightGoalX + 6 * PITCH,
        fieldTop,
        fieldBottom,
      }
    }

    const moveToward = (
      current: number,
      target: number,
      maximumDelta: number
    ) =>
      current +
      clamp(target - current, -maximumDelta, maximumDelta)

    const reflectIntoRange = (
      value: number,
      minimum: number,
      maximum: number
    ) => {
      const span = Math.max(1, maximum - minimum)
      const period = span * 2
      let offset = (value - minimum) % period
      if (offset < 0) offset += period
      return offset <= span
        ? minimum + offset
        : maximum - (offset - span)
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      const dpr = Math.max(
        1,
        Math.round(window.devicePixelRatio || 1)
      )
      const width = Math.max(2, Math.round(rect.width))
      const height = Math.max(2, Math.round(rect.height))
      canvas.width = width * dpr
      canvas.height = height * dpr
      buffer.width = width * dpr
      buffer.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const cols = Math.max(96, Math.floor(width / PITCH))
      const safeTop = clamp(Math.round(height * 0.14), 84, 112)
      const safeBottom = 20
      const availableHeight = Math.max(
        240,
        height - safeTop - safeBottom
      )
      const rows = Math.max(60, Math.floor(availableHeight / PITCH))
      const boardCols = Math.min(cols - 8, 232)
      const boardRows = Math.min(rows - 4, 132)
      const originX =
        Math.floor((width - boardCols * PITCH) / (2 * PITCH)) *
        PITCH
      const originY =
        Math.floor(
          (safeTop + (availableHeight - boardRows * PITCH) / 2) /
            PITCH
        ) * PITCH
      const leftGoalX = originX + 9 * PITCH
      const rightGoalX =
        originX + (boardCols - 9) * PITCH
      const goalTop =
        originY + Math.round(boardRows * 0.33) * PITCH
      const goalBottom =
        originY + Math.round(boardRows * 0.79) * PITCH
      const heroStack = root.closest<HTMLElement>('.hero-stack')
      const slogan =
        heroStack?.querySelector<HTMLElement>('.hero-slogan-solid')
      const lowerElements = [
        heroStack?.querySelector<HTMLElement>('.hero-cta-row'),
        heroStack?.querySelector<HTMLElement>('.hero-lead-row'),
      ].filter((element): element is HTMLElement => Boolean(element))
      const sloganBottom = slogan
        ? slogan.getBoundingClientRect().bottom - rect.top
        : height * 0.28
      const lowerTops = lowerElements
        .map(
          (element) =>
            element.getBoundingClientRect().top - rect.top
        )
        .filter((top) => top > sloganBottom + 8)
      const lowerTop = lowerTops.length
        ? Math.min(...lowerTops)
        : height * 0.78
      // Center the ready cluster in the clear band between slogan and lead/CTA.
      const bandPad = Math.round(Math.min(36, (lowerTop - sloganBottom) * 0.08))
      const bandTop = sloganBottom + bandPad
      const bandBottom = Math.max(bandTop + 80, lowerTop - bandPad)
      const readyCenterY = clamp(
        (bandTop + bandBottom) / 2,
        originY + 20 * PITCH,
        originY + (boardRows - 24) * PITCH
      )

      layout = {
        width,
        height,
        originX,
        originY,
        cols: boardCols,
        rows: boardRows,
        leftGoalX,
        rightGoalX,
        goalTop,
        goalBottom,
        readyCenterY,
      }

      const geometry = getGeometry()
      const halfPaddle = geometry.paddleHeightPx / 2
      const centerY =
        (geometry.fieldTop + geometry.fieldBottom) / 2
      const minimumY = geometry.fieldTop + halfPaddle
      const maximumY = geometry.fieldBottom - halfPaddle

      leftPaddleY =
        leftPaddleY === 0
          ? centerY
          : clamp(leftPaddleY, minimumY, maximumY)
      rightPaddleY =
        rightPaddleY === 0
          ? centerY
          : clamp(rightPaddleY, minimumY, maximumY)
      ball.x =
        ball.x === 0
          ? (geometry.leftPaddleFace +
              geometry.rightPaddleFace) /
            2
          : clamp(
              ball.x,
              geometry.leftGoalLine,
              geometry.rightGoalLine
            )
      ball.y =
        ball.y === 0
          ? centerY
          : clamp(ball.y, geometry.fieldTop, geometry.fieldBottom)

      if (introPhase !== 'done' && introParticles.length) {
        introParticles = []
      }
    }

    const resetBall = (direction: number) => {
      const geometry = getGeometry()
      const centerX =
        (geometry.leftPaddleFace + geometry.rightPaddleFace) / 2
      const centerY =
        (geometry.fieldTop + geometry.fieldBottom) / 2
      const speed = 275
      const vertical =
        (matchIndex % 2 === 0 ? 1 : -1) *
        (82 + Math.random() * 42)

      ball = {
        x: centerX,
        y: centerY + (Math.random() - 0.5) * 28,
        vx:
          Math.sign(direction || 1) *
          Math.sqrt(speed * speed - vertical * vertical),
        vy: vertical,
      }
      ballRotation = 0
      trail = []
      trailBurst = 0
    }

    const resetMatch = (
      nextScene: 'ready' | 'playing'
    ) => {
      matchIndex += 1
      matchTime = 0
      sceneTime = 0
      scene = nextScene
      scoreArgentina = 0
      scoreEngland = 0
      momentum = 0
      displayedOdds = 2.45
      marketTeam = 'ARG'
      rally = 0
      sparks = []
      const geometry = getGeometry()
      const centerY =
        (geometry.fieldTop + geometry.fieldBottom) / 2
      leftPaddleY = centerY
      rightPaddleY = centerY
      leftPaddleVelocity = 0
      rightPaddleVelocity = 0
      resetBall(matchIndex % 2 === 0 ? 1 : -1)
      if (nextScene === 'ready') {
        ball.y = centerY
        ball.vx = 0
        ball.vy = 0
      }
    }

    const restartMatch = () => {
      resetMatch('playing')
      notifyPlayChange(true)
    }
    const prepareMatch = () => {
      resetMatch('ready')
      notifyPlayChange(false)
    }
    const closeMatch = () => {
      // Back to pre-launch: ready board + restore hero copy.
      prepareMatch()
    }

    const onPointerMove = (event: PointerEvent) => {
      if (introPhase !== 'done') {
        return
      }
      const rect = root.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      pointer = {
        x,
        y,
        active: true,
      }
      playAgainHovered =
        (scene === 'ready' || scene === 'fulltime') &&
        playAgainHitbox !== null &&
        x >= playAgainHitbox.left &&
        x <= playAgainHitbox.right &&
        y >= playAgainHitbox.top &&
        y <= playAgainHitbox.bottom
      root.style.cursor = 'none'
      const center = rect.width / 2
      if (x < center - 6) controlledSide = 'left'
      if (x > center + 6) controlledSide = 'right'
    }

    const onPointerLeave = () => {
      pointer.active = false
      playAgainHovered = false
      root.style.cursor = ''
    }

    const onPointerDown = (event: PointerEvent) => {
      if (introPhase !== 'done') {
        return
      }
      if (
        (scene !== 'ready' && scene !== 'fulltime') ||
        !playAgainHitbox
      ) {
        return
      }
      const rect = root.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      if (
        x < playAgainHitbox.left ||
        x > playAgainHitbox.right ||
        y < playAgainHitbox.top ||
        y > playAgainHitbox.bottom
      ) {
        return
      }
      playAgainHovered = false
      root.style.cursor = 'none'
      if (scene === 'fulltime') {
        closeMatch()
        return
      }
      restartMatch()
    }

    const formatClock = () => {
      const seconds = Math.min(
        GAME_DURATION,
        Math.max(0, Math.floor(matchTime))
      )
      const minutes = Math.floor(seconds / 60)
      const remainder = seconds % 60
      return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    }

    const calculateMarket = () => {
      const progress = clamp(matchTime / GAME_DURATION, 0, 1)
      const scoreDifference = scoreArgentina - scoreEngland
      const scorePressure = 0.45 + progress * 0.55
      const argLogit = clamp(
        0.16 +
          scoreDifference * scorePressure +
          momentum * 0.25,
        -8,
        8
      )
      const engLogit = clamp(
        -0.04 -
          scoreDifference * scorePressure -
          momentum * 0.25,
        -8,
        8
      )
      const drawLogit = clamp(
        -0.36 +
          progress * 1.55 -
          Math.abs(scoreDifference) *
            (0.75 + progress * 0.55),
        -8,
        8
      )
      const argWeight = Math.exp(argLogit)
      const engWeight = Math.exp(engLogit)
      const drawWeight = Math.exp(drawLogit)
      const total = argWeight + engWeight + drawWeight
      const argProbability = argWeight / total
      const engProbability = engWeight / total
      const marketProbability =
        marketTeam === 'ARG' ? argProbability : engProbability
      const targetOdds = clamp(
        1.04 / marketProbability,
        1.05,
        9.99
      )

      return {
        label: `${marketTeam} WIN`,
        color:
          marketTeam === 'ARG'
            ? COLORS.argentina
            : COLORS.england,
        odds: displayedOdds.toFixed(2),
        targetOdds,
      }
    }

    const updateDisplayedOdds = (dt: number) => {
      const { targetOdds } = calculateMarket()
      const response = scene === 'goal' ? 5.2 : 2.1
      const blend = 1 - Math.exp(-response * dt)
      displayedOdds += (targetOdds - displayedOdds) * blend
      displayedOdds = clamp(displayedOdds, 1.05, 9.99)
    }

    const updateSparks = (dt: number) => {
      for (const spark of sparks) {
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt
        spark.vy += 26 * dt
        spark.life -= dt
      }
      sparks = sparks.filter((spark) => spark.life > 0)
    }

    const getWinnerColor = (): RGB =>
      scoreArgentina > scoreEngland
        ? COLORS.argentina
        : scoreEngland > scoreArgentina
          ? COLORS.england
          : COLORS.clock

    const spawnGoalSparks = (
      missedSide: 'left' | 'right',
      impactY: number,
      scorerColor: RGB
    ) => {
      const geometry = getGeometry()
      const impactX =
        missedSide === 'left'
          ? geometry.leftGoalLine
          : geometry.rightGoalLine
      const inward = missedSide === 'left' ? 1 : -1
      const additions: Spark[] = []

      for (let index = 0; index < 34; index++) {
        const angle = (Math.random() - 0.5) * Math.PI * 1.15
        const speed = 78 + Math.random() * 170
        additions.push({
          x: impactX,
          y: impactY,
          vx: inward * Math.abs(Math.cos(angle)) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.34 + Math.random() * 0.58,
          color: index % 4 === 0 ? COLORS.white : scorerColor,
        })
      }
      sparks = additions
    }

    const spawnFullTimeBurst = (
      side: 'left' | 'right',
      winnerColor: RGB
    ) => {
      const geometry = getGeometry()
      const additions: Spark[] = []
      const fieldWidth =
        geometry.rightPaddleFace - geometry.leftPaddleFace
      const horizontalDepth =
        fieldWidth * (0.08 + Math.random() * 0.28)
      const burstX =
        side === 'left'
          ? geometry.leftPaddleFace + horizontalDepth
          : geometry.rightPaddleFace - horizontalDepth
      const verticalPadding = Math.min(
        88,
        (geometry.fieldBottom - geometry.fieldTop) * 0.22
      )
      const burstY =
        geometry.fieldTop +
        verticalPadding +
        Math.random() *
          Math.max(
            1,
            geometry.fieldBottom -
              geometry.fieldTop -
              verticalPadding * 2
          )
      const rayCount = 14
      const phase = Math.random() * Math.PI * 2

      for (let ray = 0; ray < rayCount; ray++) {
        const angle =
          phase + (ray / rayCount) * Math.PI * 2
        for (let bead = 0; bead < 3; bead++) {
          const speed =
            46 + bead * 38 + Math.random() * 15
          additions.push({
            x: burstX,
            y: burstY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.86 + bead * 0.16 + Math.random() * 0.28,
            color:
              (ray + bead) % 5 === 0
                ? COLORS.white
                : winnerColor,
          })
        }
      }
      sparks.push(...additions)
    }

    const updatePaddles = (dt: number) => {
      const geometry = getGeometry()
      const halfPaddle = geometry.paddleHeightPx / 2
      const minimumY = geometry.fieldTop + halfPaddle
      const maximumY = geometry.fieldBottom - halfPaddle
      const centerY =
        (geometry.fieldTop + geometry.fieldBottom) / 2

      const aiTarget = (side: 'left' | 'right') => {
        if (scene !== 'playing') return centerY
        const approaching =
          side === 'left' ? ball.vx < 0 : ball.vx > 0
        if (!approaching) return centerY
        const targetX =
          side === 'left'
            ? geometry.leftPaddleFace
            : geometry.rightPaddleFace
        const travelTime = Math.abs(
          (targetX - ball.x) / (ball.vx || 1)
        )
        const prediction =
          ball.y +
          ball.vy * clamp(travelTime, 0, 0.82) +
          Math.sin(matchTime * 2.25 + (side === 'left' ? 0 : 1.7)) *
            24
        return reflectIntoRange(prediction, minimumY, maximumY)
      }

      const humanSide = pointer.active ? controlledSide : null
      const leftTarget =
        humanSide === 'left'
          ? pointer.y
          : aiTarget('left')
      const rightTarget =
        humanSide === 'right'
          ? pointer.y
          : aiTarget('right')
      const aiSpeed = 188 + Math.min(58, rally * 3.5)
      const userSpeed = 760
      const previousLeft = leftPaddleY
      const previousRight = rightPaddleY

      leftPaddleY = moveToward(
        leftPaddleY,
        clamp(leftTarget, minimumY, maximumY),
        (humanSide === 'left' ? userSpeed : aiSpeed) * dt
      )
      rightPaddleY = moveToward(
        rightPaddleY,
        clamp(rightTarget, minimumY, maximumY),
        (humanSide === 'right' ? userSpeed : aiSpeed) * dt
      )
      leftPaddleVelocity =
        dt > 0 ? (leftPaddleY - previousLeft) / dt : 0
      rightPaddleVelocity =
        dt > 0 ? (rightPaddleY - previousRight) / dt : 0
    }

    const bounceFromPaddle = (side: 'left' | 'right') => {
      const geometry = getGeometry()
      const isLeft = side === 'left'
      const paddleY = isLeft ? leftPaddleY : rightPaddleY
      const paddleVelocity = isLeft
        ? leftPaddleVelocity
        : rightPaddleVelocity
      const relativeImpact = clamp(
        (ball.y - paddleY) / (geometry.paddleHeightPx / 2),
        -1,
        1
      )
      const currentSpeed = Math.hypot(ball.vx, ball.vy)
      const nextSpeed = Math.min(390, currentSpeed * 1.025 + 3)
      const nextVertical = clamp(
        ball.vy +
          relativeImpact * 132 +
          paddleVelocity * 0.12,
        -nextSpeed * 0.78,
        nextSpeed * 0.78
      )
      const horizontal = Math.sqrt(
        Math.max(1, nextSpeed * nextSpeed - nextVertical * nextVertical)
      )
      const radius =
        Math.floor(BALL_MASK[0].length / 2) * PITCH +
        PARTICLE_SIZE / 2

      ball.x = isLeft
        ? geometry.leftPaddleFace + radius
        : geometry.rightPaddleFace - radius
      ball.vx = isLeft ? horizontal : -horizontal
      ball.vy = nextVertical
      momentum = clamp(
        momentum + (isLeft ? 0.09 : -0.09),
        -1,
        1
      )
      rally += 1
      trail = [{ x: ball.x, y: ball.y }]
      trailBurst = 0.48
    }

    const scoreGoal = (
      scorer: 'ARG' | 'ENG',
      missedSide: 'left' | 'right'
    ) => {
      if (scene !== 'playing') return
      if (scorer === 'ARG') {
        scoreArgentina += 1
        momentum = clamp(momentum + 0.72, -1, 1)
      } else {
        scoreEngland += 1
        momentum = clamp(momentum - 0.72, -1, 1)
      }
      marketTeam =
        scoreArgentina > scoreEngland
          ? 'ARG'
          : scoreEngland > scoreArgentina
            ? 'ENG'
            : scorer
      scene = 'goal'
      sceneTime = 0
      rally = 0
      nextServeDirection = missedSide === 'left' ? -1 : 1
      spawnGoalSparks(
        missedSide,
        ball.y,
        scorer === 'ARG' ? COLORS.argentina : COLORS.england
      )
      ball.vx = 0
      ball.vy = 0
      trail = []
      trailBurst = 0
    }

    const enterFullTime = () => {
      if (scene === 'fulltime') return
      scene = 'fulltime'
      sceneTime = 0
      fullTimeSparkAccumulator = 0
      nextFullTimeBurstSide = 'left'
      ball.vx = 0
      ball.vy = 0
      trail = []
      sparks = []
      // Keep hero copy hidden until CLOSE — do not notifyPlayChange(false) here.
      if (scoreArgentina !== scoreEngland) {
        const winnerColor = getWinnerColor()
        spawnFullTimeBurst('left', winnerColor)
        spawnFullTimeBurst('right', winnerColor)
      }
    }

    const updateBall = (dt: number) => {
      const geometry = getGeometry()
      const radius =
        Math.floor(BALL_MASK[0].length / 2) * PITCH +
        PARTICLE_SIZE / 2
      const previousX = ball.x
      const speed = Math.hypot(ball.vx, ball.vy)
      ballRotation +=
        dt * (0.72 + speed / 360) * Math.sign(ball.vx || 1)
      ball.x += ball.vx * dt
      ball.y += ball.vy * dt

      if (ball.y - radius <= geometry.fieldTop) {
        ball.y = geometry.fieldTop + radius
        ball.vy = Math.abs(ball.vy)
      } else if (ball.y + radius >= geometry.fieldBottom) {
        ball.y = geometry.fieldBottom - radius
        ball.vy = -Math.abs(ball.vy)
      }

      if (
        ball.vx < 0 &&
        previousX - radius > geometry.leftPaddleFace &&
        ball.x - radius <= geometry.leftPaddleFace
      ) {
        const hit =
          Math.abs(ball.y - leftPaddleY) <=
          geometry.paddleHeightPx / 2 + radius * 0.22
        if (hit) bounceFromPaddle('left')
      }

      if (
        ball.vx > 0 &&
        previousX + radius < geometry.rightPaddleFace &&
        ball.x + radius >= geometry.rightPaddleFace
      ) {
        const hit =
          Math.abs(ball.y - rightPaddleY) <=
          geometry.paddleHeightPx / 2 + radius * 0.22
        if (hit) bounceFromPaddle('right')
      }

      if (ball.x - radius <= geometry.leftGoalLine) {
        scoreGoal('ENG', 'left')
        return
      }
      if (ball.x + radius >= geometry.rightGoalLine) {
        scoreGoal('ARG', 'right')
        return
      }

      momentum = moveToward(momentum, 0, dt * 0.018)
      if (trailBurst > 0) {
        trailBurst = Math.max(0, trailBurst - dt)
        trail.unshift({ x: ball.x, y: ball.y })
        trail = trail.slice(0, 32)
      } else if (trail.length > 0) {
        const nextLength = Math.max(0, trail.length - 2)
        trail.unshift({ x: ball.x, y: ball.y })
        trail = trail.slice(0, nextLength)
      }
    }

    const updateGame = (dt: number) => {
      if (scene === 'ready') {
        return
      }

      if (scene === 'fulltime') {
        sceneTime += dt
        if (scoreArgentina !== scoreEngland) {
          fullTimeSparkAccumulator += dt
          while (
            fullTimeSparkAccumulator >=
            FULL_TIME_BURST_INTERVAL
          ) {
            fullTimeSparkAccumulator -=
              FULL_TIME_BURST_INTERVAL
            spawnFullTimeBurst(
              nextFullTimeBurstSide,
              getWinnerColor()
            )
            nextFullTimeBurstSide =
              nextFullTimeBurstSide === 'left'
                ? 'right'
                : 'left'
          }
        }
        updateSparks(dt)
        return
      }

      matchTime = Math.min(GAME_DURATION, matchTime + dt)
      if (matchTime >= GAME_DURATION) {
        enterFullTime()
        return
      }

      updatePaddles(dt)
      updateSparks(dt)
      updateDisplayedOdds(dt)

      if (scene === 'goal') {
        sceneTime += dt
        if (sceneTime >= GOAL_DURATION) {
          scene = 'playing'
          sceneTime = 0
          sparks = []
          resetBall(nextServeDirection)
        }
        return
      }

      updateBall(dt)
    }

    const renderFullTime = (cells: Cell[]) => {
      const centerCol = Math.floor(layout.cols / 2)
      const fullTimeScale = layout.width < 760 ? 1 : 3
      const finalScoreScaleX = layout.width < 760 ? 3 : 4
      const finalScoreScaleY = layout.width < 760 ? 2 : 3
      const winnerScale = layout.width < 760 ? 1 : 2
      const winner =
        scoreArgentina > scoreEngland
          ? 'ARGENTINA WIN'
          : scoreEngland > scoreArgentina
            ? 'ENGLAND WIN'
            : 'DRAW'
      const winnerColor = getWinnerColor()
      const tournament = 'WORLD CUP, 1986'
      const title = 'FULL TIME'
      const finalScore = `${scoreArgentina}:${scoreEngland}`
      const buttonLabel = 'CLOSE'
      const tournamentCols = textWidth(tournament, 1, 1)
      const titleCols = textWidth(title, fullTimeScale, 2)
      const scoreCols = textWidth(finalScore, finalScoreScaleX, 3)
      const winnerCols = textWidth(winner, winnerScale, 2)
      const buttonCols = textWidth(buttonLabel, 1, 1)
      const titleRow = Math.max(16, Math.round(layout.rows * 0.17))
      const tournamentRow = Math.max(4, titleRow - 13)
      const finalScoreRow = titleRow + fullTimeScale * 7 + 13
      const winnerRow =
        finalScoreRow + finalScoreScaleY * 7 + 13
      const buttonWidth = buttonCols + 25
      const buttonHeight = 14
      const buttonLeft = centerCol - Math.floor(buttonWidth / 2)
      const buttonTop = winnerRow + winnerScale * 7 + 12
      const buttonColor = playAgainHovered
        ? winnerColor
        : COLORS.white

      const geometry = getGeometry()
      const leftPaddleTop = Math.round(
        (leftPaddleY -
          geometry.paddleHeightPx / 2 -
          layout.originY) /
          PITCH
      )
      const rightPaddleTop = Math.round(
        (rightPaddleY -
          geometry.paddleHeightPx / 2 -
          layout.originY) /
          PITCH
      )
      addPaddle(
        cells,
        geometry.leftPaddleCol,
        leftPaddleTop,
        geometry.paddleWidth,
        geometry.paddleHeight,
        COLORS.argentina
      )
      addPaddle(
        cells,
        geometry.rightPaddleCol,
        rightPaddleTop,
        geometry.paddleWidth,
        geometry.paddleHeight,
        COLORS.england
      )
      addText(
        cells,
        tournament,
        centerCol - Math.floor(tournamentCols / 2),
        tournamentRow,
        COLORS.white,
        1,
        1
      )
      addText(
        cells,
        title,
        centerCol - Math.floor(titleCols / 2),
        titleRow,
        winnerColor,
        fullTimeScale,
        2
      )
      addText(
        cells,
        finalScore,
        centerCol - Math.floor(scoreCols / 2),
        finalScoreRow,
        COLORS.white,
        finalScoreScaleX,
        3,
        finalScoreScaleY
      )
      addText(
        cells,
        winner,
        centerCol - Math.floor(winnerCols / 2),
        winnerRow,
        winnerColor,
        winnerScale,
        2
      )
      addDashedRect(
        cells,
        buttonLeft,
        buttonTop,
        buttonWidth,
        buttonHeight,
        buttonColor,
        2
      )
      addText(
        cells,
        buttonLabel,
        centerCol - Math.floor(buttonCols / 2),
        buttonTop + 4,
        buttonColor,
        1,
        1
      )
      playAgainHitbox = {
        left: layout.originX + buttonLeft * PITCH,
        top: layout.originY + buttonTop * PITCH,
        right:
          layout.originX +
          (buttonLeft + buttonWidth) * PITCH,
        bottom:
          layout.originY +
          (buttonTop + buttonHeight) * PITCH,
      }
    }

    const renderGame = (
      cells: Cell[],
      showReadyButton = true
    ) => {
      const score =
        scene === 'ready'
          ? ':'
          : `${scoreArgentina} : ${scoreEngland}`
      const clock = formatClock()
      const market = calculateMarket()
      const headline = scene === 'goal' ? 'GOAL' : ''
      const scoreScaleX = layout.width < 760 ? 1 : 3
      const scoreScaleY = layout.width < 760 ? 1 : 2
      const teamScale = layout.width < 760 ? 1 : 2
      const labelScale = 1
      const oddsScale = layout.width < 760 ? 2 : 3
      const oddsScaleY = 2
      const readyButtonTopOffset = 26
      const readyButtonHeight = 14
      // Tournament sits 12 rows above the score line; group spans tournament → PLAY.
      const readyGroupTopOffset = -12
      const readyGroupBottomOffset =
        readyButtonTopOffset + readyButtonHeight
      const readyGroupCenterOffset =
        (readyGroupTopOffset + readyGroupBottomOffset) / 2
      const readyCenterRow = Math.round(
        (layout.readyCenterY - layout.originY) / PITCH
      )
      const scoreRow =
        scene === 'ready'
          ? Math.round(
              clamp(
                readyCenterRow - readyGroupCenterOffset,
                -readyGroupTopOffset,
                layout.rows - readyGroupBottomOffset
              )
            )
          : 8
      const scoreCols = textWidth(score, scoreScaleX, 2)
      const argCols = textWidth('ARG', teamScale, 2)
      const engCols = textWidth('ENG', teamScale, 2)
      const centerCol = Math.floor(layout.cols / 2)
      const teamScoreGap = layout.width < 760 ? 6 : 10
      const scoreStart = centerCol - Math.floor(scoreCols / 2)
      const argStart = scoreStart - teamScoreGap - argCols
      const engStart = scoreStart + scoreCols + teamScoreGap

      const tournament = 'WORLD CUP, 1986'
      const tournamentCols = textWidth(tournament, 1, 1)
      addText(
        cells,
        tournament,
        centerCol - Math.floor(tournamentCols / 2),
        scoreRow - 12,
        COLORS.white,
        1,
        1
      )

      addText(
        cells,
        'ARG',
        Math.max(7, argStart),
        scoreRow,
        COLORS.argentina,
        teamScale,
        2
      )
      addText(
        cells,
        score,
        scoreStart,
        scoreRow,
        COLORS.white,
        scoreScaleX,
        2,
        scoreScaleY
      )
      addText(
        cells,
        'ENG',
        Math.min(layout.cols - engCols - 7, engStart),
        scoreRow,
        COLORS.england,
        teamScale,
        2
      )

      if (scene !== 'ready') {
        const clockCols = textWidth(clock, 1, 1)
        addText(
          cells,
          clock,
          centerCol - Math.floor(clockCols / 2),
          scoreRow + 19,
          COLORS.clock,
          1,
          1
        )
      }

      if (scene !== 'ready') {
        const geometry = getGeometry()
        const leftPaddleTop = Math.round(
          (leftPaddleY -
            geometry.paddleHeightPx / 2 -
            layout.originY) /
            PITCH
        )
        const rightPaddleTop = Math.round(
          (rightPaddleY -
            geometry.paddleHeightPx / 2 -
            layout.originY) /
            PITCH
        )
        addPaddle(
          cells,
          geometry.leftPaddleCol,
          leftPaddleTop,
          geometry.paddleWidth,
          geometry.paddleHeight,
          COLORS.argentina
        )
        addPaddle(
          cells,
          geometry.rightPaddleCol,
          rightPaddleTop,
          geometry.paddleWidth,
          geometry.paddleHeight,
          COLORS.england
        )

        const labelCols = textWidth(market.label, labelScale, 1)
        const oddsCols = textWidth(market.odds, oddsScale, 2)
        const oddsRow =
          layout.rows - (oddsScaleY * 7 + 12)
        const oddsContentWidth = Math.max(labelCols, oddsCols)
        const oddsFrameStep = 3
        const oddsFrameWidth =
          Math.ceil((oddsContentWidth + 14) / oddsFrameStep) *
          oddsFrameStep
        const oddsFrameHeight =
          Math.ceil((oddsScaleY * 7 + 19) / oddsFrameStep) *
          oddsFrameStep
        const oddsFrameLeft = centerCol - oddsFrameWidth / 2
        const oddsFrameTop = oddsRow - 15
        addDashedRect(
          cells,
          oddsFrameLeft,
          oddsFrameTop,
          oddsFrameWidth,
          oddsFrameHeight,
          market.color,
          oddsFrameStep
        )
        addText(
          cells,
          market.label,
          centerCol - Math.floor(labelCols / 2),
          oddsRow - 10,
          market.color,
          labelScale,
          1
        )
        addText(
          cells,
          market.odds,
          centerCol - Math.floor(oddsCols / 2),
          oddsRow,
          market.color,
          oddsScale,
          2,
          oddsScaleY
        )
      }

      if (scene === 'ready' && showReadyButton) {
        const buttonLabel = 'PLAY THE GAME'
        const buttonScale = 1
        const buttonCols = textWidth(
          buttonLabel,
          buttonScale,
          1
        )
        const buttonWidth = buttonCols + 25
        const buttonLeft =
          centerCol - Math.floor(buttonWidth / 2)
        const buttonTop = scoreRow + readyButtonTopOffset
        const buttonHeight = readyButtonHeight
        const buttonColor = playAgainHovered
          ? controlledSide === 'left'
            ? COLORS.argentina
            : COLORS.england
          : COLORS.white
        addDashedRect(
          cells,
          buttonLeft,
          buttonTop,
          buttonWidth,
          buttonHeight,
          buttonColor,
          2
        )
        addText(
          cells,
          buttonLabel,
          centerCol - Math.floor(buttonCols / 2),
          buttonTop + 4,
          buttonColor,
          buttonScale,
          1
        )
        playAgainHitbox = {
          left: layout.originX + buttonLeft * PITCH,
          top: layout.originY + buttonTop * PITCH,
          right:
            layout.originX +
            (buttonLeft + buttonWidth) * PITCH,
          bottom:
            layout.originY +
            (buttonTop + buttonHeight) * PITCH,
        }
      }

      if (headline) {
        const goalScale = layout.width < 760 ? 2 : 3
        const goalCols = textWidth(headline, goalScale, 2)
        addText(
          cells,
          headline,
          centerCol - Math.floor(goalCols / 2),
          Math.round(layout.rows * 0.46),
          COLORS.white,
          goalScale,
          2,
          goalScale
        )
      }
    }

    const seedIntroLoader = (
      resetElapsed = true,
      nextPhase: 'loader-assembling' | 'loader-filling' = 'loader-assembling',
      barFill01 = 0
    ) => {
      if (layout.cols <= 2) return
      const cells = buildIntroLoaderCells(
        layout.cols,
        layout.rows,
        layout.readyCenterY,
        layout.originY,
        barFill01
      )
      introParticles = buildIntroParticles(
        cells,
        layout.originX,
        layout.originY,
        layout.width,
        layout.height
      )
      if (nextPhase === 'loader-filling') {
        for (const particle of introParticles) {
          particle.startX = particle.homeX
          particle.startY = particle.homeY
        }
      }
      if (resetElapsed) introElapsed = 0
      introPhase = nextPhase
    }

    const refreshIntroBarFill = (fill01: number) => {
      if (layout.cols <= 2 || !introParticles.length) return
      const cells = buildIntroLoaderCells(
        layout.cols,
        layout.rows,
        layout.readyCenterY,
        layout.originY,
        fill01
      )
      const next = buildIntroParticles(
        cells,
        layout.originX,
        layout.originY,
        layout.width,
        layout.height
      )
      // Loading dots + bar grow in place with fill (1→3 dots).
      const loadingNext = next.filter((p) => p.kind === 'loading')
      const remappedLoading = loadingNext.map((home) => ({
        homeX: home.homeX,
        homeY: home.homeY,
        startX: home.homeX,
        startY: home.homeY,
        color: home.color,
        kind: 'loading' as IntroKind,
      }))
      const barNext = next.filter((p) => p.kind === 'bar')
      const remappedBar = barNext.map((home) => ({
        homeX: home.homeX,
        homeY: home.homeY,
        startX: home.homeX,
        startY: home.homeY,
        color: home.color,
        kind: 'bar' as IntroKind,
      }))
      introParticles = [...remappedLoading, ...remappedBar]
    }

    const seedIntroMatchCrossfade = () => {
      if (layout.cols <= 2) return
      const matchCells: Cell[] = []
      const previousScene = scene
      scene = 'ready'
      renderGame(matchCells, false)
      scene = previousScene
      introParticles = remorphIntroParticlesBurst(
        introParticles,
        matchCells,
        layout.originX,
        layout.originY,
        layout.width,
        layout.height
      )
      introElapsed = 0
      introPhase = 'match-crossfade'
    }

    const finishIntro = () => {
      introParticles = []
      introPhase = 'done'
      prepareMatch()
    }

    const render = (now: number) => {
      if (!running) return
      frame = requestAnimationFrame(render)
      const dt = Math.min(
        0.04,
        Math.max(0, (now - last) / 1000)
      )
      last = now

      const ctx = canvas.getContext('2d', { alpha: false })
      const bufferCtx = buffer.getContext('2d', {
        alpha: false,
      })
      if (!ctx || !bufferCtx) return
      const dpr = Math.max(
        1,
        Math.round(window.devicePixelRatio || 1)
      )
      bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bufferCtx.imageSmoothingEnabled = false
      bufferCtx.fillStyle = 'rgb(15,16,19)'
      bufferCtx.fillRect(0, 0, layout.width, layout.height)
      drawBackgroundGrid(bufferCtx, layout.width, layout.height)

      if (introPhase !== 'done') {
        if (
          !introParticles.length &&
          layout.cols > 2 &&
          (introPhase === 'loader-assembling' ||
            introPhase === 'loader-filling')
        ) {
          seedIntroLoader(
            introElapsed === 0,
            introPhase === 'loader-filling'
              ? 'loader-filling'
              : 'loader-assembling',
            introPhase === 'loader-filling' ? 0 : 0
          )
        } else if (
          !introParticles.length &&
          layout.cols > 2 &&
          introPhase === 'match-crossfade'
        ) {
          seedIntroLoader(false, 'loader-filling', 1)
          seedIntroMatchCrossfade()
        }

        introElapsed += dt * 1000

        if (introPhase === 'ui-wait') {
          if (introElapsed >= INTRO_UI_WAIT_MS) {
            introElapsed = 0
            seedIntroLoader(true, 'loader-assembling', 0)
          }
        } else if (introPhase === 'loader-assembling') {
          const progress = Math.min(
            1,
            introElapsed / INTRO_LOADER_ASSEMBLE_MS
          )
          drawIntroParticles(bufferCtx, introParticles, progress)
          if (progress >= 1) {
            introPhase = 'loader-filling'
            introElapsed = 0
            introBarFillStep = -1
            for (const particle of introParticles) {
              particle.startX = particle.homeX
              particle.startY = particle.homeY
            }
          }
        } else if (introPhase === 'loader-filling') {
          const fill = Math.min(1, introElapsed / INTRO_BAR_FILL_MS)
          const fillStep = Math.round(fill * 48)
          if (fillStep !== introBarFillStep) {
            introBarFillStep = fillStep
            refreshIntroBarFill(fill)
          }
          drawIntroParticles(bufferCtx, introParticles, 1)
          if (fill >= 1) {
            seedIntroMatchCrossfade()
            drawBurstMorphParticles(bufferCtx, introParticles, 0)
          }
        } else if (introPhase === 'match-crossfade') {
          const progress = Math.min(
            1,
            introElapsed / INTRO_MATCH_CROSSFADE_MS
          )
          drawBurstMorphParticles(bufferCtx, introParticles, progress)
          if (progress >= 1) {
            finishIntro()
          }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(buffer, 0, 0)
        return
      }

      updateGame(dt)

      const cells: Cell[] = []
      if (scene === 'fulltime') {
        renderFullTime(cells)
        drawCells(bufferCtx, cells, layout.originX, layout.originY)
      } else {
        playAgainHitbox = null
        renderGame(cells)
        drawCells(bufferCtx, cells, layout.originX, layout.originY)
      }

      if (scene === 'playing') {
        drawTrail(
          bufferCtx,
          trail,
          layout.originX,
          layout.originY
        )
        drawBall(
          bufferCtx,
          ball.x,
          ball.y,
          ballRotation,
          layout.originX,
          layout.originY
        )
      }
      drawSparks(
        bufferCtx,
        sparks,
        layout.originX,
        layout.originY
      )
      if (pointer.active) {
        const cursorCells: Cell[] = []
        const cursorCol = Math.round(
          (pointer.x - layout.originX) / PITCH
        )
        const cursorRow = Math.round(
          (pointer.y - layout.originY) / PITCH
        )
        addPixelCursor(
          cursorCells,
          cursorCol,
          cursorRow,
          playAgainHovered
            ? COLORS.white
            : controlledSide === 'left'
              ? COLORS.argentina
              : COLORS.england
        )
        drawCells(
          bufferCtx,
          cursorCells,
          layout.originX,
          layout.originY
        )
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(buffer, 0, 0)
    }

    resize()
    prepareMatch()
    introPhase = 'ui-wait'
    introElapsed = 0
    // Remeasure after hero slogan / lead layout settles (WipeReveal, fonts).
    const remasureId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!running) return
        resize()
      })
    })
    root.addEventListener('pointermove', onPointerMove)
    root.addEventListener('pointerleave', onPointerLeave)
    root.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', resize)
    frame = requestAnimationFrame(render)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      cancelAnimationFrame(remasureId)
      root.removeEventListener('pointermove', onPointerMove)
      root.removeEventListener('pointerleave', onPointerLeave)
      root.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div ref={rootRef} className="hero-match-board" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-match-board__canvas" />
    </div>
  )
}
