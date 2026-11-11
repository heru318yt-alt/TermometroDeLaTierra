import { useState } from 'react'
import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { EpochPath } from '../games/EpochPath'
import { historicalPeriods, narrativePhases } from './catalog'
export { periods } from './catalog'

export function HistoryPage() {
  const [periodIndex, setPeriodIndex] = useState(0)
  const [eventIndex, setEventIndex] = useState(0)
  const period = historicalPeriods[periodIndex]
  const event = period.events[eventIndex]
  const totalEvents = historicalPeriods.reduce((total, item) => total + item.events.length, 0)

  function selectPeriod(index: number) {
    setPeriodIndex(index)
    setEventIndex(0)
  }

  return <div className="history-page">
    <PageIntro number="03" title="El clima, a través del tiempo." eyebrow="BITÁCORA · 1970—2025">
      Un recorrido por la ciencia, los acuerdos y las decisiones que han marcado la conversación climática. Cada hito enlaza con la fuente que lo documenta.
    </PageIntro>

    <section className="history-prologue" aria-label="Resumen de la bitácora">
      <div className="history-prologue-stat"><strong>06</strong><span>períodos narrativos</span></div>
      <div className="history-prologue-stat"><strong>{totalEvents}</strong><span>hitos documentados</span></div>
      <div className="history-prologue-stat"><strong>56</strong><span>años de conversación pública</span></div>
      <p>La historia del clima no es una sola línea. Es la historia de cómo la ciencia, la economía y la política aprendieron a mirar el mismo planeta.</p>
    </section>

    <section className="history-journey" aria-labelledby="history-journey-title">
      <div className="history-journey-heading">
        <div><p className="eyebrow">LÍNEA EDITORIAL · 1970—2025</p><h2 id="history-journey-title">Seis décadas de preguntas y acuerdos</h2></div>
        <p>Elige un período y explora sus hitos. Cada fecha enlaza con la fuente que la documenta.</p>
      </div>

      <nav className="history-period-nav" aria-label="Períodos de la historia climática">
        {historicalPeriods.map((item, index) => <button key={item.start} type="button" data-sfx="open" className={periodIndex === index ? 'is-active' : ''} aria-pressed={periodIndex === index} onClick={() => selectPeriod(index)}>
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
          {period.events.map((item, index) => <button key={`${item.year}-${item.title}`} type="button" data-sfx="info" className={`history-event ${eventIndex === index ? 'is-selected' : ''}`} aria-pressed={eventIndex === index} onClick={() => setEventIndex(index)}>
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

    <section className="history-material" aria-labelledby="history-material-title">
      <div className="history-material-head">
        <div><p className="eyebrow">OTRA FORMA DE LEER LAS DÉCADAS</p><h2 id="history-material-title">Los ritmos materiales de la era industrial</h2></div>
        <p>Una organización narrativa preliminar en cinco bloques. No significa que cada actividad apareciera o desapareciera exclusivamente en esa década: son capas que se acumulan.</p>
      </div>
      <ol className="history-phase-list">
        {narrativePhases.map(phase => <li key={phase.start} className={`history-phase phase-${phase.factor}`}>
          <span className="history-phase-years">{phase.label}</span>
          <div><span className="history-phase-focus">{phase.focus}</span><p>{phase.text}</p></div>
          <a href={phase.source} target="_blank" rel="noreferrer">{phase.sourceLabel} ↗</a>
        </li>)}
      </ol>
      <p className="history-material-note">La relación entre una actividad y una variación de temperatura requiere atribución científica. Esta sección propone un contexto, no una prueba causal.</p>
    </section>

    <section className="history-play" aria-labelledby="history-play-title">
      <div className="history-play-head">
        <div><p className="eyebrow">DEL RELATO AL JUEGO</p><h2 id="history-play-title">Cinco etapas, cinco decisiones.</h2></div>
        <p>Cada bloque material de la bitácora abre un mundo interactivo. Recórrelos en orden: completar un reto desbloquea la siguiente etapa.</p>
      </div>
      <EpochPath label="Etapas históricas jugables" />
      <p className="history-play-note">La primera etapa está abierta. El progreso se guarda en este navegador y puedes reiniciarlo desde Minijuegos.</p>
    </section>

    <section className="history-next" aria-label="Continuar el recorrido">
      <p className="eyebrow">CONTINÚA EL RECORRIDO</p>
      <div><h2>Los hitos explican decisiones. Los factores explican presiones.</h2><Link className="button" to="/factores">Explorar los cinco factores <span aria-hidden="true">↗</span></Link></div>
    </section>
  </div>
}
