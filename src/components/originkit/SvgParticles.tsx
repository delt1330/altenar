// Delivered by Originkit · stack: vite · styling: css
// @ts-nocheck

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
// ── Helpers ────────────────────────────────────────────────────────────────
function containRect(iW, iH, cW, cH) {
    const a = iW / iH,
        b = cW / cH
    return a > b
        ? {
              x: 0,
              y: Math.round((cH - cW / a) / 2),
              w: cW,
              h: Math.round(cW / a),
          }
        : {
              x: Math.round((cW - cH * a) / 2),
              y: 0,
              w: Math.round(cH * a),
              h: cH,
          }
}
function parseColor(c) {
    if (!c) return { r: 200, g: 200, b: 200, a: 255 }
    const m = c.match(
        /rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/
    )
    if (m)
        return {
            r: +m[1] | 0,
            g: +m[2] | 0,
            b: +m[3] | 0,
            a: m[4] != null ? Math.round(+m[4] * 255) : 255,
        }
    const h = c.replace("#", "")
    if (h.length >= 6)
        return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
            a: h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255,
        }
    return { r: 200, g: 200, b: 200, a: 255 }
}
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
}
function randomInShape(shape, bx, by, bw, bh) {
    const cx = bx + bw / 2,
        cy = by + bh / 2
    if (shape === "circle") {
        const r = bw / 2
        const a = Math.random() * Math.PI * 2
        const d = Math.sqrt(Math.random()) * r
        return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]
    }
    if (shape === "oval") {
        const rx = bw / 2,
            ry = bh / 2
        const a = Math.random() * Math.PI * 2
        const d = Math.sqrt(Math.random())
        return [cx + d * rx * Math.cos(a), cy + d * ry * Math.sin(a)]
    }
    return [bx + Math.random() * bw, by + Math.random() * bh]
}
const EASE = {
    easeOut: (t) => 1 - (1 - t) * (1 - t),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
    easeIn: (t) => t * t,
    backOut: (t) => {
        const c = 1.70158 + 1
        return 1 + c * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2
    },
    circOut: (t) => Math.sqrt(1 - (t - 1) * (t - 1)),
    linear: (t) => t,
    // Soft cinematic morph for assemble ↔ scatter.
    smootherstep: (t) => t * t * t * (t * (t * 6 - 15) + 10),
    softInOut: (t) => {
        const x = Math.max(0, Math.min(1, t))
        return x < 0.5
            ? 4 * x * x * x
            : 1 - Math.pow(-2 * x + 2, 3) / 2
    },
}
function getTransitionParams(tr) {
    if (!tr) return { easeFn: EASE.easeOut, durMs: 800 }
    if (tr.type === "spring") {
        const k = tr.stiffness ?? 100,
            d = tr.damping ?? 15,
            m = tr.mass ?? 1
        const durMs = Math.min(
            3000,
            Math.max(300, (d / (2 * Math.sqrt(k * m))) * 2000)
        )
        return { easeFn: EASE.backOut, durMs }
    }
    return {
        easeFn: EASE[tr.ease] || EASE.easeOut,
        durMs: (tr.duration ?? 0.8) * 1000,
    }
}
const DAMPING = 0.65
function mkParticle(src, x, y, idleX, idleY, isExtra = false) {
    return {
        x,
        y,
        vx: 0,
        vy: 0,
        startX: x,
        startY: y,
        repX: 0,
        repY: 0,
        repVX: 0,
        repVY: 0,
        homeX: src.homeX,
        homeY: src.homeY,
        idleX,
        idleY,
        r: src.r,
        g: src.g,
        b: src.b,
        a: src.a,
        totalDist: Math.max(
            1,
            Math.sqrt((src.homeX - x) ** 2 + (src.homeY - y) ** 2)
        ),
        isPadding: false,
        isExtra,
        inZone: false,
        roamTargetX: 0,
        roamTargetY: 0,
        colorIdx: Math.floor(Math.random() * 10),
        repTargetX: 0,
        repTargetY: 0,
        vortexR: 0,
        orbitDir: Math.random() > 0.5 ? 1 : -1,
    }
}

function seedFieldDrift(p, _rect) {
    // Soft local float around the scatter anchor (pre-assemble sand).
    p.driftPhase = Math.random() * Math.PI * 2
    p.driftSpeed = 0.35 + Math.random() * 0.55
    p.driftAmp = 3.5 + Math.random() * 5.5
    p.vx = 0
    p.vy = 0
    p.roamTargetX = p.idleX ?? p.x
    p.roamTargetY = p.idleY ?? p.y
}

function seedVortex(p, rect) {
    const cx = rect.x + rect.w / 2
    const cy = rect.y + rect.h / 2
    const px = p.idleX ?? p.x
    const py = p.idleY ?? p.y
    const dx = px - cx
    const dy = py - cy
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    if (!p.orbitDir) p.orbitDir = Math.random() > 0.5 ? 1 : -1
    const maxR = Math.min(rect.w, rect.h) * 0.48
    p.vortexR = Math.min(Math.max(dist, 24), maxR)
    const tx = (-dy / dist) * p.orbitDir
    const ty = (dx / dist) * p.orbitDir
    const speed = 0.55 + Math.random() * 1.1
    p.vx = tx * speed
    p.vy = ty * speed
}

function randomInRect(rect) {
    return [
        rect.x + Math.random() * Math.max(1, rect.w),
        rect.y + Math.random() * Math.max(1, rect.h),
    ]
}

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v))
}

function samplePixelsFromCanvas(W, H, gap, draw) {
    const off = document.createElement("canvas")
    off.width = W
    off.height = H
    const oc = off.getContext("2d")
    oc.clearRect(0, 0, W, H)
    draw(oc, W, H)
    let px
    try {
        px = oc.getImageData(0, 0, W, H).data
    } catch {
        return []
    }
    const src = []
    const step = Math.max(2, gap)
    for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step) {
            const i = (y * W + x) * 4
            if (px[i + 3] >= 28)
                src.push({
                    homeX: x,
                    homeY: y,
                    r: px[i],
                    g: px[i + 1],
                    b: px[i + 2],
                    a: px[i + 3],
                })
        }
    return src
}

function boundsOfPoints(pts) {
    if (!pts.length) return { x: 0, y: 0, w: 1, h: 1 }
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity
    for (const p of pts) {
        minX = Math.min(minX, p.homeX)
        minY = Math.min(minY, p.homeY)
        maxX = Math.max(maxX, p.homeX)
        maxY = Math.max(maxY, p.homeY)
    }
    return {
        x: minX,
        y: minY,
        w: Math.max(1, maxX - minX),
        h: Math.max(1, maxY - minY),
    }
}

function fitPointCount(src, count, W, H) {
    if (!count) return []
    if (!src.length) {
        return Array.from({ length: count }, () => ({
            homeX: W * 0.5,
            homeY: H * 0.5,
            r: 243,
            g: 244,
            b: 245,
            a: 255,
        }))
    }
    const out = new Array(count)
    if (src.length >= count) {
        for (let i = 0; i < count; i++)
            out[i] = { ...src[Math.floor((i * src.length) / count)] }
    } else {
        for (let i = 0; i < count; i++) out[i] = { ...src[i % src.length] }
    }
    return out
}

function remapTargetsSpatially(particles, targets) {
    const n = particles.length
    if (!n || !targets.length) return targets
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
        const dx = particles[a].homeX - particles[b].homeX
        if (Math.abs(dx) > 0.5) return dx
        return particles[a].homeY - particles[b].homeY
    })
    const sortedT = targets.slice(0, n).sort((a, b) => {
        const dx = a.homeX - b.homeX
        if (Math.abs(dx) > 0.5) return dx
        return a.homeY - b.homeY
    })
    while (sortedT.length < n) sortedT.push({ ...sortedT[sortedT.length - 1] })
    const out = new Array(n)
    for (let j = 0; j < n; j++) out[order[j]] = sortedT[j]
    return out
}

function mulberry32(a) {
    return function () {
        let t = (a += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

const SPORT_PATTERN_ANGLE = -Math.PI / 9 // ~-20° — mild tilt, courts stay readable

/** Rotate normalized plate coords around center (Chladni-style). */
function rotUV(u, v, angle = SPORT_PATTERN_ANGLE) {
    const cx = u - 0.5
    const cy = v - 0.5
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    return [cx * c - cy * s + 0.5, cx * s + cy * c + 0.5]
}

function softMin(a, b, k = 0.035) {
    const h = Math.max(0, Math.min(1, 0.5 + 0.5 * (b - a) / k))
    return a * h + b * (1 - h) - k * h * (1 - h)
}

function softMin3(a, b, c, k = 0.035) {
    return softMin(softMin(a, b, k), c, k)
}

function distLine(x, y, x0, y0, x1, y1) {
    const dx = x1 - x0
    const dy = y1 - y0
    const len2 = dx * dx + dy * dy || 1
    const t = ((x - x0) * dx + (y - y0) * dy) / len2
    const px = x0 + t * dx
    const py = y0 + t * dy
    return Math.hypot(x - px, y - py)
}

function distRectBoundary(x, y, l, t, r, b) {
    const dx = Math.max(l - x, 0, x - r)
    const dy = Math.max(t - y, 0, y - b)
    const outside = Math.hypot(dx, dy)
    if (outside > 0) return outside
    return Math.min(x - l, r - x, y - t, b - y)
}

/**
 * Rasterize a continuous venue field like a Chladni plate.
 * Primary marking bands stay bold; light harmonics add sand density.
 */
function drawVenueField(oc, W, H, stage, valueFn, opts = {}) {
    const box = stage || getPatternStageRect(W, H)
    const step = opts.step || 2
    const thresh = opts.thresh || 0.072
    const angle = opts.angle ?? SPORT_PATTERN_ANGLE
    const pad = Math.max(8, Math.round(Math.min(box.w, box.h) * 0.02))
    oc.save()
    oc.beginPath()
    oc.rect(box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2)
    oc.clip()
    oc.fillStyle = "#f3f4f5"
    for (let py = -pad; py < box.h + pad; py += step) {
        for (let px = -pad; px < box.w + pad; px += step) {
            const u0 = (px + 0.5) / box.w
            const v0 = (py + 0.5) / box.h
            const [u, v] = rotUV(u0, v0, angle)
            if (Math.abs(valueFn(u, v)) <= thresh) {
                oc.fillRect(box.x + px, box.y + py, step + 1, step + 1)
            }
        }
    }
    oc.restore()
}

/** Soft chalk band + sparse Chladni echoes — keeps venue readable. */
function venueMark(d, spacing = 0.07) {
    const band = d / 0.028
    const echo = Math.sin((Math.PI * d) / Math.max(1e-4, spacing)) * 1.15
    return softMin(band, echo, 0.45)
}

/** Football — oversized pitch with clear boxes + circle. */
function drawFootballPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.08
        const y = (v - 0.5) * 1.42
        const hw = 0.72
        const hh = 0.48
        const edge = distRectBoundary(x, y, -hw, -hh, hw, hh)
        const mid = Math.abs(x)
        const circle = Math.abs(Math.hypot(x, y) - 0.18)
        const penW = 0.26
        const penH = 0.36
        const penL = distRectBoundary(x, y, -hw, -penH, -hw + penW, penH)
        const penR = distRectBoundary(x, y, hw - penW, -penH, hw, penH)
        const boxW = 0.11
        const boxH = 0.18
        const boxL = distRectBoundary(x, y, -hw, -boxH, -hw + boxW, boxH)
        const boxR = distRectBoundary(x, y, hw - boxW, -boxH, hw, boxH)
        const arcL = Math.abs(Math.hypot(x + hw - penW, y) - 0.13)
        const arcR = Math.abs(Math.hypot(x - (hw - penW), y) - 0.13)
        const d = softMin3(
            softMin3(edge, mid, circle),
            softMin3(penL, penR, softMin(boxL, boxR)),
            softMin(arcL, arcR)
        )
        return venueMark(d, 0.065)
    })
}

/** Tennis — alleys, service boxes, net. */
function drawTennisPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.12
        const y = (v - 0.5) * 1.5
        const hw = 0.55
        const hh = 0.82
        const alley = 0.09
        const edge = distRectBoundary(x, y, -hw, -hh, hw, hh)
        const single = distRectBoundary(x, y, -hw + alley, -hh, hw - alley, hh)
        const net = Math.abs(y)
        const center = Math.abs(x)
        const serviceT = Math.abs(y - hh * 0.42)
        const serviceB = Math.abs(y + hh * 0.42)
        const d = softMin3(
            softMin(edge, single),
            softMin(net, center),
            softMin(serviceT, serviceB)
        )
        return venueMark(d, 0.06)
    })
}

