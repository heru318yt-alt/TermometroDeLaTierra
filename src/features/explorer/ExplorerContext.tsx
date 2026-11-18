import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useClimateData } from '../climate/useClimateData'
import { getAnnualAnomaly, getMonthlyAnomaly } from '../climate/math'
import type { MonthDate } from '../climate/types'
import { playSfx } from '../audio/sfx'
import type { SoundKind } from '../audio/sfx'
import { FIRST_YEAR, formatDate, fromIndex, fromMonthString, toIndex } from './model'
import type { ViewMode } from './model'

function useExplorerState(initialMode: ViewMode) {
  const { data, summary } = useClimateData()
  const minIndex = FIRST_YEAR * 12
  const last = fromMonthString(data.lastDate)
  const maxIndex = toIndex(last)
  if (!summary.latest || maxIndex < minIndex || !Number.isFinite(maxIndex)) throw new Error('No hay registros climáticos utilizables desde 1926.')
  const latestAnnualYear = [...data.years].reverse().find(row => row.annual !== null)?.year ?? last.year
  const initialDate = initialMode === 'annual' ? { year: latestAnnualYear, month: Math.min(last.month, 12) } : last
  const [selected, setSelected] = useState(() => toIndex(initialDate))
  const [mode, setModeState] = useState<ViewMode>(initialMode)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(700)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [range, setRange] = useState({ start: `${FIRST_YEAR}-01`, end: data.lastDate })
  const date = fromIndex(selected)
  const atStart = mode === 'annual' ? date.year === FIRST_YEAR : selected === minIndex
  const atEnd = mode === 'annual' ? date.year === latestAnnualYear : selected === maxIndex
  const anomaly = mode === 'monthly' ? getMonthlyAnomaly(data.years, date) : getAnnualAnomaly(data.years, date.year)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const update = () => { setReducedMotion(media?.matches ?? false); setPlaying(false) }
    media?.addEventListener('change', update)
    const visibility = () => { if (document.hidden) setPlaying(false) }
    document.addEventListener('visibilitychange', visibility)
    return () => { media?.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  const reachedEnd = useRef(false)
  useEffect(() => {
    if (!playing) { reachedEnd.current = false; return }
    if (atEnd && !reachedEnd.current) { reachedEnd.current = true; playSfx('combo') }
  }, [playing, atEnd])
  useEffect(() => {
    if (!playing || reducedMotion || atEnd) return
    const interval = window.setInterval(() => {
      setSelected(value => {
        const stepSize = mode === 'monthly' ? 1 : 12
        const next = Math.min(maxIndex, value + stepSize)
        if (next !== value && speed >= 700) playSfx('timeline')
        return next
      })
    }, speed)
    return () => window.clearInterval(interval)
  }, [playing, reducedMotion, atEnd, maxIndex, mode, speed])
  useEffect(() => { if (atEnd) setPlaying(false) }, [atEnd])

  const apply = (next: MonthDate, sound: SoundKind = 'date') => {
    setPlaying(false)
    setSelected(Math.max(minIndex, Math.min(maxIndex, toIndex(next))))
    playSfx(sound)
  }
  const select = (next: MonthDate) => apply(next, 'date')
  const selectYear = (year: number) => {
    const clamped = Math.max(FIRST_YEAR, Math.min(last.year, Math.round(year)))
    apply({ year: clamped, month: Math.min(date.month, clamped === last.year ? last.month : 12) }, 'date')
  }
  const setMode = (next: ViewMode) => { setPlaying(false); setModeState(next); playSfx('toggle') }
  const step = (direction: number) => apply(fromIndex(selected + direction * (mode === 'monthly' ? 1 : 12)), 'timeline')
  const reset = () => apply(fromIndex(minIndex), 'timeline')
  const togglePlay = () => {
    if (reducedMotion) return
    playSfx('timeline')
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
  return { data, summary, mode, setMode, date, selected, select, selectYear, minIndex, maxIndex, last,
    anomaly, label: formatDate(date, mode), playing, speed, setSpeed, reducedMotion,
    atStart, atEnd, step, reset, togglePlay, range, setRange, series }
}

type ProviderProps = { children: ReactNode; initialMode?: ViewMode }
const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null)
export function ExplorerProvider({ children, initialMode = 'monthly' }: ProviderProps) {
  const state = useExplorerState(initialMode)
  return <ExplorerContext.Provider value={state}>{children}</ExplorerContext.Provider>
}
export function useExplorer() {
  const value = useContext(ExplorerContext)
  if (!value) throw new Error('El componente requiere ExplorerProvider.')
  return value
}
