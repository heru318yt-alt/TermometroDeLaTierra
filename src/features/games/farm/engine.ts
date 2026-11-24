/**
 * Finca equilibrada · motor arcade del minijuego de Agricultura y ganadería.
 *
 * Lógica pura y determinista. En modo arcade las temporadas avanzan sin tope fijo:
 * el agua y la materia orgánica se reponen parcialmente con buena adaptación, mientras
 * el clima se vuelve más cambiante. El juego continúa hasta que la tierra útil o las
 * cosechas colapsen (o el jugador guarde su marca).
 */
export type Soil = 'fertile' | 'dry' | 'waterlogged' | 'degraded'
export type Mgmt = 'rest' | 'graze' | 'crop'
export type Fert = 0 | 1 | 2 | 3
export type Herd = 0 | 1 | 2 | 3
export type Weather = 'normal' | 'drought' | 'rain'
export type Status = 'playing' | 'finished'
export type EndReason = 'land' | 'famine' | 'manual' | null

export interface Choice { fert: Fert; mgmt: Mgmt; herd: Herd }

export const SEASONS = 8
export const WATER_STOCK = 50
export const FERTILIZER_STOCK = 12
export const SCORE_BONUS_STEP = 45
export const SCORE_BONUS_WATER = 6
export const SCORE_BONUS_FERTILIZER = 2
export const LAND_LOSS = 15
export const MIN_LAND_ALIVE = 40
export const MAX_FAMINE_STREAK = 3
export const MIN_WIN_FOOD = 80
export const MIN_WIN_ADAPTED = 5
export const MIN_WIN_LAND = 70
export const MAX_WIN_PER_FOOD = 0.85
export const MIN_WIN_MGMT = 2
export const MAX_WIN_REPEAT = 5

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
  scoreBonus: { water: number; fertilizer: number } | null
  season: number
  weather: Weather
  soilBefore: Soil
  choice: Choice
  landAfter: number
}

