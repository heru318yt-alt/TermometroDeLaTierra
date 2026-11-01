import { useExplorer } from './ExplorerContext'
import { anomalyColor, colorStops, formatAnomaly } from './model'
import { InteractiveGlobe } from './InteractiveGlobe'

/** The sphere deliberately uses a single global anomaly, never a country-level heat map. */
export function WorldClimateVisualizer() {
  const { anomaly, label, mode } = useExplorer()
  const color = anomalyColor(anomaly)
  return <section className="world-visualizer" aria-labelledby="world-title">
    <div className="world-heading"><div><p className="eyebrow">UNA SEÑAL GLOBAL</p><h2 id="world-title">La Tierra en perspectiva</h2></div><span className="badge">{mode === 'monthly' ? 'Anomalía mensual' : 'Promedio anual J-D'}</span></div>
    <div className="world-reading"><span data-testid="world-date">{label}</span><strong data-testid="world-anomaly">{formatAnomaly(anomaly)}</strong></div>
    <InteractiveGlobe color={color} label={label} anomaly={formatAnomaly(anomaly)} />
    <div className="climate-color-legend" aria-label="Escala cromática fija de menos uno a más dos grados Celsius">
      <div className="color-ramp" style={{ background: `linear-gradient(to right, ${colorStops.map(stop => stop.color).join(',')})` }} />
      <div className="color-ticks"><span>≤ −1 °C</span><span>0 °C</span><span>+1 °C</span><span>≥ +2 °C</span></div>
    </div>
    <p className="world-caption">El color de todo el océano representa una única <strong>anomalía GLOBAL</strong> respecto a 1951–1980. Los continentes son una referencia visual, no un mapa de temperaturas por país.</p>
    {anomaly === null && <p className="notice" role="status">No hay {mode === 'annual' ? 'un J-D completo' : 'un dato mensual'} para esta selección. El gris indica ausencia de datos, no cero.</p>}
    <small className="world-credit">Contornos: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth · dominio público</a>. Esfera ilustrativa.</small>
  </section>
}
