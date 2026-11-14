import { Link } from 'react-router'
import { Globe } from '../../components/Globe'
import { useClimateData } from '../climate/useClimateData'
import { getAnnualAnomaly } from '../climate/math'
import { formatAnomaly } from '../explorer/model'
import { WorldAtlas } from './WorldAtlas'

const monthFormat = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 })
const chapters = [
  { number: '01', to: '/explorador', title: 'Explorador climático', copy: 'La señal global, el planeta y la lectura de una fecha.' },
  { number: '02', to: '/linea-del-tiempo', title: 'Línea del tiempo', copy: 'La serie histórica y el mapa, sincronizados en una fecha.' },
  { number: '03', to: '/historia', title: 'Historia del clima', copy: 'Seis décadas de ciencia, acuerdos y decisiones.' },
  { number: '04', to: '/factores', title: 'Factores del cambio climático', copy: 'Energía, industria, movilidad, bosques y alimentación.' },
  { number: '05', to: '/minijuegos', title: 'Minijuegos', copy: 'Cinco misiones para decidir, probar y volver a intentar.' },
  { number: '06', to: '/fuentes', title: 'Fuentes y metodología', copy: 'De dónde viene cada dato y qué no puede afirmarse.' },
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
    <defs><linearGradient id="spark-fill" x2="0" y2="1"><stop stopColor="#d89a62" stopOpacity=".5" /><stop offset="1" stopColor="#d89a62" stopOpacity="0" /></linearGradient></defs>
    <line x1={padX} x2={width - padX} y1={y(0)} y2={y(0)} stroke="#d8cbb5" strokeDasharray="4 5" />
    {summary.thresholds.level15 !== null && <line x1={padX} x2={width - padX} y1={y(summary.thresholds.level15)} y2={y(summary.thresholds.level15)} stroke="#a75238" strokeDasharray="7 5" opacity=".75" />}
    <path d={`${path} L${x(values.length - 1)},${height - padY} L${x(0)},${height - padY} Z`} fill="url(#spark-fill)" />
    <path d={path} fill="none" stroke="#173f38" strokeWidth="2" />
    <circle cx={x(values.length - 1)} cy={y(last.value)} r="5" fill="#b75e3e" stroke="#f3e9d6" strokeWidth="2" />
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

    <section className="chapter-index" aria-labelledby="chapter-index-title">
      <div className="chapter-index-head">
        <p className="eyebrow">MAPA DEL RECORRIDO · SEIS CAPÍTULOS</p>
        <h2 id="chapter-index-title">Un observatorio no se lee de arriba abajo.</h2>
        <p>Se recorre. Elige una entrada y sigue la historia desde donde quieras empezar.</p>
      </div>
      <div className="chapter-list">
        {chapters.map(chapter => <Link key={chapter.to} to={chapter.to} className="chapter-row">
          <span className="chapter-row-number">{chapter.number}</span>
          <span className="chapter-row-title">{chapter.title}</span>
          <span className="chapter-row-copy">{chapter.copy}</span>
          <span className="chapter-row-arrow" aria-hidden="true">↗</span>
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
