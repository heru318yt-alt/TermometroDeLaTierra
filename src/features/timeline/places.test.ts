import { describe, expect, it } from 'vitest'
import { mapEvents, project } from './places'

describe('proyección cartográfica de lugares históricos', () => {
  it('ubica todas las sedes documentadas dentro del visor del mapa SVG', () => {
    const placed = mapEvents.filter(event => event.place !== null)
    expect(placed.length).toBeGreaterThan(0)

    for (const event of placed) {
      const point = project(event.place!)
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(720)
      expect(point.y).toBeGreaterThanOrEqual(25)
      expect(point.y).toBeLessThanOrEqual(320)
    }
  })

  it('centra el ecuador y converge las latitudes altas en la proyección pseudo-cilíndrica', () => {
    expect(project({ name: 'Ecuador', lat: 0, lon: 0 })).toEqual({ x: 360, y: 190 })
    const highLatDelta = Math.abs(project({ name: 'N', lat: 60, lon: 180 }).x - 360)
    const equatorDelta = Math.abs(project({ name: 'Eq', lat: 0, lon: 180 }).x - 360)
    expect(highLatDelta).toBeLessThan(equatorDelta)
  })
})
