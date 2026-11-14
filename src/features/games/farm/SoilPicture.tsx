import type { Herd, Mgmt, Soil, Weather } from './engine'
import { SOIL_LABEL, WEATHER_LABEL } from './engine'

const GROUND: Record<Soil, [string, string]> = { fertile: ['#5a3a22', '#3b2414'], dry: ['#d9b77a', '#b38a4e'], waterlogged: ['#5b5a46', '#3d3c2e'], degraded: ['#a39a8a', '#7d7466'] }
const SKY: Record<Weather, [string, string]> = { normal: ['#5fb4ef', '#cdeaf9'], drought: ['#ffb45e', '#ffe7b0'], rain: ['#6d7f93', '#b8c4cf'] }

function Cow({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <ellipse cx="0" cy="9.5" rx="9" ry="1.6" fill="#0003" />
    <rect x="-6.5" y="4" width="1.8" height="5" rx=".8" fill="#3a3030" /><rect x="3.8" y="4" width="1.8" height="5" rx=".8" fill="#3a3030" />
    <rect x="-8" y="-3" width="15" height="8.5" rx="4" fill="#f7f3ea" />
    <path d="M-5-3c1 2 3 3 3 6-2 0-4-1-5-3Z" fill="#2c2626" /><circle cx="3" cy="1" r="2.2" fill="#2c2626" />
    <rect x="5.5" y="-6.5" width="6.5" height="6" rx="2.6" fill="#f7f3ea" />
    <rect x="8.6" y="-3" width="4" height="3" rx="1.4" fill="#f2a5a0" />
    <path d="M6-6.5 5-8.6M10-6.5l1.2-2" stroke="#d8c7a0" strokeWidth="1.1" strokeLinecap="round" />
    <circle cx="8" cy="-4.6" r=".75" fill="#2c2626" />
    <path d="M-8-1q-2.5 1-1.6 4" stroke="#2c2626" strokeWidth=".9" fill="none" />
  </g>
}

/** Paisaje de la finca: clima, estado del suelo, manejo y hato elegidos. */
export function SoilPicture({ soil, weather, herd, mgmt }: { soil: Soil; weather: Weather; herd: Herd; mgmt: Mgmt }) {
  const [g1, g2] = GROUND[soil], [s1, s2] = SKY[weather]
  const sid = `farm-sky-${weather}`, gid = `farm-ground-${soil}`
  const rows = [52, 58, 65, 73, 82, 92]
  const plants = mgmt === 'crop' && soil !== 'degraded'
  return <svg className="farm-soil-picture" viewBox="0 0 160 100" role="img"
    aria-label={`Suelo ${SOIL_LABEL[soil].toLowerCase()}. ${WEATHER_LABEL[weather]}.${herd ? ` Hato de ${herd === 1 ? 'pocos' : herd === 2 ? 'varios' : 'muchos'} animales.` : ''}`}>
    <defs>
      <linearGradient id={sid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s1} /><stop offset="1" stopColor={s2} /></linearGradient>
      <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={g1} /><stop offset="1" stopColor={g2} /></linearGradient>
    </defs>
    <rect width="160" height="100" fill={`url(#${sid})`} />
    {weather === 'rain' ? <g>
      <g fill="#8a99aa"><circle cx="40" cy="16" r="9" /><circle cx="52" cy="12" r="11" /><circle cx="64" cy="17" r="8" /><rect x="34" y="16" width="36" height="8" rx="4" /></g>
      <g fill="#7b8a9c"><circle cx="104" cy="14" r="8" /><circle cx="116" cy="11" r="10" /><circle cx="127" cy="16" r="7" /><rect x="98" y="14" width="34" height="8" rx="4" /></g>
      <g stroke="#e8f3ff" strokeWidth="1.1" strokeLinecap="round" opacity=".85">{[38, 46, 54, 62, 102, 110, 118, 126].map((x, i) => <line key={x} x1={x} y1={27 + (i % 2) * 3} x2={x - 3} y2={35 + (i % 2) * 3} />)}</g>
    </g> : <g>
      <circle cx="132" cy="18" r={weather === 'drought' ? 14 : 10} fill={weather === 'drought' ? '#ff8a1f' : '#ffd84d'} opacity=".35" />
      <circle cx="132" cy="18" r={weather === 'drought' ? 9 : 7} fill={weather === 'drought' ? '#ff9f1c' : '#ffe066'} />
      {weather === 'normal' && <g fill="#ffffffe0"><circle cx="34" cy="20" r="6" /><circle cx="42" cy="17" r="7.5" /><circle cx="50" cy="21" r="5" /><rect x="30" y="20" width="24" height="5" rx="2.5" /></g>}
      {weather === 'drought' && <path d="M0 40q20-4 40 0t40 0 40 0 40 0" stroke="#fff4" strokeWidth="1.5" fill="none" />}
    </g>}
    <path d="M0 46q30-14 60-6t55-4 45 2v12H0Z" fill={weather === 'drought' ? '#c9a46a' : '#8fbf7a'} />
    <path d="M0 50q40-10 80-4t80-2v6H0Z" fill={weather === 'drought' ? '#b98f55' : '#6fa860'} />
    {/* Granero y cerca */}
    <g transform="translate(14 34)"><path d="M0 8 8 1l8 7v9H0Z" fill="#c8453a" /><path d="M-1 8.5 8 .5l9 8" stroke="#f3ecdc" strokeWidth="1.2" fill="none" /><rect x="5" y="10" width="6" height="7" fill="#7e2a22" /><path d="M5 10l6 7M11 10l-6 7" stroke="#f3ecdc" strokeWidth=".7" /></g>
    <rect y="48" width="160" height="52" fill={`url(#${gid})`} />
    {soil === 'fertile' && rows.map(y => <path key={y} d={`M0 ${y}q80 ${(y - 48) * 0.18} 160 0`} stroke="#2a180c" strokeWidth={0.8 + (y - 48) * 0.05} fill="none" opacity=".7" />)}
    {soil === 'dry' && <g fill="none" stroke="#8a6436" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 60l12 6-2 9 12 6" /><path d="M64 54l10 12 16 2-2 16" /><path d="M118 58l12 10 16-3" /><path d="M44 80l12 6" /><path d="M96 90l10-6 10 4" />
    </g>}
    {soil === 'waterlogged' && <g>
      {[[28, 64, 18], [86, 76, 22], [132, 60, 12], [52, 90, 16]].map(([x, y, w]) => <g key={x}><ellipse cx={x} cy={y} rx={w} ry={w * 0.22} fill="#4f86bf" /><ellipse cx={x - w * 0.3} cy={y - 0.8} rx={w * 0.35} ry=".8" fill="#bfe1ff" opacity=".8" /></g>)}
      {[8, 60, 112, 148].map(x => <path key={x} d={`M${x} 56v-7m2 7v-5m-4 5v-4`} stroke="#6f8f4a" strokeWidth="1.2" strokeLinecap="round" />)}
    </g>}
    {soil === 'degraded' && <g>
      {[[22, 60, 6], [66, 76, 8], [114, 64, 7], [142, 86, 5], [40, 90, 4]].map(([x, y, r]) => <g key={x}><ellipse cx={x} cy={y} rx={r} ry={r * 0.6} fill="#6d675e" /><ellipse cx={x - r * 0.3} cy={y - r * 0.25} rx={r * 0.4} ry={r * 0.2} fill="#b9b2a5" /></g>)}
      <path d="M90 56l-6 8 6 6M30 74l10 4" stroke="#5d564c" strokeWidth="1" fill="none" />
    </g>}
    {plants && rows.slice(0, 5).map((y, ri) => Array.from({ length: 9 }, (_, i) => {
      const x = 8 + i * 18 + (ri % 2) * 9, k = 0.55 + (y - 48) * 0.022
      return <g key={`${ri}-${i}`} transform={`translate(${x} ${y}) scale(${k})`}>
        <path d="M0 0v-7" stroke="#4f9a2f" strokeWidth="1.4" />
        <path d="M0-4c-2-2-5-2-6 0 2 1.5 4 1.5 6 0Z" fill="#6ccf4a" /><path d="M0-6c2-2 5-2 6 0-2 1.5-4 1.5-6 0Z" fill="#86e05e" />
        {soil === 'fertile' && <ellipse cx="0" cy="-8.5" rx="1.4" ry="2.2" fill="#f2c53d" />}
      </g>
    }))}
    {mgmt === 'graze' && soil !== 'degraded' && [16, 44, 74, 102, 130, 150].map((x, i) => <path key={x} d={`M${x} ${62 + (i % 3) * 10}l-2-5m2 5v-6m0 6 2-5`} stroke="#5aa64f" strokeWidth="1.3" strokeLinecap="round" />)}
    {mgmt === 'rest' && soil !== 'degraded' && [24, 70, 120].map((x, i) => <g key={x} transform={`translate(${x} ${66 + i * 8})`} fill="#7fcf6a"><circle cx="-2" r="2" /><circle cx="2" r="2" /><circle cx="0" cy="-2.6" r="2" /></g>)}
    {Array.from({ length: herd }, (_, i) => <Cow key={i} x={40 + i * 36} y={70 + (i % 2) * 10} s={1.25 + (i % 2) * 0.15} flip={i % 2 === 1} />)}
    {/* Postes de cerca en primer plano */}
    <g fill="#8a5a33">{[4, 30, 56, 82, 108, 134, 156].map(x => <rect key={x} x={x} y="88" width="2.6" height="12" rx="1" />)}</g>
    <path d="M0 91h160M0 96h160" stroke="#a7744a" strokeWidth="1.2" />
  </svg>
}
