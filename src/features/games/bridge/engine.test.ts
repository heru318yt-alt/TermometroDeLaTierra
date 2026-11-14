import { describe, expect, it } from 'vitest'
import { LEVELS, METERS_PER_COLUMN, starsFor, streakBonus, totalScore, START_INVENTORY, canBuildAnything, canContinue, clearColumn, commitLevel, emptyPlan, evaluate, fits, metersPerUnit, planCost, setDeck, startRun, togglePillar, type LevelDef, type Material, type Plan } from './engine'

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

  it('el concreto sin apoyos cede en la mitad del tramo y el carro cae ahí', () => {
    const l = LEVELS[0], e = evaluate(l, build(l, flat(l), 'concrete'))
    expect(e.outcome).toBe('collapse')
    expect(e.failColumn).toBe(3)
    expect(e.driven).toBe(2)
    expect(e.runs[0]).toMatchObject({ length: 4, span: 2, ok: false })
  })

  it('un pilar divide el tramo y lo vuelve seguro', () => {
    const l = LEVELS[0]
    const e = evaluate(l, build(l, flat(l), 'concrete', [2]))
    expect(e.outcome).toBe('ok')
    expect(e.runs.every(r => r.ok)).toBe(true)
  })

  it('el tramo lo limita el material más débil', () => {
    const l = LEVELS[1]
    const e = evaluate(l, build(l, flat(l), ['steel', 'steel', 'concrete', 'concrete', 'steel', 'steel'], []))
    expect(e.outcome).toBe('collapse')
  })

  it('una pieza faltante detiene al carro antes del hueco', () => {
    const l = LEVELS[0]
    let plan = build(l, flat(l), 'steel')
    plan = clearColumn(plan, 3)
    const e = evaluate(l, plan)
    expect(e.outcome).toBe('gap')
    expect(e.driven).toBe(2)
  })

  it('una pendiente de más de una fila detiene al carro', () => {
    const l = LEVELS[2]
    const e = evaluate(l, build(l, [2, 2, 4, 4, 4, 4, 4], 'steel', [3]))
    expect(e.outcome).toBe('slope')
    expect(e.driven).toBe(2)
  })

  it('un pilar solo se puede poner bajo una pieza de tablero', () => {
    const l = LEVELS[0], plan = togglePillar(emptyPlan(l), 2)
    expect(plan.pillar[1]).toBe(false)
  })
})

describe('costos y materiales', () => {
  it('el pilar cuesta cemento según la altura y se suma al material', () => {
    const l = LEVELS[2]
    const c = planCost(build(l, [2, 2, 3, 3, 3, 4, 4], 'steel', [4]))
    expect(c.steel).toBe(14)
    expect(c.cement).toBe(2)
    expect(c.emissions).toBeGreaterThan(0)
  })

  it('el concreto emite menos por unidad que el acero', () => {
    const l = LEVELS[0]
    const steel = planCost(build(l, flat(l), 'steel')), concrete = planCost(build(l, flat(l), 'concrete', [2]))
    expect(concrete.emissions).toBeLessThan(steel.emissions)
  })

  it('no se puede gastar más material del que hay', () => {
    expect(fits(START_INVENTORY, { steel: 47, cement: 0 })).toBe(false)
    const run = startRun(), l = LEVELS[0]
    expect(() => commitLevel(run, build(l, [2, 2, 2, 2], 'steel', []))).not.toThrow()
    const poor = { ...run, inventory: { steel: 0, cement: 0 } }
    expect(() => commitLevel(poor, build(l, flat(l), 'steel'))).toThrow()
  })
})

describe('partida completa', () => {
  const rows = [flat(LEVELS[0]), flat(LEVELS[1]), [2, 2, 3, 3, 3, 4, 4], [3, 3, 3, 3, 3, 3, 3, 3, 2]]

  it('existe un plan eficiente que cruza los cuatro niveles con el material fijo', () => {
    let run = startRun()
    const plans = [
      build(LEVELS[0], rows[0], 'concrete', [2]),
      build(LEVELS[1], rows[1], 'steel', [3]),
      build(LEVELS[2], rows[2], 'steel', [4]),
      build(LEVELS[3], rows[3], 'steel', [3, 6]),
    ]
    for (const plan of plans) run = commitLevel(run, plan).run
    expect(run.results.map(r => r.outcome)).toEqual(['ok', 'ok', 'ok', 'ok'])
    expect(run.distance).toBe(LEVELS.reduce((sum, l) => sum + (l.gap + 1) * METERS_PER_COLUMN, 0))
    expect(run.inventory.cement).toBeGreaterThanOrEqual(0)
    expect(run.levelIndex).toBe(LEVELS.length)
  })

  it('gastar acero sin pensar agota el material antes de terminar', () => {
    let run = startRun()
    for (const [i, level] of LEVELS.entries()) {
      if (!canContinue(run)) break
      let plan = build(level, rows[i], 'steel', i === 1 ? [3] : i === 2 ? [4] : i === 3 ? [5] : [])
      let tries = 0
      while (!fits(run.inventory, planCost(plan)) && tries++ < level.gap) plan = clearColumn(plan, level.gap - tries + 1)
      run = commitLevel(run, plan).run
    }
    expect(run.results.some(r => r.outcome !== 'ok') || run.levelIndex < LEVELS.length).toBe(true)
    expect(run.distance).toBeLessThan(LEVELS.reduce((sum, l) => sum + (l.gap + 1) * METERS_PER_COLUMN, 0))
  })

  it('el material gastado no se recupera aunque el puente falle', () => {
    const l = LEVELS[0], plan = build(l, flat(l), 'concrete')
    const { run, result } = commitLevel(startRun(), plan)
    expect(result.outcome).toBe('collapse')
    expect(run.inventory.cement).toBe(START_INVENTORY.cement - 4)
    expect(run.distance).toBe(2 * METERS_PER_COLUMN)
    expect(metersPerUnit(run)).toBeGreaterThan(0)
  })

  it('sin material para una pieza, la partida no puede continuar', () => {
    expect(canBuildAnything({ steel: 1, cement: 0 })).toBe(false)
    expect(canBuildAnything({ steel: 0, cement: 1 })).toBe(true)
    expect(canContinue({ ...startRun(), inventory: { steel: 1, cement: 0 } })).toBe(false)
  })
})

describe('Puente de materiales · racha y estrellas', () => {
  it('puentes seguidos suman bono creciente y uno fallido corta la racha', () => {
    let run = startRun()
    const l0 = LEVELS[0]
    run = commitLevel(run, build(l0, flat(l0), 'steel')).run
    expect(run.streak).toBe(1); expect(run.bonus).toBe(0)
    const l1 = LEVELS[1]
    run = commitLevel(run, build(l1, flat(l1), 'steel', [3])).run
    expect(run.results[1].outcome).toBe('ok')
    expect(run.streak).toBe(2); expect(run.bonus).toBe(streakBonus(run.results[1].meters, 2))
    expect(totalScore(run)).toBe(run.distance + run.bonus)
    const l2 = LEVELS[2]
    run = commitLevel(run, build(l2, [2], 'steel')).run
    expect(run.streak).toBe(0)
  })

  it('las estrellas premian cruzar con menos material', () => {
    const l0 = LEVELS[0]
    const heavy = planCost(build(l0, flat(l0), 'steel'))
    const light = planCost(build(l0, flat(l0), 'concrete', [2]))
    expect(starsFor(l0, 'ok', heavy)).toBe(2)
    expect(starsFor(l0, 'ok', light)).toBe(3)
    expect(starsFor(l0, 'collapse', light)).toBe(0)
  })
})
