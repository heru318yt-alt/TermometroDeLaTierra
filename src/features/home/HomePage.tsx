import { Link } from 'react-router'
import { Globe } from '../../components/Globe'
export function HomePage() {
  return <div className="home page-width">
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-dot" /> UN PLANETA. UNA HISTORIA COMPARTIDA.</p><h1>El clima cambia.<br /><em>Comprenderlo</em><br />es el primer paso.</h1><p>Explora el calentamiento global y descubre cómo nuestras actividades se relacionan con el clima de la Tierra.</p><Link className="button" to="/explorador">Comenzar la exploración <span aria-hidden="true">↗</span></Link><span className="hero-caption">Un espacio para observar, conectar y aprender.</span></div>
      <div className="planet-panel"><div className="planet-label"><span className="small-dot" /> NUESTRO PUNTO DE PARTIDA <span>01 / TIERRA</span></div><Globe /><div className="planet-bottom"><span>Todo está conectado.</span><span>Ilustración conceptual<br />Sin datos climáticos</span></div></div>
    </section>
    <section className="discovery"><div className="section-heading"><div><p className="eyebrow">DISTINTAS FORMAS DE APRENDER</p><h2>Una mirada más amplia al planeta.</h2></div><span className="section-aside">Explora a tu ritmo</span></div><div className="cards three">
      <Link className="feature-card" to="/explorador"><span className="card-top">01 <span aria-hidden="true">↗</span></span><h3>Explorar el clima</h3><p>Recorre el planeta, la línea de tiempo y la evolución de las anomalías globales.</p><span className="text-link">Ir al explorador</span></Link>
      <Link className="feature-card" to="/historia"><span className="card-top">02 <span aria-hidden="true">↗</span></span><h3>Recorrer la historia</h3><p>Una estructura por décadas para conectar el pasado con las preguntas del presente.</p><span className="text-link">Ver los períodos</span></Link>
      <Link className="feature-card" to="/minijuegos"><span className="card-top">03 <span aria-hidden="true">↗</span></span><h3>Aprender jugando</h3><p>Cinco temáticas para los futuros minijuegos sobre actividades humanas y clima.</p><span className="text-link">Conocer las temáticas</span></Link>
    </div></section>
    <aside className="development-note"><span className="small-dot" /><p><strong>Un proyecto en construcción.</strong> Explora la serie global de NASA con visualizaciones sincronizadas. Los minijuegos y las capas climáticas regionales se integrarán más adelante.</p></aside>
  </div>
}


