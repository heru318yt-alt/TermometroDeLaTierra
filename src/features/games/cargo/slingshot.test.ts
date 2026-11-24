import { describe, expect, it } from 'vitest'
import { anomalyToFrequency } from '../../audio/sonify'
import { MIN_POWER, ORIGIN, ROUTES, batchEmissionsTonnes, batchSpreadHalf, flightTime } from './engine'
import { MODE_CONTROL, evaluateDrag, handlePos, isInLauncherZone, stepSmoothedAim } from './slingshot'
import { H, W, px, py } from './render'

describe('slingshot · detección y prevención de clics accidentales', () => {
  const ox = px(ORIGIN.x)
  const oy = py(ORIGIN.y)

  it('selecciona dentro del vehículo/lanzador y rechaza clics en el cielo o destino', () => {
    expect(isInLauncherZone(ox, oy, ox, oy, 45, 0.7, false)).toBe(true)
    expect(isInLauncherZone(ox - 12, oy + 6, ox, oy, 45, 0.7, false)).toBe(true)
    expect(isInLauncherZone(320, 140, ox, oy, 45, 0.7, false)).toBe(false)
    expect(isInLauncherZone(480, 320, ox, oy, 45, 0.7, false)).toBe(false)
    // Táctil amplía ligeramente la zona de agarre alrededor del lanzador.
    expect(isInLauncherZone(ox + 50, oy - 8, ox, oy, 45, 0.7, false)).toBe(false)
    expect(isInLauncherZone(ox + 50, oy - 8, ox, oy, 45, 0.7, true)).toBe(true)
  })

  it('previene disparos accidentales sin arrastre suficiente o hacia adelante', () => {
    const start = { x: ox, y: oy }
    expect(evaluateDrag('road', start, start, 45, 0.7).armed).toBe(false)
    expect(evaluateDrag('road', start, { x: start.x - 5, y: start.y + 4 }, 45, 0.7).armed).toBe(false)
    expect(evaluateDrag('road', start, { x: start.x + 25, y: start.y + 10 }, 45, 0.7).armed).toBe(false)
    expect(evaluateDrag('rail', start, { x: start.x + 15, y: start.y - 10 }, 45, 0.7).armed).toBe(false)
  })
})

describe('slingshot · comportamiento diferenciado por medio de transporte', () => {
  const ox = px(ORIGIN.x)
  const oy = py(ORIGIN.y)
  const start = { x: ox + 20, y: oy - 10 }

  it('carretera: permite ángulo libre 10°–80° y acota potencia entre MIN_POWER y 1', () => {
    const low = evaluateDrag('road', start, { x: start.x - 30, y: start.y - 15 }, 45)
    expect(low.armed).toBe(true)
    expect(low.angle).toBe(MODE_CONTROL.road.minAngle)

    const high = evaluateDrag('road', start, { x: start.x - 2, y: start.y + 45 }, 45)
    expect(high.armed).toBe(true)
    expect(high.angle).toBe(MODE_CONTROL.road.maxAngle)

    const full = evaluateDrag('road', start, { x: start.x - 90, y: start.y + 90 }, 45)
    expect(full.atMax).toBe(true)
    expect(full.power).toBe(1)
  })

  it('ferrocarril: bloquea el ángulo estrictamente a 45° y avisa si el jugador se desvía de la vía', () => {
    const steepDrag = evaluateDrag('rail', start, { x: start.x - 65, y: start.y - 5 }, 30)
    expect(steepDrag.armed).toBe(true)
    expect(steepDrag.angle).toBe(45)
    expect(steepDrag.offAxisWarning).toBe(true)
    expect(steepDrag.power).toBeGreaterThanOrEqual(MIN_POWER)

    const aligned = evaluateDrag('rail', start, { x: start.x - 50, y: start.y + 50 }, 20)
    expect(aligned.armed).toBe(true)
    expect(aligned.angle).toBe(45)
    expect(aligned.offAxisWarning).toBe(false)
    expect(aligned.atMax).toBe(true)
  })

  it('barco: exige mayor recorrido que avión y responde con inercia pesada', () => {
    const mediumPull = { x: start.x - 32, y: start.y + 28 } // dist ≈ 42.5 px
    const shipDrag = evaluateDrag('ship', start, mediumPull, 45)
    const planeDrag = evaluateDrag('plane', start, mediumPull, 45)

    expect(planeDrag.atMax).toBe(true)
    expect(planeDrag.power).toBe(1)
    expect(shipDrag.atMax).toBe(false)
    expect(shipDrag.power).toBeLessThan(0.8)

    const afterShortDt = stepSmoothedAim({ angle: 45, power: 0.4 }, { angle: 60, power: 1 }, 'ship', 0.016, false)
    expect(afterShortDt.power).toBeGreaterThan(0.4)
    expect(afterShortDt.power).toBeLessThan(1)
  })

  it('avión: tiro corto hipersensible con respuesta inmediata', () => {
    const next = stepSmoothedAim({ angle: 45, power: 0.3 }, { angle: 28, power: 0.9 }, 'plane', 0.016, false)
    expect(next).toEqual({ angle: 28, power: 0.9 })
  })

  it('mantiene la posición visual de la manija dentro de los límites del lienzo', () => {
    for (const mode of ['road', 'rail', 'ship', 'plane'] as const) {
      const p = handlePos(ox, oy, mode, 45, 1, W, H)
      expect(p.x).toBeGreaterThanOrEqual(11.9)
      expect(p.x).toBeLessThanOrEqual(W - 11.9)
      expect(p.y).toBeGreaterThanOrEqual(15.9)
      expect(p.y).toBeLessThanOrEqual(H - 11.9)
    }
  })
})

describe('utilidades físicas y sonificación', () => {
  it('calcula tiempo de vuelo, dispersión del lote y emisiones esperadas', () => {
    expect(flightTime('ship', 45, 0.9)).toBeGreaterThan(flightTime('plane', 45, 0.9) * 2)
    expect(batchSpreadHalf('ship')).toBeGreaterThan(batchSpreadHalf('road'))
    expect(batchEmissionsTonnes('plane', ROUTES[2])).toBeGreaterThan(batchEmissionsTonnes('ship', ROUTES[2]) * 10)
  })

  it('mapea anomalías [-1, +2] °C a frecuencias lineales [220, 660] Hz', () => {
    expect(anomalyToFrequency(-1)).toBe(220)
    expect(anomalyToFrequency(-5)).toBe(220)
    expect(anomalyToFrequency(0.5)).toBe(440)
    expect(anomalyToFrequency(2)).toBe(660)
    expect(anomalyToFrequency(4)).toBe(660)
  })
})
