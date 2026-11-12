import data from './points.json';
import './fan-map.css';

// Fan map: the land mask of the Mappo globe, folded into a half-disc.
// Longitude becomes the angle of a ray, latitude its length (north outside),
// and every point is tied to one origin at the bottom centre.

type Dot = {
  lat: number; lon: number; name?: string;
  x: number; y: number;        // final position, CSS px
  depth: number;               // 0 low / far side → 1 high / front
  delay: number;               // intro order, 0..1
  phase: number;               // twinkle offset
  hot: number;                 // eased hover strength 0..1
  key?: string;                // selectable country
};

type Pulse = { dot: Dot; t: number; speed: number; inward: boolean };

export type FanMapOptions = {
  spread?: number;   // half-angle of the fan, degrees
  inner?: number;    // southern edge as a share of the radius
  hoverRadius?: number;
  // Selectable points (e.g. markets). Drawn brighter than the city dots;
  // clicking one calls onSelect with its key.
  countries?: { key: string; name: string; lat: number; lon: number }[];
  onSelect?: (key: string) => void;
  // 'countries': only the selectable points react: one ray at a time (the one
  // under the pointer), its name in a badge above the dot; the named city dots
  // are left out. Default 'all'.
  interactive?: 'all' | 'countries';
};

export type FanMap = (() => void) & { select: (key: string | null) => void };

const BRAND = ['#018DFF', '#00CDF1', '#4EFF83'];
const LAT_MIN = -56, LAT_MAX = 80;

