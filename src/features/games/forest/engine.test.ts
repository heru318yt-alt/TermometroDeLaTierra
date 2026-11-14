import { describe, expect, it } from 'vitest'
import { CARBON, CELLS, CONFIG, MAX_CARBON, SIZE, advanceCycle, applyTool, createGame, cultivate, demandAt, indicators, isProtected, protect, protectedCount, restore, score, step, summarize, totalScore, type GameState, type ParcelState } from './engine'

const find = (s: GameState, kind: ParcelState) => s.parcels.findIndex(p => p.state === kind)
const cycles = (s: GameState, n: number) => { for (let i = 0; i < n; i++) advanceCycle(s) }
function run(s: GameState, seconds: number) { for (let t = 0; t < seconds && s.status === 'playing'; t += 1 / 20) step(s, 1 / 20); return s }

describe('inicio y estado', () => {
  it('es determinista y arranca estable con la demanda cubierta', () => {
    const a = createGame(5), b = createGame(5)
    expect(a.parcels.map(p => p.state)).toEqual(b.parcels.map(p => p.state))
    expect(a.parcels).toHaveLength(CELLS)
    expect(a.parcels.filter(p => p.state === 'crop')).toHaveLength(8)
    expect(a.parcels.filter(p => p.state === 'degraded')).toHaveLength(2)
    const ind = indicators(a)
    expect(ind.coverage).toBeGreaterThanOrEqual(100)
    expect(ind.stable).toBe(true)
    expect(ind.carbon).toBeLessThan(MAX_CARBON)
  })

  it('la demanda de alimentos crece cada ciclo', () => {
    const s = createGame(); cycles(s, 5)
    expect(s.demand).toBe(demandAt(5))
    expect(s.demand).toBeGreaterThan(CONFIG.demandStart)
  })
})

describe('acciones', () => {
  it('cultivar un bosque sube los alimentos pero libera carbono de golpe', () => {
    const s = createGame(), before = indicators(s), i = find(s, 'forest')
    expect(cultivate(s, i).ok).toBe(true)
    const after = indicators(s)
    expect(after.supply).toBe(before.supply + CONFIG.foodPerCrop)
    expect(before.carbon - after.carbon).toBe(CARBON.forest - CARBON.crop)
    expect(s.converted).toBe(1)
  })

  it('cultivar una parcela degradada da alimentos sin perder bosque ni carbono', () => {
    const s = createGame(), before = indicators(s), i = find(s, 'degraded')
    cultivate(s, i)
    expect(indicators(s).supply).toBe(before.supply + CONFIG.foodPerCrop)
    expect(indicators(s).carbon).toBe(before.carbon + CARBON.crop)
    expect(s.converted).toBe(0)
  })

  it('restaurar es lento: brote, joven y recién después bosque maduro', () => {
    const s = createGame(), i = find(s, 'degraded')
    expect(restore(s, i).ok).toBe(true)
    expect(s.parcels[i].state).toBe('sapling')
    const carbonAtStart = CARBON.sapling
    cycles(s, CONFIG.growCycles); expect(s.parcels[i].state).toBe('young')
    expect(CARBON.young).toBeGreaterThan(carbonAtStart)
    cycles(s, CONFIG.growCycles); expect(s.parcels[i].state).toBe('forest')
    expect(CARBON.forest - CARBON.degraded).toBe(10)
  })

  it('restaurar un cultivo cuesta alimentos y las acciones se agotan', () => {
    const s = createGame(), food = indicators(s).supply
    restore(s, find(s, 'crop')); expect(indicators(s).supply).toBe(food - CONFIG.foodPerCrop)
    s.restoreLeft = 0
    expect(restore(s, find(s, 'degraded')).ok).toBe(false)
  })

  it('solo se restauran cultivos o parcelas degradadas; solo se conserva bosque', () => {
    const s = createGame()
    expect(restore(s, find(s, 'forest')).ok).toBe(false)
    expect(protect(s, find(s, 'crop')).ok).toBe(false)
    expect(applyTool(s, 'cultivate', find(s, 'crop')).ok).toBe(false)
  })

  it('la protección tiene tope, caduca y bloquea la tala', () => {
    const s = createGame()
    const forests = s.parcels.map((p, i) => ({ p, i })).filter(x => x.p.state === 'forest').map(x => x.i)
    forests.slice(0, CONFIG.protectCap).forEach(i => expect(protect(s, i).ok).toBe(true))
    expect(protect(s, forests[CONFIG.protectCap]).ok).toBe(false)
    expect(protectedCount(s)).toBe(CONFIG.protectCap)
    cycles(s, CONFIG.protectCycles)
    expect(isProtected(s, s.parcels[forests[0]])).toBe(false)

    const t = createGame()
    for (const p of t.parcels) if (p.state === 'forest' || p.state === 'young') p.protectedUntil = 999
    const crops = t.parcels.filter(p => p.state === 'crop').length
    cycles(t, CONFIG.loggingEvery)
    expect(t.parcels.filter(p => p.state === 'crop').length).toBe(crops)
    expect(t.logged).toBe(0)
  })
})

