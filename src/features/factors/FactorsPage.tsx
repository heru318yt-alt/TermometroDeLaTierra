import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { factors } from './catalog'
import { FactorIllustration } from './FactorIllustration'

export function FactorsPage() {
  return <div className="factors-page">
    <PageIntro number="04" title="Factores del cambio climático" eyebrow="CINCO FUERZAS · UN MISMO SISTEMA">
      La temperatura global es una señal. Detrás hay decisiones sobre energía, materiales, movilidad, territorio y alimentación. Ninguna de estas fuerzas actúa sola.
    </PageIntro>

    <nav className="factor-index" aria-label="Los cinco factores">
      {factors.map(factor => <a key={factor.id} href={`#factor-${factor.id}`} data-sfx="open"><span>{factor.number}</span><strong>{factor.title}</strong><i aria-hidden="true">↓</i></a>)}
    </nav>

    <div className="factor-chapters">
      {factors.map((factor, index) => <section key={factor.id} id={`factor-${factor.id}`} className={`factor-chapter factor-${factor.id}${index % 2 ? ' is-reversed' : ''}`} aria-labelledby={`factor-title-${factor.id}`}>
        <div className="factor-art-pane">
          <FactorIllustration factor={factor.id} title={factor.title} />
          <div className="factor-art-caption"><span>{factor.number} / 05</span><span>{factor.kicker}</span></div>
        </div>
        <div className="factor-copy-pane">
          <div className="factor-heading">
            <span className="factor-big-number">{factor.number}</span>
            <div><p className="eyebrow">{factor.kicker}</p><h2 id={`factor-title-${factor.id}`}>{factor.title}</h2></div>
          </div>
          <p className="factor-lead">{factor.summary}</p>
          <div className="factor-notes">
            <article><span>Relevancia climática</span><p>{factor.climate}</p></article>
            <article><span>Contexto histórico</span><p>{factor.history}</p></article>
          </div>
          <aside className="factor-datum">
            <span className="factor-datum-label">{factor.data.label}</span>
            <strong>{factor.data.value}</strong>
            <p>{factor.data.note}</p>
            <a href={factor.data.source.url} target="_blank" rel="noreferrer">{factor.data.source.label} ↗</a>
          </aside>
          <div className="factor-levers">
            <span>Palancas de acción</span>
            <ul>{factor.levers.map(lever => <li key={lever}>{lever}</li>)}</ul>
          </div>
          <details className="factor-sources">
            <summary>Fuentes de este capítulo</summary>
            <div className="factor-sources-links">{factor.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div>
          </details>
        </div>
      </section>)}
    </div>

    <section className="factors-closing" aria-labelledby="factors-closing-title">
      <p className="eyebrow">DEL FACTOR AL DATO</p>
      <h2 id="factors-closing-title">Ahora mira la señal que producen todos juntos.</h2>
      <p>El explorador no colorea países: muestra una anomalía global. La historia y los factores ayudan a leer el contexto que una curva no puede contar por sí sola.</p>
      <div className="factors-closing-links">
        <Link className="button" to="/explorador">Abrir el explorador <span aria-hidden="true">↗</span></Link>
        <Link className="text-link" to="/historia">Ver la historia de las decisiones →</Link>
      </div>
    </section>
  </div>
}
