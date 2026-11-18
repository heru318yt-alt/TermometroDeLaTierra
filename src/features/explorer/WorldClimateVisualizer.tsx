import { useState } from 'react'
import { historicalPeriods } from '../history/catalog'
import { useExplorer } from './ExplorerContext'
import { anomalyColor, colorStops, formatAnomaly } from './model'
import { InteractiveGlobe } from './InteractiveGlobe'

/** The sphere deliberately uses a single global anomaly, never a country-level heat map. */
export function WorldClimateVisualizer() {
  const { anomaly, label, mode, data, date } = useExplorer()
  const period = historicalPeriods.find(item => date.year >= item.start && date.year <= item.end)
  const [inspected, setInspected] = useState(false)
  const color = anomalyColor(anomaly)
  const markerPosition = anomaly === null ? 50 : (Math.max(-1, Math.min(2, anomaly)) + 1) / 3 * 100

  return <section className="world-visualizer" aria-labelledby="world-title">
    <div className="world-topline">
      <div className="world-heading">
        <div><p className="eyebrow">UNA SEÑAL GLOBAL · NO UN MAPA REGIONAL</p><h2 id="world-title">La Tierra en perspectiva</h2></div>
        <span className="badge">{mode === 'monthly' ? 'Anomalía mensual' : 'Promedio anual J-D'}</span>
      </div>

      <div className="world-reading-plate">
        <span className="world-reading-date" data-testid="world-date">{label}</span>
        <strong data-testid="world-anomaly">{formatAnomaly(anomaly)}</strong>
        <span className="world-reading-label">Anomalía global · 1951–1980</span>
        <span className="world-reading-unit">°C · NASA GISTEMP v4</span>
      </div>
    </div>

    <div className="world-map-stage">
      <div className="world-map-year" data-testid="world-period">
        <p className="eyebrow">AÑO EN EL MAPA</p>
        <strong>{date.year}</strong>
        <span>{period ? `${period.label} · ${period.name}` : 'Fuera de los períodos narrativos'}</span>
      </div>
      <div className="map-coordinate map-coordinate-n">90° N</div>
      <div className="map-coordinate map-coordinate-s">90° S</div>
      <div className="map-coordinate map-coordinate-w">180° O</div>
      <div className="map-coordinate map-coordinate-e">180° E</div>
      <InteractiveGlobe color={color} label={label} anomaly={formatAnomaly(anomaly)} onInteract={() => setInspected(true)} />
    </div>

    {inspected && <p className="globe-inspected" role="status">
      <strong>{label}:</strong> {formatAnomaly(anomaly)} respecto a 1951–1980. El color del océano representa una única anomalía global, no la temperatura de cada país.
    </p>}

    <div className="climate-legend">
      <div className="climate-legend-head"><span>LEYENDA DE ANOMALÍA</span><span>°C respecto a 1951–1980</span></div>
      <div className="climate-color-legend" aria-label="Escala cromática fija de menos uno a más dos grados Celsius">
        <div className="color-scale">
          <div className="color-ramp" style={{ background: `linear-gradient(to right, ${colorStops.map(stop => stop.color).join(',')})` }} />
          <span className="color-cursor" style={{ left: `${markerPosition}%` }} aria-hidden="true"><i /></span>
        </div>
        <div className="color-ticks"><span>≤ −1 °C</span><span>−0,5</span><span>0</span><span>+0,5</span><span>+1</span><span>≥ +2 °C</span></div>
        <p className="legend-current">Lectura actual: <strong>{anomaly === null ? 'sin dato' : formatAnomaly(anomaly)}</strong></p>
      </div>
      <div className="legend-meanings">
        <div><span aria-hidden="true">↓</span><strong>Negativa</strong><p>Más fría que la referencia 1951–1980.</p></div>
        <div><span aria-hidden="true">●</span><strong>Cercana a cero</strong><p>Sin una diferencia marcada frente a la referencia.</p></div>
        <div><span aria-hidden="true">↑</span><strong>Positiva</strong><p>Más cálida que la referencia 1951–1980.</p></div>
      </div>
      <p className="legend-reading">La escala es fija de −1 °C a +2 °C. Los valores extremos se saturan en los colores de los bordes; el marcador muestra la lectura exacta.</p>
    </div>

    <details className="world-info" data-sfx="info">
      <summary>¿Qué representa esta esfera?</summary>
      <dl>
        <div><dt>Qué representa</dt><dd>La anomalía media global de la temperatura de la superficie, calculada por NASA GISTEMP.</dd></div>
        <div><dt>Año o período</dt><dd>{label}</dd></div>
        <div><dt>Valor</dt><dd>{formatAnomaly(anomaly)}</dd></div>
        <div><dt>Unidad</dt><dd>Grados Celsius de anomalía (°C), no temperatura absoluta.</dd></div>
        <div><dt>Referencia</dt><dd>Promedio del período 1951–1980.</dd></div>
        <div><dt>Explicación breve</dt><dd>El color del océano resume una sola señal planetaria. Los continentes son una referencia geográfica: el mapa no colorea países ni compara su temperatura.</dd></div>
      </dl>
      <small>Última fecha de la serie: {data.lastDate}. Fuente: NASA GISTEMP v4.</small>
    </details>

    <p className="world-caption">El color de todo el océano representa una única <strong>anomalía GLOBAL</strong> respecto a 1951–1980. Los continentes son una referencia visual, no un mapa de temperaturas por país.</p>
    {anomaly === null && <p className="notice" role="status">No hay {mode === 'annual' ? 'un J-D completo' : 'un dato mensual'} para esta selección. El gris indica ausencia de datos, no cero.</p>}
    <small className="world-credit">Contornos: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth · dominio público</a>. Esfera ilustrativa, no cartografía analítica.</small>
  </section>
}
