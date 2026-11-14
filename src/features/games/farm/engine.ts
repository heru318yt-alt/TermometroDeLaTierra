/**
 * Finca equilibrada · motor del minijuego de Agricultura y ganadería.
 *
 * Lógica pura y determinista. El jugador combina fertilizante, manejo de la
 * tierra y tamaño del hato según el estado del suelo. Todos los valores son
 * didácticos: no son mediciones de emisiones ni de producción reales.
 */
export type Soil = 'fertile' | 'dry' | 'waterlogged' | 'degraded'
export type Mgmt = 'rest' | 'graze' | 'crop'
export type Fert = 0 | 1 | 2 | 3
export type Herd = 0 | 1 | 2 | 3
export type Weather = 'normal' | 'drought' | 'rain'
export type Status = 'playing' | 'finished'

export interface Choice { fert: Fert; mgmt: Mgmt; herd: Herd }

export const SEASONS = 8
export const WATER_STOCK = 60
export const FERTILIZER_STOCK = 14
export const LAND_LOSS = 10

export const SOILS: Soil[] = ['fertile', 'dry', 'waterlogged', 'degraded']
export const MGMTS: Mgmt[] = ['rest', 'graze', 'crop']
export const FERTS: Fert[] = [0, 1, 2, 3]
export const HERDS: Herd[] = [0, 1, 2, 3]

export const SOIL_LABEL: Record<Soil, string> = { fertile: 'Fértil', dry: 'Seco', waterlogged: 'Encharcado', degraded: 'Degradado' }
export const SOIL_TEXT: Record<Soil, string> = {
  fertile: 'Suelo oscuro y con buena estructura. Responde bien al cultivo y tolera un hato mediano, pero el exceso de fertilizante se pierde.',
  dry: 'Suelo seco y agrietado: retiene poca agua. La materia orgánica ayuda a conservar la humedad y un hato grande lo sobrepastorea.',
  waterlogged: 'Suelo saturado de agua. El fertilizante nitrogenado se pierde con facilidad como óxido nitroso y el pisoteo lo compacta.',
  degraded: 'Suelo pobre y compactado. Necesita descanso y materia orgánica antes de producir; presionarlo lo empeora.',
}
export const MGMT_LABEL: Record<Mgmt, string> = { rest: 'Descanso', graze: 'Pastoreo', crop: 'Cultivo' }
export const FERT_LABEL: Record<Fert, string> = { 0: 'Ninguno', 1: 'Orgánico', 2: 'Nitrogenado medio', 3: 'Nitrogenado alto' }
export const HERD_LABEL: Record<Herd, string> = { 0: 'Sin hato', 1: 'Pequeño', 2: 'Mediano', 3: 'Grande' }
export const WEATHER_LABEL: Record<Weather, string> = { normal: 'Temporada normal', drought: 'Sequía', rain: 'Lluvias fuertes' }

const MGMT_FIT: Record<Soil, Record<Mgmt, number>> = {
  fertile: { rest: 0.35, graze: 0.7, crop: 1.0 },
  dry: { rest: 0.7, graze: 0.6, crop: 0.35 },
  waterlogged: { rest: 0.8, graze: 0.45, crop: 0.3 },
  degraded: { rest: 1.0, graze: 0.35, crop: 0.2 },
}
const FERT_FIT: Record<Soil, Record<Fert, number>> = {
  fertile: { 0: 0.6, 1: 0.85, 2: 1.0, 3: 0.6 },
  dry: { 0: 0.45, 1: 1.0, 2: 0.45, 3: 0.25 },
  waterlogged: { 0: 0.7, 1: 0.8, 2: 0.25, 3: 0.1 },
  degraded: { 0: 0.4, 1: 1.0, 2: 0.5, 3: 0.2 },
}
const HERD_FIT: Record<Soil, Record<Herd, number>> = {
  fertile: { 0: 0.6, 1: 0.9, 2: 1.0, 3: 0.55 },
  dry: { 0: 0.8, 1: 1.0, 2: 0.6, 3: 0.2 },
  waterlogged: { 0: 0.9, 1: 0.9, 2: 0.5, 3: 0.2 },
  degraded: { 0: 1.0, 1: 0.8, 2: 0.35, 3: 0.1 },
}

