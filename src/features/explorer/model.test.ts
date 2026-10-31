import { describe, expect, it } from 'vitest'
import { analyzePeriod, anomalyColor, fromIndex, toIndex } from './model'
import type { ClimateYear } from '../climate/types'

// Synthetic fixtures, deliberately distinct J-D and monthly values.
const years: ClimateYear[] = Array.from({ length: 11 }, (_, index) => ({ year: 2000 + index, months: Array<number>(12).fill(index / 10), annual: index / 20 }))
describe('Comparaciones de períodos', () => {
  it('calcula el intervalo mensual y dos ventanas de cinco J-D completos', () => {
    const result = analyzePeriod(years, { start: { year: 2000, month: 1 }, end: { year: 2009, month: 12 } }, 'monthly')
    expect(result.interval?.mean).toBeCloseTo(.45)
    expect(result.interval?.count).toBe(120)
    expect(result.first?.mean).toBeCloseTo(.1)
    expect(result.last?.mean).toBeCloseTo(.35)
    expect(result.difference).toBeCloseTo(.25)
    expect(result.firstLabel).toBe('2000–2004')
    expect(result.lastLabel).toBe('2005–2009')
  })
  it('en modo anual utiliza J-D para el promedio del intervalo', () => {
    const result = analyzePeriod(years, { start: { year: 2000, month: 1 }, end: { year: 2009, month: 12 } }, 'annual')
    expect(result.interval?.mean).toBeCloseTo(.225)
    expect(result.interval?.count).toBe(10)
  })
  it('excluye el último año incompleto de las ventanas, sin rellenar su anual', () => {
    const partial = [...years.slice(0, 10), { year: 2010, months: [.6, ...Array<null>(11).fill(null)], annual: null }]
    const result = analyzePeriod(partial, { start: { year: 2000, month: 1 }, end: { year: 2010, month: 1 } }, 'annual')
    expect(result.interval?.mean).toBeNull()
    expect(result.interval?.count).toBe(10)
    expect(result.lastLabel).toBe('2005–2009')
    expect(result.difference).toBeCloseTo(.25)
  })
  it('no solapa ventanas ni usa años parcialmente incluidos en vista mensual', () => {
    const result = analyzePeriod(years, { start: { year: 2000, month: 2 }, end: { year: 2009, month: 12 } }, 'monthly')
    expect(result.error).toContain('diez años completos')
    expect(result.difference).toBeUndefined()
  })
  it('rechaza ventanas con J-D faltante y rangos invertidos', () => {
    const missing = years.map(row => row.year === 2002 ? { ...row, annual: null } : row)
    expect(analyzePeriod(missing, { start: { year: 2000, month: 1 }, end: { year: 2009, month: 12 } }, 'monthly').error).toContain('Faltan valores')
    expect(analyzePeriod(years, { start: { year: 2005, month: 1 }, end: { year: 2000, month: 1 } }, 'monthly').error).toContain('fecha inicial')
  })
})
it('mantiene una escala de color fija y distingue ausencia de dato', () => {
  expect(anomalyColor(-2)).toBe(anomalyColor(-1))
  expect(anomalyColor(3)).toBe(anomalyColor(2))
  expect(anomalyColor(null)).not.toBe(anomalyColor(0))
  expect(anomalyColor(-.5)).not.toBe(anomalyColor(.5))
  expect(fromIndex(toIndex({ year: 1926, month: 1 }))).toEqual({ year: 1926, month: 1 })
})
