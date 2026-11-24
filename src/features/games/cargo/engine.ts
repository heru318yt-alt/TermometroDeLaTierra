/**
 * Carga entre ciudades · motor del minijuego de Transporte de carga.
 *
 * Lanzamiento de cajas al estilo "Angry Birds". Cada modo de transporte es un
 * lanzador con alcance, tiempo de vuelo, lote, energía y emisiones distintos.
 * Todos los valores son didácticos y no son mediciones reales.
 */
export type Mode = 'road' | 'rail' | 'ship' | 'plane'
export type Status = 'playing' | 'round-over' | 'finished'

export const WORLD = { w: 120, h: 67.5 }
export const ORIGIN = { x: 8, y: 1.5 }
export const ZONE_HALF = 5
export const KM_PER_UNIT = 10
export const ROUND_SECONDS = 24
export const ENERGY_BUDGET = 54
export const MIN_POWER = 0.2

export interface ModeDef {
  label: string
  vmax: number          // velocidad de salida a potencia 1
  g: number             // gravedad del modo: define cuánto dura el vuelo
  fixedAngle: number | null
  cooldown: number      // s entre lanzamientos
  boxes: number         // cajas (toneladas) por lanzamiento
  spacing: number       // separación entre cajas del lote al llegar
  energy: number        // energía por lanzamiento
  gPerTkm: number       // g CO₂e por tonelada-kilómetro (valor del escenario)
  note: string
}

export const MODES: Record<Mode, ModeDef> = {
  road: { label: 'Carretera', vmax: 35.4, g: 25, fixedAngle: null, cooldown: 1.8, boxes: 2, spacing: 1.4, energy: 3, gPerTkm: 100, note: 'Flexible, lotes pequeños y alcance medio.' },
  rail: { label: 'Ferrocarril', vmax: 47.1, g: 27.8, fixedAngle: 45, cooldown: 3.2, boxes: 5, spacing: 1.4, energy: 4, gPerTkm: 25, note: 'Trayectoria fija, lotes grandes, eficiente por tonelada-km.' },
  ship: { label: 'Barco', vmax: 34.6, g: 10.9, fixedAngle: null, cooldown: 5.5, boxes: 9, spacing: 2.2, energy: 6, gPerTkm: 15, note: 'Gran alcance y lotes enormes, pero lento y poco preciso.' },
  plane: { label: 'Avión', vmax: 101.6, g: 89.8, fixedAngle: null, cooldown: 1.0, boxes: 3, spacing: 1.4, energy: 5, gPerTkm: 800, note: 'Muy rápido y de gran alcance, con emisiones muy altas por tonelada-km.' },
}
export const MODE_ORDER: Mode[] = ['road', 'rail', 'ship', 'plane']

export interface RouteDef { id: string; name: string; distance: number; minDelivered: number; hillX: number; hillHalf: number; hillHeight: number; text: string }

const route = (id: string, name: string, distance: number, minDelivered: number, text: string): RouteDef =>
  ({ id, name, distance, minDelivered, hillX: ORIGIN.x + distance * 0.45, hillHalf: 3.5, hillHeight: 7, text })

export const ROUTES: RouteDef[] = [
  route('cercana', 'Ruta corta', 40, 4, 'Dos ciudades cercanas: todos los modos llegan.'),
  route('media', 'Ruta media', 70, 5, 'La distancia crece y la carretera ya no alcanza.'),
  route('larga', 'Ruta larga', 100, 5, 'Destino lejano: solo el barco y el avión llegan.'),
]

export const routeCenter = (r: RouteDef) => ORIGIN.x + r.distance
export const routeKm = (r: RouteDef) => r.distance * KM_PER_UNIT

export interface Box { id: number; x: number; y: number; vx: number; vy: number; mode: Mode; batch: number }

/** Un lote lanzado: se evalúa cuando todas sus cajas terminan su vuelo. */
export interface Batch { id: number; mode: Mode; boxes: number; delivered: number; resolved: number }

export type Fx =
  | { type: 'land'; x: number; ok: boolean; mode: Mode }
  | { type: 'batch'; delivered: number; boxes: number; multiplier: number; bonus: number }
  | { type: 'streak-lost'; streak: number }

