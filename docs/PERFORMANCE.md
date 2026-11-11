# Скорость загрузки: что сделано и что дальше

Замеры — ноябрь 2026, десктоп 1440×900, Chrome, холодный кэш.

## Что уже сделано в коде

| Было | Стало |
| --- | --- |
| Home при открытии качал 70 МБ: все 75 картинок сразу | До события `load` — около 5 МБ. Иллюстрации Solutions, фото кейсов и фон футера стартуют после первого экрана, в простое браузера, или раньше, если до них осталось два экрана (`src/shared/when-near.ts`) |
| Обе страницы качали по ~3 МБ картинок из Figma-экспорта, которые потом удаляются со страницы | У этих `<img>` нет `src` (`src/Design.tsx` и тот же JSX в `public/_turnkey/assets/turnkey-contained-art-20261104.js`) |
| Анимации ждут `document.fonts.ready`. Шрифты начинали качаться на 0.7 с, `jetbrains-mono-300` — на 1.5 с, поэтому анимации стартовали ≈2.5 с | Шрифты предзагружаются из `<head>` обеих страниц и готовы к ~0.1 с |
| `altenar-glow.js` блокировал разбор HTML | Подключён с `defer`, порядок выполнения прежний |

Почему тяжёлые картинки не отложены «до самой секции»: сборка стека Turnkey, раскладка Retail и White Label ждут загрузки своих картинок. При нынешних 24 МБ на стек они бы не успели, и анимация стартовала бы с задержкой. После пережатия картинок можно оставить только загрузку «за два экрана».

## Картинки

**Статус (ноябрь 2026).** Все группы таблицы ниже, кроме новостей и SVG шагов платформы, переведены в WebP. Оригиналы лежат рядом и сайтом больше не запрашиваются. Новые фото кейсов названы `*-1280.webp`, их `photoSize` обновлён в `src/cases.json` и бандле Turnkey. Картинки после прокрутки обеих страниц: Home ≈2.7 МБ (было ~70), Turnkey ≈3 МБ (было ~16).

Сейчас они в 3–7 раз больше по пикселям, чем нужно даже для ретины, и сохранены в PNG. После переэкспорта страницы станут легче примерно в 25 раз: ~100 МБ → ~5 МБ на две страницы.

**Правило экспорта:** ширина = 2 × максимальный размер на экране, формат WebP качества 82, прозрачность сохранять, если она есть. Для плавных градиентов брать качество 92, иначе появятся полосы.

| Группа | Файлы | Сейчас | Экспорт | Будет |
| --- | --- | --- | --- | --- |
| Turnkey: hero | `_turnkey/premium-media/turnkey/platform-user.png` | 4096², PNG, **11.3 МБ**, первый экран Turnkey | 1600², WebP q82 с альфой | ~180 КБ |
| Home: стек Turnkey (7 слоёв) | `premium-media/turnkey/*-v2.png` | 4096², 2.4–4 МБ каждый | 1280², WebP q82 с альфой | 95–160 КБ |
| Home: Retail (6) | `glow-media/retail/*-v2.png` | 4096², 2.7–3.6 МБ | `platform-v2` 1200², остальные 900², WebP q82 с альфой | 45–120 КБ |
| Home: White Label (4) | `glow-media/white-label/{Blue,Green,Orange,Yellow}.png` | 4096², 2.1–2.4 МБ | 1120², WebP q82 с альфой | ~70 КБ |
| Фото кейсов (3) | `photographs/{betmotion,lottoland,wplay}.webp` | до 3240×4050, 2.4–6.8 МБ | 1280×1600, WebP q82 (планшет и 2560-экраны) | 45–155 КБ |
| Фото кейса Golden Palace | `premium-media/golden-palace.png` | 644², PNG, 725 КБ | лучше новое фото 1280×1600 (4:5, как остальные; сейчас мыльное на ретине); минимум — WebP q82 | ~55 КБ |
| Turnkey: иллюстрации карточек (4) | `_turnkey/premium-media/turnkey/{relevant-sports-content,insight-to-action,built-for-next,competitive-promotions}-*.png` | 2048², 2.5–3.1 МБ | размер оставить (нужен для 2560-экранов), WebP q82 с альфой | 170–325 КБ |
| Turnkey: скрытые слои | `_turnkey/premium-media/turnkey/{product-altenar-v2,glow-risk-management-*,glow-back-office-*}.png` | 1254–1266², 1.5–1.7 МБ, качаются при каждом открытии Turnkey, но скрыты (`display:none`) | лучше не грузить вовсе — правка кода в бандле, ~4.9 МБ; иначе WebP q82 | 95–165 КБ |
| Turnkey: шаги платформы | `_turnkey/premium-media/features/01–05.svg` | ~5 SVG, самый тяжёлый неучтённый запрос Turnkey | SVGO с точностью 1–2 знака | ~1.3 МБ на все |
| Карточки новостей (6) | `assets/imgNewsCardCover*.png` | 396×190, только 1x — мыльные на ретине | новый экспорт 792×380, WebP q82 | 10–20 КБ |
| Фоны hero | `glow-media/hero-blue-gradient.png`, `_turnkey/premium-media/turnkey/hero-blue-clean.png` | 1703×924, 0.95 и 1.4 МБ | размер оставить, WebP q92 | ~18 КБ |
| Фон футера | `shared/footer-background.png` | 2878×1560, 2.4 МБ | размер оставить, WebP q92 без альфы | ~50 КБ |
| Мега-меню | `_turnkey/glow-media/mega-menu-featured.png` | 670×356, 230 КБ | WebP q82 | ~9 КБ |

