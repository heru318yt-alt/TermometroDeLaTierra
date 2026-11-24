/**
 * Guardabosques · motor arcade del minijuego de Uso del suelo y bosques.
 *
 * Lógica pura y determinista. En modo arcade (targetCycles = 0) las presiones
 * climáticas y productivas escalan progresivamente: al alcanzar la meta del reto se
 * desbloquea el progreso y puedes seguir defendiendo el territorio para tu récord.
 */
export type ParcelState = 'forest' | 'young' | 'sapling' | 'crop' | 'degraded'
export type Tool = 'protect' | 'cultivate' | 'restore'
export type Status = 'playing' | 'hunger' | 'collapse' | 'survived'

export interface Parcel { state: ParcelState; age: number; protectedUntil: number; flashUntil: number }
export interface GameEvent { kind: 'logging' | 'fire'; index: number; cycle: number }

export const SIZE = 6
export const CELLS = SIZE * SIZE

export const CONFIG = {
  cycleSeconds: 2,
  goalCycles: 25,
  growCycles: 4,
  protectCycles: 10,
  protectCap: 8,
  restoreActions: 8,
  restoreMax: 10,
  restoreRechargeEvery: 6,
  loggingEvery: 3,
  fireStart: 5,
  fireEvery: 6,
  foodPerCrop: 10,
  demandStart: 80,
  demandGrowth: 2.4,
  stableFood: 85,
  stableCarbon: 38,
  endFood: 50,
  endCarbon: 20,
} as const

export const CHALLENGE_TARGET_SCORE = 360
export const MIN_WIN_STABLE_SECONDS = 30
export const MIN_WIN_ACTIONS = 6
export const SCORE_BONUS_STEP = 250
export const SCORE_BONUS_RESTORE = 1

export const CARBON: Record<ParcelState, number> = { forest: 10, young: 5, sapling: 2, crop: 1, degraded: 0 }
export const MAX_CARBON = CELLS * CARBON.forest

export const STATE_LABEL: Record<ParcelState, string> = {
  forest: 'Bosque maduro', young: 'Bosque joven', sapling: 'Brote en restauración', crop: 'Cultivo', degraded: 'Parcela degradada',
}

export interface GameState {
  t: number
  cycle: number
  targetCycles: number
  cycleTimer: number
  rng: number
  status: Status
  parcels: Parcel[]
  demand: number
  restoreLeft: number
  stableTime: number
  converted: number
  restored: number
  fires: number
  logged: number
  startCarbon: number
  events: GameEvent[]
  actions: number
  stableCycles: number
  multiplier: number
  bestMultiplier: number
  bonus: number
  challengeCleared: boolean
  scoreMilestonesClaimed: number
}

function nextRandom(state: GameState): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0
  let t = state.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function carbonOf(parcels: Parcel[]): number { return parcels.reduce((sum, p) => sum + CARBON[p.state], 0) }

export function createGame(seed = 1982, targetCycles = 0): GameState {
  const state: GameState = {
    t: 0, cycle: 0, targetCycles, cycleTimer: 0, rng: seed >>> 0, status: 'playing',
    parcels: Array.from({ length: CELLS }, () => ({ state: 'forest' as ParcelState, age: 0, protectedUntil: 0, flashUntil: 0 })),
    demand: CONFIG.demandStart, restoreLeft: CONFIG.restoreActions, stableTime: 0,
    converted: 0, restored: 0, fires: 0, logged: 0, startCarbon: 0, events: [],
    actions: 0, stableCycles: 0, multiplier: 1, bestMultiplier: 1, bonus: 0,
    challengeCleared: false,
    scoreMilestonesClaimed: 0,
  }
  const place = (kind: ParcelState, count: number) => {
    let placed = 0
    while (placed < count) {
      const i = Math.floor(nextRandom(state) * CELLS)
      if (state.parcels[i].state === 'forest') { state.parcels[i].state = kind; placed++ }
    }
  }
  place('crop', 8); place('degraded', 2); place('young', 2)
  state.startCarbon = carbonOf(state.parcels)
  return state
}

export interface Indicators { supply: number; demand: number; coverage: number; carbon: number; carbonPct: number; stable: boolean; forests: number; crops: number }

export function indicators(state: GameState): Indicators {
  const crops = state.parcels.filter(p => p.state === 'crop').length
  const supply = crops * CONFIG.foodPerCrop
  const coverage = (supply / state.demand) * 100
  const carbon = carbonOf(state.parcels)
  const carbonPct = (carbon / MAX_CARBON) * 100
  return {
    supply, demand: state.demand, coverage, carbon, carbonPct, crops,
    forests: state.parcels.filter(p => p.state === 'forest').length,
    stable: coverage >= CONFIG.stableFood && carbonPct >= CONFIG.stableCarbon,
  }
}

