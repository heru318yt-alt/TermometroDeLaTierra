import landPaths from '../../assets/world-land.json'
import { useExplorer } from '../explorer/ExplorerContext'
import { anomalyColor, colorStops, formatAnomaly } from '../explorer/model'
import { mapEvents, project, type MapEvent } from './places'

/** Último acontecimiento ocurrido hasta el año seleccionado (con o sin sede). */
export function latestEvent(year: number): MapEvent | null {
  return [...mapEvents].reverse().find(e => e.year <= year) ?? null
}

const GRATICULE_LON = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150]
const GRATICULE_LAT = [-60, -30, 0, 30, 60]

/**
 * Mapa del mundo sincronizado con la línea del tiempo. El color del océano es
 * la anomalía GLOBAL de la fecha (no un mapa regional) y los acontecimientos
 * documentados aparecen en su sede a medida que avanza el tiempo.
 */
export function WorldTimeMap() {
  const { anomaly, label, date, select } = useExplorer()
  const ocean = anomalyColor(anomaly)
  const visible = mapEvents.filter(e => e.place && e.year <= date.year)
  const current = latestEvent(date.year)
  const pastCount = mapEvents.filter(e => e.year <= date.year).length

  return <figure className="tl-map" aria-labelledby="tl-map-caption">
    <div className="tl-map-frame">
      <svg viewBox="0 22 720 290" role="group" aria-label={`Mapa del mundo en ${label}. Anomalía global ${formatAnomaly(anomaly)}. ${visible.length} acontecimientos con sede visibles.`}>
        <defs>
          <radialGradient id="tl-ocean" cx="50%" cy="45%" r="75%">
            <stop offset="0" stopColor={ocean} stopOpacity=".78" />
            <stop offset="1" stopColor={ocean} />
          </radialGradient>
          <filter id="tl-land-shadow" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#173f38" floodOpacity=".35" /></filter>
        </defs>
        <rect y="0" width="720" height="360" fill="url(#tl-ocean)" className="tl-ocean" />
        <g className="tl-graticule">
          {GRATICULE_LON.map(lon => <line key={lon} x1={(lon + 180) * 2} x2={(lon + 180) * 2} y1="0" y2="360" />)}
          {GRATICULE_LAT.map(lat => <line key={lat} x1="0" x2="720" y1={(90 - lat) * 2} y2={(90 - lat) * 2} className={lat === 0 ? 'is-equator' : undefined} />)}
        </g>
        <g className="tl-land" filter="url(#tl-land-shadow)">{(landPaths as string[]).map((d, i) => <path key={i} d={d} />)}</g>
        <g className="tl-pins">
          {visible.map(e => {
            const { x, y } = project(e.place!)
            const isCurrent = current?.id === e.id
            return <g key={e.id} className={`tl-pin${isCurrent ? ' is-current' : ''}`} transform={`translate(${x} ${y})`}
              role="button" tabIndex={0} aria-label={`${e.year} · ${e.title} · ${e.place!.name}`}
              onClick={() => select({ year: e.year, month: 1 })}
              onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select({ year: e.year, month: 1 }) } }}>
              {isCurrent && <circle r="14" className="tl-pin-pulse" />}
              <circle r={isCurrent ? 6.5 : 4} className="tl-pin-dot" />
              {isCurrent && <g className="tl-pin-label" transform={`translate(${x > 560 ? -10 : 10} -12)`}>
                <text textAnchor={x > 560 ? 'end' : 'start'}>{e.year} · {e.place!.name}</text>
              </g>}
            </g>
          })}
        </g>
      </svg>

      <div className="tl-map-reading" aria-live="polite">
        <span>{label}</span>
        <strong data-testid="timeline-map-anomaly">{formatAnomaly(anomaly)}</strong>
        <small>Anomalía global · ref. 1951–1980</small>
      </div>
      <div className="tl-map-count"><b>{pastCount}</b> acontecimientos hasta {date.year}</div>
    </div>
    <figcaption id="tl-map-caption" className="tl-map-caption">Océano: anomalía <b>global</b> de la fecha (no la temperatura de cada región). Puntos: sede de cada acontecimiento; toca uno para ir a ese año.</figcaption>
  </figure>
}

/** Escala de color con el cursor en la lectura actual. */
export function MapLegend() {
  const { anomaly } = useExplorer()
  const marker = anomaly === null ? 50 : (Math.max(-1, Math.min(2, anomaly)) + 1) / 3 * 100
  return <div className="tl-map-legend" aria-label="Escala de anomalía de menos uno a más dos grados Celsius">
    <div className="tl-ramp" style={{ background: `linear-gradient(to right, ${colorStops.map(s => s.color).join(',')})` }}>
      <i style={{ left: `${marker}%` }} aria-hidden="true" />
    </div>
    <div className="tl-ramp-ticks"><span>≤ −1 °C</span><span>0</span><span>+1</span><span>≥ +2 °C</span></div>
  </div>
}
