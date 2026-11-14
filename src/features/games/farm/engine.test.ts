import { describe, expect, it } from 'vitest'
import { FERTILIZER_STOCK, LAND_LOSS, SEASONS, SOILS, WATER_STOCK, adaptation, allChoices, applyWeather, canAfford, costOf, createGame, evaluate, nextSoil, play, score, soilTrend, summarize, weakestPart, type Choice, type GameState, type Soil } from './engine'

const best = (soil: Soil) => allChoices().reduce((a, b) => (adaptation(soil, b) > adaptation(soil, a) ? b : a))

describe('adaptación al terreno', () => {
  it('siempre está entre 0 y 1', () => {
    for (const soil of SOILS) for (const c of allChoices()) { const a = adaptation(soil, c); expect(a).toBeGreaterThanOrEqual(0); expect(a).toBeLessThanOrEqual(1) }
  })

  it('cada suelo tiene su mejor combinación y no es la misma', () => {
    expect(best('fertile')).toEqual({ mgmt: 'crop', fert: 2, herd: 2 })
    expect(best('degraded')).toEqual({ mgmt: 'rest', fert: 1, herd: 0 })
    const picks = new Set(SOILS.map(s => JSON.stringify(best(s))))
    expect(picks.size).toBeGreaterThanOrEqual(3)
    expect(best('dry').fert).toBe(1)
  })

  it('una misma combinación rinde distinto según el terreno', () => {
    const c: Choice = { mgmt: 'crop', fert: 2, herd: 2 }
    expect(adaptation('fertile', c)).toBeGreaterThan(adaptation('dry', c))
    expect(adaptation('fertile', c)).toBeGreaterThan(adaptation('degraded', c))
  })

  it('señala la parte que peor encaja', () => {
    expect(weakestPart('waterlogged', { mgmt: 'rest', fert: 3, herd: 0 })).toBe('fert')
    expect(weakestPart('dry', { mgmt: 'rest', fert: 1, herd: 1 })).toBeNull()
  })
})

describe('producción, emisiones y suelo', () => {
  it('más adaptación da más alimentos con la misma combinación base', () => {
    const c: Choice = { mgmt: 'crop', fert: 2, herd: 2 }
    expect(evaluate('fertile', 'normal', c).food).toBeGreaterThan(evaluate('degraded', 'normal', c).food)
  })

  it('el hato produce metano y el nitrogenado produce óxido nitroso', () => {
    const none = evaluate('fertile', 'normal', { mgmt: 'graze', fert: 0, herd: 0 })
    const herd = evaluate('fertile', 'normal', { mgmt: 'graze', fert: 0, herd: 3 })
    expect(none.ch4).toBe(0); expect(herd.ch4).toBeGreaterThan(8)
    const organic = evaluate('waterlogged', 'normal', { mgmt: 'rest', fert: 1, herd: 0 })
    const nitro = evaluate('waterlogged', 'normal', { mgmt: 'rest', fert: 3, herd: 0 })
    expect(nitro.n2o).toBeGreaterThan(organic.n2o * 4)
  })

  it('el mismo fertilizante emite más en un suelo encharcado que en uno fértil', () => {
    const c: Choice = { mgmt: 'crop', fert: 3, herd: 0 }
    expect(evaluate('waterlogged', 'normal', c).n2o).toBeGreaterThan(evaluate('fertile', 'normal', c).n2o)
  })

  it('el descanso con materia orgánica recupera un suelo degradado y casi no produce', () => {
    const o = evaluate('degraded', 'normal', best('degraded'))
    expect(o.trend).toBe('improves'); expect(o.soilAfter).toBe('dry'); expect(o.co2).toBeLessThan(0); expect(o.food).toBeLessThan(1)
    expect(nextSoil('dry', 'improves')).toBe('fertile')
  })

  it('presionar un suelo degradado o seco lo empeora y suma CO₂', () => {
    const o = evaluate('dry', 'normal', { mgmt: 'crop', fert: 3, herd: 3 })
    expect(o.trend).toBe('worsens'); expect(o.soilAfter).toBe('degraded'); expect(o.co2).toBeGreaterThan(0)
    expect(soilTrend(0.6)).toBe('same')
  })

  it('en un suelo seco, pastorear con materia orgánica y hato pequeño produce y mejora', () => {
    const o = evaluate('dry', 'normal', { mgmt: 'graze', fert: 1, herd: 1 })
    expect(o.food).toBeGreaterThan(4); expect(o.trend).toBe('improves'); expect(o.soilAfter).toBe('fertile')
  })

  it('el clima cambia el estado del suelo', () => {
    expect(applyWeather('fertile', 'drought')).toBe('dry')
    expect(applyWeather('fertile', 'rain')).toBe('waterlogged')
    expect(applyWeather('dry', 'rain')).toBe('fertile')
    expect(applyWeather('waterlogged', 'drought')).toBe('fertile')
    expect(applyWeather('degraded', 'rain')).toBe('degraded')
  })
})

