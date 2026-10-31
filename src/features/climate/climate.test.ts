import { describe, expect, it } from 'vitest'
import { assertHistoryPreserved, createDataset, parseGistempCsv } from './parse'
import { averageAnnualRange, averageRange, averageWindows, compareWindows, getAnnualAnomaly, getFirstRecord, getLastRecord, getMonthlyAnomaly, getParisThresholds, queryInterval } from './math'
import { getClimateData, getClimateSummary } from './service'

// Synthetic, intentionally simple test data. Never served in the application.
const header = 'Land-Ocean: Global Means\nYear,Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec,J-D,D-N,DJF,MAM,JJA,SON'
function row(year: number, months = Array<string>(12).fill('-.20'), annual = '-.20') {
  return [year, ...months, annual, '***', '***', '***', '***', '***'].join(',')
}
const csv = `${header}\n${Array.from({ length: 21 }, (_, i) => row(1880 + i)).join('\n')}\n`
const years = parseGistempCsv(csv)
const january = { year: 1880, month: 1 }
const march = { year: 1880, month: 3 }
const range = { start: january, end: march }

describe('Lectura del CSV oficial', () => {
  it('interpreta BOM, CRLF, números decimales, cero, signo y J-D independiente', () => {
    const data = parseGistempCsv(`\uFEFF${header}\n${row(1880, ['-.19', '.00', '+.10', ...Array<string>(9).fill('.20')], '.13')}`.replaceAll('\n', '\r\n'))
    expect(data[0].months.slice(0, 3)).toEqual([-.19, 0, .1])
    expect(data[0].annual).toBe(.13)
    expect(data[0].months).toHaveLength(12)
  })
  it('conserva meses faltantes y no crea un J-D para un año incompleto', () => {
    const data = parseGistempCsv(`${header}\n${row(1880, ['.50', ...Array<string>(11).fill('***')], '***')}`)
    expect(data[0].months[1]).toBeNull()
    expect(getAnnualAnomaly(data, 1880)).toBeNull()
    expect(getLastRecord(data)).toEqual({ year: 1880, month: 1, anomaly: .5 })
  })
  it('conserva J-D faltante aun cuando hay doce meses', () => {
    expect(parseGistempCsv(`${header}\n${row(1880, undefined, '***')}`)[0].annual).toBeNull()
  })
  it.each([
    '<html>error</html>', csv.replace('Jan', 'Ene'), csv.replace('-.20', ''),
    csv.replace('-.20', 'NaN'), csv.replace('-.20', '1x'), csv.replace('1881,', '1880,'),
    csv.replace('1881,', '1882,'), `${header}\n${row(1880)},extra`,
    `${header}\n${row(1880, Array<string>(12).fill('***'), '.4')}`,
  ])('rechaza datos mal formados sin corregirlos silenciosamente (%#)', input => {
    expect(() => parseGistempCsv(input)).toThrow()
  })
})

