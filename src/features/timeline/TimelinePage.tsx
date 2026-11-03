import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { playSfx } from '../audio/sfx'
import { ClimateHistoricalContext } from '../explorer/ClimateHistoricalContext'
import { ClimatePlaybackControls } from '../explorer/ClimatePlaybackControls'
import { ClimateSummaryPanel } from '../explorer/ClimateSummaryPanel'
import { ExplorerErrorBoundary } from '../explorer/ExplorerErrorBoundary'
import { ExplorerProvider, useExplorer } from '../explorer/ExplorerContext'
import { formatAnomaly } from '../explorer/model'
import { TimeRail } from '../explorer/TimeRail'
import { WorldClimateVisualizer } from '../explorer/WorldClimateVisualizer'
import { historicalPeriods } from '../history/catalog'
import '../explorer/explorer.css'

const ClimateChart = lazy(() => import('../explorer/ClimateChart'))

const HELP_KEY = 'tt-timeline-help'

function TimelineHelp() {
  const [visible, setVisible] = useState(() => {
    try { return window.localStorage.getItem(HELP_KEY) !== '1' } catch { return true }
  })
  if (!visible) return <p className="timeline-help-compact">Arrastra el indicador o usa ← → para cambiar de año.</p>
  return <div className="timeline-help" role="note">
    <p><strong>Cómo funciona.</strong> Desliza la línea del tiempo para explorar cómo ha cambiado la temperatura global. El mapa, el gráfico y los datos se actualizarán automáticamente con la misma fecha. Los puntos marcan acontecimientos documentados.</p>
    <button type="button" onClick={() => {
      setVisible(false)
      playSfx('click')
      try { window.localStorage.setItem(HELP_KEY, '1') } catch { /* storage may be unavailable */ }
    }}>Entendido</button>
  </div>
}

function TimelinePeriodSummary() {
  const { date, anomaly, mode, select } = useExplorer()
  const period = historicalPeriods.find(item => date.year >= item.start && date.year <= item.end)
  const next = historicalPeriods.find(item => item.start > date.year)
  return <div className="timeline-period">
    <p className="eyebrow">PERÍODO ACTIVO</p>
    <h2>{period?.name ?? 'Fuera de los períodos narrativos'}</h2>
    <p>{period?.description ?? 'Esta fecha no pertenece a uno de los seis períodos narrativos, pero la serie climática sigue disponible para todos los años.'}</p>
    <dl className="timeline-period-facts">
      <div><dt>Selección</dt><dd>{mode === 'monthly' ? 'Mensual' : 'Anual J-D'}</dd></div>
      <div><dt>Año</dt><dd>{date.year}</dd></div>
      <div><dt>Anomalía</dt><dd>{formatAnomaly(anomaly)}</dd></div>
      <div><dt>Referencia</dt><dd>1951–1980</dd></div>
    </dl>
    {next && <button type="button" className="timeline-next-period" onClick={() => select({ year: next.start, month: 1 })}>Siguiente período: {next.label} <span aria-hidden="true">→</span></button>}
  </div>
}

export function TimelinePage() {
  return <div className="timeline-page">
    <PageIntro number="02" title="Línea del tiempo" eyebrow="SALA DE INSTRUMENTOS">
      Una sola señal, muchas fechas. Recorre la anomalía global desde 1926 y observa cómo la esfera, el gráfico y la lectura cambian juntos. La serie completa conserva los registros desde 1880.
    </PageIntro>

    <ExplorerErrorBoundary><ExplorerProvider initialMode="annual">
      <section className="timeline-console" aria-labelledby="timeline-console-title">
        <div className="timeline-console-head">
          <div>
            <p className="eyebrow">CONTROL PRINCIPAL</p>
            <h2 id="timeline-console-title">Un año mueve todo el observatorio.</h2>
            <p>La línea y los controles comparten una única fecha. No hay lecturas desincronizadas.</p>
          </div>
          <TimelineHelp />
        </div>
        <TimeRail variant="full" />
        <ClimatePlaybackControls />
      </section>

      <section className="timeline-stage" aria-label="Instrumentos sincronizados de la línea del tiempo">
        <div className="timeline-stage-copy">
          <TimelinePeriodSummary />
          <div className="timeline-stage-key">
            <span><i className="key-line" /> Anomalía global</span>
            <span><i className="key-band" /> Períodos narrativos</span>
            <span><i className="key-event" /> Acontecimiento documentado</span>
          </div>
        </div>
        <WorldClimateVisualizer />
      </section>

      <section className="timeline-chart-band" aria-labelledby="timeline-chart-title">
        <div className="band-heading">
          <p className="eyebrow">SERIE HISTÓRICA</p>
          <h2 id="timeline-chart-title">La forma del cambio</h2>
          <p>Pasa el cursor para leer un punto. Haz clic o usa las flechas del teclado para seleccionarlo. El marcador y la línea temporal se mueven juntos.</p>
        </div>
        <Suspense fallback={<div className="timeline-loading" role="status">Cargando la serie climática…</div>}><ClimateChart /></Suspense>
      </section>

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
