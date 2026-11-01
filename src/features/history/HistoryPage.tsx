import { useState } from 'react'
import { PageIntro } from '../../components/PageIntro'
import { historicalPeriods } from './catalog'
export { periods } from './catalog'

export function HistoryPage() {
  const [periodIndex, setPeriodIndex] = useState(0)
  const [eventIndex, setEventIndex] = useState(0)
  const period = historicalPeriods[periodIndex]
  const event = period.events[eventIndex]

  function selectPeriod(index: number) {
    setPeriodIndex(index)
    setEventIndex(0)
  }

  return <div className="page-width inner-page history-page">
    <PageIntro number="02" title="El clima, a través del tiempo.">Un recorrido por la ciencia, los acuerdos y las decisiones que han marcado la conversación climática.</PageIntro>

    <section className="history-journey" aria-labelledby="history-journey-title">
      <div className="history-journey-heading">
        <div><p className="eyebrow">BITÁCORA HISTÓRICA · 1970—2025</p><h2 id="history-journey-title">Seis décadas de preguntas y acuerdos</h2></div>
        <p>Elige un período y explora sus hitos. Cada fecha enlaza con la fuente que la documenta.</p>
      </div>

      <nav className="history-period-nav" aria-label="Períodos de la historia climática">
        {historicalPeriods.map((item, index) => <button key={item.start} type="button" className={periodIndex === index ? 'is-active' : ''} aria-pressed={periodIndex === index} onClick={() => selectPeriod(index)}>
          <span>{item.label}</span><small>{item.events.length} {item.events.length === 1 ? 'hito' : 'hitos'}</small>
        </button>)}
      </nav>

      <div className="history-spread" key={period.start}>
        <aside className="history-period-story">
          <span className="history-decade-mark">{period.start.toString().slice(2, 4)}</span>
          <p className="eyebrow">{period.label}</p>
          <h3>{period.name}</h3>
          <p>{period.description}</p>
          <div className="history-question"><span aria-hidden="true">↗</span><p>Observa la fecha y pregúntate: ¿qué cambió en la forma de entender o abordar el clima?</p></div>
        </aside>

        <div className="history-events" aria-label={`Hitos del período ${period.label}`}>
          {period.events.map((item, index) => <button key={`${item.year}-${item.title}`} type="button" className={`history-event ${eventIndex === index ? 'is-selected' : ''}`} aria-pressed={eventIndex === index} onClick={() => setEventIndex(index)}>
            <span className="history-event-year">{item.year}</span><span className="history-event-dot" aria-hidden="true" /><span className="history-event-title">{item.title}</span>
          </button>)}
        </div>

        <article className="history-event-detail" aria-live="polite">
          <p className="eyebrow">HITO SELECCIONADO · {event.year}</p>
          <h3>{event.title}</h3>
          <p>{event.detail}</p>
          <a href={event.source} target="_blank" rel="noreferrer">{event.sourceLabel}<span aria-hidden="true"> ↗</span></a>
        </article>
      </div>
      <p className="history-method-note">Esta línea reúne hitos institucionales documentados; no representa por sí sola una serie de temperatura ni explica las causas de un dato particular.</p>
    </section>
  </div>
}
