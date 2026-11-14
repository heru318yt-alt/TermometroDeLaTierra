/**
 * Puente de materiales · motor del minijuego de Industria y materiales.
 *
 * Física deliberadamente simple y predecible: cada material resiste un tramo
 * sin apoyo de cierta longitud. Todos los valores son didácticos y no
 * representan mediciones de emisiones.
 */
export type Material = 'steel' | 'concrete'
export type Stock = 'steel' | 'cement'
export type Outcome = 'ok' | 'gap' | 'slope' | 'collapse'

export interface Inventory { steel: number; cement: number }
export interface Deck { material: Material; row: number }
export interface Plan { deck: (Deck | null)[]; pillar: boolean[] }
export interface LevelDef { id: string; name: string; gap: number; leftH: number; rightH: number; hint: string }

export const MAX_ROW = 6
export const METERS_PER_COLUMN = 8
export const START_INVENTORY: Inventory = { steel: 46, cement: 20 }

export const MATERIALS: Record<Material, { label: string; stock: Stock; perCell: number; span: number; emission: number; note: string }> = {
  steel: { label: 'Acero', stock: 'steel', perCell: 2, span: 4, emission: 1.8, note: 'Resiste tramos largos, pero su producción es intensiva en energía.' },
  concrete: { label: 'Concreto', stock: 'cement', perCell: 1, span: 2, emission: 1.4, note: 'Parte del CO₂ sale de la reacción química del cemento, no solo de quemar combustible.' },
}

export const STOCK_LABEL: Record<Stock, string> = { steel: 'Acero', cement: 'Cemento' }

export const LEVELS: LevelDef[] = [
  { id: 'quebrada', name: 'Quebrada corta', gap: 4, leftH: 2, rightH: 2, hint: 'Una brecha corta y plana: aprende cómo se apoyan las piezas.' },
  { id: 'rio', name: 'Río ancho', gap: 6, leftH: 2, rightH: 2, hint: 'Más distancia: un apoyo bien puesto ahorra material.' },
  { id: 'mirador', name: 'Mirador alto', gap: 7, leftH: 2, rightH: 4, hint: 'El destino está más arriba. Los pilares altos cuestan más cemento.' },
  { id: 'canon', name: 'Cañón largo', gap: 9, leftH: 3, rightH: 2, hint: 'La brecha más larga con lo que te queda. Combina materiales.' },
]

/** Un pilar ocupa las filas por debajo del tablero: cuesta (fila − 1) de cemento. */
export const pillarCost = (row: number) => Math.max(0, row - 1)

export function emptyPlan(level: LevelDef): Plan {
  return { deck: Array<Deck | null>(level.gap).fill(null), pillar: Array<boolean>(level.gap).fill(false) }
}

export function setDeck(plan: Plan, col: number, row: number, material: Material): Plan {
  const deck = plan.deck.slice(); deck[col - 1] = { material, row }
  return { deck, pillar: plan.pillar.slice() }
}

export function togglePillar(plan: Plan, col: number): Plan {
  if (!plan.deck[col - 1]) return plan
  const pillar = plan.pillar.slice(); pillar[col - 1] = !pillar[col - 1]
  return { deck: plan.deck.slice(), pillar }
}

export function clearColumn(plan: Plan, col: number): Plan {
  const deck = plan.deck.slice(), pillar = plan.pillar.slice()
  deck[col - 1] = null; pillar[col - 1] = false
  return { deck, pillar }
}

export interface Cost extends Inventory { emissions: number; cells: number }

export function planCost(plan: Plan): Cost {
  const cost: Cost = { steel: 0, cement: 0, emissions: 0, cells: 0 }
  plan.deck.forEach((deck, i) => {
    if (!deck) return
    const m = MATERIALS[deck.material]
    cost[m.stock] += m.perCell; cost.emissions += m.perCell * m.emission; cost.cells++
    if (plan.pillar[i]) { const c = pillarCost(deck.row); cost.cement += c; cost.emissions += c * MATERIALS.concrete.emission }
  })
  return cost
}

export function fits(inventory: Inventory, cost: Inventory): boolean {
  return cost.steel <= inventory.steel && cost.cement <= inventory.cement
}

export interface RunInfo { from: number; to: number; length: number; span: number; ok: boolean }
export interface Evaluation { outcome: Outcome; driven: number; failColumn: number | null; runs: RunInfo[]; meters: number }

