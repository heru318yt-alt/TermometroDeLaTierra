import { describe, expect, it } from 'vitest'
import {
  LEVELS, METERS_PER_COLUMN, MIN_BRIDGES_PASSED, SCORE_BONUS_REFILL, SCORE_BONUS_STEP, START_INVENTORY,
  canBuildAnything, canContinue, clearColumn, commitLevel, completedBridges, emptyPlan, evaluate, fits,
  levelAt, passedRun, planCost, refillFor, setDeck, startRun, starsFor, streakBonus, togglePillar, totalScore,
  type LevelDef, type Material, type Plan,
} from './engine'

function build(level: LevelDef, rows: number[], materials: Material | Material[], pillars: number[] = []): Plan {
  let plan = emptyPlan(level)
  rows.forEach((row, i) => { plan = setDeck(plan, i + 1, row, Array.isArray(materials) ? materials[i] : materials) })
  for (const col of pillars) plan = togglePillar(plan, col)
  return plan
}
const flat = (level: LevelDef) => Array<number>(level.gap).fill(level.leftH)

describe('evaluación del puente', () => {
  it('un tablero de acero cruza una brecha corta sin pilares', () => {
    const l = LEVELS[0], e = evaluate(l, build(l, flat(l), 'steel'))
    expect(e.outcome).toBe('ok')
    expect(e.driven).toBe(l.gap + 1)
    expect(e.meters).toBe((l.gap + 1) * METERS_PER_COLUMN)
  })

  it('el concreto sin apoyos cede y el pilar lo vuelve seguro', () => {
    const l = LEVELS[0]
    expect(evaluate(l, build(l, flat(l), 'concrete')).outcome).toBe('collapse')
    expect(evaluate(l, build(l, flat(l), 'concrete', [2])).outcome).toBe('ok')
  })

  it('detecta huecos y pendientes bruscas', () => {
    const l = LEVELS[0]
    let plan = build(l, flat(l), 'steel')
    plan = clearColumn(plan, 3)
    expect(evaluate(l, plan).outcome).toBe('gap')
    const l2 = LEVELS[2]
    expect(evaluate(l2, build(l2, [2, 2, 4, 4, 4, 4, 4], 'steel', [3])).outcome).toBe('slope')
  })
})

describe('modo arcade y recuperación circular', () => {
  it('genera tramos infinitos más allá de los 4 niveles base', () => {
    const l4 = levelAt(4), l5 = levelAt(5), l10 = levelAt(10)
    expect(l4.name).toContain('#5')
    expect(l5.gap).toBeGreaterThanOrEqual(7)
    expect(l10.id).toBe('arcade-11')
  })

  it('recupera material proporcional a las estrellas al cruzar y 0 al fallar', () => {
    const l = LEVELS[0]
    const threeStars = refillFor(l, 3)
    const oneStar = refillFor(l, 1)
    const fail = refillFor(l, 0)
    expect(threeStars.steel).toBeGreaterThan(oneStar.steel)
    expect(fail).toEqual({ steel: 0, cement: 0 })
  })

  it('cruzar 3 puentes con eficiencia aprueba el reto y permite seguir jugando indefinidamente en arcade', () => {
    let run = startRun()
    expect(START_INVENTORY).toEqual({ steel: 40, cement: 18 })
    run = commitLevel(run, build(levelAt(0), flat(levelAt(0)), 'concrete', [2])).run
    run = commitLevel(run, build(levelAt(1), flat(levelAt(1)), 'concrete', [2, 4])).run
    expect(passedRun(run)).toBe(false)
    run = commitLevel(run, build(levelAt(2), [2, 2, 3, 3, 3, 4, 4], 'steel', [4])).run
    expect(completedBridges(run)).toBe(MIN_BRIDGES_PASSED)
    expect(passedRun(run)).toBe(true)
    expect(canContinue(run)).toBe(true)

    // Puente #4 (Cañón) también se puede cruzar y abre el modo arcade #5+
    run = commitLevel(run, build(levelAt(3), [3, 3, 3, 3, 3, 3, 3, 3, 2], 'concrete', [2, 4, 6, 8])).run
    expect(run.levelIndex).toBe(4)
    expect(canContinue(run)).toBe(true)
  })

  it('no deja gastar más del inventario ni continuar sin material mínimo', () => {
    expect(fits(START_INVENTORY, { steel: 41, cement: 0 })).toBe(false)
    expect(canBuildAnything({ steel: 1, cement: 0 })).toBe(false)
    expect(canContinue({ ...startRun(), inventory: { steel: 2, cement: 1 } })).toBe(false)
  })

  it('las estrellas y la racha premian cruzar seguido con menor gasto', () => {
    const l0 = levelAt(0)
    expect(starsFor(l0, 'ok', planCost(build(l0, flat(l0), 'concrete', [2])))).toBe(3)
    let run = startRun()
    run = commitLevel(run, build(l0, flat(l0), 'steel')).run
    run = commitLevel(run, build(levelAt(1), flat(levelAt(1)), 'steel', [3])).run
    expect(run.streak).toBe(2)
    expect(run.bonus).toBe(streakBonus(run.results[1].meters, 2))
    expect(totalScore(run)).toBe(run.distance + run.bonus)
    expect(togglePillar(emptyPlan(l0), 2).pillar[1]).toBe(false)
  })

  it('otorga un bono discreto de material al alcanzar hitos de puntaje y puede sostener la continuidad arcade', () => {
    const l0 = levelAt(0)
    const tightRun = {
      ...startRun(),
      distance: SCORE_BONUS_STEP - (l0.gap + 1) * METERS_PER_COLUMN,
      inventory: { steel: l0.gap * 2, cement: 1 },
    }
    const { run: nextRun, result } = commitLevel(tightRun, build(l0, flat(l0), 'steel'))
    expect(totalScore(nextRun)).toBeGreaterThanOrEqual(SCORE_BONUS_STEP)
    expect(result.scoreBonus).toEqual(SCORE_BONUS_REFILL)
    expect(nextRun.scoreMilestonesClaimed).toBe(1)
    expect(nextRun.inventory).toEqual({
      steel: result.refill.steel + SCORE_BONUS_REFILL.steel,
      cement: 1 + result.refill.cement + SCORE_BONUS_REFILL.cement,
    })
    expect(canContinue(nextRun)).toBe(true)
  })
})
