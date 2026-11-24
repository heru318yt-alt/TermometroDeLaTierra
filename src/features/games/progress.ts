import { useSyncExternalStore } from 'react'
import { gameEpochs } from './epochs'
import type { WorldId } from './worldLinks'
import { worldIds } from './worldLinks'

const STORAGE_KEY = 'termometro:epoch-progress:v1'
const EMPTY: readonly WorldId[] = []

function readProgress(): readonly WorldId[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return EMPTY

    const valid = worldIds.filter(id => parsed.includes(id))
    return valid.length > 0 ? valid : EMPTY
  } catch {
    return EMPTY
  }
}

let snapshot: readonly WorldId[] = readProgress()
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(listener => listener())
}

function commit(next: readonly WorldId[]) {
  snapshot = next
  try {
    if (next.length === 0) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // The route still works for this session when storage is unavailable.
  }
  emit()
}

/** Read the completed epochs. The first epoch starts available. */
export function getCompletedEpochs(): readonly WorldId[] {
  return snapshot
}

export function isEpochCompleted(id: WorldId): boolean {
  return snapshot.includes(id)
}

/** Epochs unlock in order: a world opens when the previous one is completed. */
export function isEpochUnlocked(id: WorldId, completed: readonly WorldId[] = snapshot): boolean {
  const index = gameEpochs.findIndex(epoch => epoch.id === id)
  if (index <= 0) return index === 0
  return completed.includes(gameEpochs[index - 1].id)
}

export function nextEpoch(completed: readonly WorldId[] = snapshot) {
  return gameEpochs.find(epoch => !completed.includes(epoch.id))
}

/** Marks a world as completed and unlocks the following epoch. */
export function completeEpoch(id: WorldId) {
  if (snapshot.includes(id)) return

  const next = gameEpochs
    .map(epoch => epoch.id)
    .filter(worldId => worldId === id || snapshot.includes(worldId))
  commit(next)
}

/** Clears the route. Exposed as a deliberate reset, not a hidden shortcut. */
export function resetProgress() {
  if (snapshot.length > 0) commit(EMPTY)
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getServerSnapshot(): readonly WorldId[] {
  return EMPTY
}

/** React binding for the small, localStorage-backed narrative route. */
export function useCompletedEpochs(): readonly WorldId[] {
  return useSyncExternalStore(subscribeProgress, getCompletedEpochs, getServerSnapshot)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    snapshot = readProgress()
    emit()
  })
}
