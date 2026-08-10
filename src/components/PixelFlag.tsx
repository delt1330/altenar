import React from 'react'

type Props = {
  /** Market `country` field (or detail name fallback). */
  country: string
  className?: string
  title?: string
}

type Cell = { x: number; y: number; w?: number; h?: number; fill: string }

/** 12×8 pixel flag drawings — crisp squares, no gradients. */
const FLAG_CELLS: Record<string, Cell[]> = {
  Brazil: [
    { x: 0, y: 0, w: 12, h: 8, fill: '#009c3b' },
    { x: 2, y: 2, w: 8, h: 4, fill: '#ffdf00' },
    { x: 5, y: 3, w: 2, h: 2, fill: '#002776' },
  ],
  Peru: [
    { x: 0, y: 0, w: 4, h: 8, fill: '#d91023' },
    { x: 4, y: 0, w: 4, h: 8, fill: '#fff' },
    { x: 8, y: 0, w: 4, h: 8, fill: '#d91023' },
  ],
  Colombia: [
    { x: 0, y: 0, w: 12, h: 4, fill: '#fcd116' },
    { x: 0, y: 4, w: 12, h: 2, fill: '#003893' },
    { x: 0, y: 6, w: 12, h: 2, fill: '#ce1126' },
  ],
  Uruguay: [
    { x: 0, y: 0, w: 12, h: 8, fill: '#fff' },
    { x: 0, y: 1, w: 12, h: 1, fill: '#0038a8' },
    { x: 0, y: 3, w: 12, h: 1, fill: '#0038a8' },
    { x: 0, y: 5, w: 12, h: 1, fill: '#0038a8' },
    { x: 0, y: 7, w: 12, h: 1, fill: '#0038a8' },
    { x: 0, y: 0, w: 5, h: 4, fill: '#fff' },
    { x: 1, y: 1, w: 3, h: 2, fill: '#fcd116' },
  ],
  Canada: [
    { x: 0, y: 0, w: 3, h: 8, fill: '#ff0000' },
    { x: 3, y: 0, w: 6, h: 8, fill: '#fff' },
    { x: 9, y: 0, w: 3, h: 8, fill: '#ff0000' },
    { x: 5, y: 2, w: 2, h: 4, fill: '#ff0000' },
    { x: 4, y: 3, w: 4, h: 1, fill: '#ff0000' },
  ],
  'United States of America': [
    { x: 0, y: 0, w: 12, h: 8, fill: '#fff' },
    { x: 0, y: 0, w: 12, h: 1, fill: '#b22234' },
    { x: 0, y: 2, w: 12, h: 1, fill: '#b22234' },
    { x: 0, y: 4, w: 12, h: 1, fill: '#b22234' },
    { x: 0, y: 6, w: 12, h: 1, fill: '#b22234' },
    { x: 0, y: 0, w: 5, h: 4, fill: '#3c3b6e' },
  ],
  Malta: [
    { x: 0, y: 0, w: 6, h: 8, fill: '#fff' },
    { x: 6, y: 0, w: 6, h: 8, fill: '#cf142b' },
    { x: 1, y: 1, w: 2, h: 2, fill: '#c8a200' },
  ],
  'United Kingdom': [
    { x: 0, y: 0, w: 12, h: 8, fill: '#012169' },
    { x: 0, y: 3, w: 12, h: 2, fill: '#fff' },
    { x: 5, y: 0, w: 2, h: 8, fill: '#fff' },
    { x: 0, y: 3, w: 12, h: 2, fill: '#c8102e' },
    { x: 5, y: 0, w: 2, h: 8, fill: '#c8102e' },
  ],
  Denmark: [
    { x: 0, y: 0, w: 12, h: 8, fill: '#c8102e' },
    { x: 0, y: 3, w: 12, h: 2, fill: '#fff' },
    { x: 4, y: 0, w: 2, h: 8, fill: '#fff' },
  ],
  Belgium: [
    { x: 0, y: 0, w: 4, h: 8, fill: '#000' },
    { x: 4, y: 0, w: 4, h: 8, fill: '#fdda24' },
    { x: 8, y: 0, w: 4, h: 8, fill: '#ef3340' },
  ],
  Portugal: [
    { x: 0, y: 0, w: 5, h: 8, fill: '#006600' },
    { x: 5, y: 0, w: 7, h: 8, fill: '#ff0000' },
    { x: 3, y: 3, w: 3, h: 2, fill: '#ffcc00' },
  ],
  'South Africa': [
    { x: 0, y: 0, w: 12, h: 8, fill: '#007a4d' },
    { x: 0, y: 0, w: 12, h: 2, fill: '#de3831' },
    { x: 0, y: 6, w: 12, h: 2, fill: '#002395' },
    { x: 0, y: 2, w: 12, h: 1, fill: '#fff' },
    { x: 0, y: 5, w: 12, h: 1, fill: '#fff' },
    { x: 0, y: 3, w: 12, h: 2, fill: '#000' },
    { x: 0, y: 3, w: 5, h: 2, fill: '#ffb612' },
  ],
  Nigeria: [
    { x: 0, y: 0, w: 4, h: 8, fill: '#008751' },
    { x: 4, y: 0, w: 4, h: 8, fill: '#fff' },
    { x: 8, y: 0, w: 4, h: 8, fill: '#008751' },
  ],
  Kenya: [
    { x: 0, y: 0, w: 12, h: 2, fill: '#000' },
    { x: 0, y: 2, w: 12, h: 1, fill: '#fff' },
    { x: 0, y: 3, w: 12, h: 2, fill: '#bb0000' },
    { x: 0, y: 5, w: 12, h: 1, fill: '#fff' },
    { x: 0, y: 6, w: 12, h: 2, fill: '#006600' },
    { x: 5, y: 2, w: 2, h: 4, fill: '#000' },
  ],
  India: [
    { x: 0, y: 0, w: 12, h: 3, fill: '#ff9933' },
    { x: 0, y: 3, w: 12, h: 2, fill: '#fff' },
    { x: 0, y: 5, w: 12, h: 3, fill: '#138808' },
    { x: 5, y: 3, w: 2, h: 2, fill: '#000080' },
  ],
  Philippines: [
    { x: 0, y: 0, w: 12, h: 4, fill: '#0038a8' },
    { x: 0, y: 4, w: 12, h: 4, fill: '#ce1126' },
    { x: 0, y: 0, w: 5, h: 8, fill: '#fff' },
    { x: 1, y: 3, w: 2, h: 2, fill: '#fcd116' },
  ],
  Kazakhstan: [
    { x: 0, y: 0, w: 12, h: 8, fill: '#00afca' },
    { x: 4, y: 2, w: 4, h: 4, fill: '#fec50c' },
    { x: 1, y: 1, w: 1, h: 6, fill: '#fec50c' },
  ],
}

const ALIASES: Record<string, string> = {
  USA: 'United States of America',
  US: 'United States of America',
  UK: 'United Kingdom',
  Ontario: 'Canada',
  Alberta: 'Canada',
}

function resolveKey(country: string) {
  return ALIASES[country] ?? country
}

export default function PixelFlag({ country, className, title }: Props) {
  const key = resolveKey(country)
  const cells = FLAG_CELLS[key]
  if (!cells) return null

  return (
    <svg
      className={['pixel-flag', className].filter(Boolean).join(' ')}
      viewBox="0 0 12 8"
      width={18}
      height={12}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {cells.map((cell, i) => (
        <rect
          key={i}
          x={cell.x}
          y={cell.y}
          width={cell.w ?? 1}
          height={cell.h ?? 1}
          fill={cell.fill}
          shapeRendering="crispEdges"
        />
      ))}
    </svg>
  )
}
