// Delivered by Originkit · stack: vite · styling: css
// @ts-nocheck

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { sampleMatchFrame, sampleMatchImageData } from "../heroMatch1986"
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
        word: src.word || null,
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
    // Kept very subtle so the field reads calm and ordered, not trembling.
    p.driftPhase = Math.random() * Math.PI * 2
    p.driftSpeed = 0.12 + Math.random() * 0.16
    p.driftAmp = 1.0 + Math.random() * 1.4
    p.vx = 0
    p.vy = 0
    p.roamTargetX = p.idleX ?? p.x
    p.roamTargetY = p.idleY ?? p.y
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
    const step = Math.max(1, Math.round(gap))
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

function regularGridPoints(count, rect) {
    if (!count) return []
    const aspect = Math.max(0.2, rect.w / Math.max(1, rect.h))
    const cols = Math.max(1, Math.ceil(Math.sqrt(count * aspect)))
    const rows = Math.max(1, Math.ceil(count / cols))
    const stepX = rect.w / cols
    const stepY = rect.h / rows
    return Array.from({ length: count }, (_, index) => ({
        x: rect.x + (index % cols + 0.5) * stepX,
        y: rect.y + (Math.floor(index / cols) + 0.5) * stepY,
    }))
}

function remapTargetsSpatially(particles, targets) {
    const n = particles.length
    if (!n || !targets.length) return targets
    // Pair by current on-screen position so morph travel is short —
    // same sand sliding into the next silhouette, not a random shuffle.
    const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => {
        const ax = particles[a].x ?? particles[a].homeX
        const bx = particles[b].x ?? particles[b].homeX
        const dx = ax - bx
        if (Math.abs(dx) > 0.5) return dx
        const ay = particles[a].y ?? particles[a].homeY
        const by = particles[b].y ?? particles[b].homeY
        return ay - by
    })
    let sortedT = targets.slice().sort((a, b) => {
        const dx = a.homeX - b.homeX
        if (Math.abs(dx) > 0.5) return dx
        return a.homeY - b.homeY
    })
    if (sortedT.length > n) {
        // Surplus targets: pick evenly across the sorted list so density
        // thins uniformly instead of chopping off one side of the shape.
        const stride = sortedT.length / n
        const picked = new Array(n)
        for (let j = 0; j < n; j++)
            picked[j] = sortedT[Math.floor(j * stride)]
        sortedT = picked
    }
    while (sortedT.length < n) sortedT.push({ ...sortedT[sortedT.length - 1] })
    const out = new Array(n)
    for (let j = 0; j < n; j++) out[order[j]] = sortedT[j]
    return out
}

/**
 * Chladni transport: assign every particle to the nearest still-free target
 * through a balanced 2D tree. Subtree availability lets exact nearest-neighbor
 * queries stay fast as targets are consumed.
 */
function remapTargetsNearest(particles, targets) {
    if (!particles.length || !targets.length) return targets
    const buildTree = (items, depth = 0, parent = null) => {
        if (!items.length) return null
        const axis = depth % 2
        items.sort((a, b) =>
            axis === 0 ? a.homeX - b.homeX : a.homeY - b.homeY
        )
        const mid = items.length >> 1
        const node = {
            target: items[mid],
            axis,
            parent,
            left: null,
            right: null,
            used: false,
            available: 1,
        }
        node.left = buildTree(items.slice(0, mid), depth + 1, node)
        node.right = buildTree(items.slice(mid + 1), depth + 1, node)
        node.available +=
            (node.left?.available || 0) + (node.right?.available || 0)
        return node
    }
    const nearest = (node, x, y, best) => {
        if (!node || node.available <= 0) return best
        const dx = node.target.homeX - x
        const dy = node.target.homeY - y
        const distSq = dx * dx + dy * dy
        if (!node.used && distSq < best.distSq) {
            best = { node, distSq }
        }
        const delta =
            node.axis === 0 ? x - node.target.homeX : y - node.target.homeY
        const near = delta < 0 ? node.left : node.right
        const far = delta < 0 ? node.right : node.left
        best = nearest(near, x, y, best)
        if (delta * delta < best.distSq) best = nearest(far, x, y, best)
        return best
    }
    const root = buildTree(targets.slice())
    const out = new Array(particles.length)
    particles.forEach((particle, index) => {
        const x = particle.x ?? particle.homeX
        const y = particle.y ?? particle.homeY
        const match = nearest(root, x, y, { node: null, distSq: Infinity })
        if (!match.node) return
        match.node.used = true
        for (let node = match.node; node; node = node.parent) {
            node.available -= 1
        }
        out[index] = match.node.target
    })
    return out
}


// ── Basketball icon: exact contour supplied by design (Vector.svg) ─────────
// Single compound path tracing the outer ring + seam curves as filled bands.
// Particles fill the panels (outside this fill); the fill itself is the gap.
const BASKETBALL_SVG_W = 1322.98
const BASKETBALL_SVG_H = 1326.03
const BASKETBALL_SVG_PATH_D =
    "M1321.82 625.219C1321.64 622.194 1321.35 619.17 1321.12 616.088C1320.42 606.201 1319.55 596.372 1318.45 586.658C1318.1 583.867 1317.76 581.133 1317.41 578.4C1316.07 567.815 1314.45 557.345 1312.59 546.935C1312.3 545.248 1312.01 543.62 1311.72 541.933C1307.95 521.635 1303.31 501.687 1297.74 482.029C1297.68 481.738 1297.68 481.506 1297.62 481.215C1297.39 480.284 1297.04 479.47 1296.75 478.54C1288.57 450.217 1278.53 422.706 1266.81 396.069C1264.78 391.416 1262.69 386.821 1260.54 382.227C1256.83 374.375 1252.94 366.581 1249 358.905C1248.88 358.73 1248.82 358.498 1248.71 358.323C1248.59 358.149 1248.53 357.916 1248.42 357.741C1243.31 347.796 1237.85 338.084 1232.28 328.488C1229.96 324.533 1227.64 320.52 1225.26 316.623C1220.33 308.597 1215.28 300.688 1210.06 292.893C1209.83 292.544 1209.6 292.253 1209.37 291.904C1172.52 237.176 1127.84 188.613 1077.01 147.494C1075.85 146.505 1074.63 145.575 1073.41 144.644C1063.95 137.084 1054.38 129.814 1044.51 122.775C1044.11 122.485 1043.7 122.136 1043.24 121.845C1043.12 121.787 1043.01 121.787 1042.95 121.729C1030.7 113.063 1018.23 104.804 1005.41 97.0101C1003.43 95.7887 1001.4 94.6255 999.371 93.4623C986.663 85.9016 973.665 78.748 960.436 72.0015C954.633 69.0353 948.772 66.0692 942.854 63.2775C937.109 60.6021 931.365 57.9849 925.562 55.426C915.465 51.0058 905.195 46.8184 894.808 42.8635C892.661 42.0493 890.572 41.1187 888.425 40.3626C874.963 35.419 861.212 31.057 847.344 26.9858C844.848 26.2298 842.295 25.5318 839.8 24.8339C810.207 16.5172 779.801 10.2358 748.7 6.10669C748.468 5.93222 748.236 5.87405 747.946 5.81589H747.714C719.456 2.09367 690.733 0 661.488 0C296.734 0 0 297.435 0 663.017C0 1028.6 296.749 1326.03 661.488 1326.03C1026.23 1326.03 1322.98 1028.6 1322.98 663.017C1322.98 650.338 1322.51 637.724 1321.82 625.219ZM820.774 67.5853C822.34 67.9925 823.907 68.5159 825.474 68.923C835.338 71.6565 845.028 74.6226 854.66 77.8215C858.316 79.0429 861.971 80.2642 865.569 81.5437C872.996 84.1609 880.307 87.0108 887.619 89.8605C909.204 98.4681 930.268 108.181 950.635 119.056L956.205 122.022C961.834 125.105 967.346 128.362 972.859 131.619C931.428 143.192 889.825 157.15 848.336 173.203C823.095 136.737 801.045 98.4685 782.825 58.6288C795.59 61.246 808.239 64.2703 820.774 67.5853ZM1024.68 165.876C1025.9 166.748 1027.12 167.562 1028.28 168.435C1032.75 171.75 1037.04 175.298 1041.45 178.729C1049.58 185.127 1057.52 191.757 1065.3 198.561C1069.13 201.876 1072.96 205.191 1076.73 208.623C1080.97 212.52 1085.15 216.591 1089.26 220.604C1093.15 224.384 1096.98 228.165 1100.75 232.061C1104.47 235.9 1108.18 239.796 1111.84 243.693C1116.19 248.346 1120.42 253.115 1124.54 257.942C1127.45 261.257 1130.35 264.514 1133.13 267.888C1139.75 275.856 1146.25 283.939 1152.46 292.198C1152.69 292.489 1152.92 292.838 1153.21 293.129C1160.35 302.667 1167.19 312.38 1173.69 322.266C1173.81 322.441 1173.92 322.673 1174.04 322.848C1180.37 332.444 1186.46 342.215 1192.26 352.161C1192.61 352.743 1192.96 353.324 1193.25 353.906C1210.89 384.382 1225.92 416.311 1238.16 449.347C1238.27 449.638 1238.39 449.928 1238.51 450.219C1239.26 452.197 1239.84 454.29 1240.54 456.268C1103.19 421.721 973.394 334.713 876.661 212.001C926.156 193.506 975.594 177.799 1024.68 165.876ZM728.928 50.3127C749.121 99.3418 774.42 146.45 804.361 190.943C741.868 217.522 679.78 248.869 618.798 284.987C558.162 214.497 493.057 150.755 424.129 94.3347C497.242 63.5683 577.428 46.528 661.505 46.528C684.309 46.528 706.762 47.87 728.928 50.3127ZM377.529 116.44C448.958 173.03 516.267 237.761 578.823 309.758C545.864 330.52 513.137 352.215 481.108 375.595C443.449 403.105 407.183 432.01 372.426 462.078C313.705 393.682 244.653 336.511 169.157 293.879C224.338 220.19 295.602 159.421 377.529 116.44ZM142.812 332.389C215.228 372.693 281.493 427.363 337.778 492.965C227.587 593.64 134.746 705.713 66.9203 820.521C53.5744 770.213 46.4374 717.462 46.4374 663.026C46.4374 541.414 81.8848 428.005 142.812 332.389ZM86.1792 880.717C152.444 757.883 249.401 636.971 366.96 529.205C369.861 533.043 372.936 536.708 375.78 540.662C539.12 765.395 560.362 1047.52 430.614 1234.28C272.383 1169.78 146.818 1041.18 86.1666 880.725L86.1792 880.717ZM475.591 1250.68C608.819 1047.87 585.259 749.918 413.272 513.274C409.558 508.156 405.554 503.27 401.667 498.269C435.786 468.723 471.413 440.284 508.434 413.24C541.393 389.161 575.105 366.886 609.05 345.658C629.706 370.841 649.842 396.664 669.338 423.476C856.639 681.188 958.081 974.305 942.87 1210.96C858.5 1254.64 762.877 1279.53 661.51 1279.53C596.753 1279.53 534.319 1269.35 475.591 1250.68ZM990.747 1183.33C996.549 941.845 892.451 651.347 706.891 396.018C688.207 370.311 668.826 345.478 649.098 321.225C709.155 286.038 770.255 255.214 831.705 229.624C941.78 374.267 1094.85 474.472 1256.22 507.391C1260.05 522.106 1263.53 536.937 1266.31 551.942C1266.6 553.57 1266.9 555.141 1267.19 556.769C1268.87 566.249 1270.26 575.845 1271.48 585.384C1271.77 587.885 1272.12 590.386 1272.41 592.887C1273.45 601.901 1274.21 610.916 1274.84 619.989C1275.02 622.722 1275.31 625.456 1275.48 628.189C1276.18 639.821 1276.59 651.395 1276.59 663.026C1276.59 881.595 1162.38 1073.88 990.747 1183.33Z"

let _basketballPath2D
function getBasketballPath2D() {
    if (_basketballPath2D === undefined) {
        _basketballPath2D =
            typeof Path2D !== "undefined"
                ? new Path2D(BASKETBALL_SVG_PATH_D)
                : null
    }
    return _basketballPath2D
}

