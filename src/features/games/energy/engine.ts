/**
 * Mantén la red · motor del minijuego de Energía y electricidad.
 *
 * Lógica pura y determinista (sin DOM) para poder probarla. Todos los valores
 * son didácticos: no representan mediciones de emisiones ni datos GISTEMP.
 */
export type ResourceKind = 'carbon' | 'gas' | 'renewable' | 'storage'
export type GameStatus = 'playing' | 'blackout' | 'nofuel'

export interface FallingItem { id: number; kind: ResourceKind; x: number; y: number; speed: number }

/** Eventos visuales que la interfaz consume (partículas, textos, sonidos). */
export type Fx =
  | { type: 'catch'; kind: ResourceKind; x: number; gain: number }
  | { type: 'miss'; kind: ResourceKind; x: number }
  | { type: 'streak'; multiplier: number }
  | { type: 'streak-lost'; multiplier: number }

export interface GameState {
  t: number
  rng: number
  nextId: number
  status: GameStatus
  supply: number
  stored: number
  /** Combustible del colector: se gasta solo y cada vez más rápido. */
  fuel: number
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
  /** Segundos seguidos dentro de la zona segura (se reinicia al salir). */
  streakTime: number
  multiplier: number
  bestMultiplier: number
  /** Puntos extra ganados por mantener la racha. */
  bonus: number
  fx: Fx[]
}

export const CONFIG = {
  pool: 54,                 // recursos totales que caerán en la partida (se agotan)
  startFuel: 180,           // combustible del colector: la partida siempre termina sin él
  storageCap: 30,
  safeHalf: 10,             // la zona segura es demanda ± safeHalf
  containerHalf: 0.085,
  itemHalf: 0.025,
  catchTop: 0.8,
  catchBottom: 0.93,
  containerY: 0.84,
  gain: { carbon: 15, gas: 10, renewable: 7 } as Record<'carbon' | 'gas' | 'renewable', number>,
  storageGain: 12,
  emissionsPerCatch: { carbon: 4, gas: 1.6, renewable: 0, storage: 0 } as Record<ResourceKind, number>,
  releaseRate: 14,
  streakStep: 5,            // s seguidos en zona para subir el multiplicador
  maxMultiplier: 3,
} as const

export const RESOURCE_LABEL: Record<ResourceKind, string> = {
  carbon: 'Carbón', gas: 'Gas', renewable: 'Renovable', storage: 'Almacenamiento',
}

/** Demanda eléctrica del escenario: crece despacio y fluctúa. */
export function demandAt(t: number): number {
  return 45 + Math.min(t * 0.12, 18) + 7 * Math.sin(t / 6.5)
}

export function safeZone(t: number): { low: number; high: number } {
  const d = demandAt(t)
  return { low: d - CONFIG.safeHalf, high: d + CONFIG.safeHalf }
}

/** Disponibilidad de renovables (0–1): cambia durante la partida. */
export function renewableAvailability(t: number): number {
  return 0.5 + 0.5 * Math.sin(t / 11)
}

export function decayRate(t: number): number {
  return 2.8 + 0.04 * t
}

/** Combustible que consume el colector por segundo: sube con el tiempo. */
export function fuelBurn(t: number): number {
  return 1.6 + Math.floor(t / 25) * 0.7 + t * 0.012
}

/**
 * Segundos entre caídas: crece de forma acelerada, así que la reserva
 * llega cada vez más despacio y el jugador termina sin recursos ni combustible.
 */
export function spawnInterval(spawned: number): number {
  return 0.9 + spawned * 0.035 + spawned * spawned * 0.0008
}

function mulberry32(state: number): [number, number] {
  let a = (state + 0x6d2b79f5) >>> 0
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
    supply: demandAt(0), stored: 0, fuel: CONFIG.startFuel, containerX: 0.5,
    items: [], spawnTimer: 0.4, spawned: 0,
    inZoneTime: 0, emissions: 0, wasted: 0, storageReleased: 0,
    caught: { carbon: 0, gas: 0, renewable: 0, storage: 0 }, missed: 0,
    streakTime: 0, multiplier: 1, bestMultiplier: 1, bonus: 0, fx: [],
  }
}

function pickKind(state: GameState): ResourceKind {
  const avail = renewableAvailability(state.t)
  const weights: [ResourceKind, number][] = [
    ['carbon', 26], ['gas', 24], ['renewable', 10 + 40 * avail], ['storage', 14],
  ]
  const total = weights.reduce((sum, [, w]) => sum + w, 0)
  let roll = random(state) * total
  for (const [kind, w] of weights) { if ((roll -= w) <= 0) return kind }
  return 'gas'
}