export interface GameState {
  season: number
  status: Status
  endReason: EndReason
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
  streak: number
  bestStreak: number
  famineStreak: number
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

function rollWeather(state: GameState): Weather {
  const r = nextRandom(state)
  const normalCutoff = state.season >= 12 ? 0.25 : state.season >= 6 ? 0.36 : 0.5
  const droughtCutoff = normalCutoff + (1 - normalCutoff) * 0.5
  return r < normalCutoff ? 'normal' : r < droughtCutoff ? 'drought' : 'rain'
}

export function createGame(seed = 1989): GameState {
  return {
    season: 0, status: 'playing', endReason: null, rng: seed >>> 0, soil: 'fertile', weather: 'normal', weatherSoilBefore: 'fertile',
    water: WATER_STOCK, fertilizer: FERTILIZER_STOCK, land: 100, food: 0, ch4: 0, n2o: 0, co2: 0, history: [],
    streak: 0, bestStreak: 0, famineStreak: 0, bonus: 0, challengeCleared: false, scoreMilestonesClaimed: 0,
  }
}

export function canAfford(state: GameState, choice: Choice): { ok: boolean; reason?: string } {
  if (state.status !== 'playing') return { ok: false, reason: 'La partida terminó.' }
  const cost = costOf(state.soil, state.weather, choice)
  if (cost.water > state.water) return { ok: false, reason: `Esa combinación necesita ${cost.water} de agua y solo quedan ${state.water}.` }
  if (cost.fertilizer > state.fertilizer) return { ok: false, reason: `Ese fertilizante necesita ${cost.fertilizer} unidades y solo quedan ${state.fertilizer}.` }
  return { ok: true }
}

export function finishManual(state: GameState) {
  if (state.status !== 'playing') return
  state.status = 'finished'
  state.endReason = 'manual'
}

export const STREAK_ADAPTATION = 0.8
export const streakMultiplier = (streak: number) => streak >= 4 ? 1.5 : streak >= 2 ? 1.25 : 1

export const score = (state: GameState) => Math.round(state.food)
export const totalScore = (state: GameState) => Math.round(state.food + state.bonus)
export const totalEmissions = (state: GameState) => Math.max(0, state.ch4 + state.n2o + state.co2)

export interface WinChecks {
  food: boolean
  adapted: boolean
  soil: boolean
  emissions: boolean
  variety: boolean
}

function evaluateChecks(state: GameState): {
  s: number
  total: number
  emissions: number
  perFood: number
  adaptedSeasons: number
  distinctMgmt: number
  maxRepeatedChoice: number
  checks: WinChecks
} {
  const emissions = totalEmissions(state), s = score(state), total = totalScore(state)
  const perFood = s > 0 ? emissions / s : 0
  const adaptedSeasons = state.history.filter(h => h.adaptation >= STREAK_ADAPTATION).length
  const distinctMgmt = new Set(state.history.map(h => h.choice.mgmt)).size
  const choiceCounts = new Map<string, number>()
  for (const h of state.history) {
    const key = `${h.choice.mgmt}-${h.choice.fert}-${h.choice.herd}`
    choiceCounts.set(key, (choiceCounts.get(key) ?? 0) + 1)
  }
  const maxRepeatedChoice = choiceCounts.size > 0 ? Math.max(...choiceCounts.values()) : 0
  const repeatLimit = Math.max(MAX_WIN_REPEAT, Math.floor(state.history.length * 0.65))
  const checks: WinChecks = {
    food: total >= MIN_WIN_FOOD,
    adapted: adaptedSeasons >= MIN_WIN_ADAPTED,
    soil: state.soil !== 'degraded' && state.land >= MIN_WIN_LAND,
    emissions: s > 0 && perFood <= MAX_WIN_PER_FOOD,
    variety: distinctMgmt >= MIN_WIN_MGMT && maxRepeatedChoice <= repeatLimit,
  }
  return { s, total, emissions, perFood, adaptedSeasons, distinctMgmt, maxRepeatedChoice, checks }
}

export function hasReachedChallenge(state: GameState): boolean {
  const { checks } = evaluateChecks(state)
  return checks.food && checks.adapted && checks.soil && checks.emissions && checks.variety
}

/** Confirma la combinación en modo arcade: evalúa temporada, repone parte estacional y sigue adelante. */
export function play(state: GameState, choice: Choice): SeasonResult | null {
  if (!canAfford(state, choice).ok) return null
  const outcome = evaluate(state.soil, state.weather, choice, state.land)
  const soilBefore = state.soil, weather = state.weather
  state.water -= outcome.water; state.fertilizer -= outcome.fertilizer
  state.streak = outcome.adaptation >= STREAK_ADAPTATION ? state.streak + 1 : 0
  state.bestStreak = Math.max(state.bestStreak, state.streak)
  const multiplier = streakMultiplier(state.streak)
  const bonus = outcome.food * (multiplier - 1)
  state.bonus += bonus
  state.food += outcome.food; state.ch4 += outcome.ch4; state.n2o += outcome.n2o; state.co2 += outcome.co2
  const milestones = Math.floor(totalScore(state) / SCORE_BONUS_STEP)
  let scoreBonus: { water: number; fertilizer: number } | null = null
  if (milestones > state.scoreMilestonesClaimed) {
    const delta = milestones - state.scoreMilestonesClaimed
    const waterBefore = state.water
    const fertBefore = state.fertilizer
    state.water = Math.min(WATER_STOCK, state.water + delta * SCORE_BONUS_WATER)
    state.fertilizer = Math.min(FERTILIZER_STOCK, state.fertilizer + delta * SCORE_BONUS_FERTILIZER)
    const addedWater = state.water - waterBefore
    const addedFert = state.fertilizer - fertBefore
    if (addedWater > 0 || addedFert > 0) scoreBonus = { water: addedWater, fertilizer: addedFert }
    state.scoreMilestonesClaimed = milestones
  }
  state.soil = outcome.soilAfter
  if (state.soil === 'degraded') state.land = Math.max(0, state.land - LAND_LOSS)
  state.famineStreak = outcome.food < 2 ? state.famineStreak + 1 : 0

  const result: SeasonResult = { ...outcome, multiplier, bonus, scoreBonus, season: state.season, weather, soilBefore, choice: { ...choice }, landAfter: state.land }
  state.history.push(result)
  state.season++

  if (!state.challengeCleared && hasReachedChallenge(state)) {
    state.challengeCleared = true
  }

  if (state.land <= MIN_LAND_ALIVE) {
    state.status = 'finished'
    state.endReason = 'land'
  } else if (state.famineStreak >= MAX_FAMINE_STREAK) {
    state.status = 'finished'
    state.endReason = 'famine'
  } else {
    state.weather = rollWeather(state)
    const waterRecharge = state.weather === 'rain' ? 6 : state.weather === 'normal' ? 4 : 1
    state.water = Math.min(WATER_STOCK, state.water + waterRecharge)
    if (outcome.adaptation >= STREAK_ADAPTATION) {
      state.fertilizer = Math.min(FERTILIZER_STOCK, state.fertilizer + 1)
    }
    state.weatherSoilBefore = state.soil
    state.soil = applyWeather(state.soil, state.weather)
    if (state.soil === 'fertile' && state.weather === 'normal') {
      const fertileCount = state.history.filter(h => h.soilBefore === 'fertile').length
      const lastTwoFertile = state.history.length >= 2 && state.history.slice(-2).every(h => h.soilBefore === 'fertile')
      if (lastTwoFertile || fertileCount >= 3) {
        state.weather = (state.rng & 1) === 0 ? 'drought' : 'rain'
        state.weatherSoilBefore = state.soil
        state.soil = applyWeather(state.soil, state.weather)
      }
    }
  }
  return result
}

export interface Summary {
  score: number
  total: number
  bonus: number
  bestStreak: number
  adaptedSeasons: number
  distinctMgmt: number
  maxRepeatedChoice: number
  seasons: number
  endReason: EndReason
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
  checks: WinChecks
  passed: boolean
}

export function summarize(state: GameState): Summary {
  const { s, total, emissions, perFood, adaptedSeasons, distinctMgmt, maxRepeatedChoice, checks } = evaluateChecks(state)
  const passed = state.challengeCleared || (checks.food && checks.adapted && checks.soil && checks.emissions && checks.variety)
  return {
    score: s, total, bonus: Math.round(state.bonus), bestStreak: state.bestStreak, adaptedSeasons, distinctMgmt, maxRepeatedChoice,
    seasons: state.season, endReason: state.endReason,
    ch4: state.ch4, n2o: state.n2o, co2: state.co2, emissions, perFood, soil: state.soil, land: state.land,
    water: state.water, fertilizer: state.fertilizer,
    balanced: total >= 95 && state.soil !== 'degraded' && state.land >= 80 && perFood <= 0.7,
    checks,
    passed,
  }
}

export function allChoices(): Choice[] {
  const out: Choice[] = []
  for (const mgmt of MGMTS) for (const fert of FERTS) for (const herd of HERDS) out.push({ fert, mgmt, herd })
  return out
}

export function weakestPart(soil: Soil, choice: Choice): 'mgmt' | 'fert' | 'herd' | null {
  const f = fits(soil, choice)
  const entries = [['mgmt', f.mgmt], ['fert', f.fert], ['herd', f.herd]] as const
  const worst = [...entries].sort((a, b) => a[1] - b[1])[0]
  return worst[1] < 0.6 ? worst[0] : null
}