const CROP_BASE: Record<Mgmt, number> = { rest: 0, graze: 2, crop: 10 }
const ANIMAL_BASE: Record<Mgmt, number> = { rest: 0.5, graze: 4, crop: 1.5 }
const FERT_BOOST: Record<Fert, number> = { 0: 1, 1: 1.2, 2: 1.5, 3: 1.7 }
const FERT_COST: Record<Fert, number> = { 0: 0, 1: 1, 2: 2, 3: 3 }
const FERT_N2O: Record<Fert, number> = { 0: 0, 1: 1, 2: 3, 3: 6 }
const SOIL_N2O: Record<Soil, number> = { fertile: 1, dry: 0.8, waterlogged: 1.8, degraded: 1.2 }
const WATER_MGMT: Record<Mgmt, number> = { rest: 0, graze: 3, crop: 6 }
const WATER_HERD: Record<Herd, number> = { 0: 0, 1: 1, 2: 2, 3: 4 }

export function fits(soil: Soil, choice: Choice) {
  return { mgmt: MGMT_FIT[soil][choice.mgmt], fert: FERT_FIT[soil][choice.fert], herd: HERD_FIT[soil][choice.herd] }
}

/** Adaptación de la combinación al terreno (0–1). */
export function adaptation(soil: Soil, choice: Choice): number {
  const f = fits(soil, choice)
  return 0.4 * f.mgmt + 0.3 * f.fert + 0.3 * f.herd
}

export function costOf(soil: Soil, weather: Weather, choice: Choice): { water: number; fertilizer: number } {
  let water = WATER_MGMT[choice.mgmt] + WATER_HERD[choice.herd]
  if (soil === 'dry' && choice.mgmt === 'crop') water += 2
  if (weather === 'drought' && choice.mgmt !== 'rest') water += 2
  return { water, fertilizer: FERT_COST[choice.fert] }
}

export type SoilTrend = 'improves' | 'same' | 'worsens'

export function soilTrend(quality: number): SoilTrend { return quality >= 0.8 ? 'improves' : quality < 0.5 ? 'worsens' : 'same' }

export function nextSoil(soil: Soil, trend: SoilTrend): Soil {
  if (trend === 'improves') return soil === 'degraded' ? 'dry' : 'fertile'
  if (trend === 'worsens') return soil === 'fertile' ? 'dry' : 'degraded'
  return soil
}

export function applyWeather(soil: Soil, weather: Weather): Soil {
  if (weather === 'drought') return soil === 'fertile' ? 'dry' : soil === 'waterlogged' ? 'fertile' : soil
  if (weather === 'rain') return soil === 'dry' ? 'fertile' : soil === 'fertile' ? 'waterlogged' : soil
  return soil
}

export interface Outcome {
  adaptation: number
  food: number
  ch4: number
  n2o: number
  co2: number
  trend: SoilTrend
  soilAfter: Soil
  water: number
  fertilizer: number
}

export function evaluate(soil: Soil, weather: Weather, choice: Choice, landPct = 100): Outcome {
  const quality = adaptation(soil, choice)
  const raw = CROP_BASE[choice.mgmt] * FERT_BOOST[choice.fert] + ANIMAL_BASE[choice.mgmt] * choice.herd
  const trend = soilTrend(quality)
  const cost = costOf(soil, weather, choice)
  return {
    adaptation: quality,
    food: raw * quality * (landPct / 100),
    ch4: choice.herd * 3 * (choice.mgmt === 'graze' ? 1.2 : 1),
    n2o: FERT_N2O[choice.fert] * SOIL_N2O[soil] + 0.3 * choice.herd,
    co2: trend === 'worsens' ? 4 : trend === 'improves' ? -2 : 0,
    trend, soilAfter: nextSoil(soil, trend), water: cost.water, fertilizer: cost.fertilizer,
  }
}

export interface SeasonResult extends Outcome {
  multiplier: number
  bonus: number
  season: number
  weather: Weather
  soilBefore: Soil
  choice: Choice
  landAfter: number
}

export interface GameState {
  season: number
  status: Status
  rng: number
  soil: Soil
  weather: Weather
  weatherSoilBefore: Soil
  water: number
  fertilizer: number
  land: number
  food: number
  ch4: number
  n2o: number
  co2: number
  history: SeasonResult[]
  /** Temporadas seguidas bien adaptadas al terreno (adaptación ≥ 80 %). */
  streak: number
  bestStreak: number
  bonus: number
}

function nextRandom(state: GameState): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0
  let t = state.rng
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function rollWeather(state: GameState): Weather {
  const r = nextRandom(state)
  return r < 0.5 ? 'normal' : r < 0.75 ? 'drought' : 'rain'
}

