// Переносит собранный сайт в подпапку (например /altenar/ на GitHub Pages).
// Vite сам переписывает пути к своим бандлам, но в коде, CSS, JSON и готовых бандлах Turnkey
// сотни ссылок вида "/glow-media/…" от корня. Скрипт дописывает к ним префикс base.
// Запуск: BASE_PATH=/altenar/ node scripts/rebase-dist.mjs
import {readdirSync, readFileSync, writeFileSync, statSync} from 'node:fs';
import {join, extname} from 'node:path';

const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
if (base === '/') { console.log('rebase-dist: base "/", ничего не делаю'); process.exit(0); }

const dist = 'dist';
// Верхний уровень публичных папок + страница Sportsbook — всё, что лежит от корня сайта.
const roots = [...readdirSync('public').filter(n => statSync(join('public', n)).isDirectory()), 'Sportsbook'];
const re = new RegExp(`(?<![\\w./-])/(${roots.map(r => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?=[/"'\`)?#\\s])`, 'g');
const exts = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.webmanifest']);

let files = 0, hits = 0;
const walk = dir => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!exts.has(extname(name))) continue;
    const src = readFileSync(p, 'utf8');
    let n = 0;
    const out = src.replace(re, (_, dir) => { n++; return base + dir; });
    if (n) { writeFileSync(p, out); files++; hits += n; }
  }
};
walk(dist);
console.log(`rebase-dist: ${hits} путей в ${files} файлах → ${base}`);
