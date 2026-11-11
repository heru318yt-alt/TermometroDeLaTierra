import { narrativePhases } from '../history/catalog'
import { gameModules } from './catalog'
import type { WorldId } from './worldLinks'
import { worldIds } from './worldLinks'

export type GameEpoch = {
  /** Stable world identifier used by Unity and by the URL. */
  id: WorldId
  /** Zero-based position in the learning route. */
  index: number
  /** Historical decade label, e.g. 1970–1989. */
  range: string
  /** Material focus of the phase, e.g. Energía y combustibles fósiles. */
  focus: string
  /** Narrative context from the history chapter. */
  narrative: string
  /** Source supporting the narrative context. */
  source: string
  sourceLabel: string
  title: string
  description: string
  purpose: string
  question: string
  theme: string
  scene: string
}

/**
 * The five playable epochs: the narrative phases of the history chapter and
 * the Unity worlds, paired in chronological order. This is the only place
 * that decides which story phase opens which minigame.
 */
export const gameEpochs: GameEpoch[] = worldIds.map((id, index) => {
  const game = gameModules.find(item => item.id === id)
  const phase = narrativePhases[index]

  if (!game || !phase) {
    throw new Error(`No se pudo emparejar la etapa ${id} con su relato y su minijuego.`)
  }

  return {
    id,
    index,
    range: phase.label,
    focus: phase.focus,
    narrative: phase.text,
    source: phase.source,
    sourceLabel: phase.sourceLabel,
    title: game.title,
    description: game.description,
    purpose: game.purpose,
    question: game.question,
    theme: game.theme,
    scene: game.scene,
  }
})

export function findEpoch(id: string | null): GameEpoch | undefined {
  return id === null ? undefined : gameEpochs.find(epoch => epoch.id === id)
}