export function evaluate(level: LevelDef, plan: Plan): Evaluation {
  const n = level.gap
  const row = (c: number) => c === 0 ? level.leftH : c === n + 1 ? level.rightH : plan.deck[c - 1]!.row
  const supported = (c: number) => c === 0 || c === n + 1 || plan.pillar[c - 1]
  const has = (c: number) => c === 0 || c === n + 1 || plan.deck[c - 1] !== null

  // Tramos sin apoyo, delimitados por apoyos (riscos o pilares) en ambos extremos.
  const runs: RunInfo[] = []
  let c = 1
  while (c <= n) {
    if (!plan.deck[c - 1] || supported(c)) { c++; continue }
    let end = c
    while (end + 1 <= n && plan.deck[end] && !supported(end + 1)) end++
    const closed = end + 1 <= n + 1 && has(end + 1) && supported(end + 1)
    if (closed) {
      let span = Infinity
      for (let k = c; k <= end; k++) span = Math.min(span, MATERIALS[plan.deck[k - 1]!.material].span)
      runs.push({ from: c, to: end, length: end - c + 1, span, ok: end - c + 1 <= span })
    }
    c = end + 1
  }
  const failing = runs.filter(r => !r.ok).map(r => ({ run: r, at: r.from + Math.floor(r.length / 2) }))

  const done = (outcome: Outcome, driven: number, failColumn: number | null): Evaluation =>
    ({ outcome, driven, failColumn, runs, meters: driven * METERS_PER_COLUMN })

  for (let col = 1; col <= n; col++) {
    if (!has(col)) return done('gap', col - 1, null)
    if (Math.abs(row(col) - row(col - 1)) > 1) return done('slope', col - 1, null)
    const fail = failing.find(f => f.at === col)
    if (fail) return done('collapse', col - 1, col)
  }
  if (Math.abs(row(n + 1) - row(n)) > 1) return done('slope', n, null)
  return done('ok', n + 1, null)
}

export interface LevelResult { levelId: string; outcome: Outcome; meters: number; cost: Cost; stars: number; bonus: number }

export interface Run {
  levelIndex: number
  inventory: Inventory
  distance: number
  emissions: number
  used: Inventory
  results: LevelResult[]
  /** Puentes completados seguidos. */
  streak: number
  bonus: number
}

export function startRun(): Run {
  return { levelIndex: 0, inventory: { ...START_INVENTORY }, distance: 0, emissions: 0, used: { steel: 0, cement: 0 }, results: [], streak: 0, bonus: 0 }
}

/** ¿Queda material para colocar al menos una pieza de tablero? */
export function canBuildAnything(inv: Inventory): boolean {
  return inv.cement >= 1 || inv.steel >= 2
}

export function canContinue(run: Run): boolean {
  return run.levelIndex < LEVELS.length && canBuildAnything(run.inventory)
}

/** Unidades de material por columna de brecha: menos es más eficiente. */
export function unitsPerColumn(level: LevelDef, cost: Inventory): number {
  return (cost.steel + cost.cement) / level.gap
}

/** 0 si no cruza; 1 al cruzar; 2 con ≤ 2,2 unidades por columna; 3 con ≤ 1,5. */
export function starsFor(level: LevelDef, outcome: Outcome, cost: Inventory): number {
  if (outcome !== 'ok') return 0
  const u = unitsPerColumn(level, cost)
  return u <= 1.5 ? 3 : u <= 2.2 ? 2 : 1
}

/** Bono por racha: desde el 2.º puente seguido suma la mitad de sus metros por cada nivel de racha (máx. ×3). */
export const streakBonus = (meters: number, streak: number) => Math.round(meters * 0.5 * (Math.min(streak, 4) - 1))

/** Gasta el material del plan (no se recupera), prueba el puente y avanza al siguiente nivel. */
export function commitLevel(run: Run, plan: Plan): { run: Run; result: LevelResult; evaluation: Evaluation } {
  const level = LEVELS[run.levelIndex]
  const cost = planCost(plan)
  if (!fits(run.inventory, cost)) throw new Error('El plan usa más material del disponible')
  const evaluation = evaluate(level, plan)
  const streak = evaluation.outcome === 'ok' ? run.streak + 1 : 0
  const bonus = evaluation.outcome === 'ok' ? streakBonus(evaluation.meters, streak) : 0
  const result: LevelResult = { levelId: level.id, outcome: evaluation.outcome, meters: evaluation.meters, cost, stars: starsFor(level, evaluation.outcome, cost), bonus }
  return {
    evaluation, result,
    run: {
      levelIndex: run.levelIndex + 1,
      inventory: { steel: run.inventory.steel - cost.steel, cement: run.inventory.cement - cost.cement },
      distance: run.distance + evaluation.meters,
      emissions: run.emissions + cost.emissions,
      used: { steel: run.used.steel + cost.steel, cement: run.used.cement + cost.cement },
      results: [...run.results, result],
      streak, bonus: run.bonus + bonus,
    },
  }
}

export const totalScore = (run: Run) => run.distance + run.bonus
export const totalStars = (run: Run) => run.results.reduce((sum, r) => sum + r.stars, 0)

export function totalUsed(run: Run): number { return run.used.steel + run.used.cement }
export function metersPerUnit(run: Run): number { return totalUsed(run) ? run.distance / totalUsed(run) : 0 }
