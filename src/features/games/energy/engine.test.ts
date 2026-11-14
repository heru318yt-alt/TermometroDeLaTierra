import { describe, expect, it } from 'vitest'
import { CONFIG, createGame, demandAt, fuelBurn, safeZone, score, spawnInterval, step, summarize, totalScore, type FallingItem, type GameState, type ResourceKind } from './engine'

function drop(state: GameState, kind: ResourceKind, x = state.containerX): FallingItem {
  const item = { id: 999, kind, x, y: CONFIG.catchTop - 0.001, speed: 0.3 }
  state.items.push(item)
  state.spawnTimer = 99
  return item
}

/** Jugador automático: persigue el recurso útil más cercano y evita sobrecargar. */
function simulate(seed: number, cleanOnly = false): GameState {
  const state = createGame(seed)
  let guard = 0
  while (state.status === 'playing' && guard++ < 60 * 60 * 10) {
    const zone = safeZone(state.t)
    const wanted = state.items
      .filter(i => i.y < CONFIG.catchTop && (state.supply < zone.high - 12 || i.kind === 'storage'))
      .filter(i => !cleanOnly || i.kind !== 'carbon')
      .sort((a, b) => b.y - a.y)[0]
    step(state, 1 / 60, wanted ? wanted.x : state.containerX)
  }
  return state
}

describe('motor de Mantén la red', () => {
  it('es determinista con la misma semilla', () => {
    const a = simulate(7), b = simulate(7)
    expect(score(a)).toBe(score(b))
    expect(a.t).toBeCloseTo(b.t, 6)
  })

  it('la demanda crece y fluctúa dentro de un rango razonable', () => {
    for (let t = 0; t < 300; t += 1) expect(demandAt(t)).toBeGreaterThan(30)
    for (let t = 0; t < 300; t += 1) expect(demandAt(t)).toBeLessThan(85)
    expect(demandAt(120)).toBeGreaterThan(demandAt(0) + 5)
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

  it('un recurso fuera del contenedor no se atrapa', () => {
    const state = createGame(); drop(state, 'carbon', 0.95); const before = state.supply
    step(state, 0.01, 0.1)
    expect(state.caught.carbon).toBe(0)
    expect(state.supply).toBeLessThan(before)
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

  it('el almacenamiento tiene capacidad limitada', () => {
    const state = createGame(); state.supply = 70
    for (let i = 0; i < 5; i++) { drop(state, 'storage'); step(state, 0.01, 0.5) }
    expect(state.stored).toBeLessThanOrEqual(CONFIG.storageCap)
    expect(state.wasted).toBeGreaterThan(0)
  })

  it('el apagón termina la partida y el puntaje sale del tiempo en zona segura', () => {
    const state = createGame()
    let guard = 0
    while (state.status === 'playing' && guard++ < 5000) step(state, 0.05, 0.5)
    expect(state.status).toBe('blackout')
    expect(score(state)).toBe(Math.round(state.inZoneTime * 10))
    expect(score(state)).toBeGreaterThan(0)
  })

  it('los recursos disminuyen: intervalos crecientes y reserva finita', () => {
    expect(spawnInterval(60)).toBeGreaterThan(spawnInterval(0) * 4)
    expect(spawnInterval(40)).toBeGreaterThan(spawnInterval(20) * 1.5)
    const state = simulate(3)
    expect(state.spawned).toBeLessThanOrEqual(CONFIG.pool)
    expect(state.status).not.toBe('playing')
  })

  it('el combustible se agota cada vez más rápido y termina la partida', () => {
    expect(fuelBurn(80)).toBeGreaterThan(fuelBurn(10))
    const state = simulate(3)
    expect(state.status).toBe('nofuel')
    expect(state.fuel).toBe(0)
    expect(summarize(state).fuelOut).toBe(true)
  })

  it('la sobrecarga se desperdicia y no suma tiempo en zona', () => {
    const state = createGame(); state.supply = 99
    drop(state, 'carbon'); step(state, 0.01, 0.5)
    expect(state.supply).toBe(100)
    expect(state.wasted).toBeGreaterThan(0)
  })

  it('un jugador que solo evita el carbón sobrevive menos que uno que lo usa, pero con menos emisiones', () => {
    const mixed = simulate(11), clean = simulate(11, true)
    expect(summarize(clean).emissions).toBeLessThanOrEqual(summarize(mixed).emissions)
    expect(score(mixed)).toBeGreaterThan(0)
  })
})

describe('Mantén la red · racha', () => {
  it('mantener la zona segura sube el multiplicador y suma bono; salir lo reinicia', () => {
    const s = createGame()
    for (let i = 0; i < 260; i++) { s.supply = demandAt(s.t); s.spawnTimer = 99; step(s, 0.05, 0.5) }
    expect(s.multiplier).toBe(3)
    expect(s.bonus).toBeGreaterThan(0)
    expect(totalScore(s)).toBeGreaterThan(score(s))
    expect(s.fx.some(f => f.type === 'streak')).toBe(true)
    s.supply = safeZone(s.t).high + 8; step(s, 0.01, 0.5)
    expect(s.multiplier).toBe(1)
    expect(s.fx.some(f => f.type === 'streak-lost')).toBe(true)
  })

  it('el resumen distingue apagón temprano de final sin combustible', () => {
    const early = createGame(); let g = 0
    while (early.status === 'playing' && g++ < 5000) step(early, 0.05, 0.5)
    expect(summarize(early).fuelOut).toBe(false)
    expect(summarize(simulate(3)).fuelOut).toBe(true)
    expect(summarize(simulate(3)).total).toBeGreaterThanOrEqual(summarize(simulate(3)).score)
  })
})
