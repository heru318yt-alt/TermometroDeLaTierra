import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useClimateData } from '../climate/useClimateData'
import { getAnnualAnomaly, getMonthlyAnomaly } from '../climate/math'
import type { MonthDate } from '../climate/types'
import { FIRST_YEAR, formatDate, fromIndex, fromMonthString, toIndex } from './model'
import type { ViewMode } from './model'

function useExplorerState() {
  const { data, summary } = useClimateData()
  const minIndex = FIRST_YEAR * 12
  const last = fromMonthString(data.lastDate)
  const maxIndex = toIndex(last)
  if (!summary.latest || maxIndex < minIndex || !Number.isFinite(maxIndex)) throw new Error('No hay registros climáticos utilizables desde 1926.')
  const [selected, setSelected] = useState(maxIndex)
  const [mode, setModeState] = useState<ViewMode>('monthly')
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [range, setRange] = useState({ start: `${FIRST_YEAR}-01`, end: data.lastDate })
  const date = fromIndex(selected)
  const atStart = mode === 'annual' ? date.year === FIRST_YEAR : selected === minIndex
  const atEnd = mode === 'annual' ? date.year === last.year : selected === maxIndex
  const anomaly = mode === 'monthly' ? getMonthlyAnomaly(data.years, date) : getAnnualAnomaly(data.years, date.year)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const update = () => { setReducedMotion(media?.matches ?? false); setPlaying(false) }
    media?.addEventListener('change', update)
    const visibility = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener('visibilitychange', visibility)
    return () => { media?.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useEffect(() => {
    if (!playing || reducedMotion || atEnd) return
    const interval = window.setInterval(() => {
      setSelected(value => Math.min(maxIndex, value + (mode === 'monthly' ? 1 : 12)))
    }, speed)
    return () => window.clearInterval(interval)
  }, [playing, reducedMotion, atEnd, maxIndex, mode, speed])
  useEffect(() => { if (atEnd) setPlaying(false) }, [atEnd])

  const select = (next: MonthDate) => {
    setPlaying(false)
    setSelected(Math.max(minIndex, Math.min(maxIndex, toIndex(next))))
  }
  const setMode = (next: ViewMode) => { setPlaying(false); setModeState(next) }
  const step = (direction: number) => select(fromIndex(selected + direction * (mode === 'monthly' ? 1 : 12)))
  const reset = () => select(fromIndex(minIndex))
  const togglePlay = () => {
    if (reducedMotion) return
    if (atEnd) setSelected(minIndex)
    setPlaying(value => !value)
  }
  const series = useMemo(() => {
    if (mode === 'annual') return data.years.filter(row => row.year >= FIRST_YEAR && row.year <= last.year)
      .map(row => ({ date: { year: row.year, month: 1 }, anomaly: getAnnualAnomaly(data.years, row.year) }))
    return Array.from({ length: maxIndex - minIndex + 1 }, (_, i) => {
      const pointDate = fromIndex(minIndex + i)
      return { date: pointDate, anomaly: getMonthlyAnomaly(data.years, pointDate) }
    })
  }, [data, mode, minIndex, maxIndex, last.year])
  return { data, summary, mode, setMode, date, selected, select, minIndex, maxIndex, last,
    anomaly, label: formatDate(date, mode), playing, speed, setSpeed, reducedMotion,
    atStart, atEnd, step, reset, togglePlay, range, setRange, series }
}

const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null)
export function ExplorerProvider({ children }: { children: ReactNode }) {
  const state = useExplorerState()
  return <ExplorerContext.Provider value={state}>{children}</ExplorerContext.Provider>
}
export function useExplorer() {
  const value = useContext(ExplorerContext)
  if (!value) throw new Error('El componente requiere ExplorerProvider.')
  return value
}