let _basketballHitCtx
function getBasketballHitCtx() {
    if (!_basketballHitCtx && typeof document !== "undefined") {
        const c = document.createElement("canvas")
        c.width = 1
        c.height = 1
        _basketballHitCtx = c.getContext("2d")
    }
    return _basketballHitCtx
}

/** True when (localX, localY) — in the SVG's own 1323×1327 space — falls on
 *  the supplied ring/seam artwork (i.e. should stay a gap, not a particle). */
function isOnBasketballArtwork(localX, localY) {
    const path = getBasketballPath2D()
    const ctx = getBasketballHitCtx()
    if (!path || !ctx) return false
    return ctx.isPointInPath(path, localX, localY, "nonzero")
}

function getBasketballLayout(box) {
    const size = Math.min(box.w * 1.08, box.h * 1.48)
    const cx = box.x + box.w * 0.5
    const cy = box.y + box.h * 0.6
    const r = size * 0.49
    // Scale so the SVG's own diameter (its width) maps to our ball diameter.
    const scale = (r * 2) / BASKETBALL_SVG_W
    return { size, cx, cy, r, scale }
}

/**
 * Ball homes live on the very same global lattice as the logo sampling:
 * columns/rows at integer multiples of `cell`, starting from 0 — so the
 * assembled ball reads with identical pixel rhythm as the pixel wordmark.
 */
function buildDenseBasketballLattice(box, cell) {
    const { cx, cy, r, scale } = getBasketballLayout(box)
    const step = Math.max(2, Math.round(cell))
    const pts = []
    const x0 = Math.floor((cx - r) / step) * step
    const y0 = Math.floor((cy - r) / step) * step
    const x1 = Math.ceil(cx + r)
    const y1 = Math.ceil(cy + r)
    const svgCx = BASKETBALL_SVG_W / 2
    const svgCy = BASKETBALL_SVG_H / 2
    for (let y = y0; y <= y1; y += step) {
        for (let x = x0; x <= x1; x += step) {
            const localX = (x - cx) / scale + svgCx
            const localY = (y - cy) / scale + svgCy
            // Particles trace the artwork itself (ring + seam strokes) —
            // panels stay empty, exactly like the dotted reference mark.
            if (!isOnBasketballArtwork(localX, localY)) continue
            pts.push({
                homeX: x,
                homeY: y,
                r: 0,
                g: 158,
                b: 227,
                a: 255,
            })
        }
    }
    return { points: pts, cx, cy, r, cell: step }
}

function drawDenseBasketballPattern(oc, W, H, stage, step = 4) {
    const box = stage || getPatternStageRect(W, H)
    const { points, cell } = buildDenseBasketballLattice(box, step)
    const stamp = Math.max(2, Math.round(cell * 0.5))
    oc.save()
    oc.fillStyle = "#009ee3"
    for (const p of points) {
        oc.fillRect(p.homeX - stamp * 0.5, p.homeY - stamp * 0.5, stamp, stamp)
    }
    oc.restore()
}

const SPORT_PATTERNS = [
    {
        id: "basketball-icon",
        label: "Basketball icon",
        draw: drawDenseBasketballPattern,
    },
]

