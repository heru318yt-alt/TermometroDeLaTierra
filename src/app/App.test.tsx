import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { App } from './App'
import { completeEpoch, resetProgress } from '../features/games/progress'

afterEach(cleanup)
beforeEach(() => {
  resetProgress()
  window.localStorage.clear()
})
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
    ['/linea-del-tiempo', 'Línea del tiempo'], ['/historia', 'El clima, a través del tiempo.'],
    ['/factores', 'Factores del cambio climático'], ['/minijuegos', 'Aprender también es jugar.'],
    ['/fuentes', 'Fuentes y metodología'], ['/acerca', 'Comprender para participar.'],
    ['/ruta-inexistente', 'Esta coordenada no existe.'],
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
    for (const label of ['Explorador climático', 'Línea del tiempo', 'Historia del clima', 'Factores del cambio climático', 'Minijuegos', 'Fuentes y metodología', 'Acerca del proyecto', 'Inicio']) {
      await userEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
      await userEvent.click(within(screen.getByRole('navigation', { name: 'Navegación principal' })).getByRole('link', { name: new RegExp(label) }))
      expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).toBeNull()
      expect(document.title).toContain(label)
    }
  })
  it('mantiene el audio apagado hasta que la persona lo activa', async () => {
    window.localStorage.clear()
    setup()
    expect(screen.getByRole('button', { name: /Sonido/ })).toBeTruthy()
    expect(screen.getByText('Apagado')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: /Sonido/ }))
    const sliders = screen.getAllByRole('slider') as HTMLInputElement[]
    expect(sliders.map(slider => slider.value)).toEqual(['34', '52', '28'])
    const power = screen.getByRole('button', { name: 'Activar audio' })
    expect(power.getAttribute('aria-pressed')).toBe('false')
    await userEvent.click(power)
    expect(screen.getByRole('button', { name: 'Desactivar audio' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Silenciar todo' })).toBeTruthy()
    const channels = screen.getAllByRole('switch')
    expect(channels).toHaveLength(3)
    expect(channels.map(channel => channel.getAttribute('aria-checked'))).toEqual(['true', 'true', 'true'])
    await userEvent.click(channels[0])
    expect(screen.getAllByRole('switch').map(channel => channel.getAttribute('aria-checked'))).toEqual(['false', 'true', 'true'])
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
  it('recorre una historia documentada y abre cada etapa desde la ruta', async () => {
    const view = setup('/historia')
    expect(screen.getByRole('heading', { name: 'Seis décadas de preguntas y acuerdos' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /EPA · Orígenes de la agencia/ }).getAttribute('href')).toContain('epa.gov')
    await userEvent.click(screen.getByRole('button', { name: /2010–2019/ }))
    expect(screen.getByRole('heading', { name: 'Se adopta el Acuerdo de París' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /2010–2019. Guardabosques/ }).getAttribute('href')).toContain('world=bosques')
    view.unmount()

    completeEpoch('energia')
    completeEpoch('industria')
    completeEpoch('transporte')
    completeEpoch('bosques')
    setup('/minijuegos')
    const worlds = [
      ['Mantén la red'], ['Puente de materiales'], ['Carga entre ciudades'],
      ['Guardabosques'], ['Finca equilibrada'],
    ]
    for (const [index, [title]] of worlds.entries()) {
      const route = screen.getByRole('list', { name: 'Ruta de las cinco etapas' })
      await userEvent.click(within(route).getByRole('button', { name: new RegExp(title) }))
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeTruthy()
      expect(screen.getByText(`Misión ${String(index + 1).padStart(2, '0')} · ${title}`)).toBeTruthy()
      await userEvent.click(screen.getByRole('button', { name: 'Volver a la ruta' }))
      expect(screen.queryByText(`Misión ${String(index + 1).padStart(2, '0')} · ${title}`)).toBeNull()
      expect(screen.getByText('Elige una etapa de la ruta.')).toBeTruthy()
    }
  })
  it('mantiene cerradas las etapas siguientes y las abre al completar la anterior', async () => {
    setup('/minijuegos')
    const route = () => screen.getByRole('list', { name: 'Ruta de las cinco etapas' })
    expect(within(route()).getAllByRole('button')).toHaveLength(5)
    expect(within(route()).getByRole('button', { name: /1970–1989. Mantén la red. Disponible/ })).toBeTruthy()
    expect(within(route()).getByRole('button', { name: /1990–1999. Puente de materiales. Se abre al completar/ })).toBeTruthy()

    await userEvent.click(within(route()).getByRole('button', { name: /1990–1999. Puente de materiales/ }))
    expect(screen.getByRole('heading', { name: 'Esta etapa aún está bloqueada' })).toBeTruthy()
    expect(screen.queryByText('Misión 02 · Puente de materiales')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /Ir a la etapa anterior/ }))
    expect(screen.getByRole('heading', { level: 2, name: 'Mantén la red' })).toBeTruthy()
    expect(screen.getByText('Misión 01 · Mantén la red')).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Marcar reto completado' }))
    expect(screen.getByText(/Se abrió 1990–1999: Puente de materiales/)).toBeTruthy()
    expect(within(route()).getByRole('button', { name: /1990–1999. Puente de materiales. Disponible/ })).toBeTruthy()
  })
  it('restaura la aventura al abrir o recargar un enlace individual', () => {
    completeEpoch('energia')
    completeEpoch('industria')
    completeEpoch('transporte')
    setup('/minijuegos?world=bosques')
    expect(screen.getByText('Misión 04 · Guardabosques')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Guardabosques' })).toBeTruthy()
  })
  it('abre cada mundo del atlas principal con su identificador', () => {
    setup('/')
    const links = screen.getAllByRole('link', { name: /^Explorar / })
    expect(links).toHaveLength(5)
    for (const id of ['energia', 'industria', 'transporte', 'bosques', 'agricultura']) {
      const link = links.find(candidate => candidate.getAttribute('href')?.includes(`world=${id}`))
      expect(link?.getAttribute('href')).toContain(`world=${id}`)
    }
  })
})
