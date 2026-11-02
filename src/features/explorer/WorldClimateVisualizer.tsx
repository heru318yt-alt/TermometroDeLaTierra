import { useExplorer } from './ExplorerContext'
import { anomalyColor, colorStops, formatAnomaly } from './model'
import { InteractiveGlobe } from './InteractiveGlobe'

/** The sphere deliberately uses a single global anomaly, never a country-level heat map. */
export function WorldClimateVisualizer() {
  const { anomaly, label, mode } = useExplorer()
  const color = anomalyColor(anomaly)
  return <section className="world-visualizer" aria-labelledby="world-title">
    <div className="world-heading">
      <div><p className="eyebrow">UNA SEÑAL GLOBAL · NO UN MAPA REGIONAL</p><h2 id="world-title">La Tierra en perspectiva</h2></div>
      <span className="badge">{mode === 'monthly' ? 'Anomalía mensual' : 'Promedio anual J-D'}</span>
    </div>

    <div className="world-reading-plate">
      <span className="world-reading-date" data-testid="world-date">{label}</span>
      <strong data-testid="world-anomaly">{formatAnomaly(anomaly)}</strong>
      <span className="world-reading-label">Anomalía global · referencia 1951–1980</span>
    </div>

    <div className="world-map-stage">
      <div className="map-coordinate map-coordinate-n">90° N</div>
      <div className="map-coordinate map-coordinate-s">90° S</div>
      <div className="map-coordinate map-coordinate-w">180° O</div>
      <div className="map-coordinate map-coordinate-e">180° E</div>
      <InteractiveGlobe color={color} label={label} anomaly={formatAnomaly(anomaly)} />
    </div>

    <div className="climate-legend">
      <div className="climate-legend-head"><span>LEYENDA DE ANOMALÍA</span><span>°C respecto a 1951–1980</span></div>
      <div className="climate-color-legend" aria-label="Escala cromática fija de menos uno a más dos grados Celsius">
        <div className="color-ramp" style={{ background: `linear-gradient(to right, ${colorStops.map(stop => stop.color).join(',')})` }} />
        <div className="color-ticks"><span>≤ −1 °C</span><span>−0,5</span><span>0</span><span>+0,5</span><span>+1</span><span>≥ +2 °C</span></div>
      </div>
      <div className="legend-meanings">
        <div><span aria-hidden="true">↓</span><strong>Negativa</strong><p>Más fría que la referencia.</p></div>
        <div><span aria-hidden="true">●</span><strong>Cercana a cero</strong><p>Sin una diferencia marcada.</p></div>
        <div><span aria-hidden="true">↑</span><strong>Positiva</strong><p>Más cálida que la referencia.</p></div>
      </div>
    </div>

    <p className="world-caption">El color de todo el océano representa una única <strong>anomalía GLOBAL</strong> respecto a 1951–1980. Los continentes son una referencia visual, no un mapa de temperaturas por país.</p>
    {anomaly === null && <p className="notice" role="status">No hay {mode === 'annual' ? 'un J-D completo' : 'un dato mensual'} para esta selección. El gris indica ausencia de datos, no cero.</p>}
    <small className="world-credit">Contornos: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth · dominio público</a>. Esfera ilustrativa, no cartografía analítica.</small>
  </section>
}
