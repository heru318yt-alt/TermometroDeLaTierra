import { describe, expect, it } from 'vitest'
import {
  CARBON, CHALLENGE_TARGET_SCORE, CELLS, CONFIG, MAX_CARBON, MIN_WIN_ACTIONS, MIN_WIN_STABLE_SECONDS,
  SCORE_BONUS_RESTORE, SCORE_BONUS_STEP,
  advanceCycle, applyTool, createGame, cultivate, demandAt, hasReachedChallenge, indicators, isProtected, protect,
  protectedCount, restore, score, step, summarize, totalScore, type GameState, type ParcelState,
} from './engine'

const find = (s: GameState, kind: ParcelState) => s.parcels.findIndex(p => p.state === kind)
const cycles = (s: GameState, n: number) => { for (let i = 0; i < n; i++) advanceCycle(s) }
function run(s: GameState, seconds: number) { for (let t = 0; t < seconds && s.status === 'playing'; t += 1 / 20) step(s, 1 / 20); return s }

describe('inicio y estado arcade', () => {
  it('es determinista y arranca estable con la demanda cubierta y 8 restauraciones', () => {
    const a = createGame(5), b = createGame(5)
    expect(a.parcels.map(p => p.state)).toEqual(b.parcels.map(p => p.state))
    expect(a.parcels).toHaveLength(CELLS)
    expect(a.restoreLeft).toBe(CONFIG.restoreActions)
    expect(indicators(a).stable).toBe(true)
    expect(indicators(a).carbon).toBeLessThan(MAX_CARBON)
  })

  it('la demanda crece más exigente y recarga restauración cada 6 ciclos estables', () => {
    const s = createGame()
    s.restoreLeft = 4
    s.parcels.forEach((p, i) => { p.state = i < 12 ? 'crop' : 'forest'; p.protectedUntil = 999 })
    cycles(s, 6)
    expect(s.demand).toBe(demandAt(6))
    expect(s.restoreLeft).toBe(5)
  })
})

describe('acciones y presiones', () => {
  it('cultivar bosque libera carbono, restaurar requiere ciclos y respetar límites', () => {
    const s = createGame(), before = indicators(s), i = find(s, 'forest')
    expect(cultivate(s, i).ok).toBe(true)
    expect(before.carbon - indicators(s).carbon).toBe(CARBON.forest - CARBON.crop)

    const d = find(s, 'degraded')
    expect(restore(s, d).ok).toBe(true)
    expect(s.parcels[d].state).toBe('sapling')
    expect(applyTool(s, 'cultivate', find(s, 'crop')).ok).toBe(false)
  })

  it('la protección bloquea la tala y los incendios', () => {
    const t = createGame()
    const forests = t.parcels.map((p, idx) => ({ p, idx })).filter(x => x.p.state === 'forest').map(x => x.idx)
    expect(protect(t, forests[0]).ok).toBe(true)
    expect(protectedCount(t)).toBe(1)
    for (const p of t.parcels) if (p.state === 'forest' || p.state === 'young') p.protectedUntil = 999
    cycles(t, CONFIG.fireStart)
    expect(isProtected(t, t.parcels[forests[0]])).toBe(true)
    expect(t.logged).toBe(0)
  })
})

describe('meta arcade en vivo y progreso continuo', () => {
  const idx = (s: GameState, k: ParcelState) => s.parcels.map((p, i) => ({ p, i })).filter(x => x.p.state === k).map(x => x.i)

  it('desbloquea la meta del reto en vivo y sigue jugando indefinidamente para mayor puntaje', () => {
    const s = createGame(1, 0)
    let clearedScore = 0
    for (let t = 0; t < 180 && s.status === 'playing'; t += 0.1) {
      for (const i of idx(s, 'forest')) protect(s, i)
      if (indicators(s).coverage < 100) {
        const d = idx(s, 'degraded')
        if (d.length) cultivate(s, d[0])
        else { const f = idx(s, 'forest'); const pick = f.find(i => s.parcels[i].protectedUntil <= s.cycle) ?? f[0]; if (pick !== undefined) cultivate(s, pick) }
      } else {
        const d = idx(s, 'degraded')
        if (d.length && s.restoreLeft > 0) restore(s, d[0])
      }
      step(s, 0.1)
      if (s.challengeCleared && clearedScore === 0) {
        clearedScore = totalScore(s)
        expect(s.status).toBe('playing')
        expect(hasReachedChallenge(s)).toBe(true)
        expect(clearedScore).toBeGreaterThanOrEqual(CHALLENGE_TARGET_SCORE)
        expect(s.actions).toBeGreaterThanOrEqual(MIN_WIN_ACTIONS)
        expect(s.stableTime).toBeGreaterThanOrEqual(MIN_WIN_STABLE_SECONDS)
      }
    }
    expect(s.challengeCleared).toBe(true)
    expect(totalScore(s)).toBeGreaterThan(clearedScore + 200)
    expect(summarize(s).passed).toBe(true)
  })

  it('sobrevivir sin realizar acciones o colapsar no supera el reto', () => {
    const idle = createGame(1, CONFIG.goalCycles)
    run(idle, CONFIG.goalCycles * CONFIG.cycleSeconds + 2)
    expect(score(idle)).toBeGreaterThanOrEqual(0)
    const sum = summarize(idle)
    expect(sum.actions).toBe(0)
    expect(sum.checks.active).toBe(false)
    expect(sum.passed).toBe(false)
  })

  it('recarga un bono discreto de restauración al superar hitos de puntaje con tope en el máximo', () => {
    const s = createGame(1, 0)
    s.restoreLeft = 0
    s.stableTime = (SCORE_BONUS_STEP - 3) / 10
    step(s, 0.1)
    expect(s.scoreMilestonesClaimed).toBe(0)
    expect(s.restoreLeft).toBe(0)

    for (let i = 0; i < 6; i++) step(s, 0.1)
    expect(totalScore(s)).toBeGreaterThanOrEqual(SCORE_BONUS_STEP)
    expect(s.scoreMilestonesClaimed).toBe(1)
    expect(s.restoreLeft).toBe(SCORE_BONUS_RESTORE)

    s.restoreLeft = CONFIG.restoreMax
    s.stableTime = (SCORE_BONUS_STEP * 2 - 2) / 10
    for (let i = 0; i < 5; i++) step(s, 0.1)
    expect(s.scoreMilestonesClaimed).toBe(2)
    expect(s.restoreLeft).toBe(CONFIG.restoreMax)
  })
})
