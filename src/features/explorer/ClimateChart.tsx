import { useMemo, useState } from 'react'
import { useExplorer } from './ExplorerContext'
import { formatAnomaly, formatDate, fromMonthString, toIndex } from './model'

const width = 860, height = 310, left = 54, right = 22, top = 25, bottom = 42
export default function ClimateChart() {
  const { series, mode, date, select, summary, label, anomaly, range } = useExplorer()
  const [hover, setHover] = useState<{ mode: string; index: number } | null>(null)
  const selectedIndex = mode === 'annual' ? series.findIndex(point => point.date.year === date.year) : series.findIndex(point => toIndex(point.date) === toIndex(date))
  const safeSelectedIndex = Math.max(0, selectedIndex)
  const hoverIndex = hover?.mode === mode ? hover.index : null
  const activeIndex = hoverIndex ?? safeSelectedIndex
  const active = series[activeIndex]
  const thresholds = summary.thresholds
  const geometry = useMemo(() => {
    const values = series.flatMap(point => point.anomaly === null ? [] : [point.anomaly])
    const min = Math.floor(Math.min(-1, ...values) * 2) / 2
    const max = Math.ceil(Math.max(2, ...values, thresholds.level20 ?? 0) * 2) / 2
    const x = (index: number) => left + index / Math.max(1, series.length - 1) * (width - left - right)
    const y = (value: number) => top + (max - value) / (max - min) * (height - top - bottom)
    let connected = false
    const path = series.map((point, index) => {
      if (point.anomaly === null) { connected = false; return '' }
      const instruction = `${connected ? 'L' : 'M'}${x(index).toFixed(2)},${y(point.anomaly).toFixed(2)}`
      connected = true
      return instruction
    }).join(' ')
    return { x, y, min, max, path }
  }, [series, thresholds.level20])
  const { x, y, min, max, path } = geometry
  const rangeStart = fromMonthString(range.start), rangeEnd = fromMonthString(range.end)
  const firstInRange = series.findIndex(point => mode === 'annual' ? point.date.year >= rangeStart.year : toIndex(point.date) >= toIndex(rangeStart))
  const lastInRange = series.reduce((lastIndex, point, index) => (mode === 'annual' ? point.date.year <= rangeEnd.year : toIndex(point.date) <= toIndex(rangeEnd)) ? index : lastIndex, -1)
  function pointerIndex(clientX: number, element: SVGSVGElement) {
    if (series.length === 0) return 0
    const bounds = element.getBoundingClientRect()
    if (bounds.width <= 0) return safeSelectedIndex
    const localX = ((clientX - bounds.left) / bounds.width) * width
    return Math.max(0, Math.min(series.length - 1, Math.round(((localX - left) / (width - left - right)) * (series.length - 1))))
  }
  return <section className="panel climate-chart" aria-labelledby="chart-title">
    <div className="panel-heading"><h2 id="chart-title" className="visually-hidden">La evolución en una línea</h2><span className="badge">{mode === 'monthly' ? 'Serie mensual' : 'Serie anual J-D'}</span></div>
    <p className="muted">Anomalía (°C), referencia 1951–1980. Toca la curva para seleccionar una fecha; con foco en el gráfico, usa ← y →, Inicio o Fin. En pantallas pequeñas puedes desplazar el gráfico horizontalmente.</p>
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${width} ${height}`} role="group" tabIndex={0} aria-label={`Gráfico climático ${mode === 'monthly' ? 'mensual' : 'anual'}. Selección: ${label}, ${formatAnomaly(anomaly)}`} aria-describedby="chart-explanation"
        onPointerMove={event => setHover({ mode, index: pointerIndex(event.clientX, event.currentTarget) })} onPointerLeave={() => setHover(null)}
        onClick={event => { const idx = pointerIndex(event.clientX, event.currentTarget); if (series[idx]) select(series[idx].date); setHover(null) }}
        onKeyDown={event => {
          if (series.length === 0) return
          let index = safeSelectedIndex
          if (event.key === 'ArrowLeft') index--
          else if (event.key === 'ArrowRight') index++
          else if (event.key === 'Home') index = 0
          else if (event.key === 'End') index = series.length - 1
          else return
          event.preventDefault(); setHover(null); select(series[Math.max(0, Math.min(series.length - 1, index))].date)
        }}>
        <title>Evolución de la anomalía global NASA GISTEMP v4</title>
        {firstInRange >= 0 && lastInRange >= firstInRange && <rect x={x(firstInRange)} y={top} width={Math.max(1, x(lastInRange) - x(firstInRange))} height={height - top - bottom} fill="var(--surface-tint)" opacity=".45" />}
        {Array.from({ length: Math.round((max - min) * 2) + 1 }, (_, i) => min + i * .5).map(value => <g key={value}><line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke={value === 0 ? 'var(--muted)' : 'var(--line)'} strokeDasharray={value === 0 ? '5 3' : undefined} /><text x={left - 9} y={y(value) + 4} textAnchor="end">{value.toLocaleString('es-CO')}</text></g>)}
        {[{ value: thresholds.level15, text: '≈ +1,5 °C preindustrial', color: 'var(--amber)' }, { value: thresholds.level20, text: '≈ +2,0 °C preindustrial', color: 'var(--rust)' }].map(line => line.value !== null && <g key={line.text}><line x1={left} x2={width - right} y1={y(line.value)} y2={y(line.value)} stroke={line.color} strokeDasharray="7 5" /><text x={left + 7} y={y(line.value) - 5} style={{ fill: line.color }}>{line.text}</text></g>)}
        {[0, .25, .5, .75, 1].map(fraction => { const index = Math.round(fraction * (series.length - 1)); return <text key={fraction} x={x(index)} y={height - 16} textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'}>{series[index].date.year}</text> })}
        <path d={path} fill="none" stroke="var(--forest)" strokeWidth={mode === 'monthly' ? 1.4 : 2.1} strokeLinejoin="round" />
        {series.length > 0 && <>
          <line data-testid="chart-marker" data-date={label} x1={x(safeSelectedIndex)} x2={x(safeSelectedIndex)} y1={top} y2={height - bottom} stroke="var(--ink-soft)" strokeDasharray="3 3" />
          {anomaly !== null && <circle cx={x(safeSelectedIndex)} cy={y(anomaly)} r="5" fill="var(--forest)" stroke="var(--paper-3)" strokeWidth="2" />}
        </>}
        {active && hoverIndex !== null && <g pointerEvents="none"><line x1={x(activeIndex)} x2={x(activeIndex)} y1={top} y2={height - bottom} stroke="var(--muted)" />{active.anomaly !== null && <circle cx={x(activeIndex)} cy={y(active.anomaly)} r="4" fill="var(--amber)" />}<rect x={Math.max(left, Math.min(width - 252, x(activeIndex) - 115))} y={height - 95} width="230" height="44" rx="5" fill="var(--surface-dark)" stroke="var(--line-dark)" strokeWidth="1" /><text x={Math.max(left, Math.min(width - 252, x(activeIndex) - 115)) + 12} y={height - 77} className="chart-tooltip-text">{formatDate(active.date, mode)}</text><text x={Math.max(left, Math.min(width - 252, x(activeIndex) - 115)) + 12} y={height - 60} className="chart-tooltip-text">{formatAnomaly(active.anomaly)}</text></g>}
      </svg>
    </div>
    <p className="chart-readout" data-testid="chart-readout">{active ? `${formatDate(active.date, mode)} · ${formatAnomaly(active.anomaly)}` : 'Sin dato disponible'}</p>
    <p id="chart-explanation" className="muted">El fondo sombreado señala el intervalo elegido para comparar. Las líneas de París son aproximaciones didácticas calculadas con los J-D de 1880–1900, no toda la referencia 1850–1900. Superarlas durante un mes o un año no demuestra que se supere el objetivo climático a largo plazo. Los huecos de la curva indican datos ausentes.</p>
  </section>
}
