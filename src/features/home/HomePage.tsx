import { Link } from 'react-router'
import { Globe } from '../../components/Globe'
import { useClimateData } from '../climate/useClimateData'
import { getAnnualAnomaly } from '../climate/math'
import { formatAnomaly } from '../explorer/model'
import { WorldAtlas } from './WorldAtlas'

const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const ic = (d: string) => <svg viewBox="0 0 24 24"><path d={d} /></svg>
const ROUTE_ICON: Record<string, React.ReactNode> = {
  '01': ic('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-9 9h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'),
  '02': ic('M3 17l5-6 4 3 6-8 3 3M3 21h18'),
  '03': ic('M4 5h11a3 3 0 0 1 3 3v12H7a3 3 0 0 1-3-3V5Zm14 3h2v9a3 3 0 0 1-3 3M8 9h6M8 13h6'),
  '04': ic('M12 3v4M5 7l3 3M19 7l-3 3M4 15h4l2-4 4 8 2-4h4'),
  '05': ic('M6 9h12a3 3 0 0 1 3 3v3a3 3 0 0 1-5 2l-1-1H9l-1 1a3 3 0 0 1-5-2v-3a3 3 0 0 1 3-3Zm2 2v4M6 13h4M15 12h.01M17 14h.01'),
  '06': ic('M6 3h9l4 4v14H6V3Zm9 0v4h4M9 12h7M9 16h7'),
}
const chapters = [
  { number: '01', to: '/explorador', title: 'Explorador climático', copy: 'Explora el globo en una fecha exacta, escucha la anomalía y compara dos períodos.', meta: 'Mapa · indicador · comparación' },
  { number: '02', to: '/linea-del-tiempo', title: 'Línea del tiempo', copy: 'Reproductor animado año por año: observa cómo cambian el mapa y la serie NASA mientras aparecen los hitos.', meta: 'Reproductor · mapa · serie' },
  { number: '03', to: '/historia', title: 'Historia del clima', copy: 'Bitácora documental por décadas (1970–2025): lectura a fondo de acuerdos, ciencia y sus fuentes.', meta: 'Bitácora · décadas · fuentes' },
  { number: '04', to: '/factores', title: 'Factores del cambio climático', copy: 'Energía, industria, movilidad, bosques y alimentación.', meta: 'Cinco fuerzas · datos' },
  { number: '05', to: '/minijuegos', title: 'Minijuegos', copy: 'Cinco mundos para decidir, probar y volver a intentar.', meta: 'Navegador · cinco misiones' },
  { number: '06', to: '/fuentes', title: 'Fuentes y metodología', copy: 'De dónde viene cada dato y qué no puede afirmarse.', meta: 'NASA · IPCC · OWID' },
]

function SignalSparkline() {
  const { data, summary } = useClimateData()
  const values = data.years
    .filter(row => row.year >= 1926)
    .map(row => ({ year: row.year, value: getAnnualAnomaly(data.years, row.year) }))
    .filter((point): point is { year: number; value: number } => point.value !== null)
  if (!values.length) return null
  const width = 520, height = 112, padX = 8, padY = 12
  const low = Math.min(-.6, ...values.map(point => point.value))
  const high = Math.max(1.4, ...values.map(point => point.value), summary.thresholds.level15 ?? 0)
  const x = (index: number) => padX + index / Math.max(1, values.length - 1) * (width - padX * 2)
  const y = (value: number) => padY + (high - value) / (high - low) * (height - padY * 2)
  const path = values.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ')
  const last = values[values.length - 1]
  return <svg className="signal-sparkline" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="spark-title spark-desc">
    <title id="spark-title">Evolución de la anomalía anual global desde 1926</title>
    <desc id="spark-desc">Serie anual J-D de NASA GISTEMP respecto a 1951–1980. El último valor completo es {last.year}: {formatAnomaly(last.value)}.</desc>
    <defs><linearGradient id="spark-fill" x2="0" y2="1"><stop stopColor="#e5a958" stopOpacity=".45" /><stop offset="1" stopColor="#e5a958" stopOpacity="0" /></linearGradient></defs>
    <line x1={padX} x2={width - padX} y1={y(0)} y2={y(0)} stroke="#c7d6bc55" strokeDasharray="4 5" />
    {summary.thresholds.level15 !== null && <line x1={padX} x2={width - padX} y1={y(summary.thresholds.level15)} y2={y(summary.thresholds.level15)} stroke="#f27c66" strokeDasharray="7 5" opacity=".85" />}
    <path d={`${path} L${x(values.length - 1)},${height - padY} L${x(0)},${height - padY} Z`} fill="url(#spark-fill)" />
    <path d={path} fill="none" stroke="#f3cf86" strokeWidth="2.2" strokeLinejoin="round" />
    <circle cx={x(values.length - 1)} cy={y(last.value)} r="5" fill="#e59856" stroke="#102f2a" strokeWidth="2" />
    <text x={padX} y={height - 1} className="spark-year">1926</text>
    <text x={width - padX} y={height - 1} textAnchor="end" className="spark-year">{last.year}</text>
  </svg>
}

