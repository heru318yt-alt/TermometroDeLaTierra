import type { ClimateYear, MonthDate, TimeWindow } from '../climate/types'
import { averageAnnualRange, averageRange, getAnnualAnomaly } from '../climate/math'

export type ViewMode = 'monthly' | 'annual'
export const FIRST_YEAR = 1926
export const toIndex = (date: MonthDate) => date.year * 12 + date.month - 1
export const fromIndex = (value: number): MonthDate => ({ year: Math.floor(value / 12), month: value % 12 + 1 })
export const toMonthString = (date: MonthDate) => `${date.year}-${String(date.month).padStart(2, '0')}`
export const fromMonthString = (value: string): MonthDate => ({ year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)) })
const monthlyFormat = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' })
export const formatAnomaly = (value: number | null) => value === null ? 'Sin dato disponible' : `${numberFormat.format(value)} °C`
export const formatDate = (date: MonthDate, mode: ViewMode) => mode === 'annual' ? `${date.year} · anual J-D` : monthlyFormat.format(new Date(Date.UTC(date.year, date.month - 1)))

// Fixed across all dates, not recomputed per selection. Outliers saturate explicitly.
export const colorStops = [
  { value: -1, color: '#3469a1' }, { value: -.5, color: '#89b5cd' },
  { value: 0, color: '#e5e6d8' }, { value: .5, color: '#e8be81' },
  { value: 1, color: '#d88350' }, { value: 1.5, color: '#b84b37' }, { value: 2, color: '#812b34' },
]
export function anomalyColor(value: number | null): string {
  if (value === null) return '#bec8c0'
  const clamped = Math.max(-1, Math.min(2, value))
  const upper = colorStops.findIndex(stop => stop.value >= clamped)
  if (upper === 0) return colorStops[0].color
  const a = colorStops[upper - 1], b = colorStops[upper]
  const t = (clamped - a.value) / (b.value - a.value)
  const rgb = (hex: string) => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16))
  return `rgb(${rgb(a.color).map((channel, i) => Math.round(channel + (rgb(b.color)[i] - channel) * t)).join(', ')})`
}

/** Two non-overlapping, fully observed five-year windows inside the requested interval. */
export function analyzePeriod(years: readonly ClimateYear[], window: TimeWindow, mode: ViewMode) {
  if (toIndex(window.start) > toIndex(window.end)) return { error: 'La fecha inicial debe ser anterior o igual a la final.' }
  const interval = mode === 'monthly' ? averageRange(years, window) : averageAnnualRange(years, window.start.year, window.end.year)
  let firstYear = window.start.year + (mode === 'monthly' && window.start.month !== 1 ? 1 : 0)
  let lastYear = window.end.year - (mode === 'monthly' && window.end.month !== 12 ? 1 : 0)
  while (firstYear <= lastYear && getAnnualAnomaly(years, firstYear) === null) firstYear++
  while (lastYear >= firstYear && getAnnualAnomaly(years, lastYear) === null) lastYear--
  if (lastYear - firstYear + 1 < 10) return { interval, error: 'Se necesitan al menos diez años completos para comparar dos ventanas de cinco años sin solapamiento.' }
  const first = averageAnnualRange(years, firstYear, firstYear + 4)
  const last = averageAnnualRange(years, lastYear - 4, lastYear)
  if (first.mean === null || last.mean === null) return { interval, error: 'Faltan valores J-D completos en alguna de las ventanas de cinco años.' }
  return {
    interval, first, last,
    firstLabel: `${firstYear}–${firstYear + 4}`, lastLabel: `${lastYear - 4}–${lastYear}`,
    difference: last.mean - first.mean,
  }
}
