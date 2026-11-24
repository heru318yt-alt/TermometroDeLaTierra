import type { ReactNode } from 'react'
import type { Floater } from './hooks'

/** Tarjeta de indicador simple del HUD. */
export function Stat({ label, value, icon, tone }: { label: string; value: ReactNode; icon?: ReactNode; tone?: 'ok' | 'warn' | 'accent' }) {
  return <div className={`gs-stat${tone ? ` is-${tone}` : ''}`}>
    {icon && <span className="gs-stat-icon" aria-hidden="true">{icon}</span>}
    <span className="gs-stat-label">{label}</span>
    <strong>{value}</strong>
  </div>
}

/**
 * Recurso que se agota: la barra se vacía y cambia de color al escasear.
 * El texto conserva «valor / máximo» para lectores de pantalla y pruebas.
 */
export function Gauge({ label, value, max, icon, unit = '', fill = false, text }: { label: string; value: number; max: number; icon?: ReactNode; unit?: string; fill?: boolean; text?: ReactNode }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  // fill: un depósito que se llena (p. ej. almacenamiento), no un recurso que se agota.
  const level = fill ? 'high' : value <= 0 ? 'empty' : pct <= 0.2 ? 'low' : pct <= 0.5 ? 'mid' : 'high'
  return <div className={`gs-stat gs-gauge is-${level}`}>
    {icon && <span className="gs-stat-icon" aria-hidden="true">{icon}</span>}
    <span className="gs-stat-label">{label}{level === 'empty' ? ' · AGOTADO' : level === 'low' ? ' · ESCASO' : ''}</span>
    <strong>{text ?? <>{value} / {max}{unit}</>}</strong>
    <span className="gs-gauge-track" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <span className="gs-gauge-fill" style={{ width: `${pct * 100}%` }} />
    </span>
  </div>
}

/** Indicador de racha/multiplicador. */
export function Streak({ multiplier, label = 'RACHA', detail }: { multiplier: number; label?: string; detail?: string }) {
  const lvl = multiplier >= 3 ? 3 : multiplier >= 2 ? 2 : multiplier > 1 ? 1 : 0
  return <div className={`gs-stat gs-streak is-lvl${lvl}`} aria-live="polite">
    <span className="gs-stat-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg>
    </span>
    <span className="gs-stat-label">{label}</span>
    <strong>×{Number.isInteger(multiplier) ? multiplier : multiplier.toFixed(2).replace(/0$/, '')}</strong>
    {detail && <small>{detail}</small>}
  </div>
}

export function FloaterLayer({ items }: { items: Floater[] }) {
  return <div className="gs-floaters" aria-hidden="true">{items.map(f =>
    <span key={f.id} className={`gs-floater is-${f.tone}`} style={{ left: `${f.x}%`, top: `${f.y}%` }}>{f.text}</span>)}</div>
}

/** Fila de cifras para las pantallas de resultado. */
export function ResultGrid({ items }: { items: { label: string; value: ReactNode; tone?: 'ok' | 'warn' }[] }) {
  return <dl className="gs-results">{items.map(i => <div key={i.label} className={i.tone ? `is-${i.tone}` : undefined}><dt>{i.label}</dt><dd>{i.value}</dd></div>)}</dl>
}

export function Stars({ count, max = 3, label }: { count: number; max?: number; label?: string }) {
  return <span className="gs-stars" role="img" aria-label={label ?? `${count} de ${max} estrellas`}>
    {Array.from({ length: max }, (_, i) => <svg key={i} viewBox="0 0 24 24" className={i < count ? 'is-on' : ''}><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9L12 2.6Z" /></svg>)}
  </span>
}

/** Récord del navegador y si la partida acaba de superarlo. */
export function BestLine({ best, isNew }: { best: number; isNew: boolean }) {
  return <p className="gs-best">{isNew ? <b>¡Nuevo récord!</b> : null} Mejor puntaje en este navegador: {best}</p>
}

/** Pequeños iconos de línea usados en los HUD. */
export const Icon = {
  clock: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  star: <svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7L12 3Z" /></svg>,
  smoke: <svg viewBox="0 0 24 24"><path d="M7 18a4 4 0 1 1 1.2-7.8A5 5 0 0 1 17.6 9 3.5 3.5 0 1 1 17 18H7Z" /></svg>,
  box: <svg viewBox="0 0 24 24"><path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z" /><path d="m4 7 8 4 8-4M12 11v10" /></svg>,
  bolt: <svg viewBox="0 0 24 24"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg>,
  battery: <svg viewBox="0 0 24 24"><rect x="3" y="7" width="16" height="10" rx="2" /><path d="M21 10v4M7 10v4M11 10v4" /></svg>,
  drop: <svg viewBox="0 0 24 24"><path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z" /></svg>,
  sack: <svg viewBox="0 0 24 24"><path d="M9 4h6l-2 3c4 1 7 5 7 9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4c0-4 3-8 7-9L9 4Z" /></svg>,
  leaf: <svg viewBox="0 0 24 24"><path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15Z" /><path d="M5 19 13 11" /></svg>,
  shield: <svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /></svg>,
  sprout: <svg viewBox="0 0 24 24"><path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6ZM12 12c0-3 2.5-5 6-5 0 3-2.5 5-6 5Z" /></svg>,
  land: <svg viewBox="0 0 24 24"><path d="M3 17c3-4 6-6 9-6s6 2 9 6M3 21h18" /></svg>,
  calendar: <svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>,
  wheat: <svg viewBox="0 0 24 24"><path d="M12 21V8M12 8c-2-1-3-3-3-5 2 0 3 2 3 5Zm0 0c2-1 3-3 3-5-2 0-3 2-3 5Zm0 5c-2-1-4-2-4-5 2 0 4 2 4 5Zm0 0c2-1 4-2 4-5-2 0-4 2-4 5Z" /></svg>,
  ruler: <svg viewBox="0 0 24 24"><path d="M3 16 16 3l5 5L8 21l-5-5ZM7 12l2 2M10 9l2 2M13 6l2 2" /></svg>,
  route: <svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="6" r="2.5" /><path d="M8 17c6 0 2-10 8-10" /></svg>,
  check: <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>,
}
