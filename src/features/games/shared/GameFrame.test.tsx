import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { GameFrame, useIsFullscreen } from './GameFrame'
import { Gauge } from './ui'

function Probe() { return <p>{useIsFullscreen() ? 'grande' : 'normal'}</p> }

describe('GameFrame · pantalla completa', () => {
  it('sin Fullscreen API usa el modo expandido y Esc lo cierra', async () => {
    const { container } = render(<GameFrame world="energia" title="Mantén la red"><Probe /></GameFrame>)
    const root = container.querySelector('.gf-root')!
    expect(screen.getByText('normal')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Pantalla completa' }))
    expect(root.classList.contains('is-expanded')).toBe(true)
    expect(screen.getByRole('dialog', { name: /pantalla completa/ })).toBeTruthy()
    expect(screen.getByText('grande')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Salir de pantalla completa' }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.keyboard('{Escape}')
    expect(root.classList.contains('is-fullscreen')).toBe(false)
    expect(screen.getByText('normal')).toBeTruthy()
  })

  it('el botón alterna la vista expandida', async () => {
    const { container } = render(<GameFrame world="bosques" title="Guardabosques"><Probe /></GameFrame>)
    await userEvent.click(screen.getByRole('button', { name: 'Pantalla completa' }))
    await userEvent.click(screen.getByRole('button', { name: 'Salir de pantalla completa' }))
    expect(container.querySelector('.gf-root')!.classList.contains('is-expanded')).toBe(false)
  })
})

describe('Gauge · recursos que se agotan', () => {
  it('marca el recurso como escaso y agotado', () => {
    const { rerender, container } = render(<Gauge label="AGUA" value={10} max={60} />)
    expect(container.querySelector('.gs-gauge')!.className).toContain('is-low')
    expect(screen.getByText(/ESCASO/)).toBeTruthy()
    rerender(<Gauge label="AGUA" value={0} max={60} />)
    expect(screen.getByText(/AGOTADO/)).toBeTruthy()
    expect(screen.getByRole('meter', { name: 'AGUA' }).getAttribute('aria-valuenow')).toBe('0')
  })
})
