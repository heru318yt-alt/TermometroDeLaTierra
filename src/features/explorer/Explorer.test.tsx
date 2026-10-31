import { StrictMode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExplorerProvider, useExplorer } from './ExplorerContext'
import { ClimateTimeline } from './ClimateTimeline'
import { WorldClimateVisualizer } from './WorldClimateVisualizer'
import { ClimateHistoricalContext } from './ClimateHistoricalContext'
import { ClimatePeriodComparison } from './ClimatePeriodComparison'
import ClimateChart from './ClimateChart'
import { getClimateData } from '../climate/service'
import { getAnnualAnomaly, getMonthlyAnomaly } from '../climate/math'
import { formatAnomaly, formatDate, fromMonthString, toIndex } from './model'
import { ExplorerErrorBoundary } from './ExplorerErrorBoundary'

const data = getClimateData()
const last = fromMonthString(data.lastDate)
const mediaListeners = new Set<() => void>()
let reduced = false
beforeEach(() => {
  reduced = false
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced }, addEventListener: (_: string, fn: () => void) => mediaListeners.add(fn), removeEventListener: (_: string, fn: () => void) => mediaListeners.delete(fn) }))
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); mediaListeners.clear() })
function setup() {
  return render(<StrictMode><ExplorerProvider><WorldClimateVisualizer /><ClimateTimeline /><ClimateChart /><ClimateHistoricalContext /><ClimatePeriodComparison /></ExplorerProvider></StrictMode>)
}
function expectSynchronized(date: { year: number; month: number }, mode: 'monthly' | 'annual') {
  const label = formatDate(date, mode)
  const anomaly = mode === 'monthly' ? getMonthlyAnomaly(data.years, date) : getAnnualAnomaly(data.years, date.year)
  expect(screen.getByTestId('world-date').textContent).toBe(label)
  expect(screen.getByTestId('timeline-date').textContent).toBe(label)
  expect(screen.getByTestId('chart-marker').getAttribute('data-date')).toBe(label)
  expect(screen.getByTestId('world-anomaly').textContent).toBe(formatAnomaly(anomaly))
  expect(screen.getByTestId('context-anomaly').textContent).toBe(formatAnomaly(anomaly))
}

describe('Selección y sincronización del explorador', () => {
  it('abre en el último mes de los metadatos, sin permitir meses futuros', () => {
    setup()
    expectSynchronized(last, 'monthly')
    expect((screen.getByRole('button', { name: 'Avanzar' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('slider').getAttribute('max')).toBe(String(toIndex(last)))
    if (last.month < 12) expect((screen.getByRole('option', { name: 'diciembre' }) as HTMLOptionElement).disabled).toBe(true)
  })
  it('reinicia en enero de 1926 y sincroniza los selectores y el gráfico', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar/ }))
    expectSynchronized({ year: 1926, month: 1 }, 'monthly')
    expect((screen.getByRole('button', { name: 'Retroceder' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '1980' } })
    fireEvent.change(screen.getByLabelText('Mes'), { target: { value: '7' } })
    expectSynchronized({ year: 1980, month: 7 }, 'monthly')
    expect(screen.getByRole('heading', { name: 'Período 1980–1989' })).toBeDefined()
    fireEvent.change(screen.getByRole('slider'), { target: { value: toIndex(last) } })
    expectSynchronized(last, 'monthly')
  })
  it('distingue el año incompleto del J-D de un año completo', () => {
    setup()
    fireEvent.click(screen.getByRole('radio', { name: /Anual/ }))
    expectSynchronized(last, 'annual')
    expect(screen.queryByLabelText('Mes')).toBeNull()
    const completed = [...data.years].reverse().find(row => row.annual !== null)!
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: String(completed.year) } })
    expectSynchronized({ year: completed.year, month: last.month }, 'annual')
    fireEvent.click(screen.getByRole('radio', { name: 'Mensual' }))
    expectSynchronized({ year: completed.year, month: last.month }, 'monthly')
  })
  it('el gráfico permite seleccionar con teclado y puntero', () => {
    setup()
    const graph = screen.getByRole('group', { name: /Gráfico climático/ })
    fireEvent.keyDown(graph, { key: 'Home' })
    expectSynchronized({ year: 1926, month: 1 }, 'monthly')
    fireEvent.keyDown(graph, { key: 'ArrowRight' })
    expectSynchronized({ year: 1926, month: 2 }, 'monthly')
    fireEvent.keyDown(graph, { key: 'End' })
    expectSynchronized(last, 'monthly')
    vi.spyOn(graph, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 860, top: 0, height: 310, bottom: 310, right: 860, x: 0, y: 0, toJSON: () => ({}) })
    fireEvent.click(graph, { clientX: 54 })
    expectSynchronized({ year: 1926, month: 1 }, 'monthly')
  })
  it('muestra fecha y anomalía al explorar la curva sin cambiar la selección', () => {
    vi.stubGlobal('PointerEvent', MouseEvent)
    setup()
    const graph = screen.getByRole('group', { name: /Gráfico climático/ })
    vi.spyOn(graph, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 860, top: 0, height: 310, bottom: 310, right: 860, x: 0, y: 0, toJSON: () => ({}) })
    fireEvent.pointerMove(graph, { clientX: 54 })
    expect(screen.getByTestId('chart-readout').textContent).toContain('enero de 1926')
    expectSynchronized(last, 'monthly')
    fireEvent.pointerLeave(graph)
    expect(screen.getByTestId('chart-readout').textContent).toContain(formatDate(last, 'monthly'))
  })
  it('conecta los accesos históricos sin impedir consultar otras fechas', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: '2010–2019' }))
    expectSynchronized({ year: 2010, month: 1 }, 'monthly')
    fireEvent.change(screen.getByLabelText('Año'), { target: { value: '1950' } })
    expect(screen.getByRole('heading', { name: 'Una mirada al clima global' })).toBeDefined()
  })
  it('valida rangos cortos, invertidos y fuera de cobertura sin romper la interfaz', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Fecha inicial'), { target: { value: '2000-01' } })
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '2001-12' } })
    expect(screen.getByText(/Se necesitan al menos diez años/)).toBeDefined()
    expect(screen.getByText('24 de 24 meses disponibles')).toBeDefined()
    fireEvent.change(screen.getByLabelText('Fecha final'), { target: { value: '1999-12' } })
    expect(screen.getByText(/La fecha inicial debe/)).toBeDefined()
    fireEvent.change(screen.getByLabelText('Fecha inicial'), { target: { value: '1800-01' } })
    expect(screen.getByText(/Selecciona fechas entre/)).toBeDefined()
  })
})