/** Basketball — keys + three-point arcs. */
function drawBasketballPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.12
        const y = (v - 0.5) * 1.42
        const hw = 0.7
        const hh = 0.5
        const edge = distRectBoundary(x, y, -hw, -hh, hw, hh)
        const mid = Math.abs(x)
        const center = Math.abs(Math.hypot(x, y) - 0.14)
        const keyW = 0.22
        const keyH = 0.28
        const keyL = distRectBoundary(x, y, -hw, -keyH, -hw + keyW, keyH)
        const keyR = distRectBoundary(x, y, hw - keyW, -keyH, hw, keyH)
        const threeL = Math.abs(Math.hypot(x + hw * 0.08, y) - 0.52)
        const threeR = Math.abs(Math.hypot(x - hw * 0.08, y) - 0.52)
        const ftL = Math.abs(Math.hypot(x + hw - keyW, y) - 0.13)
        const ftR = Math.abs(Math.hypot(x - (hw - keyW), y) - 0.13)
        const d = softMin3(
            softMin3(edge, mid, center),
            softMin(keyL, keyR),
            softMin3(threeL, threeR, softMin(ftL, ftR))
        )
        return venueMark(d, 0.065)
    })
}

/** Ice hockey — rink, face-offs, blue lines. */
function drawIceHockeyPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.1
        const y = (v - 0.5) * 1.4
        const hw = 0.75
        const hh = 0.45
        const rink = Math.abs(Math.hypot(x / hw, y / hh) - 1)
        const center = Math.abs(x)
        const blueL = Math.abs(x + hw * 0.33)
        const blueR = Math.abs(x - hw * 0.33)
        const face = (fx, fy) => Math.abs(Math.hypot(x - fx, y - fy) - 0.09)
        const faces = softMin3(
            softMin(face(0, 0), face(0, hh * 0.5)),
            softMin(face(-hw * 0.4, hh * 0.35), face(-hw * 0.4, -hh * 0.35)),
            softMin(face(hw * 0.4, hh * 0.35), face(hw * 0.4, -hh * 0.35))
        )
        const creaseL = Math.abs(Math.hypot(x + hw * 0.9, y) - 0.11)
        const creaseR = Math.abs(Math.hypot(x - hw * 0.9, y) - 0.11)
        const d = softMin3(
            softMin3(rink, center, softMin(blueL, blueR)),
            faces,
            softMin(creaseL, creaseR)
        )
        return venueMark(d, 0.06)
    })
}

/** Horse racing — concentric track ovals. */
function drawHorseRacingPattern(oc, W, H, stage) {
    drawVenueField(
        oc,
        W,
        H,
        stage,
        (u, v) => {
            const x = (u - 0.5) * 1.05
            const y = (v - 0.5) * 1.28
            const e = Math.hypot(x / 0.78, y / 0.5)
            const rails = Math.abs(Math.sin(e * Math.PI * 4.2))
            const finish = Math.abs(x - 0.55) + Math.abs(y) * 0.15
            return softMin(rails, finish / 0.04, 0.35)
        },
        { thresh: 0.085 }
    )
}

/** Motorsport — figure-8 / circuit ribbons. */
function drawMotorsportPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.15
        const y = (v - 0.5) * 1.35
        const loopA = Math.hypot((x + 0.22) / 0.4, (y - 0.05) / 0.3)
        const loopB = Math.hypot((x - 0.22) / 0.42, (y + 0.08) / 0.28)
        const track = softMin(Math.abs(loopA - 1), Math.abs(loopB - 1), 0.07)
        const chute = distLine(x, y, -0.55, 0.32, 0.55, -0.3)
        const d = softMin(track, Math.abs(chute), 0.05)
        return venueMark(d, 0.055)
    })
}

/** Baseball — diamond + foul lines + outfield. */
function drawBaseballPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.12
        const y = (v - 0.5) * 1.35
        const a = Math.PI / 4
        const rx = x * Math.cos(a) - y * Math.sin(a)
        const ry = x * Math.sin(a) + y * Math.cos(a)
        const diamond = distRectBoundary(rx, ry, -0.26, -0.26, 0.26, 0.26)
        const mound = Math.abs(Math.hypot(x, y + 0.04) - 0.045)
        const infield = Math.abs(Math.hypot(x, y + 0.1) - 0.4)
        const outfield = Math.abs(Math.hypot(x, y + 0.14) - 0.72)
        const foulL = distLine(x, y, 0, 0.28, -0.8, -0.65)
        const foulR = distLine(x, y, 0, 0.28, 0.8, -0.65)
        const d = softMin3(
            softMin(diamond, mound),
            softMin(infield, outfield),
            softMin(foulL, foulR)
        )
        return venueMark(d, 0.06)
    })
}

/** American football — yard grid + end zones. */
function drawAmericanFootballPattern(oc, W, H, stage) {
    drawVenueField(
        oc,
        W,
        H,
        stage,
        (u, v) => {
            const x = (u - 0.5) * 1.08
            const y = (v - 0.5) * 1.4
            const hw = 0.78
            const hh = 0.4
            const edge = distRectBoundary(x, y, -hw, -hh, hw, hh)
            const endL = Math.abs(x + hw * 0.72)
            const endR = Math.abs(x - hw * 0.72)
            const yards = Math.abs(
                Math.sin(((x + hw) / (2 * hw)) * Math.PI * 10)
            )
            const hash = Math.abs(
                Math.sin(((y + hh) / (2 * hh)) * Math.PI * 2.5)
            )
            const mid = Math.abs(x)
            const d = softMin3(
                softMin(edge, mid),
                softMin(endL, endR),
                yards * 0.045 + hash * 0.02
            )
            return venueMark(d, 0.07)
        },
        { thresh: 0.08 }
    )
}

/** Cricket — boundary oval + pitch. */
function drawCricketPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.08
        const y = (v - 0.5) * 1.32
        const boundary = Math.abs(Math.hypot(x / 0.75, y / 0.55) - 1)
        const pitch = distRectBoundary(x, y, -0.055, -0.3, 0.055, 0.3)
        const creaseT = Math.abs(y - 0.2)
        const creaseB = Math.abs(y + 0.2)
        const circle = Math.abs(Math.hypot(x, y) - 0.26)
        const d = softMin3(
            softMin(boundary, pitch),
            softMin(creaseT, creaseB),
            circle
        )
        return venueMark(d, 0.06)
    })
}

/** Volleyball — court + net + attack lines. */
function drawVolleyballPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.1
        const y = (v - 0.5) * 1.4
        const hw = 0.68
        const hh = 0.45
        const edge = distRectBoundary(x, y, -hw, -hh, hw, hh)
        const net = Math.abs(x)
        const attackL = Math.abs(x + hw * 0.33)
        const attackR = Math.abs(x - hw * 0.33)
        const d = softMin3(edge, net, softMin(attackL, attackR))
        return venueMark(d, 0.06)
    })
}

/** Table tennis — table, net, center line. */
function drawTableTennisPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.1
        const y = (v - 0.5) * 1.4
        const hw = 0.7
        const hh = 0.4
        const edge = distRectBoundary(x, y, -hw, -hh, hw, hh)
        const net = Math.abs(x)
        const center = Math.abs(y)
        const d = softMin3(edge, net, center)
        return venueMark(d, 0.055)
    })
}

/** Darts — board rings + sectors. */
function drawDartsPattern(oc, W, H, stage) {
    drawVenueField(
        oc,
        W,
        H,
        stage,
        (u, v) => {
            const x = (u - 0.5) * 1.15
            const y = (v - 0.5) * 1.15
            const r = Math.hypot(x, y)
            const th = Math.atan2(y, x)
            const rings = Math.sin(r * Math.PI * 6.5)
            const spokes = Math.sin(th * 10)
            const bull = Math.abs(r - 0.04)
            return softMin3(rings, spokes * 0.9, bull / 0.03, 0.2)
        },
        { thresh: 0.095 }
    )
}

/** Snooker — table, D, pockets, spots. */
function drawSnookerPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.08
        const y = (v - 0.5) * 1.4
        const hw = 0.5
        const hh = 0.78
        const edge = distRectBoundary(x, y, -hw, -hh, hw, hh)
        const baulk = Math.abs(y - hh * 0.38)
        const D = Math.abs(Math.hypot(x, y - hh * 0.38) - 0.2)
        const spots = softMin3(
            Math.abs(Math.hypot(x, y + hh * 0.12) - 0.018),
            Math.abs(Math.hypot(x, y) - 0.018),
            Math.abs(Math.hypot(x, y - hh * 0.22) - 0.018)
        )
        const pocket = (px, py) => Math.abs(Math.hypot(x - px, y - py) - 0.045)
        const pockets = softMin3(
            softMin(pocket(-hw, -hh), pocket(hw, -hh)),
            softMin(pocket(-hw, hh), pocket(hw, hh)),
            softMin(pocket(-hw, 0), pocket(hw, 0))
        )
        const d = softMin3(softMin(edge, baulk), softMin(D, pockets), spots)
        return venueMark(d, 0.06)
    })
}

/** Esports — lanes + river + bases. */
function drawEsportsPattern(oc, W, H, stage) {
    drawVenueField(oc, W, H, stage, (u, v) => {
        const x = (u - 0.5) * 1.12
        const y = (v - 0.5) * 1.12
        const river = distLine(x, y, -0.8, 0.8, 0.8, -0.8)
        const top = distLine(x, y, -0.7, -0.68, 0.68, -0.7)
        const bot = distLine(x, y, -0.68, 0.7, 0.7, 0.68)
        const midRing = Math.abs(Math.hypot(x, y) - 0.2)
        const baseA = Math.abs(Math.hypot(x + 0.58, y + 0.58) - 0.13)
        const baseB = Math.abs(Math.hypot(x - 0.58, y - 0.58) - 0.13)
        const towers = softMin3(
            Math.abs(Math.hypot(x + 0.26, y + 0.26) - 0.055),
            Math.abs(Math.hypot(x - 0.26, y - 0.26) - 0.055),
            Math.abs(Math.hypot(x, y) - 0.055)
        )
        const d = softMin3(
            softMin3(river, top, bot),
            softMin3(midRing, baseA, baseB),
            towers
        )
        return venueMark(d, 0.055)
    })
}

const SPORT_PATTERNS = [
    { id: "football", label: "Football", draw: drawFootballPattern },
    { id: "tennis", label: "Tennis", draw: drawTennisPattern },
    { id: "basketball", label: "Basketball", draw: drawBasketballPattern },
    { id: "ice-hockey", label: "Ice hockey", draw: drawIceHockeyPattern },
    { id: "horse-racing", label: "Horse racing", draw: drawHorseRacingPattern },
    { id: "motorsport", label: "Motorsport", draw: drawMotorsportPattern },
    { id: "baseball", label: "Baseball", draw: drawBaseballPattern },
    {
        id: "american-football",
        label: "American football",
        draw: drawAmericanFootballPattern,
    },
    { id: "cricket", label: "Cricket", draw: drawCricketPattern },
    { id: "volleyball", label: "Volleyball", draw: drawVolleyballPattern },
    {
        id: "table-tennis",
        label: "Table tennis",
        draw: drawTableTennisPattern,
    },
    { id: "darts", label: "Darts", draw: drawDartsPattern },
    { id: "snooker", label: "Snooker", draw: drawSnookerPattern },
    { id: "esports", label: "Esports", draw: drawEsportsPattern },
]

function sampleSportPoints(W, H, gap, count, sportIndex, stage = null) {
    const box = stage || getPatternStageRect(W, H)
    const sport =
        SPORT_PATTERNS[
            ((sportIndex % SPORT_PATTERNS.length) + SPORT_PATTERNS.length) %
                SPORT_PATTERNS.length
        ]
    // Dense scan like Chladni so thin lines still seed enough sand.
    const scanGap = Math.max(2, Math.min(3, Math.round(gap * 0.45)))
    const maskZones = getHeroCopyMaskZones(W, H)
    const raw = samplePixelsFromCanvas(W, H, scanGap, (oc) => {
        sport.draw(oc, W, H, box)
    }).filter((p) => heroCopyVisibility(p.homeX, p.homeY, maskZones) > 0.12)
    const pts = fitPointCount(raw, count, W, H)
    return {
        points: pts,
        rect: { x: 0, y: 0, w: W, h: H },
        stage: box,
        sportId: sport.id,
        sportLabel: sport.label,
        sportIndex:
            ((sportIndex % SPORT_PATTERNS.length) + SPORT_PATTERNS.length) %
            SPORT_PATTERNS.length,
    }
}

/** Random Chladni plate / circular membrane modes (n,m). */
function pickChladniModes(rng) {
    let n = 1 + Math.floor(rng() * 7)
    let m = 1 + Math.floor(rng() * 7)
    if (n === m) m = (m % 7) + 1
    // Prefer higher contrast modes sometimes.
    if (rng() < 0.35) {
        n = 2 + Math.floor(rng() * 6)
        m = 1 + Math.floor(rng() * 5)
        if (n === m) m = n === 1 ? 2 : n - 1
    }
    return {
        n,
        m,
        kind: rng() < 0.7 ? "square" : "circle",
        rot: rng() * Math.PI,
        mix: rng() < 0.4,
        thresh: 0.045 + rng() * 0.05,
    }
}

