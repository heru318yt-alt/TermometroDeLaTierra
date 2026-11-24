import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AchievementToast } from './AchievementToast'
import { AchievementsPage } from './AchievementsPage'
import {
  ACHIEVEMENTS, dismissAchievementToast, getBestScore, isAchievementUnlocked,
  notifyAchievement, resetAchievements,
} from './achievements'
import { completeEpoch, resetProgress } from './progress'

afterEach(cleanup)
beforeEach(() => {
  resetProgress()
  resetAchievements()
  window.localStorage.clear()
})

describe('sistema de logros y notificaciones no intrusivas', () => {
  it('define 6 logros (5 temáticos + Protector Ambiental)', () => {
    expect(ACHIEVEMENTS).toHaveLength(6)
    expect(ACHIEVEMENTS.map(a => a.id)).toEqual(['energia', 'industria', 'transporte', 'bosques', 'agricultura', 'protector'])
  })

  it('sincroniza logros con el progreso y persiste récords por minijuego', () => {
    window.localStorage.setItem('tt-best-energia', '540')
    expect(getBestScore('energia')).toBe(540)
    completeEpoch('energia')
    expect(isAchievementUnlocked('energia')).toBe(true)
    expect(isAchievementUnlocked('protector')).toBe(false)

    completeEpoch('industria')
    completeEpoch('transporte')
    completeEpoch('bosques')
    completeEpoch('agricultura')
    expect(isAchievementUnlocked('protector')).toBe(true)

    resetProgress()
    expect(isAchievementUnlocked('energia')).toBe(false)
    expect(isAchievementUnlocked('protector')).toBe(false)
  })

  it('muestra la notificación sin bloquear foco ni usar modal y navega al pulsarla', async () => {
    const view = render(
      <MemoryRouter initialEntries={['/minijuegos?world=energia']}>
        <AchievementToast />
        <AchievementsPage />
      </MemoryRouter>,
    )
    act(() => {
      notifyAchievement('energia', { unlockedNext: 'Puente de materiales', playSound: false })
    })
    const status = await screen.findByRole('status')
    expect(status.textContent).toContain('Guardián de la Red')
    expect(status.textContent).toContain('Puente de materiales')
    expect(screen.queryByRole('dialog')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar notificación de logro' }))
    expect(screen.queryByText('★ RETO COMPLETADO · LOGRO DESBLOQUEADO')).toBeNull()
    dismissAchievementToast()
    view.unmount()
  })

  it('muestra la colección completa en AchievementsPage con récords personales', () => {
    window.localStorage.setItem('tt-best-energia', '720')
    completeEpoch('energia')
    render(
      <MemoryRouter>
        <AchievementsPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Logros del observatorio')
    expect(screen.getByText('1 / 6')).toBeTruthy()
    expect(screen.getByText('Guardián de la Red')).toBeTruthy()
    expect(screen.getByText('Récord personal: 720 pts')).toBeTruthy()
  })
})