export function mountFanMap(host: HTMLElement, options: FanMapOptions = {}): FanMap {
  const spread = (options.spread ?? 80) * Math.PI / 180;
  const inner = options.inner ?? .3;
  const hoverRadius = options.hoverRadius ?? 92;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onlyCountries = options.interactive === 'countries';

  host.classList.add('fan-map');
  const canvas = document.createElement('canvas');
  canvas.className = 'fan-map__canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Map of Altenar partner locations, drawn as rays from one origin.');
  const tip = document.createElement('div');
  tip.className = onlyCountries ? 'fan-map__tip fan-map__tip--badge' : 'fan-map__tip';
  tip.innerHTML = '<span class="fan-map__tip-name"></span><span class="fan-map__tip-coords"></span>';
  host.append(canvas, tip);
  const tipName = tip.firstElementChild as HTMLElement;
  const tipCoords = tip.lastElementChild as HTMLElement;
  const ctx = canvas.getContext('2d')!;

  const dots: Dot[] = [
    ...(data.land as [number, number][]).map(([lat, lon]) => ({ lat, lon })),
    ...(onlyCountries ? [] : (data.places as [string, number, number][]).map(([name, lat, lon]) => ({ lat, lon, name }))),
    ...(options.countries ?? []).map(({ key, name, lat, lon }) => ({ lat, lon, name, key })),
  ].map((d, i) => ({ ...d, x: 0, y: 0, depth: 0, delay: 0, phase: (i * 2.399) % (Math.PI * 2), hot: 0 }));
  const places = dots.filter(d => d.name);
  const countries = dots.filter(d => d.key);
  let selected: Dot | null = null;

  let W = 0, H = 0, dpr = 1, ox = 0, oy = 0, R = 0;
  let pointer: { x: number; y: number } | null = null;
  let focus: Dot | null = null;
  let pulses: Pulse[] = [];
  let intro = reduced ? 1 : 0;
  let introStart = 0;
  let visible = false, raf = 0, last = 0, spawnAt = 0;

  function layout() {
    const rect = host.getBoundingClientRect();
    W = rect.width; H = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ox = W / 2; oy = H - 4;
    // The fan must fit both the height and the half-width at its widest angle.
    R = Math.min(H - 24, (W / 2 - 12) / Math.sin(spread));
    for (const d of dots) {
      const u = (d.lon + 180) / 360;                       // 0..1 west → east
      const a = (u * 2 - 1) * spread;                      // ray angle from vertical
      const v = (d.lat - LAT_MIN) / (LAT_MAX - LAT_MIN);   // 0 south → 1 north
      const r = R * (inner + (1 - inner) * v);
      d.x = ox + Math.sin(a) * r;
      d.y = oy - Math.cos(a) * r;
      d.depth = Math.min(1, Math.max(0, (oy - d.y) / (R * .62)));
      // Rays grow from the centre outward; the last dot lands exactly at intro = 1.
      d.delay = Math.abs(a) / spread * .3 + (1 - v) * .1;
    }
  }

  const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  function draw(now: number, once = false) {
    const dt = Math.min(64, now - (last || now)); last = now;
    if (intro < 1) intro = Math.min(1, (now - introStart) / 2200);

    // Hover: ease every ray toward its target strength.
    const k = 1 - Math.pow(.001, dt / 1000);
    for (const d of dots) {
      let target = 0;
      if (pointer && !onlyCountries) {
        const dist = Math.hypot(d.x - pointer.x, d.y - pointer.y);
        if (dist < hoverRadius) target = Math.pow(1 - dist / hoverRadius, 1.4);
      }
      if (d === focus || d === selected) target = 1;
      d.hot += (target - d.hot) * k * 9;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Base rays: four depth buckets, each one batched stroke with a radial fade.
    const fade = ctx.createRadialGradient(ox, oy, 0, ox, oy, R);
    fade.addColorStop(0, 'rgba(255,255,255,.62)');
    fade.addColorStop(.12, 'rgba(255,255,255,.42)');
    fade.addColorStop(.35, 'rgba(255,255,255,.22)');
    fade.addColorStop(1, 'rgba(255,255,255,.12)');
    ctx.strokeStyle = fade;
    ctx.lineWidth = .6;
    for (let b = 0; b < 4; b++) {
      ctx.globalAlpha = .25 + b * .25;
      ctx.beginPath();
      for (const d of dots) {
        if (Math.min(3, Math.floor(d.depth * 4)) !== b) continue;
        const p = ease((intro - d.delay) / .45);
        if (p <= 0) continue;
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + (d.x - ox) * p, oy + (d.y - oy) * p);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Highlighted rays in the brand gradient.
    ctx.lineWidth = 1;
    for (const d of dots) {
      if (d.hot < .02) continue;
      const g = ctx.createLinearGradient(ox, oy, d.x, d.y);
      g.addColorStop(0, `rgba(1,141,255,${.08 * d.hot})`);
      g.addColorStop(.6, `rgba(1,141,255,${.6 * d.hot})`);
      g.addColorStop(1, `rgba(96,190,255,${.95 * d.hot})`);
      ctx.strokeStyle = g;
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(d.x, d.y); ctx.stroke();
    }

    // Pulses: a short bright segment running along a ray.
    if (!reduced && intro >= 1 && visible) {
      if (now > spawnAt) {
        const pool = pointer ? dots.filter(d => d.hot > .3) : dots;
        const dot = (pool.length ? pool : dots)[Math.floor(Math.random() * (pool.length || dots.length))];
        pulses.push({ dot, t: 0, speed: .45 + Math.random() * .35, inward: Math.random() < .5 });
        spawnAt = now + (pointer ? 60 : 140);
      }
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      pulses = pulses.filter(p => {
        p.t += p.speed * dt / 1000;
        if (p.t >= 1) return false;
        const s = p.inward ? 1 - p.t : p.t;
        const len = .12;
        const a = Math.max(0, s - len / 2), b = Math.min(1, s + len / 2);
        const { x, y } = p.dot;
        const ax = ox + (x - ox) * a, ay = oy + (y - oy) * a;
        const bx = ox + (x - ox) * b, by = oy + (y - oy) * b;
        const g = ctx.createLinearGradient(ax, ay, bx, by);
        const alpha = Math.sin(p.t * Math.PI) * (.35 + p.dot.depth * .65);
        g.addColorStop(0, 'rgba(1,141,255,0)');
        g.addColorStop(.5, `rgba(110,190,255,${alpha})`);
        g.addColorStop(1, 'rgba(1,141,255,0)');
        ctx.strokeStyle = g;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        return true;
      });
    }

    // Dots.
    for (const d of dots) {
      const p = ease((intro - d.delay - .3) / .3 + .0001);
      if (p <= 0) continue;
      const tw = reduced ? 1 : .82 + .18 * Math.sin(now / 900 + d.phase);
      const base = d.key ? 1 : (.18 + .82 * d.depth) * tw;
      const r = (d.key ? 2.6 : d.name ? 2.4 : 2.1) * (.65 + .35 * d.depth) * (1 + d.hot * .9) * p;
      if (d.hot > .05) {
        ctx.fillStyle = `rgba(1,141,255,${.2 * d.hot})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, r * 3.2, 0, Math.PI * 2); ctx.fill();
      }
      const c = d.hot > .05 ? mix([236, 238, 242], [150, 205, 255], d.hot) : [236, 238, 242];
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, base + d.hot) * p})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill();
    }

    // Focused place and selected country: ring around the dot.
    for (const d of new Set([focus, selected])) {
      if (!d || intro < 1) continue;
      ctx.strokeStyle = 'rgba(96,190,255,.85)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(d.x, d.y, 7, 0, Math.PI * 2); ctx.stroke();
    }

    // Origin glow.
    const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 70);
    glow.addColorStop(0, 'rgba(255,255,255,.4)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(ox - 70, oy - 70, 140, 70);

    if (once) return;
    const busy = intro < 1 || pulses.length > 0 || dots.some(d => (d.hot > .01 && d !== selected) || (d.hot < .99 && (d === focus || d === selected)));
    if (visible && (!reduced || busy)) raf = requestAnimationFrame(draw);
    else raf = 0;
  }

  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

  function kick() {
    if (!raf && visible) { last = 0; raf = requestAnimationFrame(draw); }
  }

  function onMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    // Countries win over city dots near the pointer, so they stay clickable.
    const nearest = (list: Dot[], within: number) => {
      let best: Dot | null = null, bestD = within;
      for (const d of list) {
        const dist = Math.hypot(d.x - pointer!.x, d.y - pointer!.y);
        if (dist < bestD) { best = d; bestD = dist; }
      }
      return best;
    };
    const best = nearest(countries, 22) ?? nearest(places, 26);
    if (best !== focus) {
      focus = best;
      if (focus) {
        tipName.textContent = focus.name!;
        tipCoords.textContent = `${fmt(focus.lat, 'N', 'S')} ${fmt(focus.lon, 'E', 'W')}`;
      }
      tip.classList.toggle('is-visible', !!focus);
    }
    if (focus) {
      const left = focus.x > W - 180;
      tip.style.transform = onlyCountries
        ? `translate(${focus.x}px, ${focus.y - 16}px) translate(-50%, -100%)`
        : `translate(${focus.x + (left ? -14 : 14)}px, ${focus.y}px) translate(${left ? '-100%' : '0'}, -50%)`;
    }
    canvas.style.cursor = focus?.key ? 'pointer' : '';
    kick();
  }
  function onLeave() {
    pointer = null; focus = null;
    tip.classList.remove('is-visible');
    kick();
  }
  const fmt = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? pos : neg}`;

  function show() {
    visible = true;
    if (!introStart && !reduced) introStart = performance.now();
    kick();
  }

  // Resizing clears the canvas, so paint a frame right away instead of
  // waiting for the next animation frame (throttled in hidden tabs/iframes).
  const ro = new ResizeObserver(() => { layout(); draw(performance.now(), true); kick(); });
  ro.observe(host);
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) show();
    else visible = false;
  }, { threshold: .15 });
  io.observe(host);

  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', e => {
    onMove(e);
    if (focus?.key) options.onSelect?.(focus.key);
  });
  layout();
  const rect = host.getBoundingClientRect();
  if (rect.bottom > 0 && rect.top < innerHeight) show();

  // Safety net: if frames never arrive (embedded preview, background tab),
  // still end on the finished picture instead of an empty canvas.
  const fallback = setTimeout(() => {
    if (intro >= 1) return;
    introStart = performance.now() - 2200;
    intro = 1;
    draw(performance.now(), true);
  }, 3000);

  const destroy = () => {
    cancelAnimationFrame(raf);
    clearTimeout(fallback);
    ro.disconnect(); io.disconnect();
    canvas.remove(); tip.remove();
    host.classList.remove('fan-map');
  };
  return Object.assign(destroy, {
    select(key: string | null) {
      selected = countries.find(d => d.key === key) ?? null;
      kick();
    },
  });
}
