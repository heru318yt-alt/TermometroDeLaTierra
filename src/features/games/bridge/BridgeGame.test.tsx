import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { BridgeGame } from './BridgeGame'

describe('Puente de materiales (interfaz)', () => {
  it('permite empezar, colocar piezas con costo y gastar el inventario visible', async () => {
    render(<BridgeGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar/ }))
    expect(screen.getByText('46 / 46')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Columna 1, fila 2: vacía' }))
    expect(screen.getByText('44 / 46')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Columna 1, fila 2: Acero' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Columna 1, fila 2: Acero' }))
    expect(screen.getByText('46 / 46')).toBeTruthy()
  })

  it('no deja probar sin piezas y avisa si no hay tablero para el pilar', async () => {
    render(<BridgeGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar/ }))
    expect((screen.getByRole('button', { name: /Probar puente/ }) as HTMLButtonElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('radio', { name: /Pilar/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Columna 2, fila 1: vacía' }))
    expect(screen.getByRole('status').textContent).toContain('Primero coloca una pieza')
  })
})