function sampleSportPoints(W, H, gap, count, sportIndex, stage = null) {
    const box = stage || getPatternStageRect(W, H)
    const sport =
        SPORT_PATTERNS[
            ((sportIndex % SPORT_PATTERNS.length) + SPORT_PATTERNS.length) %
                SPORT_PATTERNS.length
        ]
    const maskZones = getHeroCopyMaskZones(W, H)

    let pts
    if (sport.id === "basketball-icon") {
        // Same pixel pitch as the logo sampling: the ball lives on the very
        // same global lattice (cell = logo gap, phase-aligned to multiples
        // of it), so the assembled ball reads exactly as dense as the mark.
        const cell = Math.max(2, Math.round(gap))
        const lattice = buildDenseBasketballLattice(box, cell)
        const visible = lattice.points.filter(
            (p) => heroCopyVisibility(p.homeX, p.homeY, maskZones) > 0.12
        )
        pts = visible.map((p) => ({ ...p }))
        // Fewer artwork points than particles: leftovers stack exactly on
        // existing homes — invisible, density stays identical to the mark.
        while (pts.length < count && visible.length) {
            pts.push({ ...visible[pts.length % visible.length] })
        }
        // More artwork points than particles: keep ALL points — the morph
        // spawns extra (fade-in) particles to cover the difference, so the
        // strokes never get thinned below the logo's pixel pitch.
    } else {
        const scanGap = Math.max(4, Math.round(gap))
        const raw = samplePixelsFromCanvas(W, H, scanGap, (oc) => {
            sport.draw(oc, W, H, box, scanGap)
        }).filter((p) => heroCopyVisibility(p.homeX, p.homeY, maskZones) > 0.12)
        pts = fitPointCount(raw, count, W, H)
    }

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

const PARTICLE_BRAND = { r: 0, g: 158, b: 227, a: 255 } // #009ee3 — same as pattern
const PARTICLE_INK = { r: 243, g: 244, b: 245, a: 255 } // --ink
/** Hero story: Stability + flexibility pre-assembled → meets → Chladni figures. */
const PATTERN_STORY_STAGES = [
    "stability",
    "flexibility",
    "meets",
    "chladni",
]
const SLOGAN_REVEAL = {
    stability: ["stability"],
    flexibility: ["stability", "flexibility"],
    meets: ["stability", "flexibility", "meets"],
}
/** Word unlocked on each progressive step (previous words stay locked). */
const SLOGAN_STEP_WORD = {
    stability: "stability",
    flexibility: "flexibility",
    meets: "meets",
}

function particleColorFromAttr(el) {
    const c = el?.getAttribute?.("data-particle-color")
    if (c === "live") return { ...PARTICLE_BRAND }
    return { ...PARTICLE_INK }
}

/**
 * Sample hero slogan words for shot 1 or 2 from invisible DOM anchors.
 * Each point is tagged with `word`: stability | meets | flexibility.
 * Meets is always brand blue.
 */
function sampleHeroSloganWords(W, H, cell, shot) {
    if (typeof document === "undefined") return { points: [], rect: null }
    const stack = document.querySelector(".hero-stack")
    if (!stack) return { points: [], rect: null }
    const sr = stack.getBoundingClientRect()
    if (sr.width < 1 || sr.height < 1) return { points: [], rect: null }
    const sx = W / sr.width
    const sy = H / sr.height
    const words = Array.from(
        stack.querySelectorAll(".hero-slogan-word[data-particle-shot]")
    ).filter((el) => {
        const s = el.getAttribute("data-particle-shot")
        return s === "both" || s === String(shot)
    })
    if (!words.length) return { points: [], rect: null }

    const step = Math.max(2, Math.round(cell))
    const off = document.createElement("canvas")
    off.width = Math.max(1, W)
    off.height = Math.max(1, H)
    const oc = off.getContext("2d", { willReadFrequently: true })
    if (!oc) return { points: [], rect: null }
    oc.textAlign = "center"
    oc.textBaseline = "middle"

    const wordRole = (el) => {
        if (el.classList.contains("hero-slogan-word--stability"))
            return "stability"
        if (el.classList.contains("hero-slogan-word--flexibility"))
            return "flexibility"
        return "meets"
    }

    const pts = []
    for (const el of words) {
        const cr = el.getBoundingClientRect()
        const text = (el.textContent || "").trim()
        if (!text || cr.width < 2 || cr.height < 2) continue
        const role = wordRole(el)
        const cs = getComputedStyle(el)
        const fontPx = parseFloat(cs.fontSize) * sx
        if (!(fontPx > 1)) continue
        const color =
            role === "meets" ? { ...PARTICLE_BRAND } : particleColorFromAttr(el)
        oc.clearRect(0, 0, W, H)
        oc.fillStyle = `rgb(${color.r},${color.g},${color.b})`
        oc.font = `${cs.fontStyle} ${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`
        const ls = parseFloat(cs.letterSpacing)
        if (Number.isFinite(ls) && "letterSpacing" in oc) {
            oc.letterSpacing = `${ls * sx}px`
        }
        const cx = (cr.left + cr.width / 2 - sr.left) * sx
        const cy = (cr.top + cr.height / 2 - sr.top) * sy
        oc.fillText(text, cx, cy)

        let px
        try {
            px = oc.getImageData(0, 0, off.width, off.height).data
        } catch {
            continue
        }
        for (let y = 0; y < H; y += step) {
            for (let x = 0; x < W; x += step) {
                const i = (y * W + x) * 4
                if (px[i + 3] < 28) continue
                pts.push({
                    homeX: x,
                    homeY: y,
                    r: color.r,
                    g: color.g,
                    b: color.b,
                    a: 255,
                    word: role,
                })
            }
        }
    }
    return { points: pts, rect: boundsOfPoints(pts) }
}

function buildHeroSloganLattice(W, H, cell) {
    return sampleHeroSloganWords(W, H, cell, 1)
}

/** Chladni plate modes (m, n) cycled by the hero story. */
const CHLADNI_MODES = [
    [2, 5],
    [3, 5],
    [4, 7],
    [1, 3],
    [3, 4],
]
/** Hold time on a settled, static figure before the next morph. */
const CHLADNI_HOLD_MS = 3000
/** Initial assembly tween from the seeded field lattice. */
const CHLADNI_ASSEMBLE_MS = 1500
/** Kaleidoscope phase: m/n drift while sand follows the deforming field. */
const CHLADNI_FLOW_MS = 2600
/** Final micro-settle from the flowed positions into unique lattice cells. */
const CHLADNI_SETTLE_MS = 500

/**
 * Build a deterministic Chladni figure on the same unique pixel lattice as
 * the slogan words. Every returned point occupies its own cell; selecting the
 * cells nearest z=0 produces the nodal lines without particle stacking.
 */
function sampleChladniLattice(W, H, gap, m, n, count, zones) {
    const step = Math.max(3, Math.round(gap))
    const candidates = []
    for (let y = 0; y < H; y += step) {
        const ny = (y - H / 2) / (W / 2.26)
        const py = Math.PI * ny
        for (let x = 0; x < W; x += step) {
            const visibility = heroCopyVisibility(x, y, zones)
            if (visibility <= 0.12) continue
            const nx = (x - W / 2) / (W / 2.26)
            const px = Math.PI * nx
            const z =
                Math.cos(m * px) * Math.cos(n * py) -
                Math.cos(n * px) * Math.cos(m * py)
            candidates.push({
                homeX: x,
                homeY: y,
                score: Math.abs(z) + (1 - visibility) * 0.4,
                ...PARTICLE_BRAND,
                word: "chladni",
            })
        }
    }
    candidates.sort((a, b) => a.score - b.score)
    const targetCount =
        count ||
        Math.max(
            2400,
            Math.min(W < 700 ? 3600 : 6500, Math.round((W * H) / 180))
        )
    return candidates.slice(0, Math.min(targetCount, candidates.length))
}

/**
 * Large centered odds (“2.01”) on the same gap lattice as pattern/ball/logo.
 * Full pattern-stage with edge margins — does not reuse bottom-right metric layout.
 */
function sampleOddsBanner(W, H, gap, count, text = "2.01") {
    const box = getPatternStageRect(W, H)
    const padX = box.w * 0.08
    const padY = box.h * 0.1
    const inner = {
        x: box.x + padX,
        y: box.y + padY,
        w: Math.max(40, box.w - padX * 2),
        h: Math.max(40, box.h - padY * 2),
    }
    const cell = Math.max(2, Math.round(gap))
    const probe = document.createElement("canvas").getContext("2d")
    let size = Math.round(inner.h * 0.88)
    let font = `800 ${size}px Arial Black, Helvetica Neue, Arial, sans-serif`
    probe.font = font
    let tw = probe.measureText(text).width
    if (tw > inner.w) {
        size = Math.max(24, Math.floor(size * (inner.w / Math.max(1, tw))))
        font = `800 ${size}px Arial Black, Helvetica Neue, Arial, sans-serif`
        probe.font = font
        tw = probe.measureText(text).width
    }
    const cx = inner.x + inner.w / 2
    const cy = inner.y + inner.h / 2
    const maskZones = getHeroCopyMaskZones(W, H)
    const raw = samplePixelsFromCanvas(W, H, cell, (oc) => {
        oc.fillStyle = "#009ee3"
        oc.font = font
        oc.textAlign = "center"
        oc.textBaseline = "middle"
        oc.fillText(text, cx, cy)
    })
        .filter((p) => heroCopyVisibility(p.homeX, p.homeY, maskZones) > 0.12)
        .map((p) => ({
            homeX: p.homeX,
            homeY: p.homeY,
            ...PARTICLE_BRAND,
        }))
    const pts = raw.map((p) => ({ ...p }))
    while (pts.length < count && raw.length) {
        pts.push({ ...raw[pts.length % raw.length] })
    }
    return {
        points: pts,
        rect: boundsOfPoints(pts) || {
            x: inner.x,
            y: inner.y,
            w: inner.w,
            h: inner.h,
        },
        stage: box,
    }
}

/**
 * Altenar wordmark on the same gap lattice — placement matches initLogoShot
 * (DOM .hero-wordmark-image when available, else fit+scale on shape stage).
 */
function sampleAltenarLogoLattice(W, H, gap, img, count, scale = 6) {
    const stage = getShapeStageRect(W, H)
    let rect = null
    let clipRect = null
    const stack = document.querySelector(".hero-stack")
    const wordmark = stack?.querySelector(".hero-wordmark")
    const renderedImage = stack?.querySelector(".hero-wordmark-image")
    const sr = stack?.getBoundingClientRect()
    const wr = wordmark?.getBoundingClientRect()
    const ir = renderedImage?.getBoundingClientRect()
    if (sr && wr && ir && sr.width > 0 && sr.height > 0) {
        const sx = W / sr.width
        const sy = H / sr.height
        rect = {
            x: (ir.left - sr.left) * sx,
            y: (ir.top - sr.top) * sy,
            w: ir.width * sx,
            h: ir.height * sy,
        }
        clipRect = {
            x: (wr.left - sr.left) * sx,
            y: (wr.top - sr.top) * sy,
            w: wr.width * sx,
            h: wr.height * sy,
        }
    }
    if (!rect) {
        const base = containRect(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            W,
            H
        )
        const f = Math.max(1, Math.min(20, scale)) / 10
        rect = anchorBottomRight(stage, base.w * f, base.h * f)
    }
    const cell = Math.max(2, Math.round(gap))
    const off = document.createElement("canvas")
    off.width = W
    off.height = H
    const oc = off.getContext("2d")
    if (clipRect) {
        oc.save()
        oc.beginPath()
        oc.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h)
        oc.clip()
    }
    oc.drawImage(img, rect.x, rect.y, rect.w, rect.h)
    if (clipRect) oc.restore()
    let px
    try {
        px = oc.getImageData(0, 0, W, H).data
    } catch {
        return { points: [], rect, stage }
    }
    const raw = []
    for (let y = 0; y < H; y += cell) {
        for (let x = 0; x < W; x += cell) {
            const i = (y * W + x) * 4
            const lum = px[i] + px[i + 1] + px[i + 2]
            if (px[i + 3] < 20 || lum < 40) continue
            raw.push({
                homeX: x,
                homeY: y,
                ...PARTICLE_BRAND,
            })
        }
    }
    const pts = raw.map((p) => ({ ...p }))
    while (pts.length < count && raw.length) {
        pts.push({ ...raw[pts.length % raw.length] })
    }
    return {
        points: pts,
        rect: boundsOfPoints(pts) || rect,
        stage,
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

/** Sparse ring of large pixels (Spur-like icon assemble target). */
function sampleCircleOutline(W, H, count, color = { r: 0, g: 158, b: 227, a: 255 }) {
    const n = Math.max(8, Math.min(48, count | 0))
    const stage = getShapeStageRect(W, H)
    const cx = stage.x + stage.w * 0.5
    const cy = stage.y + stage.h * 0.5
    const r = Math.min(stage.w, stage.h) * 0.22
    const pts = []
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2
        pts.push({
            homeX: cx + Math.cos(a) * r,
            homeY: cy + Math.sin(a) * r,
            r: color.r,
            g: color.g,
            b: color.b,
            a: color.a ?? 255,
        })
    }
    return {
        points: pts,
        rect: {
            x: cx - r,
            y: cy - r,
            w: r * 2,
            h: r * 2,
        },
    }
}

/**
 * Pixel-art sun on the same gap lattice as Solutions icons:
 * filled circular core + 8 short rays (cardinal + diagonal).
 */
function sampleSunLattice(W, H, gap, count, color = { r: 0, g: 158, b: 227, a: 255 }) {
    const step = Math.max(2, Math.round(gap || 24))
    const stage = getShapeStageRect(W, H)
    const cx = Math.round((stage.x + stage.w * 0.5) / step) * step
    const cy = Math.round((stage.y + stage.h * 0.5) / step) * step
    const ink = {
        r: color.r,
        g: color.g,
        b: color.b,
        a: color.a ?? 255,
    }
    const cells = new Map()
    const add = (gx, gy) => {
        const key = `${gx},${gy}`
        if (cells.has(key)) return
        cells.set(key, {
            homeX: cx + gx * step,
            homeY: cy + gy * step,
            ...ink,
        })
    }

    // Core disk (radius ~2.2 cells → compact round body).
    for (let gy = -2; gy <= 2; gy++) {
        for (let gx = -2; gx <= 2; gx++) {
            if (gx * gx + gy * gy <= 5) add(gx, gy)
        }
    }

    // Eight rays: clear gap from the core (large particleSize overlaps nearby cells).
    const dirs = [
        [0, -1],
        [1, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
    ]
    for (const [dx, dy] of dirs) {
        add(dx * 5, dy * 5)
        add(dx * 6, dy * 6)
    }

    let pts = Array.from(cells.values())
    if (count && count > 0 && count < pts.length) {
        pts = fitPointCount(pts, count, W, H)
    }
    return {
        points: pts,
        rect: boundsOfPoints(pts),
    }
}

function isGeometricShapePreset(preset) {
    return preset === "circle" || preset === "sun"
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

/** Exact 10px particle-free rectangles around slogan words, lead, and CTAs. */
let _copyMaskCache = null

/**
 * Copy knockout for the hero: lead + CTAs clear particle sand.
 * Slogan words are drawn AS particles (invisible DOM anchors) — do not carve them.
 */
function getHeroCopyMaskZones(W, H) {
    if (typeof document === "undefined") return null
    const stack = document.querySelector(".hero-stack")
    if (!stack) return null
    const sr = stack.getBoundingClientRect()
    if (sr.width < 1 || sr.height < 1) return null
    const sx = W / sr.width
    const sy = H / sr.height

    const lead = stack.querySelector(".hero-lead")
    const ctas = Array.from(stack.querySelectorAll(".hero-cta a"))

    // Cheap layout signature — rebuild the raster only when it changes.
    const sig = [W, H]
    const pushSig = (r) =>
        sig.push(
            Math.round(r.left),
            Math.round(r.top),
            Math.round(r.width),
            Math.round(r.height)
        )
    if (lead) pushSig(lead.getBoundingClientRect())
    ctas.forEach((el) => pushSig(el.getBoundingClientRect()))
    const sigStr = sig.join("|")
    if (_copyMaskCache && _copyMaskCache.sig === sigStr) return _copyMaskCache

    const feather = Math.max(1, 2 * Math.max(sx, sy))
    const rects = []
    const addRect = (cr, pad) => {
        if (cr.width < 2 || cr.height < 2) return
        rects.push({
            left: (cr.left - sr.left) * sx - pad * sx,
            right: (cr.right - sr.left) * sx + pad * sx,
            top: (cr.top - sr.top) * sy - pad * sy,
            bottom: (cr.bottom - sr.top) * sy + pad * sy,
            feather,
        })
    }
    ctas.forEach((el) => addRect(el.getBoundingClientRect(), 4))
    if (lead) {
        const range = document.createRange()
        range.selectNodeContents(lead)
        Array.from(range.getClientRects()).forEach((cr) => addRect(cr, 3))
        range.detach?.()
    }

    _copyMaskCache = { sig: sigStr, rects, grid: null, gw: 0, gh: 0, step: 2 }
    return _copyMaskCache
}

/** 0 on the copy (glyphs/lines/buttons), 1 outside a short feather. */
function heroCopyVisibility(x, y, zones) {
    if (!zones) return 1
    if (zones.grid) {
        const gx = Math.floor(x / zones.step)
        const gy = Math.floor(y / zones.step)
        if (
            gx >= 0 &&
            gy >= 0 &&
            gx < zones.gw &&
            gy < zones.gh &&
            zones.grid[gy * zones.gw + gx]
        )
            return 0
    }
    let vis = 1
    for (const z of zones.rects) {
        const dx = Math.max(z.left - x, 0, x - z.right)
        const dy = Math.max(z.top - y, 0, y - z.bottom)
        const d = Math.hypot(dx, dy)
        const local = d <= 0 ? 0 : smoothstep01(0, z.feather, d)
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
 * Lattice pitch matches hero particleGap; ink via alpha (+ luma for light marks).
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
    const step = Math.max(1, Number(gap) || 1)

    const off = document.createElement('canvas')
    off.width = boxW
    off.height = boxH
    const oc = off.getContext('2d')
    oc.clearRect(0, 0, boxW, boxH)
    // Match on-page logo look: white silhouette on transparent.
    oc.filter = 'grayscale(1) brightness(0) invert(1)'
    oc.drawImage(img, dx, dy, dw, dh)
    oc.filter = 'none'
    let px
    try {
        px = oc.getImageData(0, 0, boxW, boxH).data
    } catch {
        return {
            points: [],
            rect: { x: 0, y: 0, w: boxW, h: boxH },
            stage: { x: 0, y: 0, w: boxW, h: boxH },
        }
    }

    const raw = []
    // Integer lattice indices keep pitch exact (avoids float drift from y += step).
    const i0 = Math.ceil(dx / step - 1e-9)
    const j0 = Math.ceil(dy / step - 1e-9)
    const i1 = Math.floor((dx + dw) / step + 1e-9)
    const j1 = Math.floor((dy + dh) / step + 1e-9)
    for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
            const x = i * step
            const y = j * step
            const ix = Math.min(boxW - 1, Math.max(0, Math.round(x)))
            const iy = Math.min(boxH - 1, Math.max(0, Math.round(y)))
            const idx = (iy * boxW + ix) * 4
            const a = px[idx + 3]
            const lum = px[idx] + px[idx + 1] + px[idx + 2]
            if (a < 24 || lum < 40) continue
            raw.push({
                homeX: x,
                homeY: y,
                r: 255,
                g: 255,
                b: 255,
                a: 255,
            })
        }
    }

    const fittedSrc =
        !count || count >= raw.length ? raw : fitPointCount(raw, count, boxW, boxH)
    const fitted = fittedSrc.map((p) => ({
        homeX: p.homeX,
        homeY: p.homeY,
        r: p.r,
        g: p.g,
        b: p.b,
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

function anchorCenter(stage, w, h) {
    const ww = Math.min(Math.max(1, w), stage.w)
    const hh = Math.min(Math.max(1, h), stage.h)
    return {
        x: stage.x + (stage.w - ww) / 2,
        y: stage.y + (stage.h - hh) / 2,
        w: ww,
        h: hh,
    }
}

/** Image draw/sample rect for fill/% mode — square when widthPct === heightPct. */
function resolveImageSampleRect(
    W,
    H,
    {
        mode = "fill",
        sizeUnit = "%",
        widthPx = 400,
        heightPx = 400,
        widthPct = 100,
        heightPct = 100,
        scale = 5,
        anchor = "center",
        naturalWidth = 1,
        naturalHeight = 1,
    } = {}
) {
    const stage = getShapeStageRect(W, H)
    const place = (w, h) =>
        anchor === "center"
            ? anchorCenter(stage, w, h)
            : anchorBottomRight(stage, w, h)
    if (mode === "fit") {
        const base = containRect(
            naturalWidth || 1,
            naturalHeight || 1,
            W,
            H
        )
        const f = Math.max(1, Math.min(20, scale)) / 10
        return place(base.w * f, base.h * f)
    }
    if (sizeUnit === "px") return place(widthPx, heightPx)
    if (Number(widthPct) === Number(heightPct)) {
        const side = (Math.min(stage.w, stage.h) * Number(widthPct)) / 100
        return place(side, side)
    }
    return place((W * widthPct) / 100, (H * heightPct) / 100)
}

function mapRectPoint(x, y, fromRect, toRect) {
    const u = fromRect.w ? (x - fromRect.x) / fromRect.w : 0.5
    const v = fromRect.h ? (y - fromRect.y) / fromRect.h : 0.5
    return {
        x: toRect.x + u * toRect.w,
        y: toRect.y + v * toRect.h,
    }
}

/**
 * Sample a pixel-art mask from its own lattice (not the viewport gap).
 * 400×400 / cell 16 → stable 25×25 topology at any display size.
 */
function sampleImageSourceLattice(img, cell = 16) {
    const nw = img.naturalWidth || img.width || 0
    const nh = img.naturalHeight || img.height || 0
    if (!nw || !nh) return { points: [], cols: 0, rows: 0, cell }
    const step = Math.max(1, Math.round(cell))
    const off = document.createElement("canvas")
    off.width = nw
    off.height = nh
    const oc = off.getContext("2d")
    oc.imageSmoothingEnabled = false
    if ("webkitImageSmoothingEnabled" in oc) {
        ;(oc as any).webkitImageSmoothingEnabled = false
    }
    oc.clearRect(0, 0, nw, nh)
    oc.drawImage(img, 0, 0)
    let px
    try {
        px = oc.getImageData(0, 0, nw, nh).data
    } catch {
        return { points: [], cols: 0, rows: 0, cell: step }
    }
    const points = []
    const cols = Math.floor(nw / step)
    const rows = Math.floor(nh / step)
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const sx = Math.min(nw - 1, Math.floor(col * step + step / 2))
            const sy = Math.min(nh - 1, Math.floor(row * step + step / 2))
            const i = (sy * nw + sx) * 4
            const lum = px[i] + px[i + 1] + px[i + 2]
            if (px[i + 3] < 20 || lum < 40) continue
            points.push({
                u: (col + 0.5) / cols,
                v: (row + 0.5) / rows,
                r: px[i],
                g: px[i + 1],
                b: px[i + 2],
                a: px[i + 3],
            })
        }
    }
    return { points, cols, rows, cell: step }
}

function unitsToRectPoints(units, rect) {
    return units.map((p) => ({
        homeX: rect.x + p.u * rect.w,
        homeY: rect.y + p.v * rect.h,
        r: p.r,
        g: p.g,
        b: p.b,
        a: p.a,
        u: p.u,
        v: p.v,
    }))
}

function clampToRect(x, y, rect, pad = 0) {
    return {
        x: Math.min(rect.x + rect.w - pad, Math.max(rect.x + pad, x)),
        y: Math.min(rect.y + rect.h - pad, Math.max(rect.y + pad, y)),
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
    initialLogoShot = false,
    initialPatternShot = false,
    /** Hero ARG–ENG 1986: match frame lattice (from image or programmatic). */
    initialMatchShot = false,
    matchFrame = 1,
    /** Optional reference board image for frame 1 (exact artist drawing). */
    matchFrameSrc = undefined,
    assembleAfterHoverMs = 0,
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
    /** Solutions icon: assemble when scrolled into view; N sweeps disassemble; mouse move reassembles. */
    assembleWhenVisible = false,
    disassembleAfterSweeps = 0,
    reassembleOnMove = false,
    gridScatter = false,
    /** Keep particle count/shape on resize — scale homes instead of re-sampling. */
    preserveShapeOnResize = false,
    /** Geometric assemble target instead of image sampling: "circle" | "sun". */
    shapePreset = undefined,
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
            logoImage: rawLogoImage,
            mode = "fill",
            sizeUnit = "%",
            widthPx = 400,
            heightPx = 400,
            widthPct = 100,
            heightPct = 100,
            scale = 5,
            anchor = "bottom-right",
            /** Source PNG cell size for fixed lattice (Solutions masks are 16). */
            latticeCell = 16,
        } = (imageConfig as any) || {}
        // Allow empty image for slogan-story hero (no pattern plate).
        const image =
            rawImage === undefined || rawImage === null
                ? DEFAULT_IMAGE
                : rawImage
        const logoImage = rawLogoImage || ""
        const imageAnchor = anchor === "center" ? "center" : "bottom-right"
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
    const hoverAccumMsRef = useRef(0)
    const lastHoverTsRef = useRef(0)
    const assembleTriggeredRef = useRef(false)
    const loopAfterHoverMovesRef = useRef(loopAfterHoverMoves)
    const assembleAfterMovesRef = useRef(assembleAfterMoves)
    const assembleAfterHoverMsRef = useRef(assembleAfterHoverMs)
    assembleAfterHoverMsRef.current = Math.max(0, assembleAfterHoverMs)
    const assembleWhenVisibleRef = useRef(assembleWhenVisible)
    const disassembleAfterSweepsRef = useRef(disassembleAfterSweeps)
    const reassembleOnMoveRef = useRef(reassembleOnMove)
    const gridScatterRef = useRef(gridScatter)
    const iconViewAssembledRef = useRef(false)
    const iconUserScatteredRef = useRef(false)
    const iconSweepAccRef = useRef(0)
    const iconSweepCountRef = useRef(0)
    assembleWhenVisibleRef.current = !!assembleWhenVisible
    disassembleAfterSweepsRef.current = Math.max(0, disassembleAfterSweeps)
    reassembleOnMoveRef.current = !!reassembleOnMove
    gridScatterRef.current = !!gridScatter
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
    shapeAfterMovesRef.current = Math.max(0, shapeAfterMoves)
    loopHoldRef.current = {
        assembled: loopHoldAssembledMs,
        scattered: loopHoldScatteredMs,
    }
    const fieldStoryActive = () =>
        loopStoryRef.current ||
        assembleAfterMovesRef.current > 0 ||
        assembleAfterHoverMsRef.current > 0 ||
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

    onShapeArrivedRef.current = () => {
        clearTimeout(morphStoryTimerRef.current)
        clearTimeout(chartPulseTimerRef.current)
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
        const isSloganStory = !!shapes.sloganStory

        let targets
        let rect
        const topUpExtras = (pts) => {
            if (pts.length <= particles.length) return
            const need = pts.length - particles.length
            for (let i = 0; i < need; i++) {
                // Spawn from an existing particle so extras feel like the
                // same sand splitting, not random pops across the field.
                const donor = particles[i % particles.length]
                const sx2 = donor.x
                const sy2 = donor.y
                const proto = {
                    homeX: sx2,
                    homeY: sy2,
                    ...PARTICLE_BRAND,
                    word: donor.word || "meets",
                }
                particles.push(mkParticle(proto, sx2, sy2, sx2, sy2, true))
            }
        }

        // Progressive slogan reveal: only the new word leaves the field lattice.
        // Already-formed words stay locked (no remesh).
        if (
            isSloganStory &&
            (key === "stability" || key === "flexibility" || key === "meets")
        ) {
            const revealed = SLOGAN_REVEAL[key] || []
            const stepWord = SLOGAN_STEP_WORD[key]
            const byWord = shapes.sloganByWord || {}
            const live = particles.filter((p) => !p.isPadding)
            const { durMs: _durProg } = getTransitionParams(
                (physicsRef.current as any).transition
            )
            const settleProg = Math.round(_durProg * 1.35)

            for (const word of ["stability", "flexibility", "meets"]) {
                const group = live.filter((p) => p.word === word)
                if (!group.length) continue
                if (word === stepWord) {
                    const wordTargets = byWord[word] || []
                    const mapped = remapTargetsSpatially(
                        group,
                        wordTargets.length
                            ? wordTargets
                            : group.map((p) => ({
                                  homeX: p.glyphHomeX ?? p.homeX,
                                  homeY: p.glyphHomeY ?? p.homeY,
                                  r: p.r,
                                  g: p.g,
                                  b: p.b,
                                  word,
                              }))
                    )
                    group.forEach((p, i) => {
                        const t = mapped[i]
                        p.startX = p.x
                        p.startY = p.y
                        p.homeTweenStart = 0
                        p.repX *= 0.2
                        p.repY *= 0.2
                        if (!t) return
                        p.homeX = t.homeX
                        p.homeY = t.homeY
                        if (t.r != null) {
                            p.r = t.r
                            p.g = t.g
                            p.b = t.b
                        }
                    })
                } else if (!revealed.includes(word)) {
                    group.forEach((p) => {
                        p.startX = p.x
                        p.startY = p.y
                        p.homeTweenStart = 0
                        p.repX *= 0.2
                        p.repY *= 0.2
                        p.homeX = p.idleX
                        p.homeY = p.idleY
                    })
                } else {
                    // Already assembled on a prior step — keep current homes.
                    group.forEach((p) => {
                        p.startX = p.x
                        p.startY = p.y
                        p.homeTweenStart = 0
                        p.repX *= 0.2
                        p.repY *= 0.2
                    })
                }
            }

            const revealedPts = revealed.flatMap((w) => byWord[w] || [])
            rect = revealedPts.length
                ? boundsOfPoints(revealedPts)
                : { x: 0, y: 0, w: W, h: H }
            shapes.rects = shapes.rects || {}
            shapes.rects[key] = rect
            shapes[key] = revealedPts
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
                // Meets settled → Chladni figures take over automatically.
                if (key === "meets" && shapes.sloganStory) {
                    const stageList = shapes.stages || PATTERN_STORY_STAGES
                    clearTimeout(loopTimerRef.current)
                    loopTimerRef.current = setTimeout(() => {
                        if (animStateRef.current !== "active") return
                        if (currentShapeRef.current === "chladni") return
                        shapes.storyIndex = Math.max(
                            shapes.storyIndex ?? -1,
                            stageList.indexOf("chladni")
                        )
                        morphToShapeRef.current?.("chladni")
                    }, 700)
                }
            }, settleProg)
            return
        }

        // Full-screen ordered lattice (opening field).
        if (isSloganStory && key === "field") {
            const live = particles.filter((p) => !p.isPadding)
            const movers = live
            const grid = regularGridPoints(movers.length, {
                x: 0,
                y: 0,
                w: W,
                h: H,
            })
            const { durMs: _durField } = getTransitionParams(
                (physicsRef.current as any).transition
            )
            const settleField = Math.round(_durField * 1.35)
            live.forEach((p) => {
                p.startX = p.x
                p.startY = p.y
                p.homeTweenStart = 0
                p.repX *= 0.2
                p.repY *= 0.2
            })
            movers.forEach((p, i) => {
                const g = grid[i]
                if (!g) return
                p.homeX = g.x
                p.homeY = g.y
                p.idleX = g.x
                p.idleY = g.y
            })
            rect = { x: 0, y: 0, w: W, h: H }
            shapes.field = movers.map((p) => ({
                homeX: p.homeX,
                homeY: p.homeY,
                r: p.r,
                g: p.g,
                b: p.b,
                word: p.word,
            }))
            shapes.rects = shapes.rects || {}
            shapes.rects.field = rect
            sceneRef.current.logoRect = rect
            currentShapeRef.current = "field"
            animStartTimeRef.current = Date.now()
            animStateRef.current = "assembling"
            setAssembledVis(false)
            animTimerRef.current = setTimeout(() => {
                if (animStateRef.current !== "assembling") return
                animStateRef.current = "active"
                setAssembledVis(true)
                onShapeArrivedRef.current?.("field")
            }, settleField)
            return
        }

        // Chladni figures: slogan words stay locked. Blue sand morphs between
        // unique cells on the same pixel lattice, then remains fully static.
        if (isSloganStory && key === "chladni") {
            const live = particles.filter((p) => !p.isPadding)
            let sand = live.filter((p) => p.word === "chladni")

            // Soft avoid zones: hero copy + slogan words.
            const step = Math.max(2, Math.round(gap))
            const feather = Math.max(step * 8, 44)
            const copyZones = getHeroCopyMaskZones(W, H)
            const byWord = shapes.sloganByWord || {}
            const wordRects = ["stability", "flexibility", "meets"]
                .map((w) =>
                    byWord[w]?.length ? boundsOfPoints(byWord[w]) : null
                )
                .filter(Boolean)
            shapes.chladniZones = {
                rects: (copyZones?.rects || [])
                    .map((z) => ({
                        ...z,
                        feather: Math.max(z.feather, feather),
                    }))
                    .concat(
                        wordRects.map((r) => ({
                            left: r.x - step * 2,
                            right: r.x + r.w + step * 2,
                            top: r.y - step * 2,
                            bottom: r.y + r.h + step * 2,
                            feather,
                        }))
                    ),
            }

            const [m0, n0] = CHLADNI_MODES[0]
            const firstTargets = sampleChladniLattice(
                W,
                H,
                gap,
                m0,
                n0,
                sand.length,
                shapes.chladniZones
            )
            if (!firstTargets.length) return
            if (!sand.length) {
                // Seed a unique, ordered field lattice. No two particles start
                // in the same cell and no random clusters appear while moving.
                const field = regularGridPoints(firstTargets.length, {
                    x: 0,
                    y: 0,
                    w: W,
                    h: H,
                })
                for (let i = 0; i < firstTargets.length; i++) {
                    const sx2 = field[i].x
                    const sy2 = field[i].y
                    const proto = {
                        homeX: sx2,
                        homeY: sy2,
                        ...PARTICLE_BRAND,
                        word: "chladni",
                    }
                    particles.push(
                        mkParticle(proto, sx2, sy2, sx2, sy2, true)
                    )
                }
                sand = particles.filter(
                    (p) => !p.isPadding && p.word === "chladni"
                )
            }
            const mapped = remapTargetsNearest(sand, firstTargets)
            const now = performance.now()
            sand.forEach((p, i) => {
                const target = mapped[i]
                if (!target) return
                p.chFromX = p.x
                p.chFromY = p.y
                p.chToX = target.homeX
                p.chToY = target.homeY
                p.chBrightness = 0.72 + ((p.colorIdx % 7) / 7) * 0.24
            })

            shapes.chladniIndex = 0
            shapes.chladniSim = {
                phase: "tween",
                m: m0,
                n: n0,
                targetM: m0,
                targetN: n0,
                tweenStart: now,
                tweenDuration: CHLADNI_ASSEMBLE_MS,
                spawnAt: now,
                lastFrame: now,
                flowStart: 0,
                flowSeq: 0,
                pendingTargets: null,
            }
            currentShapeRef.current = "chladni"
            animStateRef.current = "active"
            setAssembledVis(true)
            onShapeArrivedRef.current?.("chladni")

            // Hold the completed static lattice, then let the field itself
            // deform (kaleidoscope): m/n drift continuously and the sand
            // locally follows the moving nodal lines. Unique target cells
            // are only used for the final micro-settle.
            const scheduleNextMode = () => {
                clearTimeout(loopTimerRef.current)
                loopTimerRef.current = setTimeout(() => {
                    const s = shapesRef.current
                    const sim = s?.chladniSim
                    if (!sim || currentShapeRef.current !== "chladni") return
                    const idx =
                        ((s.chladniIndex ?? 0) + 1) % CHLADNI_MODES.length
                    s.chladniIndex = idx
                    const [tm, tn] = CHLADNI_MODES[idx]
                    const sandCount = sceneRef.current.particles.reduce(
                        (acc, p) =>
                            !p.isPadding && p.word === "chladni"
                                ? acc + 1
                                : acc,
                        0
                    )
                    sim.targetM = tm
                    sim.targetN = tn
                    // Pre-sample the final unique cells now (off the rAF
                    // hot path); the flow itself is target-free.
                    sim.pendingTargets = sampleChladniLattice(
                        W,
                        H,
                        gap,
                        tm,
                        tn,
                        sandCount,
                        s.chladniZones
                    )
                    sim.flowSeq = (sim.flowSeq || 0) + 1
                    sim.flowStart = performance.now()
                    sim.lastFrame = sim.flowStart
                    sim.phase = "flow"
                    scheduleNextMode()
                }, CHLADNI_HOLD_MS + CHLADNI_FLOW_MS + CHLADNI_SETTLE_MS)
            }
            scheduleNextMode()
            return
        }

        if (key === "sport" || key === "next") {
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
            // Top up with fade-in extras when the artwork holds more points
            // than we have particles — keeps stroke density at logo pitch.
            topUpExtras(targets)
        } else if (key === "odds") {
            const sampled = sampleOddsBanner(W, H, gap, n, "2.01")
            targets = sampled.points
            rect = sampled.rect
            shapes.odds = targets
            shapes.rects = shapes.rects || {}
            shapes.rects.odds = rect
            topUpExtras(targets)
        } else if (key === "brand" || key === "logo") {
            const logoImg = shapes.logoImg
            if (!logoImg) return
            const sampled = sampleAltenarLogoLattice(
                W,
                H,
                gap,
                logoImg,
                n,
                6
            )
            targets = sampled.points
            rect = sampled.rect
            shapes.logo = targets
            shapes.rects = shapes.rects || {}
            shapes.rects.logo = rect
            topUpExtras(targets)
            key = "logo"
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
    // ── Staged intro (initialLogoShot): one unified mechanic — three cursor
    // sweeps morph the particles into the next object:
    //   field (scattered clusters) → Altenar logo → basketball.
    const stageRef = useRef("field")
    const sweepAccRef = useRef(0)
    const sweepCountRef = useRef(0)
    const handleStagedSweeps = (mx, my, prev) => {
        if (flowLockedRef.current) return
        const stage = stageRef.current
        if (stage === "sport") {
            // Story finished: keep legacy behaviour (assemble on hover).
            const s = animStateRef.current
            if (
                (s === "idle" || s === "scattering") &&
                physicsRef.current.hover &&
                !loopStoryRef.current
            ) {
                startAnimRef.current?.("assembling")
            }
            return
        }
        if (!(prev && prev.x > -9000)) return
        const dist = Math.min(90, Math.hypot(mx - prev.x, my - prev.y))
        if (dist < 1.5) return
        const { W } = dimsRef.current

        if (stage === "field") {
            if (animStateRef.current !== "idle") return
            sweepAccRef.current += dist
            const sweepLen = Math.max(180, W * 0.38)
            if (sweepAccRef.current < sweepLen) return
            sweepAccRef.current = 0
            sweepCountRef.current += 1
            if (sweepCountRef.current < 3) return
            sweepCountRef.current = 0
            // Three sweeps done → particles assemble into the Altenar logo.
            stageRef.current = "logo"
            currentShapeRef.current = "logo"
            startAnimRef.current?.("assembling")
        } else if (stage === "logo") {
            if (animStateRef.current !== "active") return
            const lr = sceneRef.current.logoRect
            const pad = 40
            if (
                lr &&
                (mx < lr.x - pad ||
                    mx > lr.x + lr.w + pad ||
                    my < lr.y - pad ||
                    my > lr.y + lr.h + pad)
            )
                return
            sweepAccRef.current += dist
            const sweepLen = lr
                ? Math.max(140, lr.w * 0.7)
                : Math.max(180, W * 0.3)
            if (sweepAccRef.current < sweepLen) return
            sweepAccRef.current = 0
            sweepCountRef.current += 1
            if (sweepCountRef.current < 3) return
            sweepCountRef.current = 0
            // Three sweeps over the logo → morph into the basketball.
            stageRef.current = "sport"
            assembleTriggeredRef.current = true
            shapeMoveCountRef.current = 0
            morphToShapeRef.current?.("sport")
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
        const needMs = assembleAfterHoverMsRef.current
        const needMoves = assembleAfterMovesRef.current
        if (needMs <= 0 && needMoves <= 0) return
        const state = animStateRef.current
        if (state !== "idle" && state !== "scattering") return

        const now = performance.now()
        if (needMs > 0) {
            // Keep scattering sand under the cursor for a few seconds, then morph.
            if (!(prev && prev.x > -9000)) {
                lastHoverTsRef.current = now
                return
            }
            const dist = Math.hypot(mx - prev.x, my - prev.y)
            if (dist < 2) {
                lastHoverTsRef.current = now
                return
            }
            const dt = Math.min(64, Math.max(0, now - (lastHoverTsRef.current || now)))
            lastHoverTsRef.current = now
            hoverAccumMsRef.current += dt
            if (hoverAccumMsRef.current < needMs) return
        } else {
            if (prev && prev.x > -9000) {
                const ddx = mx - prev.x
                const ddy = my - prev.y
                if (Math.sqrt(ddx * ddx + ddy * ddy) < 28) return
            } else if (needMoves > 1) {
                return
            }
            hoverMoveCountRef.current += 1
            if (hoverMoveCountRef.current < needMoves) return
        }

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
        if (shapeAfterMovesRef.current <= 0) return
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
    /** Solutions icon cycle: 3 sweeps → scatter; mouse pass → reassemble. */
    const tryIconCycleFromHover = (mx, my, prev) => {
        if (flowLockedRef.current) return
        const needSweeps = disassembleAfterSweepsRef.current
        if (needSweeps <= 0 && !reassembleOnMoveRef.current) return
        if (!(prev && prev.x > -9000)) return
        const dist = Math.min(90, Math.hypot(mx - prev.x, my - prev.y))
        if (dist < 1.5) return

        const state = animStateRef.current

        // After user disassemble: any meaningful pass reassembles.
        if (
            reassembleOnMoveRef.current &&
            iconUserScatteredRef.current &&
            state === "idle"
        ) {
            if (dist < 6) return
            iconUserScatteredRef.current = false
            iconSweepAccRef.current = 0
            iconSweepCountRef.current = 0
            assembleTriggeredRef.current = true
            startAnimRef.current?.("assembling")
            return
        }

        if (needSweeps <= 0) return
        // Only a fully assembled icon reacts to sweeps — mid-assembly is calm.
        if (state !== "active") return
        if (!iconViewAssembledRef.current && !assembleTriggeredRef.current) return

        const { W } = dimsRef.current
        iconSweepAccRef.current += dist
        const sweepLen = Math.max(70, (W || 400) * 0.14)
        if (iconSweepAccRef.current < sweepLen) return
        iconSweepAccRef.current = 0
        iconSweepCountRef.current += 1
        if (iconSweepCountRef.current < needSweeps) return
        iconSweepCountRef.current = 0
        iconUserScatteredRef.current = true
        startAnimRef.current?.("scattering")
    }
    const tryAdvancePatternStory = (mx, my, prev) => {
        if (flowLockedRef.current) return
        if (!initialPatternShot) return
        const shapes = shapesRef.current
        if (!shapes?.patternStory || !shapes.sloganStory) return
        const stages = shapes.stages || PATTERN_STORY_STAGES
        // storyIndex -1 = field lattice; 0..len-1 = stages
        if ((shapes.storyIndex ?? -1) >= stages.length - 1) return
        if (animStateRef.current !== "active") return
        if (!(prev && prev.x > -9000)) return

        const dist = Math.min(90, Math.hypot(mx - prev.x, my - prev.y))
        if (dist < 1.5) return

        const { W } = dimsRef.current
        sweepAccRef.current += dist
        // Three short strokes across the hero (readable interaction, Spur-like).
        const sweepLen = Math.max(90, W * 0.12)
        if (sweepAccRef.current < sweepLen) return
        sweepAccRef.current = 0
        sweepCountRef.current += 1
        if (sweepCountRef.current < 3) return
        sweepCountRef.current = 0

        const nextIndex = (shapes.storyIndex ?? -1) + 1
        shapes.storyIndex = nextIndex
        const key = stages[nextIndex]
        currentShapeRef.current = key
        morphToShapeRef.current?.(key)
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
    /** First sampled icon side; draw size scales as currentSide / baseSide. */
    const iconLayoutRef = useRef({
        baseSide: 0,
        units: null,
        cols: 25,
    })
    const layoutScaleRef = useRef(1)
    const preserveShapeOnResizeRef = useRef(preserveShapeOnResize)
    preserveShapeOnResizeRef.current = !!preserveShapeOnResize
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
        anchor: imageAnchor,
        latticeCell,
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
            // Debug-only: force the shape story to a given key (e.g. "logo")
            // from the browser console, bypassing hover/timer triggers.
            forceShape(key = "logo") {
                const shapes = shapesRef.current
                if (shapes?.patternStory && Array.isArray(shapes.stages)) {
                    const idx = shapes.stages.indexOf(key)
                    if (idx >= 0) shapes.storyIndex = idx
                }
                morphToShapeRef.current?.(key)
            },
            advanceStory() {
                const shapes = shapesRef.current
                if (!shapes?.sloganStory) return null
                const stages = shapes.stages || PATTERN_STORY_STAGES
                if ((shapes.storyIndex ?? -1) >= stages.length - 1) return null
                if (animStateRef.current !== "active") return null
                const nextIndex = (shapes.storyIndex ?? -1) + 1
                shapes.storyIndex = nextIndex
                const key = stages[nextIndex]
                currentShapeRef.current = key
                sweepAccRef.current = 0
                sweepCountRef.current = 0
                morphToShapeRef.current?.(key)
                return key
            },
            hasLogoImg() {
                return !!shapesRef.current?.logoImg
            },
            storyStages() {
                return shapesRef.current?.stages?.slice() || null
            },
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
                // Snapshot BEFORE draining. Only particles actually visible
                // in the viewport frame join the flight — offscreen chunks
                // of the ball and invisible stacked duplicates just drain.
                const migrating = []
                const rect = canvasRef.current?.getBoundingClientRect()
                const { W, H } = dimsRef.current
                const sx = rect && W ? rect.width / W : 1
                const sy = rect && H ? rect.height / H : 1
                const vw = typeof window !== "undefined" ? window.innerWidth : 0
                const vh = typeof window !== "undefined" ? window.innerHeight : 0
                const seenHomes = new Set()
                live.forEach((p, i) => {
                    const drain = i >= keep
                    if (drain && rect) {
                        const clientX = rect.left + p.x * sx
                        const clientY = rect.top + p.y * sy
                        const margin = 24
                        const onScreen =
                            clientX >= -margin &&
                            clientX <= vw + margin &&
                            clientY >= -margin &&
                            clientY <= vh + margin
                        const homeKey =
                            `${Math.round(p.x)}|${Math.round(p.y)}`
                        if (onScreen && !seenHomes.has(homeKey)) {
                            seenHomes.add(homeKey)
                            migrating.push({
                                clientX,
                                clientY,
                                r: p.r,
                                g: p.g,
                                b: p.b,
                                a: p.a,
                                colorIdx: p.colorIdx,
                            })
                        }
                    }
                    p.flowDrained = drain
                })
                animStateRef.current = "idle"
                live.forEach((p) => {
                    if (p.flowDrained) return
                    p.idleX = p.x
                    p.idleY = p.y
                    p.driftPhase = Math.random() * Math.PI * 2
                    p.driftSpeed = 0.1 + Math.random() * 0.14
                    p.driftAmp = 0.8 + Math.random() * 1.2
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
                    p.driftSpeed = 0.12 + Math.random() * 0.15
                    p.driftAmp = 1.0 + Math.random() * 1.3
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
        // Ordered scatter: field-story sand settles on an even lattice with a
        // light jitter (calm, structured) instead of pure random positions.
        let scatterGrid = null
        let scatterJitter = 0
        let scatterIdx = 0
        if (
            newState === "scattering" &&
            ht === "hide" &&
            (fieldStoryActive() || gridScatterRef.current)
        ) {
            const fieldRect =
                sceneRef.current.fieldRect || { x: 0, y: 0, w: dw, h: dh }
            const liveCount = particles.reduce(
                (acc, p) => acc + (p.isPadding ? 0 : 1),
                0
            )
            if (liveCount > 0) {
                scatterGrid = regularGridPoints(liveCount, fieldRect)
                shuffle(scatterGrid)
                scatterJitter =
                    Math.sqrt(
                        (fieldRect.w * fieldRect.h) / Math.max(1, liveCount)
                    ) * 0.18
            }
        }
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
                if (fieldStoryActive() || gridScatterRef.current) {
                    const anchor = scatterGrid?.[scatterIdx++]
                    if (anchor) {
                        p.idleX =
                            anchor.x + (Math.random() - 0.5) * scatterJitter
                        p.idleY =
                            anchor.y + (Math.random() - 0.5) * scatterJitter
                    } else {
                        const [ox, oy] = randomInRect(fieldRect)
                        p.idleX = ox
                        p.idleY = oy
                    }
                    if (fieldStoryActive()) {
                        seedFieldDrift(p, fieldRect)
                    } else {
                        // Spur-like calm grid: pixels sit still on the lattice.
                        p.driftPhase = 0
                        p.driftSpeed = 0
                        p.driftAmp = 0
                    }
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
        if (!particles.length) return
        if (assembleWhenVisibleRef.current) {
            // If already on-screen when the icon finishes loading, assemble now.
            const el = containerRef.current
            if (!el || iconViewAssembledRef.current) return
            const rect = el.getBoundingClientRect()
            const vh = window.innerHeight || 1
            const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
            if (visible / Math.max(rect.height, 1) < 0.28) return
            autoAssembleTimerRef.current = setTimeout(() => {
                if (iconViewAssembledRef.current) return
                if (!sceneRef.current.particles.length) return
                iconViewAssembledRef.current = true
                assembleTriggeredRef.current = true
                iconUserScatteredRef.current = false
                iconSweepAccRef.current = 0
                iconSweepCountRef.current = 0
                startAnimRef.current?.("assembling")
            }, 120)
            return
        }
        if (!autoAssembleRef.current) return
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
        if (!W || !H) return
        const canvas = canvasRef.current
        if (!canvas) return
        // Non-slogan mounts still need an image URL (unless a geometric / match preset).
        if (
            !initialPatternShot &&
            !initialMatchShot &&
            !url &&
            !isGeometricShapePreset(shapePreset)
        )
            return
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
        hoverAccumMsRef.current = 0
        lastHoverTsRef.current = 0
        shapeMoveCountRef.current = 0
        iconViewAssembledRef.current = false
        iconUserScatteredRef.current = false
        iconSweepAccRef.current = 0
        iconSweepCountRef.current = 0
        currentShapeRef.current = "sport"
        chartPulseToggleRef.current = false
        funnelPulseToggleRef.current = false
        clearShapeTimers()
        shapesRef.current = null
        iconLayoutRef.current.baseSide = 0
        iconLayoutRef.current.units = null
        iconLayoutRef.current.cols = 25
        layoutScaleRef.current = 1
        sceneRef.current = {
            particles: [],
            logoRect: null,
            fieldRect: { x: 0, y: 0, w: W, h: H },
            sampleGap: gap,
            gridAlpha: 0,
            constrainToFrame: false,
        }

        // ARG–ENG 1986 match frame: image board (preferred) or programmatic lattice.
        if (initialMatchShot) {
            const mountFromPoints = (src, rect) => {
                if (!src.length) return
                const fieldRect = { x: 0, y: 0, w: W, h: H }
                const grid = regularGridPoints(src.length, fieldRect)
                shuffle(grid)
                const particles = src.map((p, index) => {
                    const anchor = grid[index] || { x: p.homeX, y: p.homeY }
                    const pt = mkParticle(
                        p,
                        anchor.x,
                        anchor.y,
                        anchor.x,
                        anchor.y
                    )
                    pt.driftPhase = 0
                    pt.driftSpeed = 0
                    pt.driftAmp = 0
                    return pt
                })
                animStateRef.current = "idle"
                sceneRef.current = {
                    particles,
                    logoRect: rect,
                    fieldRect,
                    sampleGap: gap,
                    gridAlpha: 0,
                }
                setAssembledVis(false)
                scheduleAutoAssemble(particles)
            }

            if (matchFrameSrc) {
                const img = new Image()
                img.decoding = "async"
                img.onload = () => {
                    const sw = img.naturalWidth || img.width
                    const sh = img.naturalHeight || img.height
                    const off = document.createElement("canvas")
                    off.width = sw
                    off.height = sh
                    const oc = off.getContext("2d")
                    if (!oc) return
                    oc.drawImage(img, 0, 0)
                    let px
                    try {
                        px = oc.getImageData(0, 0, sw, sh).data
                    } catch {
                        return
                    }
                    const sampled = sampleMatchImageData(px, sw, sh, W, H, gap)
                    mountFromPoints(sampled.points, sampled.rect)
                }
                img.onerror = () => {
                    const sampled = sampleMatchFrame(W, H, gap, matchFrame || 1)
                    mountFromPoints(sampled.points, sampled.rect)
                }
                img.src = matchFrameSrc
                return
            }

            const sampled = sampleMatchFrame(W, H, gap, matchFrame || 1)
            mountFromPoints(sampled.points, sampled.rect)
            return
        }

        // Spur-like solutions icon: few large pixels on a calm lattice → circle / sun.
        if (isGeometricShapePreset(shapePreset)) {
            const brand =
                particleColor === "single"
                    ? parseColor(singleColor)
                    : PARTICLE_BRAND
            const sampled =
                shapePreset === "sun"
                    ? sampleSunLattice(W, H, gap, count || 0, brand)
                    : sampleCircleOutline(
                          W,
                          H,
                          Math.max(8, Math.min(48, count || 18)),
                          brand
                      )
            const src = sampled.points
            const fieldRect = { x: 0, y: 0, w: W, h: H }
            const grid = regularGridPoints(src.length, fieldRect)
            shuffle(grid)
            const particles = src.map((p, index) => {
                const anchor = grid[index] || { x: p.homeX, y: p.homeY }
                const pt = mkParticle(
                    p,
                    anchor.x,
                    anchor.y,
                    anchor.x,
                    anchor.y
                )
                pt.driftPhase = 0
                pt.driftSpeed = 0
                pt.driftAmp = 0
                return pt
            })
            animStateRef.current = "idle"
            sceneRef.current = {
                particles,
                logoRect: sampled.rect,
                fieldRect,
                sampleGap: gap,
                gridAlpha: 0,
            }
            setAssembledVis(false)
            scheduleAutoAssemble(particles)
            return
        }

        // Hero slogan story: Stability + flexibility pre-assembled → meets → Chladni.
        if (initialPatternShot) {
            const applySloganShot = () => {
                _copyMaskCache = null
                const lattice = buildHeroSloganLattice(W, H, gap)
                let src = lattice.points
                if (!src.length) {
                    let tries = 0
                    const retry = () => {
                        tries += 1
                        const next = buildHeroSloganLattice(W, H, gap)
                        if (next.points.length) {
                            applySloganShot()
                            return
                        }
                        if (tries < 12) setTimeout(retry, 50)
                    }
                    setTimeout(retry, 50)
                    return
                }
                // Keep FULL glyph sampling — downsampling makes words unreadable.
                const sloganByWord = {
                    stability: src.filter((p) => p.word === "stability"),
                    flexibility: src.filter((p) => p.word === "flexibility"),
                    meets: src.filter((p) => p.word === "meets"),
                }
                // Even lattice across the full hero — shuffle so white/blue mix.
                const grid = regularGridPoints(src.length, {
                    x: 0,
                    y: 0,
                    w: W,
                    h: H,
                })
                shuffle(grid)
                const particles = src.map((p, i) => {
                    // Stability + flexibility start pre-assembled on their
                    // glyphs; only the "meets" sand lives on the field lattice.
                    const preAssembled =
                        p.word === "stability" || p.word === "flexibility"
                    const gx = preAssembled ? p.homeX : grid[i].x
                    const gy = preAssembled ? p.homeY : grid[i].y
                    const pt = mkParticle(
                        { ...p, homeX: gx, homeY: gy },
                        gx,
                        gy,
                        gx,
                        gy
                    )
                    pt.glyphHomeX = p.homeX
                    pt.glyphHomeY = p.homeY
                    pt.word = p.word
                    pt.driftPhase = 0
                    pt.driftSpeed = 0
                    pt.driftAmp = 0
                    return pt
                })
                animStateRef.current = "active"
                currentShapeRef.current = "field"
                hoverAccumMsRef.current = 0
                lastHoverTsRef.current = 0
                sweepAccRef.current = 0
                sweepCountRef.current = 0
                const patternStage = getPatternStageRect(W, H)
                shapesRef.current = {
                    patternStory: true,
                    sloganStory: true,
                    // Stability + flexibility are pre-assembled on load —
                    // sweeps continue the story from "meets".
                    storyIndex: 1,
                    stages: PATTERN_STORY_STAGES.slice(),
                    sampleGap: gap,
                    stage: patternStage,
                    sportIndex: 0,
                    slogan: src,
                    sloganByWord,
                    logoImg: null,
                    chladniIndex: 0,
                    rects: {
                        field: { x: 0, y: 0, w: W, h: H },
                        slogan: lattice.rect,
                    },
                }
                sceneRef.current = {
                    particles,
                    logoRect: { x: 0, y: 0, w: W, h: H },
                    fieldRect: { x: 0, y: 0, w: W, h: H },
                    sampleGap: gap,
                    gridAlpha: 0,
                }
                setAssembledVis(true)
            }
            // setTimeout — rAF can stall in background/automation tabs.
            setTimeout(applySloganShot, 0)
            return
        }

        const tryLoad = (cors) => {
            const img = new Image()
            if (cors) img.crossOrigin = "anonymous"
            img.onerror = () => cors && tryLoad(false)
            img.onload = () => {
                let rect
                let clipRect = null
                if (initialLogoShot) {
                    const stack = document.querySelector(".hero-stack")
                    const wordmark = stack?.querySelector(".hero-wordmark")
                    const renderedImage = stack?.querySelector(".hero-wordmark-image")
                    const sr = stack?.getBoundingClientRect()
                    const wr = wordmark?.getBoundingClientRect()
                    const ir = renderedImage?.getBoundingClientRect()
                    if (sr && wr && ir && sr.width > 0 && sr.height > 0) {
                        const sx = W / sr.width
                        const sy = H / sr.height
                        rect = {
                            x: (ir.left - sr.left) * sx,
                            y: (ir.top - sr.top) * sy,
                            w: ir.width * sx,
                            h: ir.height * sy,
                        }
                        clipRect = {
                            x: (wr.left - sr.left) * sx,
                            y: (wr.top - sr.top) * sy,
                            w: wr.width * sx,
                            h: wr.height * sy,
                        }
                    }
                }
                if (!rect) {
                    rect = resolveImageSampleRect(W, H, {
                        mode: md,
                        sizeUnit: sU,
                        widthPx: wPx,
                        heightPx: hPx,
                        widthPct: wPct,
                        heightPct: hPct,
                        scale: sc,
                        anchor: (samplingRef.current as any)?.anchor || "center",
                        naturalWidth: img.naturalWidth || img.width,
                        naturalHeight: img.naturalHeight || img.height,
                    })
                }
                const useFixedLattice = preserveShapeOnResizeRef.current
                let src = []
                let latticeCols = 0
                if (useFixedLattice) {
                    const cell =
                        Number((samplingRef.current as any)?.latticeCell) || 16
                    const lattice = sampleImageSourceLattice(img, cell)
                    latticeCols = lattice.cols || 25
                    src = unitsToRectPoints(lattice.points, rect)
                    iconLayoutRef.current.units = lattice.points
                    iconLayoutRef.current.cols = latticeCols
                } else {
                    const off = document.createElement("canvas")
                    off.width = W
                    off.height = H
                    const oc = off.getContext("2d")
                    if (clipRect) {
                        oc.save()
                        oc.beginPath()
                        oc.rect(clipRect.x, clipRect.y, clipRect.w, clipRect.h)
                        oc.clip()
                    }
                    oc.imageSmoothingEnabled = false
                    if ("webkitImageSmoothingEnabled" in oc) {
                        ;(oc as any).webkitImageSmoothingEnabled = false
                    }
                    oc.drawImage(img, rect.x, rect.y, rect.w, rect.h)
                    if (clipRect) oc.restore()
                    let px
                    try {
                        px = oc.getImageData(0, 0, W, H).data
                    } catch (_) {
                        return
                    }
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
                    particles = src.map((p) => {
                        const pt = mkParticle(
                            p,
                            p.homeX,
                            p.homeY,
                            p.homeX,
                            p.homeY
                        )
                        if (p.u != null) {
                            pt.u = p.u
                            pt.v = p.v
                        }
                        return pt
                    })
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
                } else if (fieldStoryActive() || gridScatterRef.current) {
                    // Solutions fixed-lattice icons: scatter only inside the icon frame.
                    const fieldRect = useFixedLattice
                        ? { x: rect.x, y: rect.y, w: rect.w, h: rect.h }
                        : { x: 0, y: 0, w: W, h: H }
                    if (fieldStoryActive() && initialLogoShot) {
                        // Opening shot: a few calm heaps of sand scattered
                        // around the screen (stage "field" of the intro).
                        const clusterN = 6
                        const margin = 0.12
                        const centers = Array.from(
                            { length: clusterN },
                            () => ({
                                x: (margin + Math.random() * (1 - margin * 2)) * W,
                                y: (margin + Math.random() * (1 - margin * 2)) * H,
                            })
                        )
                        const sigma = Math.min(W, H) * 0.075
                        particles = src.map((p) => {
                            const c =
                                centers[
                                    Math.floor(Math.random() * clusterN)
                                ]
                            const ang = Math.random() * Math.PI * 2
                            const rad = Math.min(
                                sigma * 2.6,
                                sigma *
                                    Math.sqrt(
                                        -2 *
                                            Math.log(
                                                1 - Math.random() * 0.999
                                            )
                                    )
                            )
                            const x = Math.min(
                                W - 8,
                                Math.max(8, c.x + Math.cos(ang) * rad)
                            )
                            const y = Math.min(
                                H - 8,
                                Math.max(8, c.y + Math.sin(ang) * rad)
                            )
                            const pt = mkParticle(p, x, y, x, y)
                            seedFieldDrift(pt, fieldRect)
                            return pt
                        })
                    } else {
                        const grid = regularGridPoints(src.length, fieldRect)
                        shuffle(grid)
                        particles = src.map((p, index) => {
                            const anchor = grid?.[index] || {
                                x: p.homeX,
                                y: p.homeY,
                            }
                            const pt = mkParticle(
                                p,
                                anchor.x,
                                anchor.y,
                                anchor.x,
                                anchor.y
                            )
                            if (p.u != null) {
                                pt.u = p.u
                                pt.v = p.v
                            }
                            pt.driftPhase = 0
                            pt.driftSpeed = 0
                            pt.driftAmp = 0
                            return pt
                        })
                    }
                    animStateRef.current = "idle"
                } else {
                    particles = src.map((p) => {
                        const [ox, oy] = hidePos(p.homeX, p.homeY)
                        const pt = mkParticle(p, ox, oy, ox, oy)
                        if (p.u != null) {
                            pt.u = p.u
                            pt.v = p.v
                        }
                        return pt
                    })
                    animStateRef.current = "idle"
                }
                const frameRect = useFixedLattice
                    ? { x: rect.x, y: rect.y, w: rect.w, h: rect.h }
                    : { x: 0, y: 0, w: W, h: H }
                const latticeGap = useFixedLattice
                    ? Math.max(2, rect.w / Math.max(1, latticeCols || 25))
                    : gap
                sceneRef.current = {
                    particles,
                    logoRect: rect,
                    fieldRect: frameRect,
                    sampleGap: latticeGap,
                    gridAlpha: 0,
                    constrainToFrame: useFixedLattice,
                }
                if (preserveShapeOnResizeRef.current && rect?.w) {
                    iconLayoutRef.current.baseSide = rect.w
                    layoutScaleRef.current = 1
                }
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
                    if (initialLogoShot) {
                        // Staged intro: homes stay on the logo silhouette so
                        // the first assemble builds the Altenar mark. Sport
                        // targets are stashed for the next stage's morph.
                        stageRef.current = "field"
                        sweepAccRef.current = 0
                        sweepCountRef.current = 0
                        currentShapeRef.current = "field"
                        shapesRef.current = {
                            sport: homePts,
                            sampleGap: gap,
                            stage: shapeStage,
                            sportIndex: sampled.sportIndex,
                            sportId: sampled.sportId,
                            sportLabel: sampled.sportLabel,
                            rects: { sport: sampled.rect },
                        }
                    } else {
                        // Legacy: never keep logo silhouette as assemble
                        // targets (flowLocked may already be true if IO raced).
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
                }
                scheduleAutoAssemble(particles)
            }
            img.src = url
        }
        tryLoad(true)
    }
    const initParticlesRef = useRef(initParticles)
    initParticlesRef.current = initParticles

    const scaleLayoutToSize = (W, H) => {
        const scene = sceneRef.current
        const oldRect = scene.logoRect
        const particles = scene.particles
        if (!oldRect?.w || !oldRect?.h || !particles?.length) return false
        const cfg = samplingRef.current as any
        const newRect = resolveImageSampleRect(W, H, {
            mode: cfg.mode,
            sizeUnit: cfg.sizeUnit,
            widthPx: cfg.widthPx,
            heightPx: cfg.heightPx,
            widthPct: cfg.widthPct,
            heightPct: cfg.heightPct,
            scale: cfg.scale,
            anchor: cfg.anchor || "center",
        })
        if (!newRect?.w || !newRect?.h) return false
        const canvas = canvasRef.current
        if (!canvas) return false
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
        dimsRef.current = { W, H }
        const units = iconLayoutRef.current.units
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i]
            let home
            // Prefer per-particle u/v (survives shuffle); fall back to units[i].
            if (p.u != null && p.v != null) {
                home = {
                    x: newRect.x + p.u * newRect.w,
                    y: newRect.y + p.v * newRect.h,
                }
            } else {
                const unit = units?.[i]
                if (unit && unit.u != null && unit.v != null) {
                    home = {
                        x: newRect.x + unit.u * newRect.w,
                        y: newRect.y + unit.v * newRect.h,
                    }
                } else {
                    home = mapRectPoint(p.homeX, p.homeY, oldRect, newRect)
                }
            }
            const cur = mapRectPoint(p.x, p.y, oldRect, newRect)
            const clampedCur = clampToRect(cur.x, cur.y, newRect, 1)
            p.homeX = home.x
            p.homeY = home.y
            p.x = clampedCur.x
            p.y = clampedCur.y
            if (p.idleX != null && p.idleY != null) {
                const idle = mapRectPoint(p.idleX, p.idleY, oldRect, newRect)
                const c = clampToRect(idle.x, idle.y, newRect, 1)
                p.idleX = c.x
                p.idleY = c.y
            }
            if (p.roamTargetX != null && p.roamTargetY != null) {
                const roam = mapRectPoint(
                    p.roamTargetX,
                    p.roamTargetY,
                    oldRect,
                    newRect
                )
                const c = clampToRect(roam.x, roam.y, newRect, 1)
                p.roamTargetX = c.x
                p.roamTargetY = c.y
            }
        }
        scene.logoRect = newRect
        scene.fieldRect = { x: newRect.x, y: newRect.y, w: newRect.w, h: newRect.h }
        scene.constrainToFrame = true
        const cols = iconLayoutRef.current.cols || 25
        scene.sampleGap = Math.max(2, newRect.w / cols)
        const base = iconLayoutRef.current.baseSide || newRect.w
        if (!iconLayoutRef.current.baseSide) {
            iconLayoutRef.current.baseSide = newRect.w
        }
        layoutScaleRef.current = newRect.w / base
        return true
    }

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const applySize = (W, H) => {
            if (!W || !H) return
            const prev = dimsRef.current
            if (
                prev.W === W &&
                prev.H === H &&
                sceneRef.current.particles.length > 0
            ) {
                return
            }
            const canScale =
                preserveShapeOnResizeRef.current &&
                prev.W > 0 &&
                prev.H > 0 &&
                sceneRef.current.particles.length > 0 &&
                sceneRef.current.logoRect
            if (canScale && scaleLayoutToSize(W, H)) return
            dimsRef.current = { W, H }
            initParticlesRef.current()
        }
        const ro = new ResizeObserver((entries) => {
            const r = entries[0]?.contentRect
            if (!r) return
            applySize(Math.round(r.width), Math.round(r.height))
        })
        ro.observe(el)
        // Immediate measure — ResizeObserver can miss the first layout in some mounts.
        applySize(Math.round(el.clientWidth), Math.round(el.clientHeight))
        return () => {
            ro.disconnect()
            clearTimeout(autoAssembleTimerRef.current)
            clearTimeout(loopTimerRef.current)
            clearTimeout(animTimerRef.current)
            clearShapeTimers()
        }
    }, [])
    useEffect(() => {
        initParticlesRef.current()
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
        assembleAfterHoverMs,
        assembleWhenVisible,
        disassembleAfterSweeps,
        reassembleOnMove,
        gridScatter,
        shapePreset,
        shapeStory,
        shapeAfterMoves,
        initialLogoShot,
        initialPatternShot,
        initialMatchShot,
        matchFrame,
        matchFrameSrc,
        logoImage,
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
            const constrainToFrame = !!sceneRef.current.constrainToFrame
            const cols = iconLayoutRef.current.cols || 25
            const cellPx =
                constrainToFrame && logoRect?.w
                    ? logoRect.w / cols
                    : null
            const layoutScale = Math.max(0.05, layoutScaleRef.current || 1)
            const ps = Math.max(
                1,
                Math.ceil(
                    cellPx != null
                        ? cellPx * 0.62 * dpr
                        : (pSz / 4) * dpr * layoutScale
                )
            )
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
            // Hero copy knockout is only valid inside the hero stack.
            // Other mounts (e.g. Solutions) must not inherit hero text zones.
            const copyMaskZones = containerRef.current?.closest(".hero-stack")
                ? getHeroCopyMaskZones(DW, DH)
                : null
            const logoCx = logoRect
                ? logoRect.x + logoRect.w / 2
                : DW / 2
            const logoCy = logoRect
                ? logoRect.y + logoRect.h / 2
                : DH / 2
            const logoSpan = logoRect
                ? Math.max(logoRect.w, logoRect.h) * 0.5
                : Math.max(DW, DH) * 0.35

            // Chladni sand, three phases:
            //  "flow"   — m/n drift continuously (kaleidoscope) and every
            //             grain follows the deforming field's gradient, so
            //             motion is always local, never a cross-screen jump;
            //  "tween"  — short settle from flowed positions into unique
            //             lattice cells (initial assembly uses this too);
            //  "static" — exact cells, zero per-frame motion.
            const chladniSim =
                currentShapeRef.current === "chladni"
                    ? shapesRef.current?.chladniSim
                    : null
            let chSpawnT = 1
            let chTweenT = 1
            let chPhase = "static"
            let chScale = 1
            let chXMax = 0
            let chYMax = 0
            let chForce = 0
            let chNoise = 0
            let chDamping = 1
            let chFrameScale = 1
            let chM = 0
            let chN = 0
            let chZones = null
            if (chladniSim) {
                const nowP = performance.now()
                chZones = shapesRef.current?.chladniZones || null
                chSpawnT = Math.min(
                    1,
                    (nowP - (chladniSim.spawnAt || nowP)) / 1200
                )
                chScale = DW / 2.26
                chXMax = DW / 2 / chScale
                chYMax = DH / 2 / chScale
                if (chladniSim.phase === "flow") {
                    chFrameScale = Math.min(
                        1.7,
                        (nowP - (chladniSim.lastFrame || nowP)) / 16.6667
                    )
                    const modeMorph = 1 - Math.exp(-0.035 * chFrameScale)
                    chladniSim.m +=
                        (chladniSim.targetM - chladniSim.m) * modeMorph
                    chladniSim.n +=
                        (chladniSim.targetN - chladniSim.n) * modeMorph
                    const age = (nowP - chladniSim.flowStart) / 1000
                    chDamping = Math.pow(0.9, chFrameScale)
                    chForce =
                        0.0013 * (1 - Math.exp(-age * 1.25)) * chFrameScale
                    chNoise =
                        (0.00013 + 0.00034 * Math.exp(-age * 0.7)) *
                        chFrameScale
                    if (nowP - chladniSim.flowStart >= CHLADNI_FLOW_MS) {
                        // Crystallize: sand already lies on the new nodal
                        // lines, so nearest-cell hops are a few pixels.
                        chladniSim.m = chladniSim.targetM
                        chladniSim.n = chladniSim.targetN
                        const sand = particles.filter(
                            (pp) => !pp.isPadding && pp.word === "chladni"
                        )
                        const targets = chladniSim.pendingTargets?.length
                            ? chladniSim.pendingTargets
                            : sampleChladniLattice(
                                  DW,
                                  DH,
                                  sceneRef.current.sampleGap || 5,
                                  chladniSim.targetM,
                                  chladniSim.targetN,
                                  sand.length,
                                  chZones
                              )
                        const mapped = remapTargetsNearest(sand, targets)
                        sand.forEach((pp, i) => {
                            const target = mapped[i]
                            if (!target) return
                            pp.chFromX = pp.x
                            pp.chFromY = pp.y
                            pp.chToX = target.homeX
                            pp.chToY = target.homeY
                        })
                        chladniSim.pendingTargets = null
                        chladniSim.tweenStart = nowP
                        chladniSim.tweenDuration = CHLADNI_SETTLE_MS
                        chladniSim.phase = "tween"
                    }
                }
                if (chladniSim.phase === "tween") {
                    const raw = Math.min(
                        1,
                        Math.max(
                            0,
                            (nowP - chladniSim.tweenStart) /
                                Math.max(1, chladniSim.tweenDuration)
                        )
                    )
                    chTweenT = raw * raw * (3 - 2 * raw)
                    if (raw >= 1) chladniSim.phase = "static"
                }
                chPhase = chladniSim.phase
                chM = chladniSim.m
                chN = chladniSim.n
                chladniSim.lastFrame = nowP
            }

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
                // Ordered Chladni sand: one particle per unique lattice cell.
                if (chladniSim && p.word === "chladni") {
                    if (chPhase === "flow") {
                        if (p.chFlowSeq !== chladniSim.flowSeq) {
                            p.chFlowSeq = chladniSim.flowSeq
                            p.chNX = (p.x - DW / 2) / chScale
                            p.chNY = (p.y - DH / 2) / chScale
                            p.chVX = 0
                            p.chVY = 0
                        }
                        let nx = p.chNX
                        let ny = p.chNY
                        let vx = p.chVX
                        let vy = p.chVY
                        const px2 = Math.PI * nx
                        const py2 = Math.PI * ny
                        const cosMX = Math.cos(chM * px2)
                        const cosNX = Math.cos(chN * px2)
                        const cosMY = Math.cos(chM * py2)
                        const cosNY = Math.cos(chN * py2)
                        const z = cosMX * cosNY - cosNX * cosMY
                        const dzdx =
                            Math.PI *
                            (-chM * Math.sin(chM * px2) * cosNY +
                                chN * Math.sin(chN * px2) * cosMY)
                        const dzdy =
                            Math.PI *
                            (-chN * cosMX * Math.sin(chN * py2) +
                                chM * cosNX * Math.sin(chM * py2))
                        const gx = -2 * z * dzdx
                        const gy = -2 * z * dzdy
                        const gmag = Math.hypot(gx, gy) || 1
                        const pull =
                            Math.min(1, gmag * 0.14) *
                            Math.min(1, Math.abs(z))
                        vx += (gx / gmag) * chForce * pull
                        vy += (gy / gmag) * chForce * pull
                        vx += (Math.random() - 0.5) * chNoise
                        vy += (Math.random() - 0.5) * chNoise
                        vx *= chDamping
                        vy *= chDamping
                        const spd = Math.hypot(vx, vy)
                        if (spd > 0.026) {
                            vx = (vx / spd) * 0.026
                            vy = (vy / spd) * 0.026
                        }
                        nx += vx * chFrameScale
                        ny += vy * chFrameScale
                        // Clamp instead of wrap: sand never teleports
                        // across the plate.
                        if (nx > chXMax) nx = chXMax
                        else if (nx < -chXMax) nx = -chXMax
                        if (ny > chYMax) ny = chYMax
                        else if (ny < -chYMax) ny = -chYMax
                        p.chNX = nx
                        p.chNY = ny
                        p.chVX = vx
                        p.chVY = vy
                        p.x = DW / 2 + nx * chScale
                        p.y = DH / 2 + ny * chScale
                    } else if (chPhase === "tween") {
                        p.x =
                            p.chFromX + (p.chToX - p.chFromX) * chTweenT
                        p.y =
                            p.chFromY + (p.chToY - p.chFromY) * chTweenT
                    } else {
                        // Exact assignment keeps the completed figure
                        // fully static with no sub-pixel drift.
                        p.x = p.chToX
                        p.y = p.chToY
                    }
                    const chVis = chZones
                        ? heroCopyVisibility(p.x, p.y, chZones)
                        : 1
                    const aCh = (p.chBrightness ?? 0.9) * chSpawnT * chVis
                    const daCh = Math.round(p.a * aCh)
                    if (daCh >= 1) {
                        drawParticle(
                            p.x * dpr,
                            p.y * dpr,
                            p.r,
                            p.g,
                            p.b,
                            daCh,
                            isCircle
                        )
                    }
                    continue
                }
                // Soft stagger: outer particles lag a bit so shape morph isn't a hard snap.
                const homeDist = Math.sqrt(
                    (p.homeX - logoCx) ** 2 + (p.homeY - logoCy) ** 2
                )
                const stagger =
                    initialLogoShot && state === "assembling"
                        ? 0
                        : state === "assembling" || state === "scattering"
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
                // Logo shot: sand scatters under the cursor for a few seconds before morph.
                const repulsionReady =
                    repOn &&
                    (!shapeStoryRef.current ||
                        assembleTriggeredRef.current ||
                        initialLogoShot)
                if (repulsionReady) {
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
                if (constrainToFrame && logoRect) {
                    const c = clampToRect(p.x, p.y, logoRect, half / dpr)
                    p.x = c.x
                    p.y = c.y
                    // Keep repulsion from parking outside the icon frame.
                    p.repX = p.x - baseX
                    p.repY = p.y - baseY
                }
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
                    if (
                        fieldStoryActive() ||
                        initialPatternShot ||
                        gridScatterRef.current
                    ) {
                        // Pattern story morphs keep every pixel visible so
                        // shapes feel like they reassemble from the same sand.
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
        if (initialLogoShot) {
            // Unified staged mechanic: three sweeps → next object.
            handleStagedSweeps(mx, my, prev)
            prevMouseRef.current = { x: mx, y: my }
            mouseRef.current = { x: mx, y: my, active: true }
            return
        }
        if (initialPatternShot) {
            tryAdvancePatternStory(mx, my, prev)
            prevMouseRef.current = { x: mx, y: my }
            mouseRef.current = { x: mx, y: my, active: true }
            return
        }
        tryAssembleFromHoverMoves(mx, my, prev)
        tryAdvanceShapeFromHover(mx, my, prev)
        tryIconCycleFromHover(mx, my, prev)
        tryUnlockLoopFromHover(mx, my, prev)
        prevMouseRef.current = { x: mx, y: my }
        mouseRef.current = { x: mx, y: my, active: true }
        // Icon cycle owns its assembly (viewport + sweep triggers).
        if (disassembleAfterSweepsRef.current > 0 || gridScatterRef.current)
            return
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
        // Staged intro: assembled objects persist when the cursor leaves —
        // only the finished (sport) stage keeps the legacy scatter-on-leave.
        if (initialLogoShot && stageRef.current !== "sport") return
        // Pattern story: keep assembled stages; repulsion only, no scatter.
        if (initialPatternShot && shapesRef.current?.patternStory) return
        // Icon cycle (Spur-like): stays assembled on leave; only sweeps scatter.
        if (disassembleAfterSweepsRef.current > 0 || gridScatterRef.current)
            return
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
        const stack = el.closest(".hero-stack") || el.closest(".solutions-visual") || el
        const move = (e) => onMouseMove(e)
        const leave = () => onMouseLeave()
        stack.addEventListener("mousemove", move)
        stack.addEventListener("mouseleave", leave)
        return () => {
            stack.removeEventListener("mousemove", move)
            stack.removeEventListener("mouseleave", leave)
        }
    }, [])
    useEffect(() => {
        if (!assembleWhenVisible) return
        const el = containerRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (entries) => {
                const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.28)
                if (!hit) return
                if (iconViewAssembledRef.current) return
                if (!sceneRef.current.particles?.length) return
                iconViewAssembledRef.current = true
                assembleTriggeredRef.current = true
                iconUserScatteredRef.current = false
                iconSweepAccRef.current = 0
                iconSweepCountRef.current = 0
                startAnimRef.current?.("assembling")
            },
            { threshold: [0, 0.28, 0.5, 0.75] }
        )
        io.observe(el)
        return () => io.disconnect()
    }, [assembleWhenVisible])
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
            {!image &&
                !initialPatternShot &&
                !initialMatchShot &&
                !isGeometricShapePreset(shapePreset) && (
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
    initialLogoShot: false,
    initialPatternShot: false,
    initialMatchShot: false,
    matchFrame: 1,
    matchFrameSrc: undefined,
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
    preserveShapeOnResize: false,
    flagWind: false,
    shapeStory: false,
    shapeAfterMoves: 4,
    particleGap: undefined,
}
