import { beforeEach, describe, expect, it } from 'vitest'
import {
  completeEpoch,
  getCompletedEpochs,
  isEpochUnlocked,
  nextEpoch,
  resetProgress,
} from './progress'

beforeEach(() => {
  resetProgress()
  window.localStorage.clear()
})

describe('Progreso narrativo de las etapas', () => {
  it('abre solo la primera etapa al comenzar', () => {
    expect(getCompletedEpochs()).toEqual([])
    expect(isEpochUnlocked('energia')).toBe(true)
    expect(isEpochUnlocked('industria')).toBe(false)
    expect(nextEpoch()?.id).toBe('energia')
  })

  it('desbloquea en orden y guarda el avance en el navegador', () => {
    completeEpoch('energia')
    expect(isEpochUnlocked('industria')).toBe(true)
    expect(isEpochUnlocked('transporte')).toBe(false)
    expect(JSON.parse(window.localStorage.getItem('termometro:epoch-progress:v1')!)).toEqual(['energia'])
    expect(nextEpoch()?.id).toBe('industria')

    completeEpoch('industria')
    expect(isEpochUnlocked('transporte')).toBe(true)
    expect(nextEpoch()?.id).toBe('transporte')
  })

  it('no altera el avance al completar dos veces la misma etapa y permite reiniciarlo', () => {
    completeEpoch('energia')
    completeEpoch('energia')
    expect(getCompletedEpochs()).toEqual(['energia'])

    resetProgress()
    expect(getCompletedEpochs()).toEqual([])
    expect(isEpochUnlocked('energia')).toBe(true)
    expect(isEpochUnlocked('industria')).toBe(false)
  })
})
