import { useClimateData } from '../climate/useClimateData'

const temperature = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero' })
const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const updatedFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' })

export function ClimateSummaryPanel() {
  const { summary } = useClimateData()
  const latest = summary.latest
  return <section className="panel indicator-panel" aria-labelledby="climate-summary-title">
    <div className="panel-heading"><h2 id="climate-summary-title">Indicador climático global</h2><span className="badge">Datos oficiales</span></div>
    <dl className="climate-summary">
      <dt>Última fecha disponible</dt>
      <dd>{latest ? <time dateTime={`${latest.year}-${String(latest.month).padStart(2, '0')}`}>{monthFormat.format(new Date(Date.UTC(latest.year, latest.month - 1)))}</time> : 'Sin datos disponibles'}</dd>
      <dt>Anomalía global del último mes</dt>
      <dd className="climate-value">{latest ? `${temperature.format(latest.anomaly)} °C` : 'Sin datos disponibles'}</dd>
      <dt>Último año completo{summary.latestAnnual ? ` · ${summary.latestAnnual.year}` : ''}</dt>
      <dd>{summary.latestAnnual ? `${temperature.format(summary.latestAnnual.anomaly)} °C (J-D)` : 'Sin datos disponibles'}</dd>
      <dt>Fuente</dt><dd><a href={summary.source.url} target="_blank" rel="noreferrer">{summary.source.name} ↗</a></dd>
      <dt>Período de referencia</dt><dd>{summary.source.referencePeriod}</dd>
      <dt>Fecha de descarga</dt><dd><time dateTime={summary.downloadedAt}>{updatedFormat.format(new Date(summary.downloadedAt))} (Bogotá)</time></dd>
    </dl>
    <p className="muted">Anomalías respecto a 1951–1980; no son temperaturas absolutas ni incrementos respecto a la época preindustrial.</p>
  </section>
}
