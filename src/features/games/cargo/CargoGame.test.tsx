import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CargoGame } from './CargoGame'

beforeEach(() => {
  vi.stubGlobal('PointerEvent', MouseEvent)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function mockStageRect(canvas: HTMLCanvasElement) {
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 640,
    height: 360,
    right: 640,
    bottom: 360,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
}

async function openRoute1Playing() {
  render(<CargoGame />)
  await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
  await userEvent.click(screen.getByRole('button', { name: /Empezar la ruta/ }))
  const canvas = document.querySelector('canvas')!
  mockStageRect(canvas)
  return canvas
}

describe('Carga entre ciudades (interfaz)', () => {
  it('recorre intro, información de ruta y deja lanzar con energía visible', async () => {
    render(<CargoGame />)
    expect(screen.getByRole('dialog', { name: /instrucciones/ })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Empezar ↗/ }))
    const dialog = screen.getByRole('dialog', { name: 'Información de la ruta' })
    expect(dialog.textContent).toContain('Alcanzan: Carretera, Ferrocarril, Barco, Avión')
    expect(dialog.textContent).toContain('Meta mínima de esta ruta: 4 cajas')
    await userEvent.click(screen.getByRole('button', { name: /Empezar la ruta/ }))
    expect(screen.getByText('54 / 54')).toBeTruthy()
    expect(screen.getByText('0 / 4 cajas')).toBeTruthy()
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
    await userEvent.click(screen.getByRole('button', { name: /Empezar la ruta/ }))
    expect(document.querySelector('.gs-coach')?.textContent).toBeTruthy()
  })

  it('ignora clics fuera del lanzador y cancela arrastres cortos o con Escape sin gastar energía', async () => {
    const canvas = await openRoute1Playing()

    // Clic accidental lejos del lanzador: avisa pero no lanza.
    fireEvent.pointerDown(canvas, { clientX: 340, clientY: 160, button: 0 })
    fireEvent.pointerUp(canvas, { clientX: 340, clientY: 160, button: 0 })
    expect(screen.getByText('54 / 54')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('vehículo lanzador')

    // Clic y arrastre muy corto dentro del lanzador: se cancela sin gastar energía.
    fireEvent.pointerDown(canvas, { clientX: 43, clientY: 322, button: 0 })
    fireEvent.pointerMove(canvas, { clientX: 38, clientY: 324 })
    fireEvent.pointerUp(canvas, { clientX: 38, clientY: 324, button: 0 })
    expect(screen.getByText('54 / 54')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Tiro cancelado')

    // Arrastrar armado y presionar Escape cancela el tiro limpiamente.
    fireEvent.pointerDown(canvas, { clientX: 43, clientY: 322, button: 0 })
    fireEvent.pointerMove(canvas, { clientX: 0, clientY: 355 })
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.pointerUp(canvas, { clientX: 0, clientY: 355, button: 0 })
    expect(screen.getByText('54 / 54')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Tiro cancelado.')
  })

  it.each([
    { radio: /Ferrocarril/, badge: 'Impulsor sobre riel', dragTo: { x: -12, y: 326 }, expectedEnergy: '50 / 54', fixedAngle: true },
    { radio: /Carretera/, badge: 'Tirachinas ágil', dragTo: { x: 18, y: 358 }, expectedEnergy: '51 / 54', fixedAngle: false },
    { radio: /Barco/, badge: 'Tensión pesada', dragTo: { x: -20, y: 365 }, expectedEnergy: '48 / 54', fixedAngle: false },
    { radio: /Avión/, badge: 'Empuje rápido', dragTo: { x: 12, y: 342 }, expectedEnergy: '49 / 54', fixedAngle: false },
  ])('apunta y lanza con arrastre de mouse en modo $badge', async ({ radio, badge, dragTo, expectedEnergy, fixedAngle }) => {
    const canvas = await openRoute1Playing()
    await userEvent.click(screen.getByRole('radio', { name: radio }))
    expect(document.querySelector('.cargo-mode-profile')?.textContent).toContain(badge)

    fireEvent.pointerDown(canvas, { clientX: 43, clientY: 322, button: 0 })
    fireEvent.pointerMove(canvas, { clientX: dragTo.x, clientY: dragTo.y })
    fireEvent.pointerUp(canvas, { clientX: dragTo.x, clientY: dragTo.y, button: 0 })

    expect(screen.getByText(expectedEnergy)).toBeTruthy()
    if (fixedAngle) {
      expect(document.querySelector('.cargo-aim')?.textContent).toContain('45° (fijo)')
    } else {
      expect((screen.getByLabelText('Ángulo de lanzamiento') as HTMLInputElement).disabled).toBe(false)
    }

    // Mientras recarga, un nuevo intento de agarre avisa en lugar de disparar.
    fireEvent.pointerDown(canvas, { clientX: 43, clientY: 322, button: 0 })
    expect(screen.getByRole('status').textContent).toContain('recargando')
  })
})
