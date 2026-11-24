import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FarmGame } from './FarmGame'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Finca equilibrada (interfaz arcade)', () => {
  it('muestra el terreno con su imagen y los recursos iniciales de 50 y 12', async () => {
    render(<FarmGame />)
    expect(screen.getByRole('dialog', { name: /instrucciones/ })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    expect(screen.getByRole('img', { name: /Suelo fértil/ })).toBeTruthy()
    expect(screen.getByText('50 / 50')).toBeTruthy()
    expect(screen.getByText('12 / 12')).toBeTruthy()
    expect(screen.getByText('#1')).toBeTruthy()
  })

  it('confirmar una temporada gasta recursos y permite continuar más allá de 8 o finalizar manualmente', async () => {
    render(<FarmGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Cultivo/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Nitrogenado medio/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Mediano/ }))
    await userEvent.click(screen.getByRole('button', { name: /Confirmar temporada/ }))
    const dialog = screen.getByRole('dialog', { name: 'Resultado de la temporada' })
    expect(dialog.textContent).toContain('Adaptación al terreno: 100 %')
    expect(dialog.textContent).toContain('metano')
    await userEvent.click(screen.getByRole('button', { name: /Siguiente temporada/ }))
    expect(screen.getByText('#2')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Finalizar y guardar/ }))
    expect(screen.getByRole('dialog', { name: 'Resultado final' })).toBeTruthy()
  })

  it('desbloquea el reto en vivo sin cortar el juego arcade al adaptar el manejo al terreno', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(2 / 1e9)
    const onComplete = vi.fn()
    const onNext = vi.fn()
    render(<FarmGame onComplete={onComplete} onNext={onNext} nextLabel="Ver título de Protector Ambiental →" />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    for (let i = 0; i < 10; i++) {
      const soilText = document.querySelector('.farm-side .farm-soil-tag')?.textContent ?? ''
      if (soilText.includes('fértil')) {
        await userEvent.click(screen.getByRole('radio', { name: /Cultivo/ }))
        await userEvent.click(screen.getByRole('radio', { name: /Nitrogenado medio/ }))
        await userEvent.click(screen.getByRole('radio', { name: /Mediano/ }))
      } else if (soilText.includes('seco')) {
        await userEvent.click(screen.getByRole('radio', { name: /Pastoreo/ }))
        await userEvent.click(screen.getByRole('radio', { name: /Orgánico/ }))
        await userEvent.click(screen.getByRole('radio', { name: /Pequeño/ }))
      } else {
        await userEvent.click(screen.getByRole('radio', { name: /Descanso/ }))
        await userEvent.click(screen.getByRole('radio', { name: /Orgánico/ }))
        await userEvent.click(screen.getByRole('radio', { name: /Sin hato/ }))
      }
      await userEvent.click(screen.getByRole('button', { name: /Confirmar temporada/ }))
      await userEvent.click(screen.getByRole('button', { name: /Siguiente temporada/ }))
    }
    // El juego sigue activo en la temporada #11 aunque el reto ya se desbloqueó en vivo
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByText('#11')).toBeTruthy()
    expect(screen.getByText('★ CUMPLIDO')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Finalizar y guardar/ }))
    expect(screen.getByText('★ RETO COMPLETADO')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Ver título de Protector Ambiental →' }))
    expect(onNext).toHaveBeenCalledTimes(1)
  }, 15000)

  it('rechaza superar el reto si se repite la misma acción sin variedad', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(2 / 1e9)
    const onComplete = vi.fn()
    render(<FarmGame onComplete={onComplete} />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Pastoreo/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Orgánico/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Pequeño/ }))
    for (let i = 0; i < 6; i++) {
      await userEvent.click(screen.getByRole('button', { name: /Confirmar temporada/ }))
      await userEvent.click(screen.getByRole('button', { name: /Siguiente temporada/ }))
    }
    await userEvent.click(screen.getByRole('button', { name: /Finalizar y guardar/ }))
    expect(screen.queryByText('★ RETO COMPLETADO')).toBeNull()
    expect(onComplete).not.toHaveBeenCalled()
    expect(screen.getByRole('list', { name: 'Condiciones del reto' }).textContent).toContain('Estrategia variada')
  }, 15000)
})
