import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { App } from './App'

afterEach(cleanup)
const setup = (path = '/') => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
}
describe('Recorrido de la aplicación', () => {
  it('bloquea el fondo y restaura el scroll al cerrar el overlay o desmontar', async () => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'auto'
    try {
      const view = setup('/historia')
      await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
      expect(document.body.style.overflow).toBe('hidden')
      expect(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: /Historia/ }).getAttribute('aria-current')).toBe('page')
      await userEvent.click(document.querySelector('.menu-backdrop')!)
      expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
      expect(document.body.style.overflow).toBe('auto')
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir menú' }))
      await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
      view.unmount()
      expect(document.body.style.overflow).toBe('auto')
    } finally { document.body.style.overflow = previousOverflow }
  })
  it.each([
    ['/', 'El clima cambia.'], ['/explorador', 'Explorador climático'],
    ['/historia', 'El clima, a través del tiempo.'], ['/minijuegos', 'Aprender también es jugar.'],
    ['/acerca', 'Comprender para participar.'], ['/ruta-inexistente', 'Página no encontrada'],
  ])('resuelve la ruta %s', (path, title) => {
    setup(path)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain(title)
  })
  it('comienza la exploración desde Inicio', async () => {
    setup()
    await userEvent.click(screen.getByRole('link', { name: /Comenzar la exploración/ }))
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Explorador climático')
    expect(document.activeElement?.tagName).toBe('MAIN')
  })
  it('abre, cierra con Escape y devuelve el foco al botón', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeDefined()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir menú' }))
  })
  it('navega por todos los enlaces del menú y lo cierra al seleccionar', async () => {
    setup()
    for (const label of ['Explorador climático', 'Historia', 'Minijuegos', 'Acerca del proyecto', 'Inicio']) {
      await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
      await userEvent.click(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: new RegExp(label) }))
      expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
      expect(document.title).toContain(label)
    }
  })
  it('cierra al pulsar el botón o fuera del menú', async () => {
    setup()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    await userEvent.click(screen.getByRole('heading', { level: 1 }))
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
  })
  it('recorre una historia documentada y abre directamente uno de los cinco mundos Unity', async () => {
    const view = setup('/historia')
    expect(screen.getByRole('heading', { name: 'Seis décadas de preguntas y acuerdos' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /EPA · Orígenes de la agencia/ }).getAttribute('href')).toContain('epa.gov')
    await userEvent.click(screen.getByRole('button', { name: /2010–2019/ }))
    expect(screen.getByRole('heading', { name: 'Se adopta el Acuerdo de París' })).toBeTruthy()
    view.unmount()
    setup('/minijuegos')
    expect(screen.getAllByRole('button', { name: /Entrar al mundo/ })).toHaveLength(5)
    const frame = screen.getByTitle('Minijuegos Termómetro de la Tierra (Unity WebGL)')
    expect(frame.getAttribute('src')).toContain('unity-minijuegos/index.html')
    await userEvent.click(screen.getAllByRole('button', { name: /Entrar al mundo/ })[0])
    expect(screen.getByTitle('Minijuegos Termómetro de la Tierra (Unity WebGL)').getAttribute('src')).toContain('?world=energia')
  })
})
