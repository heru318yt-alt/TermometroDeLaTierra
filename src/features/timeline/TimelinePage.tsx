import { lazy, Suspense } from 'react'
import { PageIntro } from '../../components/PageIntro'
import { ClimateHistoricalContext } from '../explorer/ClimateHistoricalContext'
import { ClimateSummaryPanel } from '../explorer/ClimateSummaryPanel'
import { ClimateTimeline } from '../explorer/ClimateTimeline'
import { ExplorerErrorBoundary } from '../explorer/ExplorerErrorBoundary'
import { ExplorerProvider } from '../explorer/ExplorerContext'
import { WorldClimateVisualizer } from '../explorer/WorldClimateVisualizer'
import { Link } from 'react-router'
import '../explorer/explorer.css'

const ClimateChart = lazy(() => import('../explorer/ClimateChart'))

export function TimelinePage() {
  return <div className="timeline-page">
    <PageIntro number="02" title="Línea del tiempo" eyebrow="SALA DE INSTRUMENTOS">
      Una sola señal, muchas fechas. Recorre la anomalía global desde 1926 y observa cómo la esfera, el gráfico y la lectura cambian juntos. La serie completa conserva los registros desde 1880.
    </PageIntro>

    <ExplorerErrorBoundary><ExplorerProvider>
      <section className="timeline-stage" aria-label="Instrumentos sincronizados de la línea del tiempo">
        <div className="timeline-stage-copy">
          <p className="eyebrow">LECTURA SINCRONIZADA</p>
          <h2>La fecha mueve todo el observatorio.</h2>
          <p>Elige un mes o un año, arrastra el control o reproduce el recorrido. Cada instrumento responde a la misma selección.</p>
          <div className="timeline-stage-key">
            <span><i className="key-line" /> Anomalía global</span>
            <span><i className="key-band" /> Períodos narrativos</span>
            <span><i className="key-dash" /> Niveles de París</span>
          </div>
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

      <ClimateTimeline />
      <div className="timeline-context-row">
        <ClimateHistoricalContext />
        <aside className="timeline-method">
          <p className="eyebrow">CÓMO LEER ESTA LÍNEA</p>
          <h2>Un punto no es una tendencia.</h2>
          <p>Los umbrales de 1,5 °C y 2,0 °C son aproximaciones calculadas con los J-D de 1880–1900. Superarlos en un mes o un año no demuestra que se haya superado un objetivo de largo plazo del Acuerdo de París.</p>
          <Link className="text-link" to="/fuentes">Leer la metodología completa →</Link>
        </aside>
      </div>

      <details className="data-provenance"><summary>Fuente y última actualización del conjunto NASA</summary><ClimateSummaryPanel /></details>
    </ExplorerProvider></ExplorerErrorBoundary>
  </div>
}