export const demandAt = (cycle: number) => CONFIG.demandStart + CONFIG.demandGrowth * cycle

function checkEnd(state: GameState) {
  if (state.status !== 'playing') return
  const ind = indicators(state)
  if (ind.carbonPct < CONFIG.endCarbon) state.status = 'collapse'
  else if (ind.coverage < CONFIG.endFood) state.status = 'hunger'
}

export const isProtected = (state: GameState, p: Parcel) => p.protectedUntil > state.cycle
export const protectedCount = (state: GameState) => state.parcels.filter(p => isProtected(state, p)).length
const FOREST_LIKE: ParcelState[] = ['forest', 'young', 'sapling']

export interface ActionResult { ok: boolean; reason?: string }

export function protect(state: GameState, index: number): ActionResult {
  const p = state.parcels[index]
  if (state.status !== 'playing') return { ok: false, reason: 'La partida terminó.' }
  if (!FOREST_LIKE.includes(p.state)) return { ok: false, reason: 'Solo se puede conservar un bosque o una zona en restauración.' }
  if (isProtected(state, p)) return { ok: false, reason: 'Esa parcela ya está protegida.' }
  if (protectedCount(state) >= CONFIG.protectCap) return { ok: false, reason: `Solo puedes proteger ${CONFIG.protectCap} parcelas a la vez.` }
  p.protectedUntil = state.cycle + CONFIG.protectCycles
  state.actions++
  return { ok: true }
}

export function cultivate(state: GameState, index: number): ActionResult {
  const p = state.parcels[index]
  if (state.status !== 'playing') return { ok: false, reason: 'La partida terminó.' }
  if (p.state === 'crop') return { ok: false, reason: 'Esa parcela ya es un cultivo.' }
  if (FOREST_LIKE.includes(p.state)) state.converted++
  p.state = 'crop'; p.age = 0; p.protectedUntil = 0
  state.actions++
  checkEnd(state)
  return { ok: true }
}

export function restore(state: GameState, index: number): ActionResult {
  const p = state.parcels[index]
  if (state.status !== 'playing') return { ok: false, reason: 'La partida terminó.' }
  if (p.state !== 'crop' && p.state !== 'degraded') return { ok: false, reason: 'Solo se restauran cultivos o parcelas degradadas.' }
  if (state.restoreLeft <= 0) return { ok: false, reason: `No te quedan acciones de restauración por ahora (ganas +1 cada ${CONFIG.restoreRechargeEvery} ciclos estables o cada ${SCORE_BONUS_STEP} puntos).` }
  state.restoreLeft--; state.restored++
  p.state = 'sapling'; p.age = 0
  state.actions++
  checkEnd(state)
  return { ok: true }
}

export function applyTool(state: GameState, tool: Tool, index: number): ActionResult {
  return tool === 'protect' ? protect(state, index) : tool === 'cultivate' ? cultivate(state, index) : restore(state, index)
}

function neighbours(index: number): number[] {
  const r = Math.floor(index / SIZE), c = index % SIZE, out: number[] = []
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push(nr * SIZE + nc)
  }
  return out
}

function pushEvent(state: GameState, event: GameEvent) {
  state.events.push(event)
  if (state.events.length > 30) state.events.shift()
  state.parcels[event.index].flashUntil = state.t + 1.2
}

/** Multiplicador: sube cada 5 ciclos estables seguidos, hasta ×3. */
export const multiplierFor = (stableCycles: number) => Math.min(3, 1 + Math.floor(stableCycles / 5))

