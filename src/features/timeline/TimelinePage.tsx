import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { ClimatePlaybackControls } from '../explorer/ClimatePlaybackControls'
import { ClimateSummaryPanel } from '../explorer/ClimateSummaryPanel'
import { ExplorerErrorBoundary } from '../explorer/ExplorerErrorBoundary'
import { ExplorerProvider, useExplorer } from '../explorer/ExplorerContext'
import { TimeRail } from '../explorer/TimeRail'
import { historicalPeriods } from '../history/catalog'
import { MapLegend, WorldTimeMap, latestEvent } from './WorldTimeMap'
import '../explorer/explorer.css'
import './timeline.css'

const ClimateChart = lazy(() => import('../explorer/ClimateChart'))

/** Panel lateral: período activo y último acontecimiento hasta la fecha. */
function TimelineSide() {
  const { date, mode, setMode, select } = useExplorer()
  const period = historicalPeriods.find(item => date.year >= item.start && date.year <= item.end)
  const next = historicalPeriods.find(item => item.start > date.year)
  const event = latestEvent(date.year)
  const isNew = event && event.year === date.year

  return <aside className="tl-side" aria-label="Lectura de la fecha seleccionada">
    <div className="tl-side-period">
      <p className="eyebrow">{period ? `PERÍODO ${period.label}` : 'FUERA DE LOS PERÍODOS NARRATIVOS'}</p>
      <h2>{period?.name ?? 'La serie sigue disponible'}</h2>
      <p>{period?.description ?? 'Esta fecha no pertenece a uno de los seis períodos narrativos. Avanza hasta 1970 para ver aparecer los acontecimientos en el mapa.'}</p>
    </div>

    {event ? <article className={`tl-event${isNew ? ' is-new' : ''}`} aria-live="polite">
      <p className="tl-event-meta"><span>{isNew ? 'Este año' : 'Último acontecimiento'}</span><span>{event.year} · {event.place?.name ?? 'Global'}</span></p>
      <h3>{event.title}</h3>
      <p>{event.detail}</p>
      <a href={event.source} target="_blank" rel="noreferrer">{event.sourceLabel} ↗</a>
    </article> : <p className="tl-event-empty">Todavía no hay acontecimientos marcados. Pulsa <b>Reproducir</b> o arrastra la línea para verlos aparecer en el mapa.</p>}

    <MapLegend />
    <div className="tl-side-actions">
      <div className="tl-mode" role="radiogroup" aria-label="Resolución temporal">
        <button type="button" role="radio" aria-checked={mode === 'annual'} className={mode === 'annual' ? 'is-active' : ''} onClick={() => setMode('annual')}>Anual</button>
        <button type="button" role="radio" aria-checked={mode === 'monthly'} className={mode === 'monthly' ? 'is-active' : ''} onClick={() => setMode('monthly')}>Mensual</button>
      </div>
      {next && <button type="button" className="tl-next" onClick={() => select({ year: next.start, month: 1 })}>Ir a {next.label} <span aria-hidden="true">→</span></button>}
    </div>
  </aside>
}

export function TimelinePage() {
  return <div className="timeline-page">
    <PageIntro number="02" title="Línea del tiempo" eyebrow="SALA DE INSTRUMENTOS">
      Mueve la línea y mira cómo cambian juntos el color del planeta y los acontecimientos sobre el mapa. Arrastra el indicador, usa ← → o pulsa Reproducir.
    </PageIntro>

    <ExplorerErrorBoundary><ExplorerProvider initialMode="annual">
      <section className="tl-observatory" aria-label="Mapa del mundo y línea del tiempo sincronizados">
        <WorldTimeMap />
        <TimelineSide />
        <div className="tl-rail-bar">
          <TimeRail variant="full" showCard={false} />
          <ClimatePlaybackControls />
        </div>
      </section>

      <section className="tl-chart" aria-labelledby="timeline-chart-title">
        <div className="tl-chart-head">
          <h2 id="timeline-chart-title">La forma del cambio</h2>
          <p>La misma fecha en la curva completa. Toca un punto para moverte a ese año.</p>
        </div>
        <Suspense fallback={<div className="timeline-loading" role="status">Cargando la serie climática…</div>}><ClimateChart /></Suspense>
      </section>

      <div className="tl-notes">
        <p><b>Un punto no es una tendencia.</b> Los umbrales de 1,5 °C y 2,0 °C son aproximaciones con los J-D de 1880–1900; superarlos un mes o un año no equivale a incumplir el Acuerdo de París. <Link className="text-link" to="/fuentes">Metodología →</Link></p>
        <details className="data-provenance"><summary>Fuente y última actualización del conjunto NASA</summary><ClimateSummaryPanel /></details>
      </div>
    </ExplorerProvider></ExplorerErrorBoundary>
  </div>
}