describe('Consultas y cálculos', () => {
  it('consulta meses y J-D oficiales', () => {
    expect(getMonthlyAnomaly(years, january)).toBe(-.2)
    expect(getAnnualAnomaly(years, 1880)).toBe(-.2)
    expect(getFirstRecord(years)?.year).toBe(1880)
    expect(getLastRecord(years)).toEqual({ year: 1900, month: 12, anomaly: -.2 })
  })
  it('incluye extremos y calcula la media sin redondear', () => {
    const custom = [{ year: 1880, months: [0, 1, 2, ...Array<number>(9).fill(3)], annual: 2 }]
    expect(queryInterval(custom, range)).toHaveLength(3)
    expect(averageRange(custom, range)).toEqual({ mean: 1, count: 3, expected: 3, complete: true })
  })
  it('distingue rango incompleto de media parcial explícita', () => {
    const custom = [{ year: 1880, months: [0, null, 2, ...Array<null>(9).fill(null)], annual: null }]
    expect(averageRange(custom, range)).toEqual({ mean: null, count: 2, expected: 3, complete: false })
    expect(averageRange(custom, range, true).mean).toBe(1)
  })
  it('calcula ventanas y comparación segunda menos primera', () => {
    const custom = [{ year: 1880, months: [0, 1, 2, ...Array<number>(9).fill(3)], annual: 2 }]
    const second = { start: { year: 1880, month: 4 }, end: { year: 1880, month: 6 } }
    expect(averageWindows(custom, [range, second]).map(value => value.mean)).toEqual([1, 3])
    expect(compareWindows(custom, range, second).difference).toBe(2)
  })
  it('no extrapola fuera del rango ni divide por cero', () => {
    const outside = { start: { year: 1700, month: 1 }, end: { year: 1700, month: 12 } }
    expect(getMonthlyAnomaly(years, outside.start)).toBeNull()
    expect(getAnnualAnomaly(years, 2200)).toBeNull()
    expect(queryInterval(years, outside)).toEqual([])
    expect(averageRange(years, outside, true).mean).toBeNull()
    expect(compareWindows(years, range, outside).difference).toBeNull()
    expect(getFirstRecord([])).toBeNull()
    expect(getLastRecord([])).toBeNull()
    expect(averageRange(years, { start: { year: 1879, month: 12 }, end: january }).complete).toBe(false)
  })
  it('rechaza fechas inválidas y rangos invertidos', () => {
    expect(() => getMonthlyAnomaly(years, { year: 1880, month: 13 })).toThrow(RangeError)
    expect(() => queryInterval(years, { start: march, end: january })).toThrow(RangeError)
    expect(() => averageAnnualRange(years, 1900, 1880)).toThrow(RangeError)
  })
  it('convierte los umbrales mediante 21 J-D, no promedios mensuales ni constantes históricas', () => {
    const modified = years.map(year => ({ ...year, annual: -.3 }))
    const result = getParisThresholds(modified)
    expect(result.baseline.count).toBe(21)
    expect(result.baseline.mean).toBeCloseTo(-.3, 12)
    expect(result.level15).toBeCloseTo(1.2, 12)
    expect(result.level20).toBeCloseTo(1.7, 12)
    expect(getParisThresholds(years).level15).toBeCloseTo(1.3, 12)
    expect(getParisThresholds(years.slice(1)).level15).toBeNull()
  })
})

describe('Conjunto procesado y protección de historia', () => {
  const data = createDataset(csv, '2026-10-31T00:00:00Z', 'a'.repeat(64))
  it('genera metadatos y detecta cobertura', () => {
    expect(data.yearCount).toBe(21)
    expect(data.monthCount).toBe(252)
    expect(data.firstDate).toBe('1880-01')
    expect(data.lastDate).toBe('1900-12')
    expect(data.source.referencePeriod).toBe('1951–1980')
  })
  it('no genera un conjunto con referencia histórica incompleta', () => {
    expect(() => createDataset(`${header}\n${row(1880)}`, '2026-10-31T00:00:00Z', 'a'.repeat(64))).toThrow(/21 años/)
  })
  it('el resumen no trata el último año parcial como completo', () => {
    const partial = createDataset(`${csv}${row(1901, ['.40', ...Array<string>(11).fill('***')], '***')}`, '2026-10-31T00:00:00Z', 'a'.repeat(64))
    const summary = getClimateSummary(partial)
    expect(summary.latest).toEqual({ year: 1901, month: 1, anomaly: .4 })
    expect(summary.latestAnnual).toEqual({ year: 1900, anomaly: -.2 })
  })
  it('rechaza eliminar historia pero permite revisiones numéricas oficiales', () => {
    expect(() => assertHistoryPreserved(data, { ...data, years: data.years.slice(1) })).toThrow()
    const missing = structuredClone(data)
    missing.years[0].months[0] = null
    expect(() => assertHistoryPreserved(data, missing)).toThrow()
    const revised = structuredClone(data)
    revised.years[0].months[0] = -.21
    expect(() => assertHistoryPreserved(data, revised)).not.toThrow()
  })
  it('valida que el JSON real respeta las invariantes sin fijar su último año', () => {
    const real = getClimateData()
    const summary = getClimateSummary()
    expect(real.years[0].year).toBe(1880)
    expect(real.yearCount).toBe(real.years.length)
    expect(real.monthCount).toBe(real.years.flatMap(year => year.months).filter(value => value !== null).length)
    expect(real.lastDate).toBe(`${summary.latest!.year}-${String(summary.latest!.month).padStart(2, '0')}`)
    expect(summary.thresholds.baseline.complete).toBe(true)
    expect(summary.latestAnnual?.anomaly).toBe(getAnnualAnomaly(real.years, summary.latestAnnual!.year))
    expect(real.years.every(year => year.months.length === 12 && (year.annual === null || year.months.every(value => value !== null)))).toBe(true)
  })
})