export function HomePage() {
  const { summary } = useClimateData()
  const latest = summary.latest
  const latestAnnual = summary.latestAnnual
  const latestLabel = latest ? monthFormat.format(new Date(Date.UTC(latest.year, latest.month - 1))) : 'Sin dato disponible'

  return <div className="home-page">
    <section className="home-hero">
      <div className="hero-topline">
        <span><i className="small-dot" /> OBSERVATORIO CLIMÁTICO · NASA GISTEMP v4</span>
        <span>REFERENCIA 1951–1980</span>
        <span>1880 — {latest ? latest.year : '—'}</span>
      </div>

      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">UN PLANETA · UNA HISTORIA COMPARTIDA</p>
          <h1>El clima cambia.<br /><em>Comprenderlo</em><br />es el primer paso.</h1>
          <p className="hero-intro">Explora el calentamiento global como una historia de datos, decisiones y consecuencias. Un observatorio para mirar el planeta y entender qué hay detrás de cada décima de grado.</p>
          <div className="hero-actions">
            <Link className="button" to="/explorador">Comenzar la exploración <span aria-hidden="true">↗</span></Link>
            <Link className="text-link" to="/fuentes">De dónde salen los datos →</Link>
          </div>
          <div className="hero-note"><span aria-hidden="true">↳</span><p>Una anomalía no es una temperatura absoluta. Es la diferencia respecto a un período de referencia.</p></div>
        </div>

        <div className="hero-instrument">
          <div className="instrument-head"><span>LECTURA MÁS RECIENTE</span><span className="instrument-status"><i /> EN VIVO</span></div>
          <div className="instrument-globe"><Globe /><span className="globe-coord">90°N · 180°E</span><span className="globe-coord globe-coord-b">0° · 0°</span></div>
          <div className="instrument-reading">
            <span className="instrument-date">{latestLabel}</span>
            <strong data-testid="home-latest-anomaly">{latest ? formatAnomaly(latest.anomaly) : 'Sin dato'}</strong>
            <span className="instrument-reference">Anomalía global · referencia 1951–1980</span>
          </div>
          <SignalSparkline />
          <div className="instrument-foot">
            <span>{latestAnnual ? `Último año completo · ${latestAnnual.year}: ${formatAnomaly(latestAnnual.anomaly)}` : 'Año completo: sin dato'}</span>
            <Link to="/explorador">Abrir la serie completa ↗</Link>
          </div>
        </div>
      </div>

      <div className="hero-baseline">
        <span>NIVEL 1,5 °C</span>
        <strong>{summary.thresholds.level15 !== null ? `${numberFormat.format(summary.thresholds.level15)} °C` : '—'}</strong>
        <span>en la escala NASA, aproximado con 1880–1900</span>
        <i className="baseline-rule" aria-hidden="true" />
        <span className="hero-scroll">Sigue el recorrido ↓</span>
      </div>
    </section>

    <section className="home-routes" aria-labelledby="home-routes-title">
      <div className="home-routes-head">
        <h2 id="home-routes-title">¿Por dónde empezar?</h2>
        <p>Seis entradas al mismo observatorio. Todas comparten la serie de NASA y puedes saltar entre ellas cuando quieras.</p>
      </div>
      <div className="home-route-grid">
        {chapters.map(chapter => <Link key={chapter.to} to={chapter.to} className={`home-route home-route-${chapter.number}`}>
          <span className="home-route-icon" aria-hidden="true">{ROUTE_ICON[chapter.number]}</span>
          <span className="home-route-number">{chapter.number}</span>
          <strong>{chapter.title}</strong>
          <span className="home-route-copy">{chapter.copy}</span>
          <span className="home-route-arrow" aria-hidden="true">→</span>
        </Link>)}
      </div>
    </section>

    <section className="home-atlas" aria-labelledby="home-atlas-title">
      <div className="home-atlas-heading">
        <p className="eyebrow">CUADERNO DE CAMPO · 05 LUGARES</p>
        <h2 id="home-atlas-title">Un planeta. Cinco historias por explorar.</h2>
        <p>Abre una región para entrar a su mundo y descubrir qué decisiones lo transforman. El mapa es conceptual: no es una capa de datos climáticos.</p>
      </div>
      <WorldAtlas />
    </section>
  </div>
}
