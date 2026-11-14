import type { Mode } from './engine'
import { MODE_COLOR } from './render'

/** Silueta del vehículo de cada modo para los botones y la leyenda. */
export function VehicleIcon({ mode, size = 30 }: { mode: Mode; size?: number }) {
  const c = MODE_COLOR[mode]
  return <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="gs-choice-icon">
    <rect x="1" y="1" width="38" height="38" rx="9" fill={c} opacity=".18" stroke={c} strokeOpacity=".6" />
    {mode === 'road' && <g><rect x="6" y="13" width="18" height="13" rx="2" fill={c} /><rect x="24" y="17" width="10" height="9" rx="2.5" fill={c} opacity=".75" /><rect x="27.5" y="19" width="4.5" height="3.5" rx="1" fill="#bfe6ff" /><circle cx="11" cy="28" r="3" fill="#1d2430" /><circle cx="29" cy="28" r="3" fill="#1d2430" /></g>}
    {mode === 'rail' && <g><rect x="5" y="30" width="30" height="2" fill="#8892a0" /><rect x="6" y="14" width="22" height="13" rx="2.5" fill={c} /><rect x="24" y="9" width="9" height="18" rx="2" fill={c} /><rect x="26" y="12" width="5" height="4" rx="1" fill="#bfe6ff" /><circle cx="11" cy="28" r="2.6" fill="#1d2430" /><circle cx="20" cy="28" r="2.6" fill="#1d2430" /><circle cx="29" cy="28" r="2.6" fill="#1d2430" /></g>}
    {mode === 'ship' && <g><path d="M4 23h32l-5 8H9Z" fill={c} /><rect x="9" y="15" width="6" height="6" fill="#ff9f43" /><rect x="16" y="15" width="6" height="6" fill="#2ec4b6" /><rect x="23" y="15" width="6" height="6" fill="#ffd84d" /><rect x="29" y="10" width="5" height="12" rx="1" fill="#f4f7fb" /><path d="M3 34c3-2 5 2 8 0s5 2 8 0 5 2 8 0 5 2 8 0" stroke="#7cc4f0" strokeWidth="1.6" fill="none" /></g>}
    {mode === 'plane' && <g><rect x="5" y="17" width="30" height="7" rx="3.5" fill="#e9eef5" /><path d="M17 20h8l-9 11h-5Z" fill={c} /><path d="M6 18h5L8 9H4Z" fill={c} /><circle cx="31" cy="20" r="1.4" fill="#7fb8e6" /><circle cx="27" cy="20" r="1.4" fill="#7fb8e6" /><circle cx="23" cy="20" r="1.4" fill="#7fb8e6" /></g>}
  </svg>
}