// Isolate timing from expensive SVG and chart lazy loading.
function PlaybackHarness() {
  const { label, playing } = useExplorer()
  return <><ClimateTimeline /><output data-testid="playback-state">{label}/{String(playing)}</output></>
}
function playback() { return render(<StrictMode><ExplorerProvider><PlaybackHarness /></ExplorerProvider></StrictMode>) }
describe('Reproducción y limpieza', () => {
  it('avanza, pausa, cambia velocidad y limpia el intervalo al desmontar en StrictMode', () => {
    vi.useFakeTimers()
    const view = playback()
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar/ }))
    fireEvent.click(screen.getByRole('button', { name: /Reproducir/ }))
    expect(vi.getTimerCount()).toBe(1)
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByTestId('playback-state').textContent).toContain('febrero de 1926/true')
    fireEvent.click(screen.getByRole('button', { name: /Pausar/ }))
    expect(vi.getTimerCount()).toBe(0)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByTestId('playback-state').textContent).toContain('febrero de 1926/false')
    fireEvent.change(screen.getByLabelText('Velocidad'), { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: /Reproducir/ }))
    act(() => vi.advanceTimersByTime(250))
    expect(screen.getByTestId('playback-state').textContent).toContain('marzo de 1926/true')
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
    expect(mediaListeners.size).toBe(0)
  })
  it('termina al llegar al último registro y permite volver a reproducir desde 1926', () => {
    vi.useFakeTimers(); playback()
    fireEvent.click(screen.getByRole('button', { name: 'Retroceder' }))
    fireEvent.click(screen.getByRole('button', { name: /Reproducir/ }))
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByTestId('playback-state').textContent).toBe(`${formatDate(last, 'monthly')}/false`)
    expect(vi.getTimerCount()).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: /Reproducir/ }))
    expect(screen.getByTestId('playback-state').textContent).toBe('enero de 1926/true')
  })
  it('avanza por años en vista anual y pausa cuando se cambia la selección manualmente', () => {
    vi.useFakeTimers(); playback()
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar/ }))
    fireEvent.click(screen.getByRole('radio', { name: /Anual/ }))
    fireEvent.click(screen.getByRole('button', { name: /Reproducir/ }))
    act(() => vi.advanceTimersByTime(700))
    expect(screen.getByTestId('playback-state').textContent).toBe('1927 · anual J-D/true')
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar' }))
    expect(screen.getByTestId('playback-state').textContent).toBe('1928 · anual J-D/false')
    expect(vi.getTimerCount()).toBe(0)
  })
  it('respeta movimiento reducido y cambios de preferencia durante la reproducción', () => {
    vi.useFakeTimers(); playback()
    fireEvent.click(screen.getByRole('button', { name: /Reproducir/ }))
    act(() => { reduced = true; mediaListeners.forEach(fn => fn()) })
    expect((screen.getByRole('button', { name: /Reproducir/ }) as HTMLButtonElement).disabled).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'Avanzar' }))
    expect(screen.getByTestId('playback-state').textContent).toContain('febrero de 1926/false')
  })
  it('pausa y elimina el intervalo al ocultar la pestaña', () => {
    vi.useFakeTimers(); playback()
    fireEvent.click(screen.getByRole('button', { name: /Reproducir/ }))
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.getByTestId('playback-state').textContent).toContain('/false')
  })
})

it('muestra un error recuperable si falla un componente del explorador', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  function Broken(): never { throw new Error('Fallo de recurso simulado') }
  render(<ExplorerErrorBoundary><Broken /></ExplorerErrorBoundary>)
  expect(screen.getByRole('alert').textContent).toContain('No se pudo abrir el explorador')
  expect(screen.getByRole('button', { name: 'Recargar página' })).toBeDefined()
})
