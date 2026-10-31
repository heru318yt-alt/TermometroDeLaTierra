import { useMemo } from 'react'
import { useExplorer } from './ExplorerContext'
import { analyzePeriod, FIRST_YEAR, formatAnomaly, fromMonthString, toIndex } from './model'

export function ClimatePeriodComparison() {
  const { data, range, setRange, mode, minIndex, maxIndex } = useExplorer()
  const result = useMemo(() => {
    const start = fromMonthString(range.start), end = fromMonthString(range.end)
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(range.start) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(range.end) || toIndex(start) < minIndex || toIndex(end) > maxIndex) {
      return { error: `Selecciona fechas entre ${FIRST_YEAR}-01 y ${data.lastDate}.` }
    }
    return analyzePeriod(data.years, { start, end }, mode)
  }, [data, range, mode, minIndex, maxIndex])
  return <section className="panel period-comparison" aria-labelledby="comparison-title">
    <p className="eyebrow">MÁS ALLÁ DE UN SOLO MOMENTO</p><h2 id="comparison-title">Compara períodos</h2>
    <div className="comparison-inputs"><label>Fecha inicial<input type="month" min={`${FIRST_YEAR}-01`} max={data.lastDate} value={range.start} onChange={event => setRange({ ...range, start: event.target.value })} /></label><label>Fecha final<input type="month" min={`${FIRST_YEAR}-01`} max={data.lastDate} value={range.end} onChange={event => setRange({ ...range, end: event.target.value })} /></label></div>
    <p className="muted">{mode === 'monthly' ? 'El intervalo incluye ambos meses extremos; cada mes tiene el mismo peso.' : 'Vista anual: se consideran los J-D de todos los años indicados, completos de enero a diciembre, independientemente del mes elegido. Un J-D ausente impide la media del intervalo.'}</p>
    <div aria-live="polite">
      {result.interval && <div className="comparison-stat"><span>Promedio del intervalo</span><strong>{formatAnomaly(result.interval.mean)}</strong><span>{result.interval.count} de {result.interval.expected} {mode === 'monthly' ? 'meses' : 'años J-D'} disponibles</span>{!result.interval.complete && <p className="muted">Intervalo incompleto: no se sustituye ningún valor ausente ni se presenta una media parcial.</p>}</div>}
      {result.error ? <p className="notice">{result.error}</p> : <div className="comparison-windows"><div><span>{result.firstLabel} · 5 años</span><strong>{formatAnomaly(result.first!.mean)}</strong></div><span aria-hidden="true">→</span><div><span>{result.lastLabel} · 5 años</span><strong>{formatAnomaly(result.last!.mean)}</strong></div><div className="comparison-difference"><span>Diferencia entre ventanas</span><strong>{formatAnomaly(result.difference!)}</strong></div></div>}
    </div>
    <p className="muted">Ventanas: medias de cinco J-D oficiales completos en cada extremo, sin solapamiento. Se excluyen años incompletos de los extremos. La diferencia es la última media menos la primera; no es una tasa de cambio ni una atribución causal.</p>
  </section>
}
