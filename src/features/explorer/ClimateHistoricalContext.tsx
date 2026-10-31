import { historicalPeriods } from '../history/catalog'
import { useExplorer } from './ExplorerContext'
import { formatAnomaly } from './model'
export function ClimateHistoricalContext() {
  const { date, label, anomaly } = useExplorer()
  const period = historicalPeriods.find(period => date.year >= period.start && date.year <= period.end)
  return <aside className="panel historical-context" aria-labelledby="context-title"><p className="eyebrow">CONTEXTO DE LA SELECCIÓN</p><h2 id="context-title">{period?.name ?? 'Una mirada al clima global'}</h2><p>{period?.description ?? 'Esta fecha está fuera de los seis períodos narrativos. La anomalía expresa la diferencia frente al promedio de referencia de 1951–1980 y no describe el clima de una región concreta.'}</p><p><strong>{label}</strong><br /><span data-testid="context-anomaly">{formatAnomaly(anomaly)}</span></p><p className="muted">Una observación no establece una tendencia ni identifica por sí sola sus causas.</p></aside>
}
