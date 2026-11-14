import type { ParcelState } from './engine'

/** Ilustraciones de cada estado de parcela: formas simples y reconocibles. */
export function ParcelArt({ state }: { state: ParcelState }) {
  return <svg className="forest-art" viewBox="0 0 48 48" aria-hidden="true">
    {state === 'forest' && <g>
      <ellipse cx="24" cy="42" rx="20" ry="4" fill="#0d3a1d" opacity=".5" />
      <rect x="11" y="28" width="3" height="12" rx="1" fill="#6b4226" />
      <circle cx="12.5" cy="22" r="9" fill="#1f7a3a" /><circle cx="9.5" cy="19" r="4" fill="#3aa357" opacity=".7" />
      <rect x="34" y="28" width="3" height="12" rx="1" fill="#6b4226" />
      <circle cx="35.5" cy="23" r="8" fill="#23843f" /><circle cx="33" cy="20" r="3.4" fill="#45b062" opacity=".7" />
      <rect x="22.5" y="30" width="3" height="11" rx="1" fill="#5a3720" />
      <path d="M24 5 33 21h-4l6 10H13l6-10h-4Z" fill="#14632d" /><path d="M24 5 28.5 13 24 13Z" fill="#3c9a55" opacity=".8" />
    </g>}
    {state === 'young' && <g>
      <ellipse cx="24" cy="42" rx="14" ry="3.5" fill="#1f4a1d" opacity=".4" />
      <rect x="22.5" y="26" width="3" height="15" rx="1" fill="#7a4d2c" />
      <circle cx="24" cy="21" r="10" fill="#4fae45" /><circle cx="20" cy="17.5" r="4.5" fill="#7fd36b" opacity=".75" />
      <circle cx="29" cy="25" r="5" fill="#3e9638" />
    </g>}
    {state === 'sapling' && <g>
      <ellipse cx="24" cy="39" rx="12" ry="4" fill="#7a5233" />
      <path d="M24 38V24" stroke="#3f8a2e" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 28c-1-6-6-8-11-7 0 5 4 8 11 7Z" fill="#6fcf4f" /><path d="M24 25c1-5 5-7 10-6 0 4-4 7-10 6Z" fill="#8fe06a" />
    </g>}
    {state === 'crop' && <g strokeLinecap="round">
      {[8, 16, 24, 32, 40].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 2 : 0})`}>
        <path d="M0 42V20" stroke="#c4962a" strokeWidth="1.6" />
        {[22, 26, 30].map(y => <g key={y}><ellipse cx="-2.3" cy={y} rx="2.2" ry="1.3" fill="#f2c53d" transform={`rotate(-30 -2.3 ${y})`} /><ellipse cx="2.3" cy={y} rx="2.2" ry="1.3" fill="#e8b42c" transform={`rotate(30 2.3 ${y})`} /></g>)}
        <ellipse cx="0" cy="18.5" rx="1.4" ry="2.4" fill="#f7d35a" />
      </g>)}
    </g>}
    {state === 'degraded' && <g>
      <path d="M6 18l8 6-3 8 9 4M30 10l-4 10 8 5 2 9M40 22l-6 3M18 40l6-4 8 3" stroke="#5a3e28" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="25" cy="31" rx="7" ry="2.4" fill="#4a3220" />
      <rect x="19" y="24" width="12" height="7" fill="#7b5233" /><ellipse cx="25" cy="24" rx="6" ry="2.2" fill="#c49a6c" /><ellipse cx="25" cy="24" rx="3" ry="1" fill="none" stroke="#8a6440" strokeWidth=".8" />
      <circle cx="10" cy="36" r="2" fill="#8d8579" /><circle cx="38" cy="38" r="2.6" fill="#8d8579" />
    </g>}
  </svg>
}

export function FlameArt() {
  return <svg className="forest-flame" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 6c3 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 5-12 0 4 2 6 4 6-1-7 1-12 3-18Z" fill="#ff6a1a" />
    <path d="M24 20c2 5 7 7 7 13a7 7 0 0 1-14 0c0-3 2-5 3-7 0 2 1 3 2 3 0-4 1-6 2-9Z" fill="#ffd23f" />
  </svg>
}

export function ToolIcon({ tool }: { tool: 'protect' | 'cultivate' | 'restore' }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="gs-choice-icon forest-tool-icon">
    <rect x="1" y="1" width="30" height="30" rx="8" fill={tool === 'protect' ? '#2f7bff33' : tool === 'cultivate' ? '#f2c53d33' : '#6fcf4f33'} />
    {tool === 'protect' && <path d="M16 6 8 9v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V9Z" fill="#4da3ff" stroke="#cfe6ff" strokeWidth="1.2" />}
    {tool === 'protect' && <path d="m12.5 15.5 2.6 2.6 4.6-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    {tool === 'cultivate' && <g strokeLinecap="round"><path d="M16 26V10" stroke="#c4962a" strokeWidth="1.8" />{[12, 16, 20].map(y => <g key={y}><ellipse cx="13.3" cy={y} rx="2.6" ry="1.5" fill="#f2c53d" transform={`rotate(-30 13.3 ${y})`} /><ellipse cx="18.7" cy={y} rx="2.6" ry="1.5" fill="#e8b42c" transform={`rotate(30 18.7 ${y})`} /></g>)}</g>}
    {tool === 'restore' && <g><ellipse cx="16" cy="25" rx="8" ry="2.6" fill="#7a5233" /><path d="M16 25V15" stroke="#3f8a2e" strokeWidth="2" strokeLinecap="round" /><path d="M16 18c-1-4-4-6-8-5 0 3 3 6 8 5Z" fill="#6fcf4f" /><path d="M16 16c1-3 4-5 7-4 0 3-3 5-7 4Z" fill="#8fe06a" /></g>}
  </svg>
}