describe('recursos y temporadas', () => {
  it('cada decisión gasta agua y fertilizante, y el agua cuesta más con sequía', () => {
    const s = createGame(), c: Choice = { mgmt: 'crop', fert: 2, herd: 2 }
    const r = play(s, c)!
    expect(s.water).toBe(WATER_STOCK - r.water); expect(s.fertilizer).toBe(FERTILIZER_STOCK - 2)
    expect(costOf('fertile', 'drought', c).water).toBe(costOf('fertile', 'normal', c).water + 2)
    expect(costOf('dry', 'normal', c).water).toBeGreaterThan(costOf('fertile', 'normal', c).water)
  })

  it('no se puede elegir una combinación que excede los recursos', () => {
    const s = createGame(); s.water = 3
    const res = canAfford(s, { mgmt: 'crop', fert: 0, herd: 0 })
    expect(res.ok).toBe(false); expect(res.reason).toContain('agua')
    expect(play(s, { mgmt: 'crop', fert: 0, herd: 0 })).toBeNull()
    s.fertilizer = 1
    expect(canAfford(s, { mgmt: 'rest', fert: 3, herd: 0 }).ok).toBe(false)
    expect(canAfford(s, { mgmt: 'rest', fert: 0, herd: 0 }).ok).toBe(true)
  })

  it('la tierra útil baja cuando el suelo queda degradado y reduce la producción', () => {
    const s = createGame(); s.soil = 'degraded'
    play(s, { mgmt: 'crop', fert: 3, herd: 3 })
    expect(s.land).toBe(100 - LAND_LOSS)
    const full = evaluate('fertile', 'normal', { mgmt: 'crop', fert: 2, herd: 2 }, 100).food
    expect(evaluate('fertile', 'normal', { mgmt: 'crop', fert: 2, herd: 2 }, 80).food).toBeCloseTo(full * 0.8, 6)
  })

  it('la partida dura ocho temporadas y el clima es determinista', () => {
    const a = createGame(3), b = createGame(3)
    const rest: Choice = { mgmt: 'rest', fert: 0, herd: 0 }
    for (let i = 0; i < SEASONS; i++) { expect(a.weather).toBe(b.weather); play(a, rest); play(b, rest) }
    expect(a.status).toBe('finished'); expect(a.history).toHaveLength(SEASONS)
    expect(play(a, rest)).toBeNull()
    expect(createGame().weather).toBe('normal')
  })
})

describe('estrategias completas', () => {
  const greedy = (): Choice => ({ mgmt: 'crop', fert: 3, herd: 3 })
  const adaptive = (s: GameState): Choice => {
    let pick: Choice | null = null, bestFood = -1
    for (const c of allChoices()) {
      if (!canAfford(s, c).ok) continue
      const o = evaluate(s.soil, s.weather, c, s.land)
      const value = o.food + (o.trend === 'improves' ? 3 : o.trend === 'worsens' ? -6 : 0)
      if (value > bestFood) { bestFood = value; pick = c }
    }
    return pick ?? { mgmt: 'rest', fert: 0, herd: 0 }
  }
  const fallow = (): Choice => ({ mgmt: 'rest', fert: 1, herd: 0 })
  function run(policy: (s: GameState) => Choice, seed = 1): GameState {
    const s = createGame(seed)
    while (s.status === 'playing') {
      let c = policy(s)
      if (!canAfford(s, c).ok) c = { mgmt: 'rest', fert: 0, herd: 0 }
      play(s, c)
    }
    return s
  }

  it('apretar siempre al máximo rinde menos y emite más por alimento que adaptarse al terreno', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const g = run(greedy, seed), a = run(adaptive, seed)
      expect(score(a)).toBeGreaterThan(score(g))
      expect(summarize(a).perFood).toBeLessThan(summarize(g).perFood)
    }
  })

  it('dejar la finca en descanso conserva el suelo pero no alimenta', () => {
    const f = run(fallow), a = run(adaptive)
    expect(score(f)).toBeLessThan(score(a) * 0.2)
    expect(f.soil).not.toBe('degraded')
  })

  it('una buena estrategia puede ganar la medalla de finca equilibrada', () => {
    const wins = [1, 2, 3, 4, 5, 6].filter(seed => summarize(run(adaptive, seed)).balanced).length
    expect(wins).toBeGreaterThanOrEqual(4)
    expect(summarize(run(greedy)).balanced).toBe(false)
  })
})

describe('Finca equilibrada · racha de temporadas adaptadas', () => {
  it('adaptarse seguido multiplica los alimentos ganados; una mala temporada corta la racha', () => {
    const g = createGame(7)
    for (let i = 0; i < 3; i++) { g.soil = 'fertile'; g.weather = 'normal'; play(g, best('fertile')) }
    expect(g.streak).toBe(3)
    expect(g.bonus).toBeGreaterThan(0)
    expect(summarize(g).total).toBe(Math.round(g.food + g.bonus))
    g.soil = 'degraded'; play(g, { mgmt: 'crop', fert: 3, herd: 3 })
    expect(g.streak).toBe(0)
    expect(g.history[g.history.length - 1].multiplier).toBe(1)
  })
})
