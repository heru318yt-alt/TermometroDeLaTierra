import { historicalPeriods } from '../history/catalog'
import { useExplorer } from './ExplorerContext'
import { FIRST_YEAR } from './model'
import { ClimatePlaybackControls } from './ClimatePlaybackControls'
import { TimeRail } from './TimeRail'

const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, index))))

export function ClimateTimeline() {
  const { mode, setMode, date, label, select, selectYear, last, playing } = useExplorer()
  return <section className="climate-timeline instrument-tape" aria-labelledby="timeline-title">
    <div className="section-heading">
      <div><p className="eyebrow">CONTROL TEMPORAL</p><h2 id="timeline-title">Recorre el tiempo</h2></div>
      <output className="selected-date" data-testid="timeline-date" aria-live={playing ? 'off' : 'polite'}>{label}</output>
    </div>


    <div className="temporal-selectors">
      <fieldset className="view-switch"><legend>Resolución temporal</legend><label><input type="radio" name="view-mode" checked={mode === 'monthly'} onChange={() => setMode('monthly')} /> Mensual</label><label><input type="radio" name="view-mode" checked={mode === 'annual'} onChange={() => setMode('annual')} /> Anual (J-D)</label></fieldset>
      <label>Año<select value={date.year} onChange={event => selectYear(Number(event.target.value))}>{Array.from({ length: last.year - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i).map(year => <option key={year} value={year}>{year}</option>)}</select></label>
      {mode === 'monthly' && <label>Mes<select value={date.month} onChange={event => select({ ...date, month: Number(event.target.value) })}>{months.map((month, index) => <option key={month} value={index + 1} disabled={date.year === last.year && index + 1 > last.month}>{month}</option>)}</select></label>}
    </div>

    <TimeRail variant="compact" />

    <div className="historical-shortcuts" aria-label="Ir al inicio de un período histórico">
      <span className="shortcuts-label">Ir a un período</span>
      {historicalPeriods.map(period => <button type="button" key={period.start} onClick={() => select({ year: period.start, month: 1 })} aria-label={period.label}>{period.label}</button>)}
    </div>
    <ClimatePlaybackControls />
  </section>
}
