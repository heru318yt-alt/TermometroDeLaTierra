import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_TARGET_SCORE, CONFIG, MIN_WIN_CAUGHT, MIN_WIN_IN_ZONE_PCT,
  SCORE_BONUS_STABILITY, SCORE_BONUS_STEP, SCORE_BONUS_STORAGE,
  createGame, decayRate, demandAt, fallSpeedAt, hasReachedChallenge, safeZone, score, spawnInterval, step, summarize, totalScore,
  type FallingItem, type GameState, type ResourceKind,
} from './engine'

function drop(state: GameState, kind: ResourceKind, x = state.containerX): FallingItem {
  const item = { id: 999, kind, x, y: CONFIG.catchTop - 0.001, speed: 0.3 }
  state.items.push(item)
  state.spawnTimer = 99
  return item
}

function simulate(seed: number, options: { maxSeconds?: number; cleanOnly?: boolean } = {}): GameState {
  const state = createGame(seed)
  const maxSteps = Math.round((options.maxSeconds ?? 240) * 60)
  for (let i = 0; i < maxSteps && state.status === 'playing'; i++) {
    const zone = safeZone(state.t)
    const wanted = state.items
      .filter(item => item.y < CONFIG.catchTop && (state.supply < zone.high - 9 || item.kind === 'storage'))
      .filter(item => !options.cleanOnly || item.kind !== 'carbon')
      .sort((a, b) => b.y - a.y)[0]
    step(state, 1 / 60, wanted ? wanted.x : state.containerX)
  }
  return state
}

describe('motor arcade de Mantén la red', () => {
  it('es determinista con la misma semilla', () => {
    const a = simulate(7, { maxSeconds: 90 }), b = simulate(7, { maxSeconds: 90 })
    expect(score(a)).toBe(score(b))
    expect(a.t).toBeCloseTo(b.t, 6)
  })

  it('la demanda y la dificultad escalan de forma continua', () => {
    expect(demandAt(120)).toBeGreaterThan(demandAt(0) + 12)
    expect(decayRate(120)).toBeGreaterThan(decayRate(0))
    expect(fallSpeedAt(120)).toBeGreaterThan(fallSpeedAt(0))
    expect(spawnInterval(120)).toBeLessThan(spawnInterval(0))
  })

  it('cada recurso atrapado sube la oferta o el almacenamiento y suma emisiones', () => {
    const carbon = createGame(); const before = carbon.supply
    drop(carbon, 'carbon'); step(carbon, 0.01, 0.5)
    expect(carbon.supply).toBeGreaterThan(before + CONFIG.gain.carbon - 1)
    expect(carbon.emissions).toBe(CONFIG.emissionsPerCatch.carbon)

    const solar = createGame(); drop(solar, 'renewable'); step(solar, 0.01, 0.5)
    expect(solar.emissions).toBe(0)
    expect(solar.caught.renewable).toBe(1)

    const gas = createGame(); drop(gas, 'gas'); step(gas, 0.01, 0.5)
    expect(gas.emissions).toBeGreaterThan(0)
    expect(gas.emissions).toBeLessThan(CONFIG.emissionsPerCatch.carbon)
  })

  it('el almacenamiento no sube la barra de inmediato y la libera cuando baja', () => {
    const state = createGame(); drop(state, 'storage'); const before = state.supply
    step(state, 0.01, 0.5)
    expect(state.stored).toBe(CONFIG.storageGain)
    expect(state.supply).toBeLessThan(before)
    state.supply = safeZone(state.t).low - 1
    const low = state.supply
    step(state, 0.05, 0.5)
    expect(state.supply).toBeGreaterThan(low)
    expect(state.storageReleased).toBeGreaterThan(0)
  })

  it('el flujo es infinito en modo arcade sin tope de recursos', () => {
    const state = simulate(3, { maxSeconds: 90 })
    expect(state.spawned).toBeGreaterThan(54)
  })

  it('alcanza la meta del reto en vivo sin detener la partida y deja seguir subiendo puntaje', () => {
    const state = createGame(3)
    let clearedScore = 0
    for (let i = 0; i < 60 * 160 && state.status === 'playing'; i++) {
      const zone = safeZone(state.t)
      const wanted = state.items
        .filter(item => item.y < CONFIG.catchTop && (state.supply < zone.high - 9 || item.kind === 'storage'))
        .sort((a, b) => b.y - a.y)[0]
      step(state, 1 / 60, wanted ? wanted.x : state.containerX)
      if (state.challengeCleared && clearedScore === 0) {
        clearedScore = totalScore(state)
        expect(state.status).toBe('playing')
        expect(hasReachedChallenge(state)).toBe(true)
        expect(clearedScore).toBeGreaterThanOrEqual(CHALLENGE_TARGET_SCORE)
      }
    }
    expect(state.challengeCleared).toBe(true)
    expect(totalScore(state)).toBeGreaterThan(clearedScore + 150)
    const sum = summarize(state)
    expect(sum.inZonePct).toBeGreaterThanOrEqual(MIN_WIN_IN_ZONE_PCT)
    expect(sum.caughtTotal).toBeGreaterThanOrEqual(MIN_WIN_CAUGHT)
    expect(sum.passed).toBe(true)
  })

  it('salir de la zona segura agota la estabilidad o causa apagón', () => {
    const empty = createGame()
    for (let i = 0; i < 4000 && empty.status === 'playing'; i++) step(empty, 0.05, 0.5)
    expect(empty.status).toBe('blackout')

    const greedy = createGame(3)
    for (let i = 0; i < 60 * 120 && greedy.status === 'playing'; i++) {
      const target = greedy.items.filter(item => item.y < CONFIG.catchTop).sort((a, b) => b.y - a.y)[0]
      step(greedy, 1 / 60, target ? target.x : greedy.containerX)
    }
    expect(greedy.status).not.toBe('playing')
    expect(summarize(greedy).passed).toBe(false)
  })

  it('otorga un pequeño respaldo de almacenamiento y estabilidad al superar hitos de puntaje', () => {
    const s = createGame(3)
    s.spawnTimer = 99
    s.stored = 5
    s.stability = 70
    s.inZoneTime = (SCORE_BONUS_STEP - 2) / 10
    step(s, 0.05, 0.5)
    expect(s.scoreMilestonesClaimed).toBe(0)
    expect(s.stored).toBe(5)

    for (let i = 0; i < 6; i++) step(s, 0.05, 0.5)
    expect(totalScore(s)).toBeGreaterThanOrEqual(SCORE_BONUS_STEP)
    expect(s.scoreMilestonesClaimed).toBe(1)
    expect(s.stored).toBeLessThanOrEqual(CONFIG.storageCap)
    expect(s.stored).toBeCloseTo(5 + SCORE_BONUS_STORAGE, 4)
    expect(s.stability).toBeGreaterThan(78)
    expect(s.stability).toBeLessThanOrEqual(CONFIG.startStability)
    expect(s.fx.some(e => e.type === 'score-bonus' && e.storage === SCORE_BONUS_STORAGE && e.stability === SCORE_BONUS_STABILITY)).toBe(true)
  })
})
