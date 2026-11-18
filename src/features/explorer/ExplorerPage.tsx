import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { ClimateSummaryPanel } from './ClimateSummaryPanel'
import { ExplorerProvider } from './ExplorerContext'
import { WorldClimateVisualizer } from './WorldClimateVisualizer'
import { ClimateTimeline } from './ClimateTimeline'
import { ClimatePeriodComparison } from './ClimatePeriodComparison'
import { ExplorerErrorBoundary } from './ExplorerErrorBoundary'
import './explorer.css'
import '../timeline/timeline.css'

const ClimateChart = lazy(() => import('./ClimateChart'))

export function ExplorerPage() {
  return <div className="explorer-page">
    <PageIntro number="01" title="Explorador climático" eyebrow="MESA DE OBSERVACIÓN">
      Elige una fecha y lee la anomalía global en el globo, o compara dos períodos. El color describe una sola señal global, no países.
    </PageIntro>

    <ExplorerErrorBoundary><ExplorerProvider>
      <section className="explorer-observation" aria-label="Observación sincronizada del planeta">
        <WorldClimateVisualizer />
        <aside className="explorer-side">
          <ClimateTimeline />
          <Link className="explorer-next-link" to="/linea-del-tiempo">Ver los años pasar sobre el mapa del mundo en la línea del tiempo →</Link>
        </aside>
      </section>

      <section className="explorer-chart-section" aria-labelledby="explorer-chart-title">
        <div className="tl-chart-head"><h2 id="explorer-chart-title">La evolución en una línea</h2><p>Toca un punto para cambiar la fecha. El intervalo sombreado es el que se compara abajo.</p></div>
        <Suspense fallback={<div className="timeline-loading" role="status">Cargando el gráfico climático…</div>}><ClimateChart /></Suspense>
      </section>

      <div className="explorer-analysis">
        <ClimatePeriodComparison />
        <aside className="explorer-reading-note">
          <h2>Comparar no es atribuir.</h2>
          <p>La diferencia entre dos medias dice cuánto cambió la señal, no qué la produjo ni qué pasará después. Los niveles de París usan 1880–1900, el inicio de esta serie.</p>
          <Link className="text-link" to="/fuentes">Metodología →</Link>
        </aside>
      </div>

      <details className="data-provenance"><summary>Fuente y última actualización del conjunto NASA</summary><ClimateSummaryPanel /></details>
    </ExplorerProvider></ExplorerErrorBoundary>
  </div>
}
