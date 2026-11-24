import { useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { playSfx } from '../audio/sfx'
import { prefersReducedMotion } from '../games/shared/hooks'
import { factors } from './catalog'
import { FactorIllustration } from './FactorIllustration'

export function FactorsPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('factor')
  const index = Math.max(0, factors.findIndex(f => f.id === requested))
  const factor = factors[index]
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  function choose(i: number, focus = false) {
    const next = factors[(i + factors.length) % factors.length]
    setParams({ factor: next.id }, { replace: true })
    if (focus) window.requestAnimationFrame(() => tabs.current[factors.indexOf(next)]?.focus())
  }

  function onKey(event: React.KeyboardEvent, i: number) {
    if (event.key === 'ArrowRight') { event.preventDefault(); playSfx('toggle'); choose(i + 1, true) }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); playSfx('toggle'); choose(i - 1, true) }
    else if (event.key === 'Home') { event.preventDefault(); playSfx('toggle'); choose(0, true) }
    else if (event.key === 'End') { event.preventDefault(); playSfx('toggle'); choose(factors.length - 1, true) }
  }

  const next = factors[(index + 1) % factors.length]

  return <div className="factors-page">
    <PageIntro number="04" title="Factores del cambio climático" eyebrow="CINCO FUERZAS · UN MISMO SISTEMA">
      Detrás de la señal global hay decisiones sobre energía, materiales, movilidad, territorio y alimentación. Elige un factor; ninguno actúa solo.
    </PageIntro>

    <div className="factor-index" role="tablist" aria-label="Los cinco factores">
      {factors.map((f, i) => <button key={f.id} ref={el => { tabs.current[i] = el }} type="button" role="tab" id={`factor-tab-${f.id}`}
        aria-selected={i === index} aria-controls="factor-panel" tabIndex={i === index ? 0 : -1} data-sfx="toggle"
        className={`factor-tab-${f.id}${i === index ? ' is-active' : ''}`} onClick={() => choose(i)} onKeyDown={event => onKey(event, i)}>
        <span>{f.number}</span><strong>{f.title}</strong>
      </button>)}
    </div>

    <section id="factor-panel" role="tabpanel" aria-labelledby={`factor-tab-${factor.id}`} className={`factor-chapter factor-${factor.id}`} key={factor.id}>
      <div className="factor-art-pane">
        <FactorIllustration factor={factor.id} title={factor.title} />
        <div className="factor-art-caption"><span>{factor.number} / 05</span><span>{factor.kicker}</span></div>
        <Link className="factor-play" to={`/minijuegos?world=${factor.id}`}>Probar este factor en su minijuego <span aria-hidden="true">→</span></Link>
      </div>
      <div className="factor-copy-pane">
        <div className="factor-heading">
          <span className="factor-big-number">{factor.number}</span>
          <div><p className="eyebrow">{factor.kicker}</p><h2 id={`factor-title-${factor.id}`}>{factor.title}</h2></div>
        </div>
        <p className="factor-lead">{factor.summary}</p>
        <aside className="factor-datum">
          <span className="factor-datum-label">{factor.data.label}</span>
          <strong>{factor.data.value}</strong>
          <p>{factor.data.note}</p>
          <a href={factor.data.source.url} target="_blank" rel="noreferrer">{factor.data.source.label} ↗</a>
        </aside>
        <div className="factor-notes">
          <article><span>Relevancia climática</span><p>{factor.climate}</p></article>
          <article><span>Contexto histórico</span><p>{factor.history}</p></article>
        </div>
        <div className="factor-levers">
          <span>Palancas de acción</span>
          <ul>{factor.levers.map(lever => <li key={lever}>{lever}</li>)}</ul>
        </div>
        <div className="factor-sources"><span>Fuentes</span>{factor.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
        <button type="button" className="factor-next" onClick={() => { choose(index + 1); window.scrollTo?.({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' }) }}>Siguiente: {next.title} <span aria-hidden="true">→</span></button>
      </div>
    </section>

    <p className="factors-note">Los factores se separan para poder observarlos, pero en la realidad se mezclan. Esta sección no atribuye una variación de temperatura a una actividad concreta: las cifras son de contexto sectorial y la serie de temperatura es de NASA GISTEMP.</p>
  </div>
}
