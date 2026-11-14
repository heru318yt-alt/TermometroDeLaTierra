import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { ClimateHistoricalContext } from '../explorer/ClimateHistoricalContext'
import { ClimatePlaybackControls } from '../explorer/ClimatePlaybackControls'
import { ClimateSummaryPanel } from '../explorer/ClimateSummaryPanel'
import { ExplorerErrorBoundary } from '../explorer/ExplorerErrorBoundary'
import { ExplorerProvider, useExplorer } from '../explorer/ExplorerContext'
import { TimeRail } from '../explorer/TimeRail'
import { WorldClimateVisualizer } from '../explorer/WorldClimateVisualizer'
import { historicalPeriods } from '../history/catalog'
import '../explorer/explorer.css'

const ClimateChart = lazy(() => import('../explorer/ClimateChart'))

function TimelinePeriodSummary() {
  const { date, select } = useExplorer()
  const period = historicalPeriods.find(item => date.year >= item.start && date.year <= item.end)
  const next = historicalPeriods.find(item => item.start > date.year)
  return <div className="timeline-period">
    <p className="eyebrow">PERÍODO ACTIVO</p>
    <h2>{period?.name ?? 'Fuera de los períodos narrativos'}</h2>
    <p>{period?.description ?? 'Esta fecha no pertenece a uno de los seis períodos narrativos, pero la serie climática sigue disponible para todos los años.'}</p>
    {next && <button type="button" className="timeline-next-period" onClick={() => select({ year: next.start, month: 1 })}>Siguiente período: {next.label} <span aria-hidden="true">→</span></button>}
  </div>
}

export function TimelinePage() {
  return <div className="timeline-page">
    <PageIntro number="02" title="Línea del tiempo" eyebrow="SALA DE INSTRUMENTOS">
      Una sola señal, muchas fechas. Mueve el año y observa cambiar la esfera, la lectura y la serie al mismo tiempo.
    </PageIntro>

    <ExplorerErrorBoundary><ExplorerProvider initialMode="annual">
      <section className="timeline-workbench" aria-labelledby="timeline-console-title">
        <div className="timeline-controls">
          <div className="timeline-controls-head">
            <p className="eyebrow">CONTROL PRINCIPAL</p>
            <h2 id="timeline-console-title">Un año mueve todo el observatorio.</h2>
          </div>

          <TimeRail variant="full" />

          <div className="rail-legend" aria-hidden="true">
            <span><i className="key-line" /> Anomalía global</span>
            <span><i className="key-band" /> Períodos narrativos</span>
            <span><i className="key-event" /> Acontecimiento</span>
          </div>

          <ClimatePlaybackControls />
          <TimelinePeriodSummary />

          <details className="timeline-help">
            <summary>Cómo usar esta línea</summary>
            <p>Desliza el indicador o usa <kbd>←</kbd> <kbd>→</kbd>. El mapa, la lectura y el gráfico comparten la misma fecha; los puntos marcan acontecimientos documentados.</p>
          </details>
        </div>

        <WorldClimateVisualizer />
      </section>

      <section className="timeline-chart-band" aria-labelledby="timeline-chart-title">
        <div className="band-heading">
          <p className="eyebrow">SERIE HISTÓRICA</p>
          <h2 id="timeline-chart-title">La forma del cambio</h2>
          <p>Pasa el cursor para leer un punto. Haz clic o usa las flechas del teclado para seleccionarlo.</p>
        </div>
        <Suspense fallback={<div className="timeline-loading" role="status">Cargando la serie climática…</div>}><ClimateChart /></Suspense>
      </section>

      <div className="timeline-context-row">
        <ClimateHistoricalContext />
        <details className="timeline-method">
          <summary>Cómo leer esta línea</summary>
          <h2>Un punto no es una tendencia.</h2>
          <p>Los umbrales de 1,5 °C y 2,0 °C son aproximaciones calculadas con los J-D de 1880–1900. Superarlos en un mes o un año no demuestra que se haya superado un objetivo de largo plazo del Acuerdo de París.</p>
          <Link className="text-link" to="/fuentes">Leer la metodología completa →</Link>
        </details>
      </div>

      <details className="data-provenance"><summary>Fuente y última actualización del conjunto NASA</summary><ClimateSummaryPanel /></details>
    </ExplorerProvider></ExplorerErrorBoundary>
  </div>
}
