import { PageIntro } from '../../components/PageIntro'
import { useClimateData } from '../climate/useClimateData'
import { methodology, sources } from './catalog'

export function SourcesPage() {
  const { data, summary } = useClimateData()
  const reference = summary.source.referencePeriod
  const dateFormat = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'America/Bogota' })

  return <div className="sources-page">
    <PageIntro number="06" title="Fuentes y metodología" eyebrow="TRAZABILIDAD CIENTÍFICA">
      De dónde salen los datos, qué significan exactamente y qué no puede afirmar una visualización. Cada cifra del observatorio debe poder rastrearse hasta una fuente.
    </PageIntro>

    <nav className="sources-jump" aria-label="Secciones de fuentes">
      <a href="#fuentes" data-sfx="open"><span>01</span><strong>Biblioteca</strong><i aria-hidden="true">↓</i></a>
      <a href="#metodologia" data-sfx="open"><span>02</span><strong>Metodología</strong><i aria-hidden="true">↓</i></a>
      <a href="#auditoria" data-sfx="open"><span>03</span><strong>Auditoría</strong><i aria-hidden="true">↓</i></a>
      <a href="#citacion" data-sfx="open"><span>04</span><strong>Cómo citar</strong><i aria-hidden="true">↓</i></a>
    </nav>

    <section className="sources-ledger" id="fuentes" aria-labelledby="sources-ledger-title">
      <div className="sources-ledger-head">
        <p className="eyebrow">BIBLIOTECA DE REFERENCIA · 10 ENTRADAS</p>
        <h2 id="sources-ledger-title">Todo lo que sostiene la lectura.</h2>
        <p>Fuentes de datos, evaluaciones científicas y recursos metodológicos. Los enlaces abren los documentos originales.</p>
      </div>
      <ol className="source-list">
        {sources.map(source => <li key={source.id} className={`source-entry source-${source.kind.toLowerCase()}`}>
          <span className="source-number">{source.number}</span>
          <div className="source-body">
            <div className="source-meta"><span>{source.kind}</span><span>{source.organization}</span></div>
            <h3>{source.name}</h3>
            <p>{source.description}</p>
            <p className="source-use"><strong>Se usa para:</strong> {source.usedFor}</p>
            <a href={source.url} target="_blank" rel="noreferrer">{source.linkLabel} ↗</a>
          </div>
        </li>)}
      </ol>
    </section>

    <details className="method-section" id="metodologia">
      <summary>
        <span className="eyebrow">CÓMO SE CONSTRUYÓ ESTA LECTURA</span>
        <span className="method-title">Método, referencias y límites.</span>
        <span className="method-lead">Ocho notas para leer el explorador sin confundir una anomalía con una temperatura absoluta ni una coincidencia con una causa.</span>
      </summary>
      <div className="method-grid">
        {methodology.map((item, index) => <article key={item.title} className="method-note">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>)}
      </div>
    </details>

    <section className="data-audit" id="auditoria" aria-labelledby="audit-title">
      <div className="data-audit-copy">
        <p className="eyebrow">AUDITORÍA DEL CONJUNTO LOCAL</p>
        <h2 id="audit-title">La copia exacta que usa la página.</h2>
        <p>El navegador no consulta NASA en tiempo de ejecución. El proyecto incluye una copia validada del archivo global Land-Ocean de GISTEMP v4 y muestra su fecha de descarga para que pueda comprobarse.</p>
        <a className="text-link" href={summary.source.url} target="_blank" rel="noreferrer">Descargar el CSV original de NASA ↗</a>
      </div>
      <dl className="data-audit-facts">
        <div><dt>Cobertura</dt><dd>{data.firstDate} → {data.lastDate}</dd></div>
        <div><dt>Registros</dt><dd>{data.yearCount} años · {data.monthCount} meses</dd></div>
        <div><dt>Unidad</dt><dd>Anomalía en {data.source.unit}, referencia {reference}</dd></div>
        <div><dt>Descarga local</dt><dd><time dateTime={data.downloadedAt}>{dateFormat.format(new Date(data.downloadedAt))}</time> (Bogotá)</dd></div>
        <div><dt>Hash SHA-256</dt><dd className="hash">{data.sha256}</dd></div>
        <div><dt>Regenerar</dt><dd><code>npm run data:update</code></dd></div>
      </dl>
    </section>

    <details className="citation-strip" id="citacion">
      <summary>
        <span className="eyebrow">CÓMO CITAR</span>
        <span className="citation-title">Si reutilizas esta lectura, cita también sus fuentes.</span>
      </summary>
      <p>GISTEMP Team, 2026: <em>GISS Surface Temperature Analysis, versión 4</em>. NASA Goddard Institute for Space Studies. Serie descargada el {data.downloadedAt.slice(0, 10)} y conservada localmente en este proyecto.</p>
      <p>Para la incertidumbre y el método: Lenssen et al. (2024), <em>A GISTEMPv4 observational uncertainty ensemble</em>, Journal of Geophysical Research: Atmospheres, 129, e2023JD040179. <a href="https://doi.org/10.1029/2023JD040179" target="_blank" rel="noreferrer">DOI ↗</a></p>
    </details>
  </div>
}
