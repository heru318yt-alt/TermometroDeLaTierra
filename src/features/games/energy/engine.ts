/**
 * Mantén la red · motor arcade del minijuego de Energía y electricidad.
 *
 * Lógica pura y determinista (sin DOM). En modo arcade, el flujo de recursos es
 * continuo con dificultad creciente: al superar la meta del reto se desbloquea el
 * progreso y el jugador puede seguir jugando sin límite para buscar su récord.
 */
export type ResourceKind = 'carbon' | 'gas' | 'renewable' | 'storage'
export type GameStatus = 'playing' | 'blackout' | 'overload'

export interface FallingItem { id: number; kind: ResourceKind; x: number; y: number; speed: number }

export type Fx =
  | { type: 'catch'; kind: ResourceKind; x: number; gain: number }
  | { type: 'miss'; kind: ResourceKind; x: number }
  | { type: 'streak'; multiplier: number }
  | { type: 'streak-lost'; multiplier: number }
  | { type: 'score-bonus'; storage: number; stability: number }

export interface GameState {
  t: number
  rng: number
  nextId: number
  status: GameStatus
  supply: number
  stored: number
  /** Estabilidad de la red (0–100): baja fuera de la zona segura y se recupera dentro. */
  stability: number
  containerX: number
  items: FallingItem[]
  spawnTimer: number
  spawned: number
  inZoneTime: number
  emissions: number
  wasted: number
  storageReleased: number
  caught: Record<ResourceKind, number>
  missed: number
  streakTime: number
  multiplier: number
  bestMultiplier: number
  bonus: number
  challengeCleared: boolean
  scoreMilestonesClaimed: number
  fx: Fx[]
}

export const CONFIG = {
  startStability: 100,
  storageCap: 30,
  safeHalf: 8.5,
  containerHalf: 0.085,
  itemHalf: 0.025,
  catchTop: 0.8,
  catchBottom: 0.93,
  containerY: 0.84,
  gain: { carbon: 15, gas: 10, renewable: 7 } as Record<'carbon' | 'gas' | 'renewable', number>,
  storageGain: 12,
  emissionsPerCatch: { carbon: 4, gas: 1.6, renewable: 0, storage: 0 } as Record<ResourceKind, number>,
  releaseRate: 15,
  streakStep: 5,
  maxMultiplier: 3,
} as const

export const CHALLENGE_TARGET_SCORE = 320
export const MIN_WIN_IN_ZONE_PCT = 50
export const MIN_WIN_CAUGHT = 8
export const SCORE_BONUS_STEP = 300
export const SCORE_BONUS_STORAGE = 6
export const SCORE_BONUS_STABILITY = 8

export const RESOURCE_LABEL: Record<ResourceKind, string> = {
  carbon: 'Carbón', gas: 'Gas', renewable: 'Renovable', storage: 'Almacenamiento',
}

/** Demanda eléctrica en modo arcade: sube más rápido y oscila con mayor amplitud. */
export function demandAt(t: number): number {
  return 42 + Math.min(t * 0.22, 34) + 8 * Math.sin(t / 5.5)
}

export function safeZone(t: number): { low: number; high: number } {
  const d = demandAt(t)
  return { low: d - CONFIG.safeHalf, high: d + CONFIG.safeHalf }
}

export function renewableAvailability(t: number): number {
  return 0.5 + 0.5 * Math.sin(t / 11)
}

/** Consumo base de la red: arranca más exigente y escala de forma progresiva. */
export function decayRate(t: number): number {
  return 3.4 + Math.min(3.2, 0.024 * t)
}

/** Velocidad vertical de caída: escala suavemente con el tiempo en pantalla. */
export function fallSpeedAt(t: number): number {
  return 0.29 + Math.min(0.22, t * 0.0014)
}

/** Ritmo de caída continuo en modo arcade: más veloz conforme avanza la partida. */
export function spawnInterval(elapsedSeconds: number): number {
  return Math.max(0.56, 0.92 - elapsedSeconds * 0.0022)
}

function mulberry32(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) >>> 0
  let t = a
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a]
}

function random(state: GameState): number {
  const [value, next] = mulberry32(state.rng)
  state.rng = next
  return value
}