Размеры в колонке «Будет» получены пробным кодированием через `cwebp` и перепроверены вторым агентом: размеры экспорта сверены с реальными блоками на 1440, 1920, 2560 и на планшете.

Команда для одного файла, если экспортировать не из Figma:

```bash
cwebp -q 82 -alpha_q 90 -resize 1280 1280 in.png -o out.webp
```

### Что поменять в коде после переэкспорта

Когда у файла меняется расширение, нужно обновить ссылки на него. Это делаю я.

- **Иллюстрации Home.** Ссылки на `.png` прописаны в `src/premium/turnkey-stack.ts` (там же атрибуты `width/height="4096"` — достаточно, чтобы совпадали пропорции), `src/premium/glow/retail.ts`, `src/premium/glow/white-label.ts` и `src/premium/glow/hero.ts`.
- **Предзагрузка hero.** Её путь указан в `index.html`.
- **Фото кейсов.** Размеры `photoSize` записаны в `src/cases.json` и в бандле Turnkey. Их нужно обновить, иначе сломается кадрирование в морфе.
- **Turnkey.** Пути к картинкам Turnkey лежат в бандлах `public/_turnkey/assets/*.js` и в `src/shared/sportsbook.ts`.
- **Фон футера.** Путь к нему — в `src/shared/footer.css`.

## Шрифты

Сейчас шрифты в TTF: на Home предзагружается около 1.6 МБ, на Turnkey около 1.3 МБ (gzip сжимает это примерно вдвое).

- **Формат.** Перевод в WOFF2 с латинским сабсетом даст ~160 КБ на Home. Нужен `fonttools`: `pyftsubset in.ttf --unicodes=U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-21FF,U+2212,U+221A,U+2248,U+2302,U+FEFF,U+FFFD --flavor=woff2 --layout-features='*' --output-file=out.woff2`.
- **Где обновить.** После перевода — `@font-face` в `src/base.css` и `src/shared/typography.css`, а также preload в обоих HTML (`type="font/woff2"`).
- **Дубли.** `/_turnkey/fonts/` побайтно повторяет часть `/fonts/`, поэтому при переходе между страницами одни и те же шрифты качаются дважды. Стоит перевести Turnkey на `/fonts/`.

## Можно удалить (нигде не подключены)

Перед удалением сверить вкладку Network на обеих страницах.

- `_turnkey/premium-media/turnkey/brand-player-experience-*.png` (3.5 МБ)
- `_turnkey/premium-media/turnkey/local-market-global.png` — возможно, не используется, проверить по Network
- `cases/{horse-racing,tennis,sports-trading}.png`
- `_turnkey/assets/{heroInitial,heroSplit}.png`
- `assets/` и `_turnkey/assets/`: `imgVector`, `imgCaseMedia`, `imgFrame2147221950`, `imgPositioningMedia`, `imgMarketsMapWorld`, `imgVector53` (`.png`)
- дубли `premium-media/turnkey/glow-{risk-management,back-office}-*.png` (копии лежат в `_turnkey/`)

Это уменьшит размер сайта на Pages (лимит 1 ГБ), но на скорость загрузки страниц не повлияет.
