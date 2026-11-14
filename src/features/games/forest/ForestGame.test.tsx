import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ForestGame } from './ForestGame'

describe('Guardabosques (interfaz)', () => {
  it('muestra la intro y una cuadrícula de 36 parcelas al empezar', async () => {
    render(<ForestGame />)
    expect(screen.getByRole('dialog', { name: /instrucciones/ })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    expect(screen.getAllByRole('button', { name: /^Parcela / })).toHaveLength(36)
    expect(screen.getByText('10 / 10')).toBeTruthy()
  })

  it('restaurar gasta una acción y cultivar un bosque cambia la parcela', async () => {
    render(<ForestGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Restaurar/ }))
    await userEvent.click(screen.getAllByRole('button', { name: /Cultivo$/ })[0])
    expect(screen.getByText('9 / 10')).toBeTruthy()
    await userEvent.click(screen.getByRole('radio', { name: /Cultivar/ }))
    const forest = screen.getAllByRole('button', { name: /Bosque maduro$/ })[0]
    const label = forest.getAttribute('aria-label')!
    await userEvent.click(forest)
    expect(screen.queryByRole('button', { name: label })).toBeNull()
  })

  it('explica por qué no se puede usar una herramienta', async () => {
    render(<ForestGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    await userEvent.click(screen.getAllByRole('button', { name: /Cultivo$/ })[0])
    await userEvent.click(screen.getByRole('radio', { name: /Cultivar/ }))
    await userEvent.click(screen.getAllByRole('button', { name: /Cultivo$/ })[0])
    expect(screen.getByRole('status').textContent).toContain('ya es un cultivo')
  })
})
