import { Link } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { useClimateData } from '../climate/useClimateData'

export function AboutPage() {
  const { summary } = useClimateData()
  return <div className="about-page">
    <PageIntro number="—" title="Comprender para participar." eyebrow="ACERCA DEL PROYECTO">
      Termómetro de la Tierra es un proyecto universitario de la asignatura Arquitectura de Sistemas Multimedia.
    </PageIntro>

    <div className="about-ledger">
      <section className="about-purpose">
        <p className="eyebrow">EL PROPÓSITO</p>
        <h2>Acercar el clima a las personas.</h2>
        <p className="about-lead">Crear una aplicación educativa sobre el calentamiento global que combine exploración visual, contenido temporal y experiencias de aprendizaje interactivas.</p>
        <h3>Objetivos del proyecto</h3>
        <ol>
          <li><span>01</span>Facilitar la comprensión de información climática con fuentes verificables.</li>
          <li><span>02</span>Relacionar distintas actividades humanas con el cambio climático sin confundir correlación con causa.</li>
          <li><span>03</span>Ofrecer experiencias educativas interactivas junto a la exploración climática.</li>
        </ol>
      </section>

      <section className="about-status">
        <p className="eyebrow">ESTADO ACTUAL</p>
        <h2>Explora, compara y juega.</h2>
        <p>La aplicación conserva su navegación adaptable e integra datos globales de NASA GISTEMP v4.</p>
        <p>El mapa, el gráfico y la línea de tiempo permiten recorrer la anomalía global; cinco minijuegos 2D en Unity proponen decisiones sobre energía, industria, movilidad, bosques y agricultura. El contexto histórico mantiene sus fuentes y notas de atribución.</p>
        <div className="about-status-facts">
          <span><strong>01</strong>Serie global 1880–{summary.latest ? summary.latest.year : '—'}</span>
          <span><strong>05</strong>Mundos jugables</span>
          <span><strong>10</strong>Fuentes documentadas</span>
        </div>
      </section>

      <section className="about-sources">
        <p className="eyebrow">REFERENCIAS Y TRANSPARENCIA</p>
        <h2>Un punto de partida verificable.</h2>
        <a className="source-link" href="https://data.giss.nasa.gov/gistemp/" target="_blank" rel="noreferrer"><strong>NASA GISS · GISTEMP <span aria-hidden="true">↗</span></strong><span>Fuente de la serie global de anomalías respecto a 1951–1980. La fecha de descarga está disponible en el explorador.</span></a>
        <p className="muted">GISTEMP Team: GISS Surface Temperature Analysis, versión 4. NASA GISS. Descarga: {summary.downloadedAt.slice(0, 10)}.</p>
        <a className="source-link" href="https://doi.org/10.1029/2023JD040179" target="_blank" rel="noreferrer"><strong>Lenssen et al. (2024) <span aria-hidden="true">↗</span></strong><span>A GISTEMPv4 observational uncertainty ensemble. Journal of Geophysical Research: Atmospheres, 129.</span></a>
        <a className="source-link" href="https://temperatura-mu.vercel.app/" target="_blank" rel="noreferrer"><strong>Referencia de la asignatura <span aria-hidden="true">↗</span></strong><span>Recurso proporcionado por el profesor. No se pudo verificar su contenido durante esta implementación; no se ha copiado su código.</span></a>
        <Link className="text-link" to="/fuentes">Ver las diez fuentes y la metodología completa →</Link>
      </section>
    </div>
  </div>
}