function chladniValue(u, v, modes) {
    const cx = u - 0.5
    const cy = v - 0.5
    const c = Math.cos(modes.rot)
    const s = Math.sin(modes.rot)
    const x = cx * c - cy * s + 0.5
    const y = cx * s + cy * c + 0.5
    const { n, m, kind } = modes
    if (kind === "circle") {
        const dx = x - 0.5
        const dy = y - 0.5
        const r = Math.sqrt(dx * dx + dy * dy) * 2
        const th = Math.atan2(dy, dx)
        // Standing wave on a disk — nodal diameters + rings.
        return Math.cos(n * th) * Math.sin(m * Math.PI * Math.min(1, r))
    }
    // Classic square-plate Chladni: cos(nx)cos(my) − cos(mx)cos(ny) = 0
    let f =
        Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y) -
        Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y)
    if (modes.mix) {
        const n2 = Math.max(1, m - 1)
        const m2 = n
        f +=
            0.65 *
            (Math.cos(n2 * Math.PI * x) * Math.cos(m2 * Math.PI * y) -
                Math.cos(m2 * Math.PI * x) * Math.cos(n2 * Math.PI * y))
    }
    return f
}

/** Rasterize nodal lines of a Chladni figure (sand settles on zeros). */
function drawChladniPattern(oc, W, H, stage, modes) {
    const box = stage || getPatternStageRect(W, H)
    const step = 2
    const thresh = modes.thresh || 0.06
    oc.save()
    // Bleed slightly past edges so nodal lines aren't framed.
    const pad = Math.max(8, Math.round(Math.min(box.w, box.h) * 0.02))
    oc.beginPath()
    oc.rect(box.x - pad, box.y - pad, box.w + pad * 2, box.h + pad * 2)
    oc.clip()
    oc.fillStyle = "#f3f4f5"
    for (let py = -pad; py < box.h + pad; py += step) {
        for (let px = -pad; px < box.w + pad; px += step) {
            const u = (px + 0.5) / box.w
            const v = (py + 0.5) / box.h
            if (Math.abs(chladniValue(u, v, modes)) <= thresh) {
                oc.fillRect(box.x + px, box.y + py, step + 1, step + 1)
            }
        }
    }
    oc.restore()
}

function sampleChladniPoints(W, H, gap, count, seed, stage = null) {
    const box = stage || getPatternStageRect(W, H)
    const rng = mulberry32(seed >>> 0)
    const modes = pickChladniModes(rng)
    // Denser scan so thin nodal lines still yield enough particles.
    const scanGap = Math.max(2, Math.min(4, Math.round(gap * 0.55)))
    const raw = samplePixelsFromCanvas(W, H, scanGap, (oc) => {
        drawChladniPattern(oc, W, H, box, modes)
    })
    const pts = fitPointCount(raw, count, W, H)
    return {
        points: pts,
        rect: boundsOfPoints(pts),
        stage: box,
        modes,
        seed: seed >>> 0,
    }
}

function getGridInset(W, H = W) {
    // Mirrors CSS --cell-x: clamp(24px, 3vw, 48px)
    return Math.max(24, Math.min(48, Math.min(W, H) * 0.03))
}

function getShapeStageRect(W, H) {
    // Full inset frame — shapes keep large size, only anchored bottom-right.
    const inset = getGridInset(W, H)
    return {
        x: inset,
        y: inset,
        w: Math.max(80, W - inset * 2),
        h: Math.max(80, H - inset * 2),
        inset,
    }
}

/** Full-bleed plate for patterns. Copy legibility uses soft per-line masks, not a hard rect. */
function getPatternStageRect(W, H) {
    return {
        x: 0,
        y: 0,
        w: Math.max(1, W),
        h: Math.max(1, H),
        inset: 0,
    }
}

function smoothstep01(edge0, edge1, x) {
    const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
}

/** Elliptical soft zones fitted to each headline line, lead, and CTA row. */
function getHeroCopyMaskZones(W, H) {
    if (typeof document === "undefined") return []
    const stack = document.querySelector(".hero-stack")
    if (!stack) return []
    const sr = stack.getBoundingClientRect()
    if (sr.width < 1 || sr.height < 1) return []
    const sx = W / sr.width
    const sy = H / sr.height
    const feather = Math.max(16, Math.min(42, H * 0.024))
    const zones = []
    const seen = new Set()

    const addEl = (el) => {
        const cr = el.getBoundingClientRect()
        if (cr.width < 2 || cr.height < 2) return
        const key = `${Math.round(cr.left)}|${Math.round(cr.top)}|${Math.round(cr.width)}|${Math.round(cr.height)}`
        if (seen.has(key)) return
        seen.add(key)
        const padX = Math.max(6, Math.min(18, cr.width * 0.03))
        const padY = Math.max(5, Math.min(14, cr.height * 0.28))
        zones.push({
            cx: ((cr.left + cr.right) * 0.5 - sr.left) * sx,
            cy: ((cr.top + cr.bottom) * 0.5 - sr.top) * sy,
            rx: cr.width * 0.5 * sx + padX,
            ry: cr.height * 0.5 * sy + padY,
            feather,
        })
    }

    stack.querySelectorAll(".hero-slogan-line").forEach(addEl)
    const lead = stack.querySelector(".hero-lead")
    if (lead) addEl(lead)
    stack.querySelectorAll(".hero-cta a").forEach(addEl)

    return zones
}

/** 0 under copy, 1 in open field — soft elliptical falloff per text block. */
function heroCopyVisibility(x, y, zones) {
    if (!zones.length) return 1
    let vis = 1
    for (const z of zones) {
        const nx = (x - z.cx) / Math.max(1, z.rx)
        const ny = (y - z.cy) / Math.max(1, z.ry)
        const d = Math.sqrt(nx * nx + ny * ny)
        const f = z.feather / Math.max(z.rx, z.ry)
        const inner = Math.max(0.35, 1 - f * 0.55)
        let local = 1
        if (d <= inner) local = 0
        else if (d < 1 + f) local = smoothstep01(inner, 1 + f, d)
        vis = Math.min(vis, local)
    }
    return vis
}

/**
 * Clear isometric gear rim — teeth + outer ring + thickness, no hub/spokes.
 * Local spin rotates around the gear axis before projection.
 */
const GEAR_HEIGHT_MUL = 1.4
/** Fixed tilt of the gear silhouette (45°). */
const GEAR_BASE_ANGLE = Math.PI / 4
/** Local Z thickness — keep front/back layers clearly separated in iso. */
const GEAR_THICK = 1.55

function isoProject(x, y, z) {
    const c30 = Math.cos(Math.PI / 6)
    const s30 = Math.sin(Math.PI / 6)
    return [(x - z) * c30, (y + (x + z) * s30) * GEAR_HEIGHT_MUL]
}

function gearScale(box) {
    return Math.min(box.w, box.h) * 0.46
}

function gearRadiusAtAngle(a, R, toothDepth, teeth) {
    const slice = (Math.PI * 2) / teeth
    const local = ((a % slice) + slice) % slice
    const u = local / slice
    // Flat crest / root with beveled sides — classic cog silhouette.
    if (u < 0.18 || u > 0.82) return R - toothDepth * 0.12
    if (u > 0.32 && u < 0.68) return R + toothDepth
    if (u < 0.32) {
        const t = (u - 0.18) / 0.14
        return R - toothDepth * 0.12 + (toothDepth * 1.12) * t
    }
    const t = (u - 0.68) / 0.14
    return R + toothDepth - (toothDepth * 1.12) * t
}

function forEachGearOutlinePoint(teeth, R, toothDepth, stepsPerTooth, fn) {
    const total = teeth * stepsPerTooth
    for (let i = 0; i <= total; i++) {
        const a = (i / total) * Math.PI * 2 - Math.PI / 2
        const rad = gearRadiusAtAngle(a, R, toothDepth, teeth)
        fn(Math.cos(a) * rad, Math.sin(a) * rad, i, total)
    }
}

function drawGearPattern(oc, W, H, stage, spin = 0) {
    const box = stage || getPatternStageRect(W, H)
    const cx = box.x + box.w * 0.5
    const cy = box.y + box.h * 0.52
    const scale = gearScale(box)
    const R = 1
    const toothDepth = 0.2
    const teeth = 12
    const rimR = 0.62
    const thick = GEAR_THICK
    const ang = GEAR_BASE_ANGLE + spin
    const cos = Math.cos(ang)
    const sin = Math.sin(ang)
    const map = (lx, ly, lz) => {
        const rx = lx * cos - ly * sin
        const ry = lx * sin + ly * cos
        const [ix, iy] = isoProject(rx * scale, ry * scale, lz * scale)
        return [cx + ix, cy + iy]
    }
    const lw = Math.max(3.5, scale * 0.032)
    oc.save()
    oc.strokeStyle = "#f3f4f5"
    oc.fillStyle = "#f3f4f5"
    oc.lineWidth = lw
    oc.lineCap = "round"
    oc.lineJoin = "round"

    const strokeRing = (radius, z, n = 72) => {
        oc.beginPath()
        for (let i = 0; i <= n; i++) {
            const a = (i / n) * Math.PI * 2
            const [x, y] = map(Math.cos(a) * radius, Math.sin(a) * radius, z)
            if (i === 0) oc.moveTo(x, y)
            else oc.lineTo(x, y)
        }
        oc.closePath()
        oc.stroke()
    }

    const strokeOutline = (z) => {
        oc.beginPath()
        forEachGearOutlinePoint(teeth, R, toothDepth, 10, (x, y, i) => {
            const [px, py] = map(x, y, z)
            if (i === 0) oc.moveTo(px, py)
            else oc.lineTo(px, py)
        })
        oc.closePath()
        oc.stroke()
    }

    // Back face, tooth bridges, front face + outer rim only (no hub / spokes).
    strokeOutline(-thick / 2)
    strokeRing(rimR, -thick / 2, 64)

    for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2 - Math.PI / 2
        const rad = R + toothDepth * 0.85
        const lx = Math.cos(a) * rad
        const ly = Math.sin(a) * rad
        const [x0, y0] = map(lx, ly, -thick / 2)
        const [x1, y1] = map(lx, ly, thick / 2)
        oc.beginPath()
        oc.moveTo(x0, y0)
        oc.lineTo(x1, y1)
        oc.stroke()
    }

    strokeOutline(thick / 2)
    strokeRing(rimR, thick / 2, 64)
    oc.restore()
}

function sampleGearPoints(W, H, gap, count, stage = null) {
    const box = stage || getPatternStageRect(W, H)
    const teeth = 12
    const toothDepth = 0.2
    const R = 1
    const rimR = 0.58
    const thick = GEAR_THICK
    const zFront = thick / 2
    const zBack = -thick / 2
    const locals = []

    const push = (lx, ly, lz) => {
        locals.push({ localX: lx, localY: ly, localZ: lz })
    }

    // Only two depth planes — widely separated; no packed mid-Z layers.
    forEachGearOutlinePoint(teeth, R, toothDepth, 16, (x, y) => {
        push(x, y, zFront)
        push(x, y, zBack)
    })
    // Sparse tooth-edge bridges so the gap between faces reads clearly.
    for (let i = 0; i < teeth; i++) {
        const a = (i / teeth) * Math.PI * 2 - Math.PI / 2
        const rad = R + toothDepth * 0.85
        const lx = Math.cos(a) * rad
        const ly = Math.sin(a) * rad
        push(lx, ly, zFront)
        push(lx, ly, zBack)
        // Single mid connector per crest (not a stack of layers).
        push(lx, ly, 0)
        for (const rr of [0.9, 0.78]) {
            push(Math.cos(a) * rad * rr, Math.sin(a) * rad * rr, zFront)
            push(Math.cos(a) * rad * rr, Math.sin(a) * rad * rr, zBack)
        }
    }
    // Concentric rings on front + back only (skip mid-Z fill).
    const ringCount = 6
    for (let r = 0; r < ringCount; r++) {
        const t = r / (ringCount - 1)
        const radius = rimR + (R - toothDepth * 0.15 - rimR) * t
        const n = 56 + Math.round(t * 40)
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2
            const lx = Math.cos(a) * radius
            const ly = Math.sin(a) * radius
            push(lx, ly, zFront)
            push(lx, ly, zBack)
        }
    }

    const fitted = []
    if (!locals.length) {
        for (let i = 0; i < count; i++) fitted.push({ localX: 0, localY: 0, localZ: 0 })
    } else if (locals.length >= count) {
        for (let i = 0; i < count; i++)
            fitted.push(locals[Math.floor((i * locals.length) / count)])
    } else {
        for (let i = 0; i < count; i++) fitted.push(locals[i % locals.length])
    }

    const points = fitted.map((loc) => {
        const projected = projectGearLocal(
            loc.localX,
            loc.localY,
            loc.localZ,
            0,
            box
        )
        return {
            homeX: projected.homeX,
            homeY: projected.homeY,
            r: 243,
            g: 244,
            b: 245,
            a: 255,
            localX: loc.localX,
            localY: loc.localY,
            localZ: loc.localZ,
        }
    })
    return {
        points,
        rect: boundsOfPoints(points),
        stage: box,
        cx: box.x + box.w * 0.5,
        cy: box.y + box.h * 0.52,
        scale: gearScale(box),
    }
}