/** Multiplicador por lotes precisos seguidos (al menos la mitad del lote en la zona). */
export const streakMultiplier = (streak: number) => streak >= 5 ? 3 : streak >= 3 ? 2 : 1

export interface GameState {
  routeIndex: number
  status: Status
  roundTime: number
  energy: number
  cooldown: number
  boxes: Box[]
  nextId: number
  delivered: number
  deliveredByRoute: number[]
  deliveredTkm: number
  launched: number
  lost: number
  late: number
  emissionsKg: number
  launches: Record<Mode, number>
  deliveredByMode: Record<Mode, number>
  endReason: 'time' | 'energy' | null
  batches: Record<number, Batch>
  nextBatch: number
  streak: number
  bestStreak: number
  bonus: number
  fx: Fx[]
}

export function createGame(): GameState {
  return {
    routeIndex: 0, status: 'playing', roundTime: 0, energy: ENERGY_BUDGET, cooldown: 0, boxes: [], nextId: 1,
    delivered: 0, deliveredByRoute: [0, 0, 0], deliveredTkm: 0, launched: 0, lost: 0, late: 0, emissionsKg: 0,
    launches: { road: 0, rail: 0, ship: 0, plane: 0 }, deliveredByMode: { road: 0, rail: 0, ship: 0, plane: 0 }, endReason: null,
    batches: {}, nextBatch: 1, streak: 0, bestStreak: 0, bonus: 0, fx: [],
  }
}

export const minEnergy = () => Math.min(...MODE_ORDER.map(m => MODES[m].energy))
const rad = (deg: number) => (deg * Math.PI) / 180

export function effectiveAngle(mode: Mode, angle: number): number {
  const fixed = MODES[mode].fixedAngle
  return Math.min(80, Math.max(10, fixed ?? angle))
}

export function launchVelocity(mode: Mode, angle: number, power: number) {
  const v = MODES[mode].vmax * Math.min(1, Math.max(0, power))
  const a = rad(effectiveAngle(mode, angle))
  return { vx: v * Math.cos(a), vy: v * Math.sin(a) }
}

/** Ruta que seguiría el centro del lote (sin colinas ni zona): para la guía de puntería. */
export function trajectory(mode: Mode, angle: number, power: number, dt = 0.05): { x: number; y: number }[] {
  const { vx, vy } = launchVelocity(mode, angle, power)
  const g = MODES[mode].g
  const pts: { x: number; y: number }[] = []
  for (let t = 0; t < 20; t += dt) {
    const x = ORIGIN.x + vx * t, y = ORIGIN.y + vy * t - 0.5 * g * t * t
    pts.push({ x, y: Math.max(0, y) })
    if (y <= 0 || x > WORLD.w) break
  }
  return pts
}

/** x donde aterriza el centro del lote al nivel del suelo. */
export function landingX(mode: Mode, angle: number, power: number): number {
  const { vx, vy } = launchVelocity(mode, angle, power)
  const g = MODES[mode].g
  const t = (vy + Math.sqrt(vy * vy + 2 * g * ORIGIN.y)) / g
  return ORIGIN.x + vx * t
}

/** Tiempo estimado de vuelo (en segundos) hasta y = 0. */
export function flightTime(mode: Mode, angle: number, power: number): number {
  const { vy } = launchVelocity(mode, angle, power)
  const g = MODES[mode].g
  return (vy + Math.sqrt(vy * vy + 2 * g * ORIGIN.y)) / g
}

/** Semiancho de dispersión del lote alrededor del punto central de caída. */
export function batchSpreadHalf(mode: Mode): number {
  const def = MODES[mode]
  return ((def.boxes - 1) * def.spacing) / 2
}

/** Emisiones estimadas (en toneladas de CO₂e) de un lanzamiento en la ruta dada. */
export function batchEmissionsTonnes(mode: Mode, r: RouteDef): number {
  const def = MODES[mode]
  return (def.boxes * def.gPerTkm * routeKm(r)) / 1000
}

