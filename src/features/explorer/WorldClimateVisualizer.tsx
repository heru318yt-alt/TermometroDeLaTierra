import { useId } from 'react'
import type { ReactNode } from 'react'
import landPaths from '../../assets/world-land.json'
import { useExplorer } from './ExplorerContext'
import { anomalyColor, colorStops, formatAnomaly } from './model'

// Same envelope as the stored land projection, with 2 SVG units of breathing room.
// This preserves the original continent geometry, including polar coastlines.
const latitudes = Array.from({ length: 181 }, (_, index) => 90 - index)
const earthOutline = [...latitudes.map(latitude => [360 + 347 * Math.sqrt(1 - (latitude / 110) ** 2), 190 - latitude / 90 * 167]),
  ...[...latitudes].reverse().map(latitude => [360 - 347 * Math.sqrt(1 - (latitude / 110) ** 2), 190 - latitude / 90 * 167])]
  .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + 'Z'

/** Overlay slot reserved for a separately sourced, documented spatial layer. */
export function WorldClimateVisualizer({ spatialLayer }: { spatialLayer?: ReactNode }) {
  const { anomaly, label, mode } = useExplorer()
  const color = anomalyColor(anomaly)
  const clipId = useId()
  return <section className="world-visualizer" aria-labelledby="world-title">
    <div className="world-heading"><div><p className="eyebrow">UNA SEÑAL GLOBAL</p><h2 id="world-title">La Tierra en perspectiva</h2></div><span className="badge">{mode === 'monthly' ? 'Anomalía mensual' : 'Promedio anual J-D'}</span></div>
    <div className="world-reading"><span data-testid="world-date">{label}</span><strong data-testid="world-anomaly">{formatAnomaly(anomaly)}</strong></div>
    <svg className="world-svg" viewBox="0 0 720 380" role="img" aria-label={`Representación mundial, ${label}: ${formatAnomaly(anomaly)}. Color uniforme del indicador global, sin valores regionales.`}>
      <defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse"><path d={earthOutline} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
      <path className="world-ocean" d={earthOutline} fill={color} />
      <g stroke="#243f37" strokeOpacity=".14" fill="none"><path d="M15 190H705M47 100H673M47 280H673M360 20V360" /><ellipse cx="360" cy="190" rx="170" ry="170" /><ellipse cx="360" cy="190" rx="290" ry="170" /></g>
      <g className="world-land" fill="#173f35" fillOpacity=".78" stroke="#f5f6eb" strokeOpacity=".45" strokeWidth=".45" fillRule="evenodd">{landPaths.map((path, index) => <path key={index} d={path} />)}</g>
      {spatialLayer}
      </g>
      <path d={earthOutline} fill="none" stroke="#506c5c" strokeOpacity=".3" strokeWidth="1" />
    </svg>
    <div className="climate-color-legend" aria-label="Escala cromática fija de menos uno a más dos grados Celsius">
      <div className="color-ramp" style={{ background: `linear-gradient(to right, ${colorStops.map(stop => stop.color).join(',')})` }} />
      <div className="color-ticks"><span>≤ −1 °C</span><span>0 °C</span><span>+1 °C</span><span>≥ +2 °C</span></div>
    </div>
    <p className="world-caption">El color del planeta representa una única <strong>anomalía GLOBAL</strong> respecto a 1951–1980. Los continentes son una referencia visual, no un mapa de temperaturas por país.</p>
    {anomaly === null && <p className="notice" role="status">No hay {mode === 'annual' ? 'un J-D completo' : 'un dato mensual'} para esta selección. El gris indica ausencia de datos, no cero.</p>}
    <small className="world-credit">Contornos: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth · dominio público</a>. Proyección ilustrativa.</small>
  </section>
}