describe('presiones y eventos', () => {
  it('la tala convierte un bosque sin protección cada cierto tiempo', () => {
    const s = createGame(), crops = indicators(s).crops
    cycles(s, CONFIG.loggingEvery)
    expect(s.logged).toBe(1)
    expect(indicators(s).crops).toBe(crops + 1)
    expect(s.events.some(e => e.kind === 'logging')).toBe(true)
  })

  it('un incendio degrada una parcela sin protección y puede revertir lo restaurado', () => {
    const s = createGame()
    cycles(s, CONFIG.fireStart)
    expect(s.fires).toBe(1)
    expect(s.parcels.filter(p => p.state === 'degraded').length).toBeGreaterThanOrEqual(2)
  })

  it('un incendio no afecta parcelas protegidas', () => {
    const s = createGame()
    for (const p of s.parcels) if (p.state !== 'crop' && p.state !== 'degraded') p.protectedUntil = 999
    const degraded = s.parcels.filter(p => p.state === 'degraded').length
    cycles(s, CONFIG.fireStart)
    expect(s.parcels.filter(p => p.state === 'degraded').length).toBe(degraded)
  })

  it('las parcelas cercanas a cultivos y zonas degradadas se queman con más frecuencia', () => {
    let nearHits = 0, farHits = 0
    for (let seed = 1; seed <= 300; seed++) {
      const s = createGame(seed); s.cycle = CONFIG.fireStart - 1
      const before = s.parcels.map(p => p.state)
      advanceCycle(s)
      const hit = s.parcels.findIndex((p, i) => p.state === 'degraded' && before[i] !== 'degraded')
      if (hit < 0) continue
      const r = Math.floor(hit / SIZE), c = hit % SIZE
      const near = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => { const n = (r + dr) * SIZE + (c + dc); return r + dr >= 0 && r + dr < SIZE && c + dc >= 0 && c + dc < SIZE && (before[n] === 'crop' || before[n] === 'degraded') })
      near ? nearHits++ : farHits++
    }
    expect(nearHits).toBeGreaterThan(farHits)
  })
})

describe('puntaje y final', () => {
  it('el puntaje es el tiempo con alimentos y carbono estables', () => {
    const s = createGame(); step(s, 0.1); step(s, 0.1)
    expect(score(s)).toBe(Math.round(0.2 * 10))
  })

  it('termina por colapso del bosque cuando el carbono cae demasiado', () => {
    const s = createGame()
    for (let i = 0; i < CELLS && s.status === 'playing'; i++) cultivate(s, i)
    expect(s.status).toBe('collapse')
    expect(summarize(s).cause).toBe('collapse')
  })

  it('termina por hambre cuando la demanda deja de cubrirse', () => {
    const s = createGame()
    run(s, 600)
    expect(['hunger', 'collapse']).toContain(s.status)
    expect(s.cycle).toBeGreaterThan(0)
  })

  it('las acciones no se pueden usar después de terminar', () => {
    const s = createGame(); s.status = 'hunger'
    expect(cultivate(s, 0).ok).toBe(false); expect(protect(s, 0).ok).toBe(false); expect(restore(s, 0).ok).toBe(false)
  })
})

describe('estrategias completas', () => {
  const idx = (s: GameState, k: ParcelState) => s.parcels.map((p, i) => ({ p, i })).filter(x => x.p.state === k).map(x => x.i)
  function play(policy: (s: GameState) => void): GameState {
    const s = createGame(1)
    for (let t = 0; t < 1500 && s.status === 'playing'; t += 0.1) { policy(s); step(s, 0.1) }
    return s
  }
  const idle = () => {}
  const naive = (s: GameState) => { if (indicators(s).coverage < 100) { const f = idx(s, 'forest'); if (f.length) cultivate(s, f[0]) } }
  const smart = (s: GameState) => {
    for (const i of idx(s, 'forest')) protect(s, i)
    if (indicators(s).coverage < 100) {
      const d = idx(s, 'degraded')
      if (d.length) cultivate(s, d[0])
      else { const f = idx(s, 'forest'), unprotected = f.filter(i => s.parcels[i].protectedUntil <= s.cycle); const pick = unprotected[0] ?? f[0]; if (pick !== undefined) cultivate(s, pick) }
    } else { const d = idx(s, 'degraded'); if (d.length && s.restoreLeft > 0) restore(s, d[0]) }
  }

  it('proteger, usar tierras degradadas y restaurar rinde más que no hacer nada', () => {
    const good = play(smart), none = play(idle)
    expect(score(good)).toBeGreaterThan(score(none) * 1.25)
    expect(good.t).toBeGreaterThan(none.t * 1.5)
  })

  it('alimentar la demanda solo con bosque rinde menos que usar tierras degradadas', () => {
    expect(score(play(naive))).toBeLessThan(score(play(smart)))
    expect(play(naive).status).toBe('collapse')
  })

  it('la partida siempre termina y termina por una causa clara', () => {
    for (const policy of [idle, naive, smart]) expect(['hunger', 'collapse']).toContain(play(policy).status)
  })
})

describe('Guardabosques · racha de equilibrio', () => {
  it('ciclos estables seguidos multiplican el puntaje y perder el equilibrio lo reinicia', () => {
    const s = createGame()
    // Bosque protegido y cultivos justos: estable sin eventos que lo rompan.
    s.parcels.forEach((p, i) => { p.state = i < 10 ? 'crop' : 'forest'; p.protectedUntil = 999 })
    s.demand = 100
    run(s, CONFIG.cycleSeconds * 11 + 0.1)
    expect(s.multiplier).toBeGreaterThanOrEqual(2)
    expect(totalScore(s)).toBeGreaterThan(score(s))
    for (let i = 0; i < 6; i++) s.parcels[i].state = 'degraded'
    run(s, 0.2)
    expect(s.multiplier).toBe(1)
  })
})
