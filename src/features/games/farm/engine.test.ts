import { describe, expect, it } from 'vitest'
import {
  FERTILIZER_STOCK, LAND_LOSS, MIN_WIN_FOOD, SCORE_BONUS_FERTILIZER, SCORE_BONUS_STEP, SCORE_BONUS_WATER,
  SOILS, WATER_STOCK,
  adaptation, allChoices, applyWeather, canAfford, costOf, createGame, evaluate, finishManual, nextSoil,
  play, score, soilTrend, summarize, totalScore, weakestPart, type Choice, type Soil,
} from './engine'

const best = (soil: Soil) => allChoices().reduce((a, b) => (adaptation(soil, b) > adaptation(soil, a) ? b : a))

describe('adaptación al terreno', () => {
  it('siempre está entre 0 y 1 y señala la parte débil', () => {
    for (const soil of SOILS) for (const c of allChoices()) { const a = adaptation(soil, c); expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThanOrEqual(1) }
    expect(weakestPart('waterlogged', { mgmt: 'rest', fert: 3, herd: 0 })).toBe('fert')
    expect(weakestPart('dry', { mgmt: 'rest', fert: 1, herd: 1 })).toBeNull()
  })

  it('el clima y las emisiones responden al manejo elegido', () => {
    const o = evaluate('dry', 'normal', { mgmt: 'graze', fert: 1, herd: 1 })
    expect(o.food).toBeGreaterThan(4); expect(o.trend).toBe('improves'); expect(o.soilAfter).toBe('fertile')
    expect(applyWeather('fertile', 'drought')).toBe('dry')
    expect(nextSoil('dry', soilTrend(0.85))).toBe('fertile')
  })
})

describe('modo arcade por temporadas infinitas', () => {
  it('gasta recursos, pierde tierra útil al degradar y repone margen estacional sin detenerse en la 8.ª temporada', () => {
    const s = createGame(3)
    const c: Choice = { mgmt: 'crop', fert: 2, herd: 2 }
    const r = play(s, c)!
    expect(s.water).toBeLessThanOrEqual(WATER_STOCK)
    expect(s.fertilizer).toBeLessThanOrEqual(FERTILIZER_STOCK)
    expect(r.water).toBe(costOf('fertile', 'normal', c).water)

    for (let i = 0; i < 12; i++) {
      let pick: Choice
      if (s.soil === 'fertile') pick = { mgmt: 'crop', fert: 2, herd: 2 }
      else if (s.soil === 'dry') pick = { mgmt: 'graze', fert: 1, herd: 1 }
      else pick = { mgmt: 'rest', fert: 1, herd: 0 }
      if (!canAfford(s, pick).ok) pick = { mgmt: 'rest', fert: 0, herd: 0 }
      play(s, pick)
    }
    expect(s.season).toBe(13)
    expect(s.status).toBe('playing')
  })

  it('supera la meta del reto en vivo y permite seguir acumulando alimentos', () => {
    const g = createGame(2)
    let clearedAt = 0
    for (let i = 0; i < 14 && g.status === 'playing'; i++) {
      let pick: Choice
      if (g.soil === 'fertile') pick = { mgmt: 'crop', fert: 2, herd: 2 }
      else if (g.soil === 'dry') pick = { mgmt: 'graze', fert: 1, herd: 1 }
      else pick = { mgmt: 'rest', fert: 1, herd: 0 }
      if (!canAfford(g, pick).ok) pick = { mgmt: 'rest', fert: 0, herd: 0 }
      play(g, pick)
      if (g.challengeCleared && clearedAt === 0) clearedAt = g.season
    }
    expect(g.challengeCleared).toBe(true)
    expect(clearedAt).toBeGreaterThanOrEqual(5)
    expect(clearedAt).toBeLessThan(12)
    expect(totalScore(g)).toBeGreaterThanOrEqual(MIN_WIN_FOOD)
    expect(summarize(g).passed).toBe(true)

    finishManual(g)
    expect(g.status).toBe('finished')
    expect(g.endReason).toBe('manual')
  })

  it('colapsa si la tierra útil cae por sobreexplotación o hambre y rechaza repetir una sola acción', () => {
    const s = createGame(1)
    s.soil = 'degraded'
    play(s, { mgmt: 'crop', fert: 3, herd: 3 })
    expect(s.land).toBe(100 - LAND_LOSS)

    const fixed = createGame(1)
    for (let i = 0; i < 8 && fixed.status === 'playing'; i++) {
      const c: Choice = canAfford(fixed, best('fertile')).ok ? best('fertile') : { mgmt: 'rest', fert: 0, herd: 0 }
      play(fixed, c)
    }
    expect(summarize(fixed).passed).toBe(false)
    expect(score(fixed)).toBeGreaterThan(0)
  })

  it('recarga un pequeño bono de agua y fertilizante al alcanzar hitos de puntaje respetando los topes', () => {
    const g = createGame(2)
    g.water = 16
    g.fertilizer = 4
    g.food = SCORE_BONUS_STEP - 5
    const r = play(g, { mgmt: 'crop', fert: 1, herd: 1 })!
    expect(totalScore(g)).toBeGreaterThanOrEqual(SCORE_BONUS_STEP)
    expect(g.scoreMilestonesClaimed).toBe(1)
    expect(r.scoreBonus).toEqual({ water: SCORE_BONUS_WATER, fertilizer: SCORE_BONUS_FERTILIZER })
    expect(g.water).toBeLessThanOrEqual(WATER_STOCK)
    expect(g.fertilizer).toBeLessThanOrEqual(FERTILIZER_STOCK)

    const capped = createGame(2)
    capped.food = SCORE_BONUS_STEP - 5
    const rCap = play(capped, { mgmt: 'crop', fert: 1, herd: 1 })!
    expect(capped.water).toBeLessThanOrEqual(WATER_STOCK)
    expect(capped.fertilizer).toBeLessThanOrEqual(FERTILIZER_STOCK)
    expect(rCap.scoreBonus?.fertilizer).toBe(1)
  })
})
