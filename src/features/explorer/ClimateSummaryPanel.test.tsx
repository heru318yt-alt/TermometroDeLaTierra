import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { ClimateSummaryPanel } from './ClimateSummaryPanel'
import { getClimateSummary } from '../climate/service'

afterEach(cleanup)

it('muestra datos, fechas y referencia del JSON real en el panel', () => {
  render(<ClimateSummaryPanel />)
  const panel = screen.getByRole('region', { name: 'Indicador climático global' })
  const summary = getClimateSummary()
  const format = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' })
  expect(within(panel).getByText(`${format.format(summary.latest!.anomaly)} °C`)).toBeDefined()
  expect(within(panel).getByText(`${format.format(summary.latestAnnual!.anomaly)} °C (J-D)`)).toBeDefined()
  expect(within(panel).getByText(`Último año completo · ${summary.latestAnnual!.year}`)).toBeDefined()
  expect(within(panel).getByText('1951–1980')).toBeDefined()
  expect(within(panel).getByRole('link', { name: /NASA GISTEMP v4/ }).getAttribute('href')).toBe(summary.source.url)
  const dates = [...panel.querySelectorAll('time')].map(element => element.dateTime)
  expect(dates).toContain(summary.downloadedAt)
  expect(dates).toContain(`${summary.latest!.year}-${String(summary.latest!.month).padStart(2, '0')}`)
})
