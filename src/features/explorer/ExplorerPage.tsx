import { lazy, Suspense } from 'react'
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
  return <div className="page-width inner-page interactive-explorer">
    <PageIntro number="01" title="Explorador climático">Un planeta, muchas fechas. Recorre la señal global del clima desde 1926 y descubre cómo cambia a través del tiempo.</PageIntro>
    <ExplorerErrorBoundary><ExplorerProvider>
      <div className="explorer-experience earth-dashboard">
        <WorldClimateVisualizer />
        <div className="earth-tools"><ClimateTimeline /><ClimatePeriodComparison /></div>
      </div>
      <Suspense fallback={<section className="panel" role="status">Cargando el gráfico climático…</section>}><ClimateChart /></Suspense>
      <ClimateHistoricalContext />
      <details className="data-provenance"><summary>Fuente y última actualización del conjunto NASA</summary><ClimateSummaryPanel /></details>
    </ExplorerProvider></ExplorerErrorBoundary>
  </div>
}
