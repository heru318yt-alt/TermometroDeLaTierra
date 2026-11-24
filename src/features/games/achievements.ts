import { useSyncExternalStore } from 'react'
import { playSfx } from '../audio/sfx'
import { playVictoryFanfare } from '../audio/victorySound'
import { getCompletedEpochs, subscribeProgress } from './progress'
import type { WorldId } from './worldLinks'

export type AchievementId = WorldId | 'protector'

export interface AchievementDef {
  id: AchievementId
  order: string
  theme: string
  gameTitle: string
  title: string
  description: string
  criterion: string
  accent: string
  worldId?: WorldId
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'energia',
    order: '01',
    theme: 'Energía y red eléctrica',
    gameTitle: 'Mantén la red',
    title: 'Guardián de la Red',
    description: 'Mantuviste la oferta eléctrica en equilibrio en modo arcade con renovables y respaldo sin apagar la ciudad.',
    criterion: 'Alcanza 320 puntos (≥ 8 capturas y ≥ 50 % en zona segura) en una partida.',
    accent: '#c9733f',
    worldId: 'energia',
  },
  {
    id: 'industria',
    order: '02',
    theme: 'Industria y materiales',
    gameTitle: 'Puente de materiales',
    title: 'Ingeniero Circular',
    description: 'Optimizaste acero, concreto y pilares para superar múltiples brechas cuidando el inventario circular.',
    criterion: 'Cruza con éxito al menos 3 puentes en una misma partida arcade.',
    accent: '#9f4735',
    worldId: 'industria',
  },
  {
    id: 'transporte',
    order: '03',
    theme: 'Movilidad y transporte',
    gameTitle: 'Carga entre ciudades',
    title: 'Logística Limpia',
    description: 'Completaste las tres rutas de carga eligiendo el alcance y modo adecuado por tonelada-kilómetro.',
    criterion: 'Cumple el mínimo de cajas entregadas en las 3 rutas dentro del presupuesto energético.',
    accent: '#5a8891',
    worldId: 'transporte',
  },
  {
    id: 'bosques',
    order: '04',
    theme: 'Uso del suelo y bosques',
    gameTitle: 'Guardabosques',
    title: 'Custodio del Bosque',
    description: 'Protegiste parcelas clave frente a tala e incendios mientras sostenías alimentos y carbono almacenado.',
    criterion: 'Alcanza 360 puntos en equilibrio (≥ 30 s estables y ≥ 6 acciones de gestión).',
    accent: '#5e7a50',
    worldId: 'bosques',
  },
  {
    id: 'agricultura',
    order: '05',
    theme: 'Agricultura y suelos',
    gameTitle: 'Finca equilibrada',
    title: 'Semilla Sostenible',
    description: 'Adaptaste manejo, fertilizante y tamaño del hato a cada cambio de suelo y clima sin agotar la tierra útil.',
    criterion: 'Alcanza 80 puntos adaptando ≥ 5 temporadas con variedad de manejos y bajas emisiones.',
    accent: '#a18a45',
    worldId: 'agricultura',
  },
  {
    id: 'protector',
    order: '★',
    theme: 'Reconocimiento maestro',
    gameTitle: 'Ruta climática 5 / 5',
    title: 'Protector Ambiental',
    description: 'Superaste los cinco desafíos interconectados del observatorio climático y desbloqueaste el diploma oficial.',
    criterion: 'Completa los cinco retos de la ruta (01 al 05).',
    accent: '#e5a958',
  },
]

const STORAGE_KEY = 'termometro:achievements:v1'
export type UnlockMap = Readonly<Partial<Record<AchievementId, string>>>
export interface AchievementToastState {
  key: number
  achievement: AchievementDef
  unlockedNext?: string
}

const EMPTY_UNLOCKS: UnlockMap = {}

function readStoredUnlocks(): UnlockMap {
  if (typeof window === 'undefined') return EMPTY_UNLOCKS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_UNLOCKS
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return EMPTY_UNLOCKS
    const clean: Partial<Record<AchievementId, string>> = {}
    for (const def of ACHIEVEMENTS) {
      const v = (parsed as Record<string, unknown>)[def.id]
      if (typeof v === 'string' && v.length > 0) clean[def.id] = v
    }
    return Object.keys(clean).length > 0 ? clean : EMPTY_UNLOCKS
  } catch {
    return EMPTY_UNLOCKS
  }
}

let storedUnlocks: UnlockMap = readStoredUnlocks()
let activeToast: AchievementToastState | null = null
let nativeFullscreen = false
let toastCounter = 0
let toastTimer: number | null = null

