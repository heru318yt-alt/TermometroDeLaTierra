import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CargoGame } from './CargoGame'

describe('Carga entre ciudades (interfaz)', () => {
  it('recorre intro, información de ruta y deja lanzar con energía visible', async () => {
    render(<CargoGame />)
    expect(screen.getByRole('dialog', { name: /instrucciones/ })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    expect(screen.getByRole('dialog', { name: 'Información de la ruta' }).textContent).toContain('Alcanzan: Carretera, Ferrocarril, Barco, Avión')
    await userEvent.click(screen.getByRole('button', { name: /Empezar la ruta/ }))
    expect(screen.getByText('54 / 54')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Lanzar/ }))
    expect(screen.getByText('50 / 54')).toBeTruthy()
  })

  it('avisa qué modos no alcanzan en una ruta y el ferrocarril tiene ángulo fijo', async () => {
    render(<CargoGame />)
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    await userEvent.click(screen.getByRole('radio', { name: /Ferrocarril/ }))
    expect((screen.getByLabelText('Ángulo de lanzamiento') as HTMLInputElement).disabled).toBe(true)
    await userEvent.click(screen.getByRole('radio', { name: /Carretera/ }))
    expect((screen.getByLabelText('Ángulo de lanzamiento') as HTMLInputElement).disabled).toBe(false)
  })
})
