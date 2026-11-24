import { useMemo, useState } from 'react'
import { historicalPeriods } from '../history/catalog'
import { useExplorer } from './ExplorerContext'
import { FIRST_YEAR, fromIndex } from './model'

type Props = { variant?: 'compact' | 'full'; showCard?: boolean }

type Marker = {
  id: string
  year: number
  title: string
  detail: string
  source: string
  sourceLabel: string
  periodLabel: string
  periodName: string
}

const markers: Marker[] = historicalPeriods.flatMap(period => period.events.map(event => ({
  ...event,
  id: `${event.year}-${event.title}`,
  periodLabel: period.label,
  periodName: period.name,
})))

/**
 * Shared historical rail. It keeps one native range input for pointer, touch
 * and keyboard access, and draws decades, narrative periods, event markers and
 * the selected-year needle around it. Nothing here stores its own date: every
 * instrument reads the same selection from ExplorerContext.
 */
export function TimeRail({ variant = 'compact', showCard = true }: Props) {
  const { mode, date, selected, minIndex, maxIndex, last, select, label, playing } = useExplorer()
  const [openMarker, setOpenMarker] = useState<string | null>(null)
  const activePeriod = historicalPeriods.find(period => date.year >= period.start && date.year <= period.end)
  const axisEnd = last.year + (mode === 'monthly' ? (last.month - 1) / 12 : 0)
  const span = Math.max(1, axisEnd - FIRST_YEAR)
  const position = (year: number, withinYear = 0) => Math.min(100, Math.max(0, ((year + withinYear - FIRST_YEAR) / span) * 100))
  const selectedPosition = position(date.year, mode === 'monthly' ? (date.month - 1) / 12 : 0)

  const decades = useMemo(() => {
    const years: number[] = []
    for (let year = Math.ceil(FIRST_YEAR / 10) * 10; year <= last.year; year += 10) years.push(year)
    return years
  }, [last.year])

  const marker = markers.find(item => item.id === openMarker) ?? null

  function move(value: number) {
    if (mode === 'monthly') {
      select(fromIndex(value))
    } else {
      select({ year: value, month: date.month })
    }
  }

  return <div className={`time-rail time-rail-${variant}`}>
    <div className="rail-head">
      <span className="rail-kicker">LÍNEA DEL TIEMPO</span>
      <output className="rail-readout" aria-live={playing ? 'off' : 'polite'}>{label}</output>
    </div>

    <div className="rail-track">
      <div className="rail-canvas">
        <div className="rail-bands" aria-hidden="true">
          {historicalPeriods.map(period => <span
            key={period.start}
            className={`rail-band${activePeriod?.start === period.start ? ' is-active' : ''}`}
            style={{ left: `${position(period.start)}%`, width: `${Math.max(position(period.end + 1) - position(period.start), 1)}%` }}
          />)}
        </div>

        <div className="rail-axis" aria-hidden="true" />

        <div className="rail-decades" aria-hidden="true">
          {decades.map(year => <span key={year} className="rail-decade" style={{ left: `${position(year)}%` }}>
            <i />{variant === 'full' || year % 20 === 0 ? year : null}
          </span>)}
        </div>

        <div className="rail-needle" style={{ left: `${selectedPosition}%` }} aria-hidden="true">
          <span>{date.year}</span>
        </div>
      </div>

      <input
        className="rail-input"
        type="range"
        min={mode === 'monthly' ? minIndex : FIRST_YEAR}
        max={mode === 'monthly' ? maxIndex : last.year}
        step="1"
        value={mode === 'monthly' ? selected : date.year}
        aria-label="Línea de tiempo"
        aria-valuetext={label}
        onChange={event => move(Number(event.target.value))}
      />

      <div className="rail-markers" role="group" aria-label="Hitos históricos en la línea">
        {markers.map(item => <button
          key={item.id}
          type="button"
          className={`rail-marker${openMarker === item.id ? ' is-open' : ''}`}
          style={{ left: `${position(item.year)}%` }}
          aria-label={`Evento histórico de ${item.year}: ${item.title}`}
          aria-expanded={showCard ? openMarker === item.id : undefined}
          onClick={() => {
            select({ year: item.year, month: 1 })
            if (showCard) setOpenMarker(current => current === item.id ? null : item.id)
          }}
        ><i /></button>)}
      </div>
    </div>

    <div className="rail-foot">
      <span>{FIRST_YEAR}</span>
      <span className="rail-period-label">{activePeriod ? activePeriod.name : 'Serie NASA GISTEMP'}</span>
      <span>{last.year}</span>
    </div>

    {showCard && marker && <div className="rail-event-card" role="status">
      <div>
        <span className="rail-event-meta">Hito · {marker.year}</span>
        <h3>{marker.title}</h3>
        <p>{marker.detail}</p>
        <a href={marker.source} target="_blank" rel="noreferrer">{marker.sourceLabel} ↗</a>
      </div>
      <button type="button" className="rail-event-close" onClick={() => setOpenMarker(null)} aria-label="Cerrar explicación del acontecimiento">×</button>
    </div>}
  </div>
}

export { markers as timelineMarkers }
