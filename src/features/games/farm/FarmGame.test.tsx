import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FarmGame } from './FarmGame'

describe('Finca equilibrada (interfaz)', () => {
  it('muestra el terreno con su imagen y los recursos al empezar', async () => {
    render(<FarmGame />)
    expect(screen.getByRole('dialog', { name: /instrucciones/ })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    expect(screen.getByRole('img', { name: /Suelo fértil/ })).toBeTruthy()
    expect(screen.getByText('60 / 60')).toBeTruthy()
    expect(screen.getByText('14 / 14')).toBeTruthy()
    expect(screen.getByText('1 de 8')).toBeTruthy()
  })

  it('confirmar una temporada gasta recursos y muestra el resultado con emisiones por gas', async () => {
    render(<FarmGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Cultivo/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Nitrogenado medio/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Mediano/ }))
    await userEvent.click(screen.getByRole('button', { name: /Confirmar temporada/ }))
    const dialog = screen.getByRole('dialog', { name: 'Resultado de la temporada' })
    expect(dialog.textContent).toContain('Adaptación al terreno: 100 %')
    expect(dialog.textContent).toContain('metano')
    expect(dialog.textContent).toContain('óxido nitroso')
    expect(screen.getByText('52 / 60')).toBeTruthy()
    expect(screen.getByText('12 / 14')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Siguiente temporada/ }))
    expect(screen.getByText('2 de 8')).toBeTruthy()
  })

  it('juega las ocho temporadas hasta el resultado final', async () => {
    render(<FarmGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Descanso/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Ninguno/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Sin hato/ }))
    for (let i = 0; i < 8; i++) {
      await userEvent.click(screen.getByRole('button', { name: /Confirmar temporada/ }))
      await userEvent.click(screen.getByRole('button', { name: i === 7 ? /Ver resultado final/ : /Siguiente temporada/ }))
    }
    expect(screen.getByRole('dialog', { name: 'Resultado final' })).toBeTruthy()
  })
})
