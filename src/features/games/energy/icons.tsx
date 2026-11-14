import type { ResourceKind } from './engine'
import { KIND_COLOR } from './render'

/** Misma ficha que en el canvas, en SVG para la leyenda y el HUD. */
export function ResourceBadge({ kind, size = 30 }: { kind: ResourceKind; size?: number }) {
  const c = KIND_COLOR[kind], id = `rb-${kind}`
  return <svg width={size} height={size} viewBox="-20 -20 40 40" aria-hidden="true">
    <defs><radialGradient id={id} cx="30%" cy="28%" r="80%"><stop offset="0" stopColor={c.light} /><stop offset="1" stopColor={c.dark} /></radialGradient></defs>
    <circle r="18" fill={`url(#${id})`} stroke="#ffffff55" strokeWidth="1.5" />
    <ellipse cx="-5" cy="-9" rx="8" ry="4" fill="#ffffff30" transform="rotate(-28 -5 -9)" />
    {kind === 'carbon' && <g strokeLinejoin="round">
      <path d="M-10 3-6-6.5 2-9 9.5-3 10 5.5 2 9-7.5 8Z" fill="#16171d" stroke="#b9bdcb" strokeWidth="1.6" />
      <path d="M-6-6.5 0.4 0.4 9.5-3M0.4 0.4 2 9" fill="none" stroke="#6d7180" strokeWidth="1.1" />
      <circle cx="-3.3" cy="4" r="2" fill="#ff7a2f" />
    </g>}
    {kind === 'gas' && <g>
      <path d="M0-11C9.4-1.4 9 9 0 9.4-9 9-9.4-1.4 0-11Z" fill="#f2fbff" />
      <path d="M0-1.6C5 2.6 5 8 0 8.4-5 8-5 2.6 0-1.6Z" fill="#2b8cff" />
    </g>}
    {kind === 'renewable' && <g stroke="#fffbe8" strokeWidth="2.3" strokeLinecap="round">
      {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <line key={i} x1={Math.cos(a) * 8.3} y1={Math.sin(a) * 8.3} x2={Math.cos(a) * 12} y2={Math.sin(a) * 12} /> })}
      <circle r="5.8" fill="#fffbe8" stroke="none" />
    </g>}
    {kind === 'storage' && <g>
      <rect x="-8.6" y="-5.4" width="15.5" height="10.8" rx="2.2" fill="none" stroke="#f2fff5" strokeWidth="2" />
      <rect x="7.2" y="-2.3" width="2.2" height="4.6" fill="#f2fff5" />
      <path d="M.4-4.3-3.6.7H-.4L-1.8 4.5 2.9-1.1H-.4Z" fill="#ffe14d" />
    </g>}
  </svg>
}