export function advanceCycle(state: GameState) {
  if (indicators(state).stable) {
    state.stableCycles++
    if (state.stableCycles % CONFIG.restoreRechargeEvery === 0 && state.restoreLeft < CONFIG.restoreMax) {
      state.restoreLeft++
    }
  } else {
    state.stableCycles = 0
  }
  state.multiplier = multiplierFor(state.stableCycles)
  state.bestMultiplier = Math.max(state.bestMultiplier, state.multiplier)
  state.cycle++
  state.demand = demandAt(state.cycle)
  for (const p of state.parcels) {
    if (p.state === 'sapling' || p.state === 'young') {
      p.age++
      if (p.age >= CONFIG.growCycles) { p.state = p.state === 'sapling' ? 'young' : 'forest'; p.age = 0 }
    }
  }
  const loggingFreq = state.cycle >= 12 ? 2 : CONFIG.loggingEvery
  if (state.cycle % loggingFreq === 0) {
    const candidates = state.parcels.map((p, i) => ({ p, i })).filter(({ p }) => p.state === 'forest' && !isProtected(state, p))
    if (candidates.length) {
      const { p, i } = candidates[Math.floor(nextRandom(state) * candidates.length)]
      p.state = 'crop'; p.age = 0; state.converted++; state.logged++
      pushEvent(state, { kind: 'logging', index: i, cycle: state.cycle })
    }
  }
  const fireFreq = state.cycle >= 14 ? 4 : CONFIG.fireEvery
  if (state.cycle >= CONFIG.fireStart && (state.cycle - CONFIG.fireStart) % fireFreq === 0) {
    const weighted = state.parcels.map((p, i) => ({ p, i }))
      .filter(({ p }) => FOREST_LIKE.includes(p.state) && !isProtected(state, p))
      .map(({ p, i }) => ({ p, i, w: 1 + 2 * neighbours(i).filter(n => state.parcels[n].state === 'crop' || state.parcels[n].state === 'degraded').length }))
    const total = weighted.reduce((sum, x) => sum + x.w, 0)
    if (total > 0) {
      let roll = nextRandom(state) * total, picked = weighted[0]
      for (const x of weighted) { if ((roll -= x.w) <= 0) { picked = x; break } }
      picked.p.state = 'degraded'; picked.p.age = 0; state.fires++
      pushEvent(state, { kind: 'fire', index: picked.i, cycle: state.cycle })
    }
  }
  checkEnd(state)
  if (state.status === 'playing' && state.targetCycles > 0 && state.cycle >= state.targetCycles) {
    state.status = 'survived'
  }
}

export function hasReachedChallenge(state: GameState): boolean {
  return totalScore(state) >= CHALLENGE_TARGET_SCORE && state.stableTime >= MIN_WIN_STABLE_SECONDS && state.actions >= MIN_WIN_ACTIONS
}

export function step(state: GameState, dt: number): GameState {
  if (state.status !== 'playing') return state
  dt = Math.min(Math.max(dt, 0), 0.1)
  state.t += dt
  if (indicators(state).stable) {
    state.stableTime += dt
    state.bonus += dt * 10 * (state.multiplier - 1)
  } else if (state.multiplier > 1) {
    state.multiplier = 1
    state.stableCycles = 0
  }
  const milestones = Math.floor(totalScore(state) / SCORE_BONUS_STEP)
  if (milestones > state.scoreMilestonesClaimed) {
    const gained = (milestones - state.scoreMilestonesClaimed) * SCORE_BONUS_RESTORE
    state.restoreLeft = Math.min(CONFIG.restoreMax, state.restoreLeft + gained)
    state.scoreMilestonesClaimed = milestones
  }
  if (!state.challengeCleared && hasReachedChallenge(state)) {
    state.challengeCleared = true
  }
  state.cycleTimer += dt
  while (state.cycleTimer >= CONFIG.cycleSeconds && state.status === 'playing') {
    state.cycleTimer -= CONFIG.cycleSeconds
    advanceCycle(state)
  }
  return state
}

export const score = (state: GameState) => Math.round(state.stableTime * 10)
export const totalScore = (state: GameState) => Math.round(state.stableTime * 10 + state.bonus)

export interface Summary {
  score: number
  total: number
  bonus: number
  bestMultiplier: number
  seconds: number
  cycles: number
  stableSeconds: number
  actions: number
  forests: number
  converted: number
  netCarbon: number
  fires: number
  logged: number
  restored: number
  cause: Status
  checks: { score: boolean; stable: boolean; active: boolean }
  passed: boolean
}

export function summarize(state: GameState): Summary {
  const ind = indicators(state)
  const total = totalScore(state)
  const checks = {
    score: state.challengeCleared || total >= CHALLENGE_TARGET_SCORE,
    stable: state.stableTime >= MIN_WIN_STABLE_SECONDS,
    active: state.actions >= MIN_WIN_ACTIONS,
  }
  const finitePassed = state.status === 'survived' && checks.stable && checks.active
  return {
    score: score(state), total, bonus: Math.round(state.bonus), bestMultiplier: state.bestMultiplier,
    seconds: state.t, cycles: state.cycle,
    stableSeconds: Math.round(state.stableTime), actions: state.actions, forests: ind.forests, converted: state.converted,
    netCarbon: ind.carbon - state.startCarbon, fires: state.fires, logged: state.logged, restored: state.restored, cause: state.status,
    checks, passed: state.challengeCleared || hasReachedChallenge(state) || finitePassed,
  }
}