export function hillBlocks(r: RouteDef, x: number, y: number): boolean {
  const d = Math.abs(x - r.hillX)
  return d < r.hillHalf && y <= r.hillHeight * (1 - d / r.hillHalf)
}

export function maxRange(mode: Mode): number {
  return landingX(mode, MODES[mode].fixedAngle ?? 45, 1) - ORIGIN.x
}

export function reaches(mode: Mode, r: RouteDef): boolean {
  return maxRange(mode) >= r.distance + 1
}

export function canLaunch(state: GameState, mode: Mode): { ok: boolean; reason?: string } {
  if (state.status !== 'playing') return { ok: false, reason: 'La ronda terminó.' }
  if (state.cooldown > 0) return { ok: false, reason: 'El lanzador se está recargando.' }
  if (state.energy < MODES[mode].energy) return { ok: false, reason: 'No te alcanza la energía para este modo.' }
  return { ok: true }
}

/** Lanza un lote. Devuelve false si no se puede (recarga, energía o potencia). */
export function launch(state: GameState, mode: Mode, angle: number, power: number): boolean {
  if (!canLaunch(state, mode).ok || power < MIN_POWER) return false
  const def = MODES[mode], r = ROUTES[state.routeIndex]
  const { vx, vy } = launchVelocity(mode, angle, power)
  const batch = state.nextBatch++
  state.batches[batch] = { id: batch, mode, boxes: def.boxes, delivered: 0, resolved: 0 }
  for (let i = 0; i < def.boxes; i++) {
    state.boxes.push({ id: state.nextId++, x: ORIGIN.x + (i - (def.boxes - 1) / 2) * def.spacing, y: ORIGIN.y, vx, vy, mode, batch })
  }
  state.energy -= def.energy
  state.cooldown = def.cooldown
  state.launched += def.boxes
  state.launches[mode]++
  state.emissionsKg += (def.boxes * def.gPerTkm * routeKm(r)) / 1000
  return true
}

function pushFx(state: GameState, fx: Fx) {
  state.fx.push(fx)
  if (state.fx.length > 60) state.fx.shift()
}

/** Marca una caja como resuelta y, si el lote terminó, actualiza la racha. */
function resolveBox(state: GameState, box: Box, delivered: boolean) {
  const batch = state.batches[box.batch]
  if (!batch) return
  batch.resolved++
  if (delivered) batch.delivered++
  if (batch.resolved < batch.boxes) return
  delete state.batches[box.batch]
  if (batch.delivered * 2 >= batch.boxes) {
    state.streak++
    state.bestStreak = Math.max(state.bestStreak, state.streak)
    const multiplier = streakMultiplier(state.streak)
    const bonus = batch.delivered * (multiplier - 1)
    state.bonus += bonus
    pushFx(state, { type: 'batch', delivered: batch.delivered, boxes: batch.boxes, multiplier, bonus })
  } else {
    if (state.streak > 0) pushFx(state, { type: 'streak-lost', streak: state.streak })
    state.streak = 0
    pushFx(state, { type: 'batch', delivered: batch.delivered, boxes: batch.boxes, multiplier: 1, bonus: 0 })
  }
}

function finishRound(state: GameState, reason: 'time' | 'energy') {
  for (const b of state.boxes) resolveBox(state, b, false)
  state.late += state.boxes.length
  state.boxes = []
  state.status = 'round-over'
  state.endReason = reason
}

const SUBSTEP = 0.01