export function createGame(seed = 1970): GameState {
  return {
    t: 0, rng: seed >>> 0, nextId: 1, status: 'playing',
    supply: demandAt(0), stored: 0, stability: CONFIG.startStability, containerX: 0.5,
    items: [], spawnTimer: 0.35, spawned: 0,
    inZoneTime: 0, emissions: 0, wasted: 0, storageReleased: 0,
    caught: { carbon: 0, gas: 0, renewable: 0, storage: 0 }, missed: 0,
    streakTime: 0, multiplier: 1, bestMultiplier: 1, bonus: 0,
    challengeCleared: false, scoreMilestonesClaimed: 0, fx: [],
  }
}

function pickKind(state: GameState): ResourceKind {
  const avail = renewableAvailability(state.t)
  const weights: [ResourceKind, number][] = [
    ['carbon', 24], ['gas', 26], ['renewable', 12 + 40 * avail], ['storage', 16],
  ]
  const total = weights.reduce((sum, [, w]) => sum + w, 0)
  let roll = random(state) * total
  for (const [kind, w] of weights) { if ((roll -= w) <= 0) return kind }
  return 'gas'
}

function spawn(state: GameState) {
  const kind = pickKind(state)
  const baseSpeed = fallSpeedAt(state.t)
  state.items.push({
    id: state.nextId++, kind, x: 0.06 + random(state) * 0.88, y: -0.04,
    speed: baseSpeed + random(state) * 0.12,
  })
  state.spawned++
}

function pushFx(state: GameState, fx: Fx) {
  state.fx.push(fx)
  if (state.fx.length > 40) state.fx.shift()
}

function applyCatch(state: GameState, kind: ResourceKind, x: number) {
  pushFx(state, { type: 'catch', kind, x, gain: kind === 'storage' ? CONFIG.storageGain : CONFIG.gain[kind] })
  state.caught[kind]++
  state.emissions += CONFIG.emissionsPerCatch[kind]
  if (kind === 'storage') {
    const room = CONFIG.storageCap - state.stored
    const add = Math.min(room, CONFIG.storageGain)
    state.stored += add
    state.wasted += CONFIG.storageGain - add
  } else {
    state.supply += CONFIG.gain[kind]
  }
}

export function hasReachedChallenge(state: GameState): boolean {
  const caughtTotal = Object.values(state.caught).reduce((a, b) => a + b, 0)
  const inZonePct = state.t > 0 ? (state.inZoneTime / state.t) * 100 : 0
  return totalScore(state) >= CHALLENGE_TARGET_SCORE && caughtTotal >= MIN_WIN_CAUGHT && inZonePct >= MIN_WIN_IN_ZONE_PCT
}

