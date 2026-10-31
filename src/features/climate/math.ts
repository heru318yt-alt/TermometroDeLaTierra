import type { AverageResult, ClimateYear, MonthDate, MonthlyRecord, TimeWindow } from './types.ts'

function monthIndex(date: MonthDate): number {
  if (!Number.isInteger(date.year) || date.year < 1 || date.year > 9999 ||
      !Number.isInteger(date.month) || date.month < 1 || date.month > 12) {
    throw new RangeError('Fecha inválida: se requiere año entero y mes entre 1 y 12.')
  }
  return date.year * 12 + date.month - 1
}

export function getMonthlyAnomaly(years: readonly ClimateYear[], date: MonthDate): number | null {
  monthIndex(date)
  return years.find(row => row.year === date.year)?.months[date.month - 1] ?? null
}

export function getAnnualAnomaly(years: readonly ClimateYear[], year: number): number | null {
  monthIndex({ year, month: 1 })
  const row = years.find(row => row.year === year)
  return row && row.months.length === 12 && row.months.every(value => value !== null) ? row.annual : null
}

export function getAvailableRecords(years: readonly ClimateYear[]): MonthlyRecord[] {
  return years.flatMap(row => row.months.flatMap((value, index) =>
    value === null ? [] : [{ year: row.year, month: index + 1, anomaly: value }],
  )).sort((a, b) => monthIndex(a) - monthIndex(b))
}

export function getFirstRecord(years: readonly ClimateYear[]): MonthlyRecord | null {
  return getAvailableRecords(years)[0] ?? null
}

export function getLastRecord(years: readonly ClimateYear[]): MonthlyRecord | null {
  return getAvailableRecords(years).at(-1) ?? null
}

/** Inclusive endpoints; missing months are omitted, never converted to zero. */
export function queryInterval(years: readonly ClimateYear[], window: TimeWindow): MonthlyRecord[] {
  const start = monthIndex(window.start)
  const end = monthIndex(window.end)
  if (start > end) throw new RangeError('El inicio del intervalo debe preceder al final.')
  return getAvailableRecords(years).filter(row => monthIndex(row) >= start && monthIndex(row) <= end)
}

/** Equal monthly weighting. Incomplete intervals yield null unless explicitly allowed. */
export function averageRange(years: readonly ClimateYear[], window: TimeWindow, allowPartial = false): AverageResult {
  const records = queryInterval(years, window)
  const expected = monthIndex(window.end) - monthIndex(window.start) + 1
  const count = records.length
  const complete = count === expected
  return {
    mean: count > 0 && (complete || allowPartial) ? records.reduce((sum, row) => sum + row.anomaly, 0) / count : null,
    count, expected, complete,
  }
}

export function averageWindows(years: readonly ClimateYear[], windows: readonly TimeWindow[], allowPartial = false) {
  return windows.map(window => ({ ...window, ...averageRange(years, window, allowPartial) }))
}

/** Difference = second window minus first window, in °C. */
export function compareWindows(years: readonly ClimateYear[], first: TimeWindow, second: TimeWindow, allowPartial = false) {
  const a = averageRange(years, first, allowPartial)
  const b = averageRange(years, second, allowPartial)
  return { first: a, second: b, difference: a.mean === null || b.mean === null ? null : b.mean - a.mean }
}

/** Equal yearly weighting of official complete J-D values, inclusive years. */
export function averageAnnualRange(years: readonly ClimateYear[], start: number, end: number): AverageResult {
  monthIndex({ year: start, month: 1 })
  monthIndex({ year: end, month: 12 })
  if (start > end) throw new RangeError('Rango anual invertido.')
  const values: number[] = []
  for (let year = start; year <= end; year++) {
    const value = getAnnualAnomaly(years, year)
    if (value !== null) values.push(value)
  }
  const expected = end - start + 1
  const complete = values.length === expected
  return { mean: complete ? values.reduce((sum, value) => sum + value, 0) / expected : null, count: values.length, expected, complete }
}

/** Educational proxy only: 1880–1900 is not the full 1850–1900 baseline. */
export function getParisThresholds(years: readonly ClimateYear[]) {
  const baseline = averageAnnualRange(years, 1880, 1900)
  return {
    baseline,
    referencePeriod: '1880–1900',
    anomalyReferencePeriod: '1951–1980',
    level15: baseline.mean === null ? null : baseline.mean + 1.5,
    level20: baseline.mean === null ? null : baseline.mean + 2,
  }
}
