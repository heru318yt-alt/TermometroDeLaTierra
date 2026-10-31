import { historicalPeriods } from '../history/catalog'
import { useExplorer } from './ExplorerContext'
import { FIRST_YEAR, fromIndex } from './model'
import { ClimatePlaybackControls } from './ClimatePlaybackControls'

const months = Array.from({ length: 12 }, (_, index) => new Intl.DateTimeFormat('es-CO', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, index))))
export function ClimateTimeline() {
  const { mode, setMode, date, label, select, selected, minIndex, maxIndex, last, playing } = useExplorer()
  return <section className="climate-timeline" aria-labelledby="timeline-title">
    <div className="section-heading"><h2 id="timeline-title">Recorre el tiempo</h2><output className="selected-date" data-testid="timeline-date" aria-live={playing ? 'off' : 'polite'}>{label}</output></div>
    <div className="temporal-selectors">
      <fieldset className="view-switch"><legend>Resolución temporal</legend><label><input type="radio" name="view-mode" checked={mode === 'monthly'} onChange={() => setMode('monthly')} /> Mensual</label><label><input type="radio" name="view-mode" checked={mode === 'annual'} onChange={() => setMode('annual')} /> Anual (J-D)</label></fieldset>
      <label>Año<select value={date.year} onChange={event => select({ year: Number(event.target.value), month: date.month })}>{Array.from({ length: last.year - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i).map(year => <option key={year} value={year}>{year}</option>)}</select></label>
      {mode === 'monthly' && <label>Mes<select value={date.month} onChange={event => select({ ...date, month: Number(event.target.value) })}>{months.map((month, index) => <option key={month} value={index + 1} disabled={date.year === last.year && index + 1 > last.month}>{month}</option>)}</select></label>}
    </div>
    <label className="timeline-slider-label">Fecha seleccionada<input aria-label="Línea de tiempo" type="range" min={mode === 'monthly' ? minIndex : FIRST_YEAR} max={mode === 'monthly' ? maxIndex : last.year} value={mode === 'monthly' ? selected : date.year} aria-valuetext={label} onChange={event => select(mode === 'monthly' ? fromIndex(Number(event.target.value)) : { year: Number(event.target.value), month: date.month })} /></label>
    <div className="timeline-labels"><span>{FIRST_YEAR}</span><span>{last.year} · {months[last.month - 1]}</span></div>
    <div className="history-band" aria-label="Referencias históricas en la línea de tiempo">{historicalPeriods.map((period, i) => <span key={period.start} title={period.label} style={{ left: `${(period.start * 12 - minIndex) / (maxIndex - minIndex + 1) * 100}%`, width: `${((period.end - period.start + 1) * 12) / (maxIndex - minIndex + 1) * 100}%`, background: i % 2 ? '#627e65' : '#b0c49b' }} />)}</div>
    <div className="historical-shortcuts" aria-label="Ir al inicio de un período histórico">{historicalPeriods.map(period => <button key={period.start} onClick={() => select({ year: period.start, month: 1 })}>{period.label}</button>)}</div>
    <p className="muted">Las bandas señalan los seis períodos narrativos. Puedes explorar todos los años desde 1926.</p>
    <ClimatePlaybackControls />
  </section>
}