function spawn(state: GameState) {
  const kind = pickKind(state)
  state.items.push({
    id: state.nextId++, kind, x: 0.06 + random(state) * 0.88, y: -0.04,
    speed: 0.27 + random(state) * 0.12,
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

/** Avanza la simulación `dt` segundos. `targetX` es la posición deseada (0–1) del contenedor. */
export function step(state: GameState, dt: number, targetX: number): GameState {
  if (state.status !== 'playing') return state
  dt = Math.min(Math.max(dt, 0), 0.05)
  const half = CONFIG.containerHalf
  state.containerX = Math.min(1 - half, Math.max(half, targetX))
  state.t += dt

  // Llegada de recursos: el conjunto es finito.
  if (state.spawned < CONFIG.pool) {
    state.spawnTimer -= dt
    if (state.spawnTimer <= 0) { spawn(state); state.spawnTimer += spawnInterval(state.spawned) }
  }

  // Caída y captura.
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

  // Consumo constante de la red.
  state.supply -= decayRate(state.t) * dt

  // El colector gasta combustible aunque no atrape nada: la partida tiene un final.
  state.fuel = Math.max(0, state.fuel - fuelBurn(state.t) * dt)

  // El almacenamiento amortigua cuando la oferta cae cerca del límite inferior.
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
    // Racha: mantener la red estable multiplica los puntos de cada segundo.
    state.streakTime += dt
    const level = Math.min(CONFIG.maxMultiplier, 1 + Math.floor(state.streakTime / CONFIG.streakStep))
    if (level > state.multiplier) { state.multiplier = level; state.bestMultiplier = Math.max(state.bestMultiplier, level); pushFx(state, { type: 'streak', multiplier: level }) }
    state.bonus += dt * 10 * (state.multiplier - 1)
  } else if (state.streakTime > 0) {
    if (state.multiplier > 1) pushFx(state, { type: 'streak-lost', multiplier: state.multiplier })
    state.streakTime = 0; state.multiplier = 1
  }
  if (state.fuel <= 0) { state.fuel = 0; state.status = 'nofuel' }
  else if (state.spawned >= CONFIG.pool && state.items.length === 0) state.status = 'nofuel'
  else if (state.supply <= 0) { state.supply = 0; state.status = 'blackout' }
  return state
}

export function score(state: GameState): number {
  return Math.round(state.inZoneTime * 10)
}

/** Puntaje mostrado: tiempo en zona + bono por racha. */
export function totalScore(state: GameState): number {
  return Math.round(state.inZoneTime * 10 + state.bonus)
}

/** Recursos que todavía pueden llegar (en la reserva o cayendo). */
export function remainingResources(state: GameState): number {
  return Math.max(0, CONFIG.pool - state.spawned) + state.items.length
}

/** ¿La partida terminó porque se acabó el combustible o la reserva? */
export function reserveExhausted(state: GameState): boolean {
  return state.status === 'nofuel'
}

export interface Summary {
  score: number
  total: number
  bonus: number
  bestMultiplier: number
  exhausted: boolean
  fuelOut: boolean
  fuelLeft: number
  seconds: number
  emissions: number
  emissionsPerSecond: number
  cleanGrid: boolean
  dominant: ResourceKind | null
  caughtTotal: number
}

export function summarize(state: GameState): Summary {
  const caughtTotal = Object.values(state.caught).reduce((a, b) => a + b, 0)
  const s = score(state)
  const perSecond = state.emissions / Math.max(1, state.inZoneTime)
  let dominant: ResourceKind | null = null
  for (const kind of Object.keys(state.caught) as ResourceKind[]) {
    if (state.caught[kind] > 0 && (!dominant || state.caught[kind] > state.caught[dominant])) dominant = kind
  }
  return {
    score: s, total: totalScore(state), bonus: Math.round(state.bonus), bestMultiplier: state.bestMultiplier,
    exhausted: reserveExhausted(state), fuelOut: state.status === 'nofuel', fuelLeft: Math.round(state.fuel),
    seconds: state.t, emissions: Math.round(state.emissions),
    emissionsPerSecond: perSecond, cleanGrid: s >= 300 && perSecond <= 1.2, dominant, caughtTotal,
  }
}