export function step(state: GameState, dt: number): GameState {
  if (state.status !== 'playing') return state
  dt = Math.min(Math.max(dt, 0), 0.1)
  const r = ROUTES[state.routeIndex], center = routeCenter(r)
  state.cooldown = Math.max(0, state.cooldown - dt)
  let left = dt
  while (left > 1e-9) {
    const h = Math.min(SUBSTEP, left); left -= h
    state.roundTime += h
    const alive: Box[] = []
    for (const b of state.boxes) {
      const g = MODES[b.mode].g
      b.x += b.vx * h; b.y += b.vy * h - 0.5 * g * h * h; b.vy -= g * h
      if (hillBlocks(r, b.x, b.y)) { state.lost++; pushFx(state, { type: 'land', x: b.x, ok: false, mode: b.mode }); resolveBox(state, b, false); continue }
      if (b.y <= 0) {
        const ok = Math.abs(b.x - center) <= ZONE_HALF
        if (ok) {
          state.delivered++; state.deliveredByRoute[state.routeIndex]++; state.deliveredByMode[b.mode]++
          state.deliveredTkm += routeKm(r)
        } else state.lost++
        pushFx(state, { type: 'land', x: b.x, ok, mode: b.mode })
        resolveBox(state, b, ok)
        continue
      }
      if (b.x > WORLD.w) { state.lost++; resolveBox(state, b, false); continue }
      alive.push(b)
    }
    state.boxes = alive
    if (state.roundTime >= ROUND_SECONDS) { finishRound(state, 'time'); return state }
  }
  if (state.energy < minEnergy() && state.boxes.length === 0) finishRound(state, 'energy')
  return state
}

/** Pasa a la siguiente ruta o termina la partida. La energía restante se conserva. */
export function nextRound(state: GameState): GameState {
  if (state.status !== 'round-over') return state
  if (state.routeIndex + 1 >= ROUTES.length) { state.status = 'finished'; return state }
  state.routeIndex++
  state.roundTime = 0; state.cooldown = 0; state.boxes = []; state.endReason = null
  state.status = 'playing'
  if (state.energy < minEnergy()) { state.status = 'round-over'; state.endReason = 'energy' }
  return state
}

export function score(state: GameState): number { return state.delivered }

/** Cajas entregadas + bono por racha de lotes precisos. */
export function totalScore(state: GameState): number { return state.delivered + state.bonus }

export interface RouteCheck {
  id: string
  name: string
  delivered: number
  minDelivered: number
  ok: boolean
}

export interface Summary {
  score: number
  total: number
  bonus: number
  bestStreak: number
  launched: number
  emissionsTonnes: number
  gPerTkm: number
  cleanRoute: boolean
  dominant: Mode | null
  routeChecks: RouteCheck[]
  routesPassed: number
  passed: boolean
}

export function summarize(state: GameState): Summary {
  const gPerTkm = state.deliveredTkm > 0 ? (state.emissionsKg * 1000) / state.deliveredTkm : 0
  let dominant: Mode | null = null
  for (const m of MODE_ORDER) if (state.launches[m] > 0 && (!dominant || state.launches[m] * MODES[m].boxes > state.launches[dominant] * MODES[dominant].boxes)) dominant = m
  const routeChecks: RouteCheck[] = ROUTES.map((r, i) => {
    const delivered = state.deliveredByRoute[i] ?? 0
    return { id: r.id, name: r.name, delivered, minDelivered: r.minDelivered, ok: delivered >= r.minDelivered }
  })
  const routesPassed = routeChecks.filter(r => r.ok).length
  const passed = routesPassed === ROUTES.length
  return {
    score: state.delivered, total: totalScore(state), bonus: state.bonus, bestStreak: state.bestStreak, launched: state.launched, emissionsTonnes: state.emissionsKg / 1000,
    gPerTkm, cleanRoute: passed && state.delivered >= 20 && gPerTkm > 0 && gPerTkm <= 100, dominant,
    routeChecks, routesPassed, passed,
  }
}

/** Busca la puntería que deja el centro del lote en el centro de la zona (para guías y pruebas). */
export function solveAim(mode: Mode, r: RouteDef): { angle: number; power: number } | null {
  const target = routeCenter(r)
  const angles = MODES[mode].fixedAngle !== null ? [MODES[mode].fixedAngle!] : [45, 40, 50, 35, 55, 30, 60, 25, 65]
  for (const angle of angles) {
    if (landingX(mode, angle, 1) < target) continue
    let lo = MIN_POWER, hi = 1
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (landingX(mode, angle, mid) < target) lo = mid; else hi = mid }
    const power = (lo + hi) / 2
    const clear = trajectory(mode, angle, power, 0.01).every(p => !hillBlocks(r, p.x, p.y))
    if (clear) return { angle, power }
  }
  return null
}
