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
  it('recorre una historia documentada y abre cada aventura sin un segundo selector Unity', async () => {
    const view = setup('/historia')
    expect(screen.getByRole('heading', { name: 'Seis décadas de preguntas y acuerdos' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /EPA · Orígenes de la agencia/ }).getAttribute('href')).toContain('epa.gov')
    await userEvent.click(screen.getByRole('button', { name: /2010–2019/ }))
    expect(screen.getByRole('heading', { name: 'Se adopta el Acuerdo de París' })).toBeTruthy()
    view.unmount()
    setup('/minijuegos')
    const worlds = [
      ['Energía viva', 'energia'], ['Fábrica circular', 'industria'], ['Rutas que respiran', 'transporte'],
      ['Bosque guardián', 'bosques'], ['La finca del futuro', 'agricultura'],
    ]
    expect(screen.getAllByRole('button', { name: /^Jugar / })).toHaveLength(5)
    expect(screen.queryByTitle('Minijuegos Termómetro de la Tierra (Unity WebGL)')).toBeNull()
    for (const [title, id] of worlds) {
      await userEvent.click(screen.getByRole('button', { name: `Jugar ${title}` }))
      const frame = screen.getByTitle(`Minijuego ${title} en Unity WebGL`)
      const src = frame.getAttribute('src')!
      expect(src).toContain(`world=${id}`)
      expect(src).toContain('return=')
      expect(screen.getByRole('heading', { name: `Juega: ${title}` })).toBeTruthy()
      await userEvent.click(screen.getByRole('button', { name: 'Volver a los mundos' }))
      expect(screen.queryByTitle(`Minijuego ${title} en Unity WebGL`)).toBeNull()
      expect(screen.queryByRole('heading', { name: 'Elige un mundo para empezar' })).toBeTruthy()
    }
  })
  it('restaura la aventura al abrir o recargar un enlace individual', () => {
    setup('/minijuegos?world=bosques')
    const frame = screen.getByTitle('Minijuego Bosque guardián en Unity WebGL')
    expect(frame.getAttribute('src')).toContain('world=bosques')
    expect(screen.getByRole('heading', { name: 'Juega: Bosque guardián' })).toBeTruthy()
  })
  it('abre cada mundo del atlas principal con su identificador y ruta de regreso', () => {
    setup('/')
    const links = screen.getAllByRole('link', { name: /^Explorar / })
    expect(links).toHaveLength(5)
    for (const id of ['energia', 'industria', 'transporte', 'bosques', 'agricultura']) {
      const link = links.find(candidate => candidate.getAttribute('href')?.includes(`world=${id}`))
      expect(link?.getAttribute('href')).toContain(`world=${id}`)
      expect(link?.getAttribute('href')).toContain('return=')
    }
  })
})