/** Project a local gear-plane point into stage pixel coords at given spin. */
function projectGearLocal(localX, localY, localZ, spin, stage) {
    const box = stage || getPatternStageRect(1, 1)
    const cx = box.x + box.w * 0.5
    const cy = box.y + box.h * 0.52
    const scale = gearScale(box)
    const ang = GEAR_BASE_ANGLE + spin
    const cos = Math.cos(ang)
    const sin = Math.sin(ang)
    const rx = localX * cos - localY * sin
    const ry = localX * sin + localY * cos
    const [ix, iy] = isoProject(rx * scale, ry * scale, (localZ || 0) * scale)
    return { homeX: cx + ix, homeY: cy + iy, cx, cy, scale }
}

/**
 * Sample a raster logo into home points fitted inside a local box (W×H).
 * Draws the image centered (contain) and keeps white particle color.
 */
function sampleClientLogoPoints(img, W, H, gap, count, padRatio = 0.12) {
    const boxW = Math.max(2, Math.round(W))
    const boxH = Math.max(2, Math.round(H))
    const padX = boxW * padRatio
    const padY = boxH * padRatio
    const availW = Math.max(2, boxW - padX * 2)
    const availH = Math.max(2, boxH - padY * 2)
    const iW = img.naturalWidth || img.width || 1
    const iH = img.naturalHeight || img.height || 1
    const scale = Math.min(availW / iW, availH / iH)
    const dw = iW * scale
    const dh = iH * scale
    const dx = (boxW - dw) / 2
    const dy = (boxH - dh) / 2

    const raw = samplePixelsFromCanvas(boxW, boxH, Math.max(2, gap), (oc) => {
        oc.clearRect(0, 0, boxW, boxH)
        oc.drawImage(img, dx, dy, dw, dh)
    }).map((p) => ({
        ...p,
        // Flatten to solid white silhouette (matches CSS invert look).
        r: 243,
        g: 244,
        b: 245,
        a: 255,
    }))
    const fitted = fitPointCount(raw, count, boxW, boxH).map((p) => ({
        homeX: p.homeX,
        homeY: p.homeY,
        r: 243,
        g: 244,
        b: 245,
        a: 255,
    }))
    return {
        points: fitted,
        rect: boundsOfPoints(fitted),
        stage: { x: 0, y: 0, w: boxW, h: boxH },
    }
}

export {
    sampleGearPoints,
    drawGearPattern,
    projectGearLocal,
    isoProject,
    sampleClientLogoPoints,
}

function coverRect(iW, iH, cW, cH) {
    const a = iW / iH,
        b = cW / cH
    return a > b
        ? {
              x: Math.round((cW - cH * a) / 2),
              y: 0,
              w: Math.round(cH * a),
              h: cH,
          }
        : {
              x: 0,
              y: Math.round((cH - cW / a) / 2),
              w: cW,
              h: Math.round(cW / a),
          }
}

function anchorBottomRight(stage, w, h) {
    const ww = Math.min(Math.max(1, w), stage.w)
    const hh = Math.min(Math.max(1, h), stage.h)
    return {
        x: stage.x + stage.w - ww,
        y: stage.y + stage.h - hh,
        w: ww,
        h: hh,
    }
}

function getChartLayout(W, H, barCount = 5, stage = null) {
    const inset = getGridInset(W, H)
    // Keep the large chart footprint (~as before), park it bottom-right.
    const areaW = W * 0.84
    const areaH = H * 0.8
    const box = anchorBottomRight(
        stage || getShapeStageRect(W, H),
        areaW,
        areaH
    )
    const padX = box.w * 0.06
    const padY = box.h * 0.08
    const innerW = box.w - padX * 2
    const innerH = box.h - padY * 2
    const g = innerW * 0.055
    const barW = (innerW - g * (barCount - 1)) / barCount
    const baseY = box.y + padY + innerH
    const centers = Array.from(
        { length: barCount },
        (_, i) => box.x + padX + i * (barW + g) + barW * 0.5
    )
    return {
        n: barCount,
        marginX: box.x + padX,
        marginY: box.y + padY,
        areaW: innerW,
        areaH: innerH,
        g,
        barW,
        baseY,
        centers,
        stage: box,
        inset,
    }
}

function getMetricFont(W, H) {
    // Full-canvas scale (same as before the corner move).
    const size = Math.round(Math.min(W, H) * 0.62)
    return {
        size,
        font: `800 ${size}px Arial Black, Helvetica Neue, Arial, sans-serif`,
    }
}

function layoutMetricChars(W, H, text, stage = null) {
    const box = stage || getShapeStageRect(W, H)
    const { size, font } = getMetricFont(W, H)
    const probe = document.createElement("canvas").getContext("2d")
    probe.font = font
    const gap = size * 0.045
    const widths = Array.from(text).map((ch) =>
        Math.max(
            probe.measureText(ch).width,
            ch === "." ? size * 0.18 : size * 0.42
        )
    )
    const total =
        widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, text.length - 1)
    // Bottom-right of the inset frame; size unchanged.
    let x = box.x + box.w - total
    const y = box.y + box.h - size * 0.42
    const slots = []
    for (let i = 0; i < text.length; i++) {
        const w = widths[i]
        slots.push({
            ch: text[i],
            index: i,
            cx: x + w / 2,
            cy: y,
            w,
            h: size,
            left: x,
            right: x + w,
        })
        x += w + gap
    }
    return { slots, size, font, stage: box }
}

function sampleMetricSlots(W, H, text, gap, count, stage = null) {
    const { slots, size, font, stage: box } = layoutMetricChars(
        W,
        H,
        text,
        stage
    )
    const weights = slots.map((s) => (s.ch === "." ? 0.22 : 1))
    const sumW = weights.reduce((a, b) => a + b, 0)
    const counts = weights.map((w) => Math.max(2, Math.round((count * w) / sumW)))
    let diff = count - counts.reduce((a, b) => a + b, 0)
    let g = 0
    while (diff !== 0 && g < 2000) {
        const i = g % counts.length
        if (slots[i].ch === ".") {
            g++
            continue
        }
        if (diff > 0) {
            counts[i] += 1
            diff -= 1
        } else if (counts[i] > 2) {
            counts[i] -= 1
            diff += 1
        }
        g++
    }
    const bySlot = []
    const all = []
    const step = Math.max(2, gap)
    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        const raw = samplePixelsFromCanvas(W, H, step, (oc) => {
            oc.fillStyle = "#f3f4f5"
            oc.font = font
            oc.textAlign = "center"
            oc.textBaseline = "middle"
            oc.fillText(slot.ch, slot.cx, slot.cy)
        })
        const pad = size * 0.08
        const filtered = raw.filter(
            (p) =>
                p.homeX >= slot.left - pad &&
                p.homeX <= slot.right + pad &&
                p.homeY >= slot.cy - size * 0.55 &&
                p.homeY <= slot.cy + size * 0.55
        )
        const pts = fitPointCount(
            filtered.length ? filtered : raw,
            counts[i],
            W,
            H
        ).map((p) => ({ ...p, digitSlot: i }))
        bySlot[i] = pts
        all.push(...pts)
    }
    while (all.length > count) all.pop()
    while (all.length < count) {
        const last = all[all.length - 1] || {
            homeX: box.x + box.w * 0.5,
            homeY: box.y + box.h * 0.5,
            r: 243,
            g: 244,
            b: 245,
            a: 255,
            digitSlot: 0,
        }
        all.push({ ...last })
    }
    return {
        points: all,
        bySlot,
        slots,
        text,
        stage: box,
        rect: boundsOfPoints(all),
    }
}

function drawMetricText(oc, W, H, text) {
    const stage = getShapeStageRect(W, H)
    const { font, size } = getMetricFont(W, H)
    oc.fillStyle = "#f3f4f5"
    oc.font = font
    oc.textAlign = "right"
    oc.textBaseline = "middle"
    oc.fillText(text, stage.x + stage.w, stage.y + stage.h - size * 0.42)
}

function drawBarChart(oc, W, H, heights) {
    const layout = getChartLayout(W, H, heights.length)
    oc.fillStyle = "#f3f4f5"
    for (let i = 0; i < layout.n; i++) {
        const bh = Math.max(12, layout.areaH * heights[i])
        oc.fillRect(
            layout.centers[i] - layout.barW * 0.5,
            layout.baseY - bh,
            layout.barW,
            bh
        )
    }
}

function buildChartSlots(layout, heights, count) {
    const weights = heights.map((h) => Math.max(0.1, h))
    const sum = weights.reduce((a, b) => a + b, 0)
    const counts = weights.map((w) => Math.max(2, Math.round((count * w) / sum)))
    let diff = count - counts.reduce((a, b) => a + b, 0)
    let guard = 0
    while (diff !== 0 && guard < 1000) {
        const i = guard % counts.length
        if (diff > 0) {
            counts[i] += 1
            diff -= 1
        } else if (counts[i] > 2) {
            counts[i] -= 1
            diff += 1
        }
        guard++
    }
    const slots = []
    for (let i = 0; i < layout.n; i++) {
        const m = counts[i]
        for (let s = 0; s < m; s++) {
            const cols = Math.max(2, Math.round(Math.sqrt(m * 0.65)))
            const rows = Math.max(1, Math.ceil(m / cols))
            const col = s % cols
            const row = Math.floor(s / cols)
            const barU = (col + 0.5) / cols
            const barT = (row + 0.5) / rows
            slots.push({ barIndex: i, barU, barT })
        }
    }
    return slots.slice(0, count)
}

function homesFromChartSlots(layout, heights, slots) {
    return slots.map((slot) => {
        const bh = Math.max(12, layout.areaH * heights[slot.barIndex])
        const halfW = layout.barW * 0.42
        return {
            homeX: layout.centers[slot.barIndex] + (slot.barU - 0.5) * 2 * halfW,
            homeY: layout.baseY - slot.barT * bh,
            r: 243,
            g: 244,
            b: 245,
            a: 255,
            barIndex: slot.barIndex,
            barU: slot.barU,
            barT: slot.barT,
        }
    })
}

const CHART_HEIGHTS_A = [0.42, 0.7, 0.36, 0.88, 0.55]
const CHART_HEIGHTS_B = [0.78, 0.4, 0.82, 0.5, 0.95]

/** Relative stage widths for a classic top→bottom data funnel. */
const FUNNEL_VALUES_A = [1, 0.74, 0.5, 0.32, 0.16]
const FUNNEL_VALUES_B = [1, 0.84, 0.6, 0.4, 0.22]

function getFunnelLayout(W, H, stageCount = 5, stage = null) {
    const areaW = W * 0.7
    const areaH = H * 0.78
    const box = anchorBottomRight(
        stage || getShapeStageRect(W, H),
        areaW,
        areaH
    )
    const padX = box.w * 0.04
    const padY = box.h * 0.05
    const gap = Math.max(4, box.h * 0.016)
    const innerW = box.w - padX * 2
    const innerH = box.h - padY * 2 - gap * (stageCount - 1)
    const bandH = innerH / stageCount
    const cx = box.x + box.w * 0.5
    const maxW = innerW
    const bands = []
    for (let i = 0; i < stageCount; i++) {
        const top = box.y + padY + i * (bandH + gap)
        bands.push({
            index: i,
            top,
            bottom: top + bandH,
            midY: top + bandH * 0.5,
            h: bandH,
        })
    }
    return {
        n: stageCount,
        box,
        cx,
        maxW,
        bandH,
        gap,
        bands,
        marginX: box.x + padX,
        marginY: box.y + padY,
        areaW: innerW,
        areaH: box.h - padY * 2,
        inset: getGridInset(W, H),
    }
}

function funnelWidths(values, i) {
    const top = Math.max(0.08, values[i] ?? 0.2)
    const bot =
        i < values.length - 1
            ? Math.max(0.06, values[i + 1] ?? top * 0.7)
            : Math.max(0.05, top * 0.55)
    return { top, bot }
}

function buildFunnelSlots(layout, values, count) {
    const weights = values.map((v, i) => {
        const { top, bot } = funnelWidths(values, i)
        return Math.max(0.12, ((top + bot) * 0.5) * (layout.bands[i]?.h || 1))
    })
    const sum = weights.reduce((a, b) => a + b, 0)
    const counts = weights.map((w) => Math.max(3, Math.round((count * w) / sum)))
    let diff = count - counts.reduce((a, b) => a + b, 0)
    let guard = 0
    while (diff !== 0 && guard < 2000) {
        const i = guard % counts.length
        if (diff > 0) {
            counts[i] += 1
            diff -= 1
        } else if (counts[i] > 3) {
            counts[i] -= 1
            diff += 1
        }
        guard++
    }
    const slots = []
    for (let i = 0; i < layout.n; i++) {
        const m = counts[i]
        const cols = Math.max(3, Math.round(Math.sqrt(m * 1.15)))
        const rows = Math.max(2, Math.ceil(m / cols))
        for (let s = 0; s < m; s++) {
            const col = s % cols
            const row = Math.floor(s / cols)
            slots.push({
                stageIndex: i,
                stageU: (col + 0.5) / cols,
                stageT: (row + 0.5) / rows,
            })
        }
    }
    return slots.slice(0, count)
}