/** Avanza la simulación `dt` segundos. `targetX` es la posición deseada (0–1) del colector. */
export function step(state: GameState, dt: number, targetX: number): GameState {
  if (state.status !== 'playing') return state
  dt = Math.min(Math.max(dt, 0), 0.05)
  const half = CONFIG.containerHalf
  state.containerX = Math.min(1 - half, Math.max(half, targetX))
  state.t += dt

  state.spawnTimer -= dt
  if (state.spawnTimer <= 0) {
    spawn(state)
    state.spawnTimer += spawnInterval(state.t)
  }

  const reach = half + CONFIG.itemHalf
  const remaining: FallingItem[] = []
  for (const item of state.items) {
    item.y += item.speed * dt
    const inCatchWindow = item.y >= CONFIG.catchTop && item.y <= CONFIG.catchBottom
    if (inCatchWindow && Math.abs(item.x - state.containerX) <= reach) applyCatch(state, item.kind, item.x)
    else if (item.y > 1.04) { state.missed++; pushFx(state, { type: 'miss', kind: item.kind, x: item.x }) }
    else remaining.push(item)
  }
  state.items = remaining

  state.supply -= decayRate(state.t) * dt

  const zone = safeZone(state.t)
  if (state.stored > 0 && state.supply < zone.low + 3) {
    const moved = Math.min(state.stored, CONFIG.releaseRate * dt)
    state.stored -= moved
    state.supply += moved
    state.storageReleased += moved
  }

  if (state.supply > 100) { state.wasted += state.supply - 100; state.supply = 100 }
  if (state.supply >= zone.low && state.supply <= zone.high) {
    state.inZoneTime += dt
    state.stability = Math.min(CONFIG.startStability, state.stability + 4.5 * dt)
    state.streakTime += dt
    const level = Math.min(CONFIG.maxMultiplier, 1 + Math.floor(state.streakTime / CONFIG.streakStep))
    if (level > state.multiplier) {
      state.multiplier = level
      state.bestMultiplier = Math.max(state.bestMultiplier, level)
      pushFx(state, { type: 'streak', multiplier: level })
    }
    state.bonus += dt * 10 * (state.multiplier - 1)
  } else {
    if (state.streakTime > 0) {
      if (state.multiplier > 1) pushFx(state, { type: 'streak-lost', multiplier: state.multiplier })
      state.streakTime = 0
      state.multiplier = 1
    }
    const drain = state.supply >= 97 ? 13 : 7.5
    state.stability = Math.max(0, state.stability - drain * dt)
  }

  const milestones = Math.floor(totalScore(state) / SCORE_BONUS_STEP)
  if (milestones > state.scoreMilestonesClaimed) {
    const delta = milestones - state.scoreMilestonesClaimed
    const addStorage = Math.min(CONFIG.storageCap - state.stored, delta * SCORE_BONUS_STORAGE)
    const addStability = Math.min(CONFIG.startStability - state.stability, delta * SCORE_BONUS_STABILITY)
    state.stored += addStorage
    state.stability += addStability
    state.scoreMilestonesClaimed = milestones
    pushFx(state, { type: 'score-bonus', storage: Math.round(addStorage), stability: Math.round(addStability) })
  }

  if (!state.challengeCleared && hasReachedChallenge(state)) {
    state.challengeCleared = true
  }

  if (state.supply <= 0) {
    state.supply = 0
    state.status = 'blackout'
  } else if (state.stability <= 0) {
    state.stability = 0
    state.status = state.supply < zone.low ? 'blackout' : 'overload'
  }
  return state
}

export function score(state: GameState): number {
  return Math.round(state.inZoneTime * 10)
}

export function totalScore(state: GameState): number {
  return Math.round(state.inZoneTime * 10 + state.bonus)
}

export interface SummaryChecks {
  score: boolean
  inZone: boolean
  active: boolean
}

export interface Summary {
  score: number
  total: number
  bonus: number
  bestMultiplier: number
  stabilityLeft: number
  seconds: number
  inZonePct: number
  emissions: number
  emissionsPerSecond: number
  cleanGrid: boolean
  dominant: ResourceKind | null
  caughtTotal: number
  cause: GameStatus
  checks: SummaryChecks
  passed: boolean
}

export function summarize(state: GameState): Summary {
  const caughtTotal = Object.values(state.caught).reduce((a, b) => a + b, 0)
  const s = score(state)
  const total = totalScore(state)
  const perSecond = state.emissions / Math.max(1, state.inZoneTime)
  const inZonePct = state.t > 0 ? (state.inZoneTime / state.t) * 100 : 0
  const checks: SummaryChecks = {
    score: state.challengeCleared || total >= CHALLENGE_TARGET_SCORE,
    inZone: inZonePct >= MIN_WIN_IN_ZONE_PCT,
    active: caughtTotal >= MIN_WIN_CAUGHT,
  }
  const passed = state.challengeCleared || (checks.score && checks.inZone && checks.active)
  let dominant: ResourceKind | null = null
  for (const kind of Object.keys(state.caught) as ResourceKind[]) {
    if (state.caught[kind] > 0 && (!dominant || state.caught[kind] > state.caught[dominant])) dominant = kind
  }
  return {
    score: s, total, bonus: Math.round(state.bonus), bestMultiplier: state.bestMultiplier,
    stabilityLeft: Math.round(state.stability),
    seconds: state.t, inZonePct, emissions: Math.round(state.emissions),
    emissionsPerSecond: perSecond, cleanGrid: passed && total >= 450 && perSecond <= 1.2, dominant, caughtTotal,
    cause: state.status, checks, passed,
  }
}
