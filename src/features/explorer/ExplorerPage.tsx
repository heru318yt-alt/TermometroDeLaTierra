import { lazy, Suspense } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { ClimateSummaryPanel } from './ClimateSummaryPanel'
import { ExplorerProvider } from './ExplorerContext'
import { WorldClimateVisualizer } from './WorldClimateVisualizer'
import { ClimateTimeline } from './ClimateTimeline'
import { ClimateHistoricalContext } from './ClimateHistoricalContext'
import { ClimatePeriodComparison } from './ClimatePeriodComparison'
import { ExplorerErrorBoundary } from './ExplorerErrorBoundary'
import './explorer.css'

const ClimateChart = lazy(() => import('./ClimateChart'))

export function ExplorerPage() {
  return <div className="explorer-page">
    <PageIntro number="01" title="Explorador climático" eyebrow="MESA DE OBSERVACIÓN">
      Un planeta, muchas fechas. Recorre la señal global del clima desde 1926 y descubre cómo cambia a través del tiempo. El color no describe países: describe una anomalía global.
    </PageIntro>

    <ExplorerErrorBoundary><ExplorerProvider>
      <section className="explorer-observation" aria-label="Observación sincronizada del planeta">
        <WorldClimateVisualizer />
        <aside className="explorer-side">
          <ClimateTimeline />
          <ClimateHistoricalContext />
          <div className="explorer-next"><p className="eyebrow">PARA VER LA CURVA COMPLETA</p><p>La línea del tiempo reúne la serie, los umbrales y la reproducción en una sola sala de instrumentos.</p><Link className="text-link" to="/linea-del-tiempo">Abrir la línea del tiempo →</Link></div>
        </aside>
      </section>

      <section className="explorer-chart-section" aria-labelledby="explorer-chart-title">
        <div className="band-heading"><p className="eyebrow">SERIE GLOBAL NASA GISTEMP v4</p><h2 id="explorer-chart-title">La evolución en una línea</h2><p>Selecciona cualquier punto para actualizar la fecha, la esfera y la lectura. El intervalo sombreado se usa para comparar.</p></div>
        <Suspense fallback={<div className="timeline-loading" role="status">Cargando el gráfico climático…</div>}><ClimateChart /></Suspense>
      </section>

      <div className="explorer-analysis">
        <ClimatePeriodComparison />
        <aside className="explorer-reading-note">
          <p className="eyebrow">NOTA DE LECTURA</p>
          <h2>Comparar no es atribuir.</h2>
          <p>Una diferencia entre dos medias indica cuánto cambió la señal entre dos ventanas. No demuestra por sí sola qué actividad produjo ese cambio ni permite predecir el futuro.</p>
          <p>Los niveles de París se calculan con 1880–1900 porque es el inicio de esta serie; no son la referencia completa 1850–1900.</p>
          <Link className="text-link" to="/fuentes">Leer fuentes y metodología →</Link>
        </aside>
      </div>

      <details className="data-provenance"><summary>Fuente y última actualización del conjunto NASA</summary><ClimateSummaryPanel /></details>
    </ExplorerProvider></ExplorerErrorBoundary>
  </div>
}