export function createGame(seed = 1989): GameState {
  return {
    season: 0, status: 'playing', rng: seed >>> 0, soil: 'fertile', weather: 'normal', weatherSoilBefore: 'fertile',
    water: WATER_STOCK, fertilizer: FERTILIZER_STOCK, land: 100, food: 0, ch4: 0, n2o: 0, co2: 0, history: [],
    streak: 0, bestStreak: 0, bonus: 0,
  }
}

export function canAfford(state: GameState, choice: Choice): { ok: boolean; reason?: string } {
  if (state.status !== 'playing') return { ok: false, reason: 'La partida terminó.' }
  const cost = costOf(state.soil, state.weather, choice)
  if (cost.water > state.water) return { ok: false, reason: `Esa combinación necesita ${cost.water} de agua y solo quedan ${state.water}.` }
  if (cost.fertilizer > state.fertilizer) return { ok: false, reason: `Ese fertilizante necesita ${cost.fertilizer} unidades y solo quedan ${state.fertilizer}.` }
  return { ok: true }
}

/** Confirma la combinación: calcula la temporada, gasta recursos y pasa a la siguiente. */
export function play(state: GameState, choice: Choice): SeasonResult | null {
  if (!canAfford(state, choice).ok) return null
  const outcome = evaluate(state.soil, state.weather, choice, state.land)
  const soilBefore = state.soil, weather = state.weather
  state.water -= outcome.water; state.fertilizer -= outcome.fertilizer
  // Racha: adaptar cada temporada al terreno multiplica los alimentos ganados.
  state.streak = outcome.adaptation >= STREAK_ADAPTATION ? state.streak + 1 : 0
  state.bestStreak = Math.max(state.bestStreak, state.streak)
  const multiplier = streakMultiplier(state.streak)
  const bonus = outcome.food * (multiplier - 1)
  state.bonus += bonus
  state.food += outcome.food; state.ch4 += outcome.ch4; state.n2o += outcome.n2o; state.co2 += outcome.co2
  state.soil = outcome.soilAfter
  if (state.soil === 'degraded') state.land = Math.max(0, state.land - LAND_LOSS)
  const result: SeasonResult = { ...outcome, multiplier, bonus, season: state.season, weather, soilBefore, choice: { ...choice }, landAfter: state.land }
  state.history.push(result)
  state.season++
  if (state.season >= SEASONS) state.status = 'finished'
  else {
    state.weather = rollWeather(state)
    state.weatherSoilBefore = state.soil
    state.soil = applyWeather(state.soil, state.weather)
  }
  return result
}

export const STREAK_ADAPTATION = 0.8
/** ×1 → ×1.25 desde la 2.ª temporada adaptada seguida → ×1.5 desde la 4.ª. */
export const streakMultiplier = (streak: number) => streak >= 4 ? 1.5 : streak >= 2 ? 1.25 : 1

export const score = (state: GameState) => Math.round(state.food)
/** Alimentos + bono por racha de temporadas adaptadas. */
export const totalScore = (state: GameState) => Math.round(state.food + state.bonus)
export const totalEmissions = (state: GameState) => Math.max(0, state.ch4 + state.n2o + state.co2)

export interface Summary {
  score: number
  total: number
  bonus: number
  bestStreak: number
  ch4: number
  n2o: number
  co2: number
  emissions: number
  perFood: number
  soil: Soil
  land: number
  water: number
  fertilizer: number
  balanced: boolean
}

export function summarize(state: GameState): Summary {
  const emissions = totalEmissions(state), s = score(state)
  const perFood = s > 0 ? emissions / s : 0
  return {
    score: s, total: totalScore(state), bonus: Math.round(state.bonus), bestStreak: state.bestStreak, ch4: state.ch4, n2o: state.n2o, co2: state.co2, emissions, perFood, soil: state.soil, land: state.land,
    water: state.water, fertilizer: state.fertilizer,
    balanced: s >= 70 && state.soil !== 'degraded' && state.land >= 80 && perFood <= 0.7,
  }
}

export function allChoices(): Choice[] {
  const out: Choice[] = []
  for (const mgmt of MGMTS) for (const fert of FERTS) for (const herd of HERDS) out.push({ fert, mgmt, herd })
  return out
}

/** Pista cualitativa (sin números) sobre qué parte de la combinación encaja peor. */
export function weakestPart(soil: Soil, choice: Choice): 'mgmt' | 'fert' | 'herd' | null {
  const f = fits(soil, choice)
  const entries = [['mgmt', f.mgmt], ['fert', f.fert], ['herd', f.herd]] as const
  const worst = [...entries].sort((a, b) => a[1] - b[1])[0]
  return worst[1] < 0.6 ? worst[0] : null
}