function homesFromFunnelSlots(layout, values, slots) {
    return slots.map((slot) => {
        const band = layout.bands[slot.stageIndex]
        const { top, bot } = funnelWidths(values, slot.stageIndex)
        const t = slot.stageT
        const wNorm = top + (bot - top) * t
        const halfW = (layout.maxW * wNorm) * 0.5
        return {
            homeX: layout.cx + (slot.stageU - 0.5) * 2 * halfW,
            homeY: band.top + t * band.h,
            r: 243,
            g: 244,
            b: 245,
            a: 255,
            stageIndex: slot.stageIndex,
            stageU: slot.stageU,
            stageT: slot.stageT,
        }
    })
}

const ParticleImage = forwardRef(function ParticleImage({
    imageConfig,
    particleCount,
    particleSize,
    particleShape = "circle",
    particleColor = "original",
    singleColor = "#ffffff",
    multiColors = [],
    hoverEnabled = true,
    hoverConfig = {},
    repulsionEnabled = true,
    repulsionConfig = {},
    autoAssemble = false,
    loopStory = false,
    loopHoldAssembledMs = 2200,
    loopHoldScatteredMs = 900,
    loopAfterHoverMoves = 4,
    assembleAfterMoves = 0,
    flagWind = false,
    shapeStory = false,
    shapeAfterMoves = 4,
    particleGap = undefined,
    onAssembledChange = undefined,
    width = undefined,
    height = undefined,
    className = undefined,
    style,
    ...props
}, ref) {
    const hover = hoverEnabled
    const resolvedHoverConfig = autoAssemble
        ? {
              hoverType: "hide",
              hideType: "scatter",
              ...hoverConfig,
          }
        : hoverConfig
    const {
        hoverType = autoAssemble ? "hide" : "roam",
        transition,
        roamWidth = 0,
        roamHeight = 0,
        roamOpacity = 0.5,
        roamShape = "rectangle",
        hideType = autoAssemble ? "scatter" : "scatter",
    } = (resolvedHoverConfig as any) || {}
    const repulsion = repulsionEnabled
    const {
        repulsionForce = 6,
        repulsionRadius = 80,
        repulsionMode = "outside",
    } = repulsionConfig || {}
    const DEFAULT_IMAGE =
        "https://imagedelivery.net/IEUjvl3YUlxY-MrTpOAWDQ/8b5ddde3-e723-4ca9-573d-4199bdb4ab00/w=800"
    const {
        image: rawImage,
        mode = "fill",
        sizeUnit = "%",
        widthPx = 400,
        heightPx = 400,
        widthPct = 100,
        heightPct = 100,
        scale = 5,
    } = (imageConfig as any) || {}
    const image = rawImage || DEFAULT_IMAGE
    const containerRef = useRef(null)
    const canvasRef = useRef(null)
    const mouseRef = useRef({ x: -99999, y: -99999, active: false })
    const prevMouseRef = useRef({ x: -99999, y: -99999 })
    const mouseSpeedRef = useRef(0)
    const smoothMouseRef = useRef({ x: -99999, y: -99999 })
    const autoAssembleRef = useRef(autoAssemble)
    const autoAssembleTimerRef = useRef(null)
    const loopStoryRef = useRef(loopStory)
    const loopTimerRef = useRef(null)
    const loopUnlockedRef = useRef(false)
    const hoverMoveCountRef = useRef(0)
    const assembleTriggeredRef = useRef(false)
    const loopAfterHoverMovesRef = useRef(loopAfterHoverMoves)
    const assembleAfterMovesRef = useRef(assembleAfterMoves)
    const flagWindRef = useRef(flagWind)
    const flagWindStartRef = useRef(0)
    const shapeStoryRef = useRef(shapeStory)
    const shapeAfterMovesRef = useRef(shapeAfterMoves)
    const shapeMoveCountRef = useRef(0)
    const shapesRef = useRef(null)
    const currentShapeRef = useRef("logo")
    const morphStoryTimerRef = useRef(null)
    const chartPulseTimerRef = useRef(null)
    const chartPulseToggleRef = useRef(false)
    const chartHeightsRef = useRef(CHART_HEIGHTS_A.slice())
    const flowLockedRef = useRef(false)

    const funnelValuesRef = useRef(FUNNEL_VALUES_A.slice())
    const funnelPulseToggleRef = useRef(false)
    const metricValueRef = useRef(1.75)
    const metricTextRef = useRef("1.75")
    const loopHoldRef = useRef({
        assembled: loopHoldAssembledMs,
        scattered: loopHoldScatteredMs,
    })
    const onAssembledChangeRef = useRef(onAssembledChange)
    onAssembledChangeRef.current = onAssembledChange
    autoAssembleRef.current = autoAssemble
    loopStoryRef.current = loopStory
    loopAfterHoverMovesRef.current = Math.max(1, loopAfterHoverMoves)
    assembleAfterMovesRef.current = Math.max(0, assembleAfterMoves)
    flagWindRef.current = !!flagWind
    shapeStoryRef.current = !!shapeStory && !flowLockedRef.current
    shapeAfterMovesRef.current = Math.max(1, shapeAfterMoves)
    loopHoldRef.current = {
        assembled: loopHoldAssembledMs,
        scattered: loopHoldScatteredMs,
    }
    const fieldStoryActive = () =>
        loopStoryRef.current ||
        assembleAfterMovesRef.current > 0 ||
        shapeStoryRef.current
    const setAssembledVis = (on) => {
        onAssembledChangeRef.current?.(on)
    }
    const clearShapeTimers = () => {
        clearTimeout(morphStoryTimerRef.current)
        clearTimeout(chartPulseTimerRef.current)
        morphStoryTimerRef.current = null
        chartPulseTimerRef.current = null
    }
    const morphToShapeRef = useRef(null)
    const tweenHomesInPlaceRef = useRef(null)
    const applyMetricTextRef = useRef(null)
    const applyChartHeightsRef = useRef(null)
    const applyFunnelValuesRef = useRef(null)
    const onShapeArrivedRef = useRef(null)

    tweenHomesInPlaceRef.current = (targets, durationMs = 420) => {
        const { particles } = sceneRef.current
        if (!particles.length || !targets?.length) return
        const now = Date.now()
        const mapped = remapTargetsSpatially(particles, targets)
        particles.forEach((p, i) => {
            if (p.isPadding) return
            const t = mapped[i]
            if (!t) return
            p.homeFromX = p.homeX
            p.homeFromY = p.homeY
            p.homeToX = t.homeX
            p.homeToY = t.homeY
            p.homeTweenStart = now
            p.homeTweenDur = durationMs
            if (t.barIndex != null) {
                p.barIndex = t.barIndex
                p.barU = t.barU
                p.barT = t.barT
            }
            p.repX *= 0.25
            p.repY *= 0.25
        })
    }

    applyMetricTextRef.current = (nextText, durationMs = 280) => {
        const shapes = shapesRef.current
        const { W, H } = dimsRef.current
        const { particles } = sceneRef.current
        if (!shapes || !W || !H || !particles.length) return
        const sampled = sampleMetricSlots(
            W,
            H,
            nextText,
            shapes.sampleGap || 5,
            particles.length,
            shapes.stage || getShapeStageRect(W, H)
        )
        const prevText = metricTextRef.current || ""
        sceneRef.current.logoRect = sampled.rect
        const now = Date.now()

        // First layout / full bind: assign digit slots once.
        const needsBind = particles.some(
            (p) => !p.isPadding && (p.digitSlot == null || p.digitSlot < 0)
        )
        if (needsBind || !prevText || prevText.length !== nextText.length) {
            particles.forEach((p, i) => {
                if (p.isPadding) return
                const t = sampled.points[i]
                if (!t) return
                p.digitSlot = t.digitSlot
                p.homeFromX = p.homeX
                p.homeFromY = p.homeY
                p.homeToX = t.homeX
                p.homeToY = t.homeY
                p.homeTweenStart = now
                p.homeTweenDur = durationMs
                p.repX *= 0.25
                p.repY *= 0.25
            })
            metricTextRef.current = nextText
            return
        }

        // Clock-style tick: remorph only digits that actually changed.
        for (let slot = 0; slot < nextText.length; slot++) {
            if (prevText[slot] === nextText[slot]) continue
            const fresh = sampled.bySlot[slot] || []
            const members = []
            particles.forEach((p, i) => {
                if (!p.isPadding && p.digitSlot === slot) members.push(i)
            })
            if (!members.length || !fresh.length) continue
            const fitted = fitPointCount(fresh, members.length, W, H)
            members.forEach((pi, j) => {
                const p = particles[pi]
                const t = fitted[j]
                if (!p || !t) return
                p.homeFromX = p.homeX
                p.homeFromY = p.homeY
                p.homeToX = t.homeX
                p.homeToY = t.homeY
                p.homeTweenStart = now
                p.homeTweenDur = durationMs
                p.repX *= 0.2
                p.repY *= 0.2
            })
        }
        metricTextRef.current = nextText
    }

    applyChartHeightsRef.current = (heights, durationMs = 900) => {
        const shapes = shapesRef.current
        const layout = shapes?.chartLayout
        const { particles } = sceneRef.current
        if (!layout || !particles.length) return
        const now = Date.now()
        particles.forEach((p) => {
            if (p.isPadding || p.barIndex == null) return
            const bh = Math.max(12, layout.areaH * heights[p.barIndex])
            const halfW = layout.barW * 0.42
            p.homeFromX = p.homeX
            p.homeFromY = p.homeY
            p.homeToX =
                layout.centers[p.barIndex] + (p.barU - 0.5) * 2 * halfW
            p.homeToY = layout.baseY - p.barT * bh
            p.homeTweenStart = now
            p.homeTweenDur = durationMs
            p.repX *= 0.2
            p.repY *= 0.2
        })
        chartHeightsRef.current = heights.slice()
        sceneRef.current.logoRect = {
            x: layout.marginX,
            y: layout.marginY,
            w: layout.areaW,
            h: layout.areaH,
        }
    }

    applyFunnelValuesRef.current = (values, durationMs = 900) => {
        const shapes = shapesRef.current
        const layout = shapes?.funnelLayout
        const { particles } = sceneRef.current
        if (!layout || !particles.length) return
        const now = Date.now()
        particles.forEach((p) => {
            if (p.isPadding || p.stageIndex == null) return
            const band = layout.bands[p.stageIndex]
            if (!band) return
            const { top, bot } = funnelWidths(values, p.stageIndex)
            const t = p.stageT ?? 0.5
            const wNorm = top + (bot - top) * t
            const halfW = layout.maxW * wNorm * 0.5
            p.homeFromX = p.homeX
            p.homeFromY = p.homeY
            p.homeToX = layout.cx + (p.stageU - 0.5) * 2 * halfW
            p.homeToY = band.top + t * band.h
            p.homeTweenStart = now
            p.homeTweenDur = durationMs
            p.repX *= 0.2
            p.repY *= 0.2
        })
        funnelValuesRef.current = values.slice()
        sceneRef.current.logoRect = {
            x: layout.marginX,
            y: layout.marginY,
            w: layout.areaW,
            h: layout.areaH,
        }
    }

    onShapeArrivedRef.current = (_key) => {
        clearTimeout(morphStoryTimerRef.current)
        clearTimeout(chartPulseTimerRef.current)
        // Pattern story: no auto pulses / digit ticks — wait for next cursor moves.
    }
    morphToShapeRef.current = (key) => {
        const shapes = shapesRef.current
        if (!shapes) return
        const { particles } = sceneRef.current
        if (!particles.length) return
        clearShapeTimers()
        clearTimeout(animTimerRef.current)
        clearTimeout(loopTimerRef.current)

        const { W, H } = dimsRef.current
        const n = particles.length
        const gap = shapes.sampleGap || 5
        const stage = shapes.stage || getPatternStageRect(W, H)

        let targets
        let rect
        if (key === "sport" || key === "next" || key === "chladni") {
            const nextIndex =
                key === "next"
                    ? (shapes.sportIndex ?? 0) + 1
                    : shapes.sportIndex ?? 0
            const sampled = sampleSportPoints(
                W,
                H,
                gap,
                n,
                nextIndex,
                stage
            )
            targets = sampled.points
            rect = sampled.rect
            shapes.sportIndex = sampled.sportIndex
            shapes.sportId = sampled.sportId
            shapes.sportLabel = sampled.sportLabel
            shapes.sport = targets
            shapes.rects = shapes.rects || {}
            shapes.rects.sport = rect
            key = "sport"
        } else {
            targets = shapes[key]
            rect = shapes.rects?.[key] || shapes.rects?.sport
            if (!targets || !targets.length) return
        }
        targets = remapTargetsSpatially(particles, targets)

        const { durMs: _dur } = getTransitionParams(
            (physicsRef.current as any).transition
        )
        const settleMs = Math.round(_dur * 1.35)
        particles.forEach((p, i) => {
            if (p.isPadding) return
            p.startX = p.x
            p.startY = p.y
            p.homeTweenStart = 0
            const t = targets[i]
            if (!t) return
            p.homeX = t.homeX
            p.homeY = t.homeY
            p.barIndex = null
            p.stageIndex = null
            p.digitSlot = null
            if (t.r != null) {
                p.r = t.r
                p.g = t.g
                p.b = t.b
            }
            p.repX *= 0.2
            p.repY *= 0.2
        })
        if (rect) sceneRef.current.logoRect = rect
        currentShapeRef.current = key
        animStartTimeRef.current = Date.now()
        animStateRef.current = "assembling"
        setAssembledVis(false)
        animTimerRef.current = setTimeout(() => {
            if (animStateRef.current !== "assembling") return
            animStateRef.current = "active"
            setAssembledVis(true)
            onShapeArrivedRef.current?.(key)
        }, settleMs)
    }
    const scheduleLoopStep = (fromState) => {
        if (!loopStoryRef.current || !loopUnlockedRef.current) return
        clearTimeout(loopTimerRef.current)
        if (fromState === "active") {
            loopTimerRef.current = setTimeout(() => {
                if (loopUnlockedRef.current)
                    startAnimRef.current?.("scattering")
            }, loopHoldRef.current.assembled)
        } else if (fromState === "idle") {
            loopTimerRef.current = setTimeout(() => {
                if (loopUnlockedRef.current)
                    startAnimRef.current?.("assembling")
            }, loopHoldRef.current.scattered)
        }
    }
    const isInsideLogo = (x, y, pad = 14) => {
        const logoRect = sceneRef.current.logoRect
        if (!logoRect) return false
        return (
            x >= logoRect.x - pad &&
            x <= logoRect.x + logoRect.w + pad &&
            y >= logoRect.y - pad &&
            y <= logoRect.y + logoRect.h + pad
        )
    }
    const tryAssembleFromHoverMoves = (mx, my, prev) => {
        if (flowLockedRef.current) return
        if (assembleTriggeredRef.current) return
        if (assembleAfterMovesRef.current <= 0) return
        const state = animStateRef.current
        if (state !== "idle" && state !== "scattering") return
        if (prev && prev.x > -9000) {
            const ddx = mx - prev.x
            const ddy = my - prev.y
            // Ignore micro-jitter; only deliberate cursor travel counts.
            if (Math.sqrt(ddx * ddx + ddy * ddy) < 28) return
        } else {
            return
        }
        hoverMoveCountRef.current += 1
        if (hoverMoveCountRef.current < assembleAfterMovesRef.current) return
        assembleTriggeredRef.current = true
        currentShapeRef.current = "sport"
        shapeMoveCountRef.current = 0
        // Always morph into sport/Chladni-like patterns — never the image logo.
        if (shapeStoryRef.current || shapeStory) {
            morphToShapeRef.current?.("sport")
        } else {
            startAnimRef.current?.("assembling")
        }
    }
    const tryAdvanceShapeFromHover = (mx, my, prev) => {
        if (flowLockedRef.current) return
        if (!shapeStoryRef.current) return
        if (!assembleTriggeredRef.current) return
        if (animStateRef.current !== "active") return
        if (prev && prev.x > -9000) {
            const ddx = mx - prev.x
            const ddy = my - prev.y
            if (Math.sqrt(ddx * ddx + ddy * ddy) < 28) return
        } else {
            return
        }
        shapeMoveCountRef.current += 1
        if (shapeMoveCountRef.current < shapeAfterMovesRef.current) return
        shapeMoveCountRef.current = 0
        // Next sport marking pattern.
        morphToShapeRef.current?.("next")
    }
    const tryUnlockLoopFromHover = (mx, my, prev) => {
        if (loopUnlockedRef.current || !loopStoryRef.current) return
        if (shapeStoryRef.current) return
        const state = animStateRef.current
        if (state !== "active" && state !== "assembling") return
        if (!isInsideLogo(mx, my)) return
        if (prev && prev.x > -9000) {
            const ddx = mx - prev.x
            const ddy = my - prev.y
            if (Math.sqrt(ddx * ddx + ddy * ddy) < 8) return
        }
        hoverMoveCountRef.current += 1
        if (hoverMoveCountRef.current < loopAfterHoverMovesRef.current) return
        loopUnlockedRef.current = true
        if (animStateRef.current === "active") scheduleLoopStep("active")
    }
    const physicsRef = useRef({})
    physicsRef.current = {
        hover,
        hoverType,
        transition,
        roamWidth,
        roamHeight,
        roamOpacity,
        roamShape,
        hideType,
        repulsion,
        repulsionForce,
        repulsionRadius,
        repulsionMode,
        particleSize,
        particleShape,
        particleColor,
        singleColor,
        multiColors,
    }
    const sceneRef = useRef({
        particles: [],
        logoRect: null,
        fieldRect: null,
        sampleGap: 8,
        gridAlpha: 0,
    })
    const dimsRef = useRef({ W: 0, H: 0 })
    const samplingRef = useRef({})
    samplingRef.current = {
        image,
        mode,
        sizeUnit,
        widthPx,
        heightPx,
        widthPct,
        heightPct,
        scale,
        particleCount,
        particleGap,
        hover,
        hoverType,
        roamWidth,
        roamHeight,
        roamShape,
        hideType,
    }
    const animStateRef = useRef("active")
    const animRef = useRef(null)
    const animStartTimeRef = useRef(0)
    const animTimerRef = useRef(null)
    const roamFadeStartRef = useRef(0)
    const roamFadeFromRef = useRef(1)
    const roamFadeToRef = useRef(1)
    const startAnimRef = useRef(null)

    useImperativeHandle(ref, () => {
        const captureSnapshot = () => {
            const canvas = canvasRef.current
            const { particles } = sceneRef.current
            const { W, H } = dimsRef.current
            if (!canvas || !particles.length || !W || !H) return []
            const rect = canvas.getBoundingClientRect()
            const sx = rect.width / W
            const sy = rect.height / H
            const out = []
            for (const p of particles) {
                if (p.isPadding || p.flowDrained) continue
                out.push({
                    clientX: rect.left + p.x * sx,
                    clientY: rect.top + p.y * sy,
                    r: p.r,
                    g: p.g,
                    b: p.b,
                    a: p.a,
                    colorIdx: p.colorIdx,
                })
            }
            return out
        }
        return {
            captureSnapshot,
            beginFlowHandoff({ keepRatio = 0.16 } = {}) {
                flowLockedRef.current = true
                shapeStoryRef.current = false
                clearTimeout(morphStoryTimerRef.current)
                clearTimeout(chartPulseTimerRef.current)
                clearTimeout(animTimerRef.current)
                clearTimeout(loopTimerRef.current)
                const { particles } = sceneRef.current
                const live = particles.filter((p) => !p.isPadding)
                const n = live.length
                const safeKeepRatio = Math.max(
                    0,
                    Math.min(1, Number(keepRatio) || 0)
                )
                const keep = Math.round(n * safeKeepRatio)
                // Snapshot BEFORE draining so bridge gets full migration set.
                const migrating = []
                const rect = canvasRef.current?.getBoundingClientRect()
                const { W, H } = dimsRef.current
                const sx = rect && W ? rect.width / W : 1
                const sy = rect && H ? rect.height / H : 1
                live.forEach((p, i) => {
                    const drain = i >= keep
                    if (drain && rect) {
                        migrating.push({
                            clientX: rect.left + p.x * sx,
                            clientY: rect.top + p.y * sy,
                            r: p.r,
                            g: p.g,
                            b: p.b,
                            a: p.a,
                            colorIdx: p.colorIdx,
                        })
                    }
                    p.flowDrained = drain
                })
                animStateRef.current = "idle"
                live.forEach((p) => {
                    if (p.flowDrained) return
                    p.idleX = p.x
                    p.idleY = p.y
                    p.driftPhase = Math.random() * Math.PI * 2
                    p.driftSpeed = 0.3 + Math.random() * 0.4
                    p.driftAmp = 2.5 + Math.random() * 4
                })
                return migrating
            },
            isFlowLocked() {
                return flowLockedRef.current
            },
            /** Reverse handoff: show all particles again and resume pattern story. */
            restoreFlowHandoff() {
                flowLockedRef.current = false
                shapeStoryRef.current = !!shapeStory
                const { particles } = sceneRef.current
                const { W, H } = dimsRef.current
                particles.forEach((p) => {
                    if (p.isPadding) return
                    p.flowDrained = false
                    p.idleX = p.x
                    p.idleY = p.y
                    p.driftPhase = Math.random() * Math.PI * 2
                    p.driftSpeed = 0.35 + Math.random() * 0.5
                    p.driftAmp = 3.5 + Math.random() * 5
                })
                animStateRef.current = "idle"
                assembleTriggeredRef.current = false
                shapeMoveCountRef.current = 0
                hoverMoveCountRef.current = 0
                clearShapeTimers()

                // Re-bind homes to sport/Chladni patterns (not the Altenar mark).
                if (shapeStory && particles.length && W && H) {
                    const live = particles.filter((p) => !p.isPadding)
                    const gap = sceneRef.current.sampleGap || 5
                    const shapeStage = getPatternStageRect(W, H)
                    const prevIndex = shapesRef.current?.sportIndex ?? 0
                    const sampled = sampleSportPoints(
                        W,
                        H,
                        gap,
                        live.length,
                        prevIndex,
                        shapeStage
                    )
                    const homePts = sampled.points
                    const mapped = remapTargetsSpatially(live, homePts)
                    live.forEach((p, i) => {
                        const t = mapped[i]
                        if (!t) return
                        p.homeX = t.homeX
                        p.homeY = t.homeY
                        if (t.r != null) {
                            p.r = t.r
                            p.g = t.g
                            p.b = t.b
                        }
                    })
                    sceneRef.current.logoRect = sampled.rect
                    currentShapeRef.current = "sport"
                    shapesRef.current = {
                        sport: homePts,
                        sampleGap: gap,
                        stage: shapeStage,
                        sportIndex: sampled.sportIndex,
                        sportId: sampled.sportId,
                        sportLabel: sampled.sportLabel,
                        rects: { sport: sampled.rect },
                    }
                }
            },
        }
    })

    startAnimRef.current = (newState) => {
        const { particles } = sceneRef.current
        const { W, H } = dimsRef.current
        const {
            hoverType: ht,
            roamWidth: rw,
            roamHeight: rh,
            roamShape: rs,
            roamOpacity: rOp,
            transition: tr,
        } = physicsRef.current as any
        const { durMs: _dur } = getTransitionParams(tr)
        // Extra settle window so staggered particles finish without a hard snap.
        const settleMs = Math.round(_dur * 1.35)
        const bw = Math.max(80, rw || W),
            bh = Math.max(80, rh || H)
        const bx = (W - bw) / 2,
            by = (H - bh) / 2
        const { W: dw, H: dh } = dimsRef.current
        const maxD = Math.max(dw, dh)
        particles.forEach((p) => {
            if (p.isPadding) return
            p.startX = p.x
            p.startY = p.y
            if (newState === "scattering" && ht === "roam") {
                const [tx, ty] = randomInShape(rs, bx, by, bw, bh)
                p.roamTargetX = tx
                p.roamTargetY = ty
                p.idleX = tx
                p.idleY = ty
            } else if (newState === "scattering" && ht === "hide") {
                const fieldRect =
                    sceneRef.current.fieldRect || {
                        x: 0,
                        y: 0,
                        w: dw,
                        h: dh,
                    }
                if (fieldStoryActive()) {
                    const [ox, oy] = randomInRect(fieldRect)
                    p.idleX = ox
                    p.idleY = oy
                    seedFieldDrift(p, fieldRect)
                } else {
                    const range = 10
                    const d = (range / 10) * 0.5 * maxD
                    const angle = Math.random() * Math.PI * 2
                    p.idleX = p.homeX + Math.cos(angle) * d
                    p.idleY = p.homeY + Math.sin(angle) * d
                }
            }
        })
        const _rOp = rOp ?? 0.5
        if (ht === "roam") {
            if (newState === "scattering") {
                roamFadeStartRef.current = Date.now()
                roamFadeFromRef.current = 1
                roamFadeToRef.current = _rOp
            } else if (newState === "assembling") {
                roamFadeStartRef.current = Date.now()
                roamFadeFromRef.current = _rOp
                roamFadeToRef.current = 1
            }
        }
        if (newState === "scattering" && ht === "roam") {
            clearTimeout(animTimerRef.current)
            clearTimeout(loopTimerRef.current)
            animStateRef.current = "idle"
            setAssembledVis(false)
            if (loopStoryRef.current && loopUnlockedRef.current) {
                scheduleLoopStep("idle")
            }
            return
        }
        if (newState === "scattering") setAssembledVis(false)
        animStartTimeRef.current = Date.now()
        animStateRef.current = newState
        clearTimeout(animTimerRef.current)
        clearTimeout(loopTimerRef.current)
        const next = newState === "assembling" ? "active" : "idle"
        animTimerRef.current = setTimeout(() => {
            if (animStateRef.current !== newState) return
            animStateRef.current = next
            if (next === "active") {
                setAssembledVis(true)
                if (
                    flagWindRef.current &&
                    currentShapeRef.current === "logo"
                )
                    flagWindStartRef.current = Date.now()
                shapeMoveCountRef.current = 0
            } else if (next === "idle") setAssembledVis(false)
            if (!loopStoryRef.current || !loopUnlockedRef.current) return
            scheduleLoopStep(next)
        }, settleMs)
    }
    const scheduleAutoAssemble = (particles) => {
        clearTimeout(autoAssembleTimerRef.current)
        clearTimeout(loopTimerRef.current)
        if (!autoAssembleRef.current || !particles.length) return
        autoAssembleTimerRef.current = setTimeout(() => {
            if (sceneRef.current.particles.length > 0) {
                startAnimRef.current?.("assembling")
            }
        }, 500)
    }
    const initParticles = () => {
        const {
            image: url,
            mode: md,
            sizeUnit: sU,
            widthPx: wPx,
            heightPx: hPx,
            widthPct: wPct,
            heightPct: hPct,
            scale: sc,
            particleCount: count,
            particleGap: pGap,
            hover: hOn,
            hoverType: ht,
            roamWidth: rw,
            roamHeight: rh,
            roamShape: rs,
            hideType: hT,
        } = samplingRef.current as any
        const { W, H } = dimsRef.current
        if (!url || !W || !H) return
        const canvas = canvasRef.current
        if (!canvas) return
        clearTimeout(animTimerRef.current)
        clearTimeout(autoAssembleTimerRef.current)
        clearTimeout(loopTimerRef.current)
        const gap =
            typeof pGap === "number" && pGap > 0
                ? Math.max(2, Math.round(pGap))
                : Math.max(5, Math.round(220 / Math.max(1, count)))
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
        mouseRef.current = { x: -99999, y: -99999, active: false }
        loopUnlockedRef.current = false
        assembleTriggeredRef.current = false
        hoverMoveCountRef.current = 0
        shapeMoveCountRef.current = 0
        currentShapeRef.current = "sport"
        chartPulseToggleRef.current = false
        funnelPulseToggleRef.current = false
        clearShapeTimers()
        shapesRef.current = null
        sceneRef.current = {
            particles: [],
            logoRect: null,
            fieldRect: { x: 0, y: 0, w: W, h: H },
            sampleGap: gap,
            gridAlpha: 0,
        }
        const tryLoad = (cors) => {
            const img = new Image()
            if (cors) img.crossOrigin = "anonymous"
            img.onerror = () => cors && tryLoad(false)
            img.onload = () => {
                let rect
                const stage = getShapeStageRect(W, H)
                if (md === "fit") {
                    // Size against full canvas, re-anchor to bottom-right.
                    const base = containRect(
                        img.naturalWidth || img.width,
                        img.naturalHeight || img.height,
                        W,
                        H
                    )
                    const f = Math.max(1, Math.min(20, sc)) / 10
                    const w = base.w * f
                    const h = base.h * f
                    rect = anchorBottomRight(stage, w, h)
                } else if (sU === "px") {
                    rect = anchorBottomRight(stage, wPx, hPx)
                } else {
                    rect = anchorBottomRight(
                        stage,
                        (W * wPct) / 100,
                        (H * hPct) / 100
                    )
                }
                const off = document.createElement("canvas")
                off.width = W
                off.height = H
                const oc = off.getContext("2d")
                oc.drawImage(img, rect.x, rect.y, rect.w, rect.h)
                let px
                try {
                    px = oc.getImageData(0, 0, W, H).data
                } catch (_) {
                    return
                }
                const src = []
                for (let y = 0; y < H; y += gap)
                    for (let x = 0; x < W; x += gap) {
                        const i = (y * W + x) * 4
                        const lum = px[i] + px[i + 1] + px[i + 2]
                        if (px[i + 3] >= 20 && lum >= 40)
                            src.push({
                                homeX: x,
                                homeY: y,
                                r: px[i],
                                g: px[i + 1],
                                b: px[i + 2],
                                a: px[i + 3],
                            })
                    }
                shuffle(src)
                let particles = []
                const hidePos = (homeX, homeY) => {
                    const range = fieldStoryActive()
                        ? 4
                        : hT === "in-place"
                          ? 1
                          : 10
                    const maxD = Math.max(W, H)
                    const d = (range / 10) * 0.5 * maxD
                    const angle = Math.random() * Math.PI * 2
                    return [
                        homeX + Math.cos(angle) * d,
                        homeY + Math.sin(angle) * d,
                    ]
                }
                if (!hOn) {
                    animStateRef.current = "active"
                    particles = src.map((p) =>
                        mkParticle(p, p.homeX, p.homeY, p.homeX, p.homeY)
                    )
                } else if (ht === "roam") {
                    const bw = Math.max(80, rw || W),
                        bh = Math.max(80, rh || H)
                    const bx = (W - bw) / 2,
                        by = (H - bh) / 2
                    particles = src.map((p) => {
                        const [rx, ry] = randomInShape(rs, bx, by, bw, bh)
                        const pt = mkParticle(p, rx, ry, rx, ry)
                        const [tx, ty] = randomInShape(rs, bx, by, bw, bh)
                        pt.roamTargetX = tx
                        pt.roamTargetY = ty
                        pt.vx = (Math.random() - 0.5) * 1.6
                        pt.vy = (Math.random() - 0.5) * 1.6
                        return pt
                    })
                    animStateRef.current = "idle"
                } else if (fieldStoryActive()) {
                    const fieldRect = { x: 0, y: 0, w: W, h: H }
                    particles = src.map((p) => {
                        const [ox, oy] = randomInRect(fieldRect)
                        const pt = mkParticle(p, ox, oy, ox, oy)
                        seedFieldDrift(pt, fieldRect)
                        return pt
                    })
                    animStateRef.current = "idle"
                } else {
                    particles = src.map((p) => {
                        const [ox, oy] = hidePos(p.homeX, p.homeY)
                        return mkParticle(p, ox, oy, ox, oy)
                    })
                    animStateRef.current = "idle"
                }
                sceneRef.current = {
                    particles,
                    logoRect: rect,
                    fieldRect: { x: 0, y: 0, w: W, h: H },
                    sampleGap: gap,
                    gridAlpha: 0,
                }
                // Seed pattern homes from the prop — never keep logo silhouette
                // as assemble targets (flowLocked may already be true if IO raced).
                if (shapeStory && particles.length) {
                    const n = particles.length
                    const shapeStage = getPatternStageRect(W, H)
                    const sampled = sampleSportPoints(
                        W,
                        H,
                        gap,
                        n,
                        0,
                        shapeStage
                    )
                    const homePts = sampled.points
                    particles.forEach((p, i) => {
                        const t = homePts[i]
                        if (!t) return
                        p.homeX = t.homeX
                        p.homeY = t.homeY
                        if (t.r != null) {
                            p.r = t.r
                            p.g = t.g
                            p.b = t.b
                        }
                    })
                    sceneRef.current.logoRect = sampled.rect
                    currentShapeRef.current = "sport"
                    shapesRef.current = {
                        sport: homePts,
                        sampleGap: gap,
                        stage: shapeStage,
                        sportIndex: sampled.sportIndex,
                        sportId: sampled.sportId,
                        sportLabel: sampled.sportLabel,
                        rects: { sport: sampled.rect },
                    }
                }
                scheduleAutoAssemble(particles)
            }
            img.src = url
        }
        tryLoad(true)
    }
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r) return
            const W = Math.round(r.width),
                H = Math.round(r.height)
            if (!W || !H) return
            dimsRef.current = { W, H }
            initParticles()
        })
        ro.observe(el)
        return () => {
            ro.disconnect()
            clearTimeout(autoAssembleTimerRef.current)
            clearTimeout(loopTimerRef.current)
            clearTimeout(animTimerRef.current)
            clearShapeTimers()
        }
    }, [])
    useEffect(() => {
        initParticles()
    }, [
        image,
        mode,
        sizeUnit,
        widthPx,
        heightPx,
        widthPct,
        heightPct,
        scale,
        particleCount,
        particleGap,
        hover,
        hoverType,
        roamWidth,
        roamHeight,
        roamShape,
        hideType,
        autoAssemble,
        loopStory,
        loopHoldAssembledMs,
        loopHoldScatteredMs,
        loopAfterHoverMoves,
        assembleAfterMoves,
        shapeStory,
        shapeAfterMoves,
    ])
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        let idata = null,
            bW = 0,
            bH = 0
        const draw = () => {
            animRef.current = requestAnimationFrame(draw)
            const PW = canvas.width,
                PH = canvas.height
            if (!PW || !PH) return
            const dpr = window.devicePixelRatio || 1
            const { particles, logoRect, fieldRect } = sceneRef.current
            if (!particles.length) return
            if (!idata || PW !== bW || PH !== bH) {
                idata = ctx.createImageData(PW, PH)
                bW = PW
                bH = PH
            }
            idata.data.fill(0)
            const buf = idata.data
            const {
                hover: hOn,
                hoverType: ht,
                transition: tr,
                roamWidth: rw,
                roamHeight: rh,
                roamOpacity: rOp,
                roamShape: rs,
                repulsion: repOn,
                repulsionForce: rF,
                repulsionRadius: rR,
                repulsionMode: rMode,
                particleSize: pSz,
                particleShape: pShape,
                particleColor: pColor,
                singleColor: scColor,
                multiColors: mcColors,
            } = physicsRef.current as any
            const state = animStateRef.current
            const { x: rawMx, y: rawMy, active } = mouseRef.current
            const hitSpeed = mouseSpeedRef.current
            mouseSpeedRef.current *= 0.88
            const sm = smoothMouseRef.current
            if (active) {
                const lerpFactor = Math.max(0.08, 0.3 - hitSpeed * 0.006)
                if (sm.x < -9000) {
                    sm.x = rawMx
                    sm.y = rawMy
                } else {
                    sm.x += (rawMx - sm.x) * lerpFactor
                    sm.y += (rawMy - sm.y) * lerpFactor
                }
            } else {
                sm.x = -99999
                sm.y = -99999
            }
            const mx = sm.x
            const my = sm.y
            const ps = Math.max(1, Math.ceil((pSz / 4) * dpr))
            const { easeFn, durMs } = getTransitionParams(tr)
            const elapsed = Date.now() - animStartTimeRef.current
            const animTGlobal = Math.min(1, elapsed / durMs)
            const { W: DW, H: DH } = dimsRef.current
            const bw = Math.max(80, rw || DW),
                bh = Math.max(80, rh || DH)
            const bx = (DW - bw) / 2,
                by = (DH - bh) / 2
            const half = ps / 2
            const roamBounds =
                fieldRect || { x: 0, y: 0, w: DW, h: DH }
            const copyMaskZones = getHeroCopyMaskZones(DW, DH)
            const logoCx = logoRect
                ? logoRect.x + logoRect.w / 2
                : DW / 2
            const logoCy = logoRect
                ? logoRect.y + logoRect.h / 2
                : DH / 2
            const logoSpan = logoRect
                ? Math.max(logoRect.w, logoRect.h) * 0.5
                : Math.max(DW, DH) * 0.35

            const drawParticle = (cx, cy, r, g, b, a, isCircle) => {
                const px0 = Math.round(cx) - (ps >> 1)
                const py0 = Math.round(cy) - (ps >> 1)
                for (let dy = 0; dy < ps; dy++) {
                    const iy = py0 + dy
                    if (iy < 0 || iy >= PH) continue
                    const row = iy * PW
                    for (let dx = 0; dx < ps; dx++) {
                        if (isCircle) {
                            const ddx = dx - half + 0.5,
                                ddy = dy - half + 0.5
                            if (ddx * ddx + ddy * ddy > half * half) continue
                        }
                        const ix = px0 + dx
                        if (ix < 0 || ix >= PW) continue
                        const i = (row + ix) * 4
                        buf[i] = r
                        buf[i + 1] = g
                        buf[i + 2] = b
                        buf[i + 3] = a
                    }
                }
            }
            const repCutoff = Math.max(1, rR)
            const repCutoffSq = repCutoff * repCutoff
            let pIdx = 0
            for (const p of particles) {
                const isCircle =
                    pShape === "circle" || (pShape === "both" && pIdx % 2 === 1)
                pIdx++
                if (p.isPadding) continue
                if (p.flowDrained) continue
                // Soft stagger: outer particles lag a bit so shape morph isn't a hard snap.
                const homeDist = Math.sqrt(
                    (p.homeX - logoCx) ** 2 + (p.homeY - logoCy) ** 2
                )
                const stagger =
                    state === "assembling" || state === "scattering"
                        ? Math.min(0.32, (homeDist / Math.max(1, logoSpan)) * 0.28) +
                          ((p.colorIdx % 7) / 7) * 0.06
                        : 0
                const localSpan = Math.max(0.55, 1 - stagger)
                const localRaw = Math.min(
                    1,
                    Math.max(0, (animTGlobal - stagger) / localSpan)
                )
                const animT = easeFn(localRaw)
                let baseX = p.x,
                    baseY = p.y
                if (state === "assembling") {
                    baseX = p.startX + (p.homeX - p.startX) * animT
                    baseY = p.startY + (p.homeY - p.startY) * animT
                } else if (state === "scattering") {
                    baseX = p.startX + (p.idleX - p.startX) * animT
                    baseY = p.startY + (p.idleY - p.startY) * animT
                } else if (state === "active") {
                    const nowT = Date.now()
                    if (p.homeTweenStart) {
                        const dur = Math.max(1, p.homeTweenDur || 400)
                        const u = Math.min(
                            1,
                            Math.max(0, (nowT - p.homeTweenStart) / dur)
                        )
                        const e = u * u * (3 - 2 * u)
                        baseX =
                            p.homeFromX + (p.homeToX - p.homeFromX) * e
                        baseY =
                            p.homeFromY + (p.homeToY - p.homeFromY) * e
                        if (u >= 1) {
                            p.homeX = p.homeToX
                            p.homeY = p.homeToY
                            p.homeTweenStart = 0
                        }
                    } else if (
                        flagWindRef.current &&
                        logoRect &&
                        currentShapeRef.current === "logo"
                    ) {
                        const t = nowT * 0.001
                        const fade = Math.min(
                            1,
                            Math.max(
                                0,
                                (nowT - (flagWindStartRef.current || 0)) /
                                    1100
                            )
                        )
                        const fadeEased = fade * fade * (3 - 2 * fade)
                        const left = logoRect.x
                        const top = logoRect.y
                        const w = Math.max(1, logoRect.w)
                        const h = Math.max(1, logoRect.h)
                        // Free edge on the right — left side more anchored.
                        const u = Math.max(
                            0,
                            Math.min(1, (p.homeX - left) / w)
                        )
                        const v =
                            (p.homeY - (top + h * 0.5)) / h
                        const phase =
                            p.homeX * 0.02 +
                            p.homeY * 0.012 +
                            (p.colorIdx % 5) * 0.15
                        const wave1 = Math.sin(t * 1.45 + phase)
                        const wave2 = Math.sin(t * 2.1 + phase * 1.35 + 0.8)
                        const free = 0.08 + u * u * 0.92
                        const amp = (2.6 + Math.abs(v) * 1.4) * free * fadeEased
                        baseX =
                            p.homeX + (wave1 * 0.32 + wave2 * 0.18) * amp
                        baseY =
                            p.homeY + (wave1 * 0.9 + wave2 * 0.4) * amp * 0.8
                    } else {
                        baseX = p.homeX
                        baseY = p.homeY
                    }
                } else if (state === "idle") {
                    if (fieldStoryActive() && roamBounds) {
                        // Gentle float around scatter anchors before assemble.
                        const t = Date.now() * 0.001
                        const phase =
                            p.driftPhase ?? ((p.colorIdx || 0) * 0.73)
                        const speed = p.driftSpeed ?? 0.5
                        const amp = p.driftAmp ?? 5
                        baseX =
                            p.idleX +
                            Math.sin(t * speed + phase) * amp
                        baseY =
                            p.idleY +
                            Math.cos(t * speed * 0.91 + phase * 1.37) *
                                amp *
                                0.9
                        p.x = baseX
                        p.y = baseY
                    } else if (ht === "roam") {
                        const dtx = p.roamTargetX - p.x,
                            dty = p.roamTargetY - p.y
                        if (Math.sqrt(dtx * dtx + dty * dty) < 5) {
                            const [tx, ty] = randomInShape(rs, bx, by, bw, bh)
                            p.roamTargetX = tx
                            p.roamTargetY = ty
                        }
                        p.vx =
                            (p.vx || 0) * 0.96 + (p.roamTargetX - p.x) * 0.005
                        p.vy =
                            (p.vy || 0) * 0.96 + (p.roamTargetY - p.y) * 0.005
                        const sp2 = Math.sqrt(p.vx ** 2 + p.vy ** 2)
                        if (sp2 > 2.1) {
                            p.vx = (p.vx / sp2) * 2.1
                            p.vy = (p.vy / sp2) * 2.1
                        }
                        p.x += p.vx
                        p.y += p.vy
                        baseX = p.x
                        baseY = p.y
                    } else {
                        baseX = p.idleX
                        baseY = p.idleY
                    }
                }
                if (repOn) {
                    if (rMode === "random") {
                        const dx = baseX - rawMx
                        const dy = baseY - rawMy
                        const dist = Math.sqrt(dx * dx + dy * dy)
                        if (dist < repCutoff) {
                            if (!p.inZone) {
                                const angle = Math.random() * Math.PI * 2
                                const d = Math.random() * rF * 5
                                p.repTargetX = Math.cos(angle) * d
                                p.repTargetY = Math.sin(angle) * d
                                p.inZone = true
                            }
                            p.repX += (p.repTargetX - p.repX) * 0.15
                            p.repY += (p.repTargetY - p.repY) * 0.15
                        } else {
                            p.inZone = false
                        }
                    } else {
                        if (active) {
                            const dx = baseX - mx
                            const dy = baseY - my
                            const distSq = dx * dx + dy * dy
                            if (distSq > 0 && distSq < repCutoffSq) {
                                const dist = Math.sqrt(distSq)
                                const nx = dx / dist
                                const ny = dy / dist
                                const falloff = 1 - dist / repCutoff
                                const push =
                                    falloff *
                                    (0.35 + hitSpeed * 0.055) *
                                    rF
                                p.repX += nx * push
                                p.repY += ny * push
                                const targetRepX = nx * (repCutoff - dist) * 0.85
                                const targetRepY = ny * (repCutoff - dist) * 0.85
                                p.repX += (targetRepX - p.repX) * 0.12
                                p.repY += (targetRepY - p.repY) * 0.12
                                p.inZone = true
                            } else {
                                p.inZone = false
                            }
                        } else {
                            p.inZone = false
                        }
                    }
                } else {
                    p.inZone = false
                }
                if (!p.inZone) {
                    p.repX *= 0.96
                    p.repY *= 0.96
                }
                p.x = baseX + p.repX
                p.y = baseY + p.repY
                let dr, dg, db, da
                if (state === "active") {
                    dr = p.r
                    dg = p.g
                    db = p.b
                    da = p.a
                } else if (p.isExtra) {
                    dr = p.r
                    dg = p.g
                    db = p.b
                    if (state === "assembling") da = Math.round(p.a * animT)
                    else if (state === "scattering")
                        da = Math.round(p.a * (1 - animT))
                    else da = 0
                } else if (ht === "roam" && hOn) {
                    let alphaMul
                    if (roamFadeStartRef.current === 0) {
                        alphaMul = rOp ?? 0.5
                    } else {
                        const fadeElapsed =
                            Date.now() - roamFadeStartRef.current
                        const fadeT = Math.min(
                            1,
                            Math.max(0, fadeElapsed / durMs)
                        )
                        const easedFadeT = easeFn(fadeT)
                        alphaMul =
                            roamFadeFromRef.current +
                            (roamFadeToRef.current - roamFadeFromRef.current) *
                                easedFadeT
                    }
                    dr = p.r
                    dg = p.g
                    db = p.b
                    da = Math.round(p.a * alphaMul)
                } else if (ht === "hide" && hOn) {
                    let alphaMul
                    if (fieldStoryActive()) {
                        // Field story keeps particles visible while scattered.
                        alphaMul = 1
                    } else if (state === "idle") alphaMul = 0
                    else if (state === "assembling") alphaMul = animT
                    else if (state === "scattering") alphaMul = 1 - animT
                    else alphaMul = 1
                    dr = p.r
                    dg = p.g
                    db = p.b
                    da = Math.round(p.a * alphaMul)
                } else {
                    dr = p.r
                    dg = p.g
                    db = p.b
                    da = p.a
                }
                if (da < 1) continue
                // Soft fade under headline / lead / buttons — no hard square hole.
                da = Math.round(
                    da * heroCopyVisibility(p.x, p.y, copyMaskZones)
                )
                if (da < 1) continue
                if (pColor === "single") {
                    const sc = parseColor(scColor)
                    dr = sc.r
                    dg = sc.g
                    db = sc.b
                } else if (pColor === "multi") {
                    const cols = (mcColors || []).filter(Boolean)
                    if (cols.length > 0) {
                        const mc = parseColor(cols[p.colorIdx % cols.length])
                        dr = mc.r
                        dg = mc.g
                        db = mc.b
                    }
                }
                drawParticle(p.x * dpr, p.y * dpr, dr, dg, db, da, isCircle)
            }
            ctx.putImageData(idata, 0, 0)
        }
        draw()
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current)
        }
    }, [])
    const onMouseMove = (e) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const { W, H } = dimsRef.current
        const scaleX = rect.width > 0 ? W / rect.width : 1
        const scaleY = rect.height > 0 ? H / rect.height : 1
        const mx = (e.clientX - rect.left) * scaleX
        const my = (e.clientY - rect.top) * scaleY
        const prev = prevMouseRef.current
        if (prev.x > -9999) {
            const ddx = mx - prev.x,
                ddy = my - prev.y
            mouseSpeedRef.current = Math.sqrt(ddx * ddx + ddy * ddy)
        }
        tryAssembleFromHoverMoves(mx, my, prev)
        tryAdvanceShapeFromHover(mx, my, prev)
        tryUnlockLoopFromHover(mx, my, prev)
        prevMouseRef.current = { x: mx, y: my }
        mouseRef.current = { x: mx, y: my, active: true }
        if (
            physicsRef.current.hover &&
            !loopStoryRef.current &&
            assembleAfterMovesRef.current <= 0
        ) {
            const s = animStateRef.current
            if (s === "idle" || s === "scattering")
                startAnimRef.current("assembling")
        }
    }
    const onMouseLeave = () => {
        mouseRef.current = { x: -99999, y: -99999, active: false }
        if (
            physicsRef.current.hover &&
            !loopStoryRef.current &&
            assembleAfterMovesRef.current <= 0
        ) {
            const s = animStateRef.current
            if (s === "assembling" || s === "active")
                startAnimRef.current("scattering")
        }
    }
    useEffect(() => {
        // Track mouse over the whole hero stack so text overlays don't kill repulsion.
        const el = containerRef.current
        if (!el) return
        const stack = el.closest(".hero-stack") || el
        const move = (e) => onMouseMove(e)
        const leave = () => onMouseLeave()
        stack.addEventListener("mousemove", move)
        stack.addEventListener("mouseleave", leave)
        return () => {
            stack.removeEventListener("mousemove", move)
            stack.removeEventListener("mouseleave", leave)
        }
    }, [])
    return (
        <div
            ref={containerRef}
            className={className}
            {...props}
            style={{
                position: "relative",
                width,
                height,
                minWidth: 0,
                minHeight: 0,
                overflow: "hidden",
                ...style,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
            {!image && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(0,0,0,0.3)",
                        fontSize: 13,
                        fontFamily: "monospace",
                        border: "1px dashed rgba(0,0,0,0.15)",
                        borderRadius: 4,
                        background: "rgba(0,0,0,0.04)",
                        pointerEvents: "none",
                    }}
                >
                    Upload image in panel →
                </div>
            )}
        </div>
    )
})

export default ParticleImage

ParticleImage.defaultProps = {
    imageConfig: undefined,
    particleCount: 20,
    particleSize: 5,
    particleShape: "circle",
    particleColor: "original",
    singleColor: "#ffffff",
    multiColors: ["#ffffff", "#aaaaaa", "#555555"],
    hoverEnabled: true,
    hoverConfig: {
        hoverType: "roam",
        transition: { duration: 0.8, ease: "easeInOut" },
        roamWidth: 0,
        roamHeight: 0,
        roamOpacity: 0.5,
        roamShape: "rectangle",
        hideType: "scatter",
    },
    repulsionEnabled: true,
    repulsionConfig: {
        repulsionForce: 10,
        repulsionRadius: 50,
        repulsionMode: "outside",
    },
    autoAssemble: false,
    loopStory: false,
    loopHoldAssembledMs: 2200,
    loopHoldScatteredMs: 900,
    loopAfterHoverMoves: 4,
    assembleAfterMoves: 0,
    flagWind: false,
    shapeStory: false,
    shapeAfterMoves: 4,
    particleGap: undefined,
}