const unlockListeners = new Set<() => void>()
const toastListeners = new Set<() => void>()
const fsListeners = new Set<() => void>()

export function setNativeFullscreenHost(active: boolean) {
  if (nativeFullscreen === active) return
  nativeFullscreen = active
  fsListeners.forEach(fn => fn())
}

export function useNativeFullscreenHost(): boolean {
  return useSyncExternalStore(
    listener => { fsListeners.add(listener); return () => fsListeners.delete(listener) },
    () => nativeFullscreen,
    () => false,
  )
}

function emitUnlocks() { unlockListeners.forEach(fn => fn()) }
function emitToast() { toastListeners.forEach(fn => fn()) }

function writeUnlocks(next: UnlockMap) {
  storedUnlocks = next
  try {
    if (Object.keys(next).length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch { /* storage unavailable */ }
  emitUnlocks()
}

export function findAchievement(id: AchievementId): AchievementDef {
  return ACHIEVEMENTS.find(a => a.id === id) ?? ACHIEVEMENTS[0]
}

export function getBestScore(worldId: WorldId): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(`tt-best-${worldId}`)
    if (!raw) return 0
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  } catch {
    return 0
  }
}

/** Ensures all completed epochs (and master 5/5 Protector) reflect in stored unlocks. */
export function syncAchievementsWithProgress(): UnlockMap {
  const completed = getCompletedEpochs()
  const now = new Date().toISOString()
  let changed = false
  const next: Partial<Record<AchievementId, string>> = { ...storedUnlocks }
  for (const worldId of completed) {
    if (!next[worldId]) { next[worldId] = now; changed = true }
  }
  if (completed.length >= 5 && !next.protector) {
    next.protector = now
    changed = true
  }
  if (changed) writeUnlocks(next)
  return storedUnlocks
}

export function recordAchievementUnlock(id: AchievementId) {
  syncAchievementsWithProgress()
  const completed = getCompletedEpochs()
  const now = new Date().toISOString()
  const next: Partial<Record<AchievementId, string>> = { ...storedUnlocks }
  let changed = false
  if (!next[id]) { next[id] = now; changed = true }
  if (completed.length >= 5 && !next.protector) { next.protector = now; changed = true }
  if (changed) writeUnlocks(next)
}

export function isAchievementUnlocked(id: AchievementId, unlocks: UnlockMap = storedUnlocks, completed = getCompletedEpochs()): boolean {
  if (id === 'protector') return completed.length >= 5 || Boolean(unlocks.protector)
  return completed.includes(id) || Boolean(unlocks[id])
}

export function dismissAchievementToast() {
  if (toastTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
  if (activeToast) {
    activeToast = null
    emitToast()
  }
}

export function notifyAchievement(id: AchievementId, options: { unlockedNext?: string; playSound?: boolean; durationMs?: number } = {}) {
  recordAchievementUnlock(id)
  const achievement = findAchievement(id)
  if (toastTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(toastTimer)
    toastTimer = null
  }
  toastCounter += 1
  activeToast = { key: toastCounter, achievement, unlockedNext: options.unlockedNext }
  emitToast()

  if (options.playSound !== false) {
    playSfx('win')
    playVictoryFanfare(id === 'protector')
  }

  const duration = options.durationMs ?? 6500
  if (duration > 0 && typeof window !== 'undefined') {
    toastTimer = window.setTimeout(() => {
      toastTimer = null
      activeToast = null
      emitToast()
    }, duration)
  }
}

export function resetAchievements() {
  dismissAchievementToast()
  if (Object.keys(storedUnlocks).length > 0) writeUnlocks(EMPTY_UNLOCKS)
}

export function getAchievementToast(): AchievementToastState | null {
  return activeToast
}

export function getUnlockedMap(): UnlockMap {
  return storedUnlocks
}

export function useAchievementToast(): AchievementToastState | null {
  return useSyncExternalStore(
    listener => {
      toastListeners.add(listener)
      return () => toastListeners.delete(listener)
    },
    getAchievementToast,
    () => null,
  )
}

export function useUnlockedAchievements(): UnlockMap {
  return useSyncExternalStore(
    listener => {
      unlockListeners.add(listener)
      return () => unlockListeners.delete(listener)
    },
    getUnlockedMap,
    () => EMPTY_UNLOCKS,
  )
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    storedUnlocks = readStoredUnlocks()
    emitUnlocks()
  })
}

let prevProgressCount = getCompletedEpochs().length
subscribeProgress(() => {
  const nextCount = getCompletedEpochs().length
  if (prevProgressCount > 0 && nextCount === 0) {
    resetAchievements()
  }
  prevProgressCount = nextCount
})
