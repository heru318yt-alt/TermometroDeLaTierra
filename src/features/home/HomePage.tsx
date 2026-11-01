import { Link } from 'react-router'
import { Globe } from '../../components/Globe'
import { gameModules } from '../games/catalog'
import { unityWorldUrl } from '../games/worldLinks'

export function HomePage() {
  return <div className="home page-width">
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow"><span className="small-dot" /> UN PLANETA. UNA HISTORIA COMPARTIDA.</p><h1>El clima cambia.<br /><em>Comprenderlo</em><br />es el primer paso.</h1><p>Explora el calentamiento global y descubre cómo nuestras actividades se relacionan con el clima de la Tierra.</p><Link className="button" to="/explorador">Comenzar la exploración <span aria-hidden="true">↗</span></Link><span className="hero-caption">Un espacio para observar, conectar y aprender.</span></div>
      <div className="planet-panel"><div className="planet-label"><span className="small-dot" /> NUESTRO PUNTO DE PARTIDA <span>01 / TIERRA</span></div><Globe /><div className="planet-bottom"><span>Todo está conectado.</span><span>Ilustración conceptual<br />Sin datos climáticos</span></div></div>
    </section>
    <section className="home-atlas" aria-labelledby="home-atlas-title">
      <div className="home-atlas-heading"><p className="eyebrow">CUADERNO DE CAMPO · 05 LUGARES</p><h2 id="home-atlas-title">Un planeta. Cinco historias por explorar.</h2><p>Abre una región para entrar a su mundo y descubrir qué decisiones lo transforman.</p></div>
      <div className="atlas-spread">
        <div className="atlas-map-art">
          <svg viewBox="0 0 760 450" role="img" aria-labelledby="atlas-title atlas-desc">
            <title id="atlas-title">Atlas ilustrado de los cinco mundos</title><desc id="atlas-desc">Mapa conceptual con rutas que conectan la ciudad, la fábrica, el bosque, las rutas de movilidad y la finca.</desc>
            <defs><linearGradient id="atlas-paper" x2="0" y2="1"><stop stopColor="#f5ebd6"/><stop offset="1" stopColor="#ead9b9"/></linearGradient><linearGradient id="atlas-water" x2="0" y2="1"><stop stopColor="#94c9bc"/><stop offset="1" stopColor="#478b83"/></linearGradient></defs>
            <rect width="760" height="450" rx="18" fill="url(#atlas-paper)"/><path d="M0 0h760v40H0z" fill="#204c40"/><text x="28" y="27" fill="#f5eedc" fontSize="12" fontFamily="Georgia,serif" letterSpacing="3">TERMÓMETRO DE LA TIERRA  /  ATLAS DE EXPLORACIÓN</text>
            <path d="M0 110q105-55 205-20t177-11q81-44 154 2t224-7v376H0Z" fill="url(#atlas-water)"/>
            <path d="m37 206 78-57 82 18 36-34 91 11 28 46 73 7 40 59-39 42-9 64-77 32-53-26-56 13-56-32-77 9-52-44-76-10Z" fill="#d7bc83" stroke="#9c845d" strokeWidth="4"/>
            <path d="m76 217 53-41 57 13 40-29 45 15 17 37-36 13-15 44-55 4-26 40-44-13-21-40-41-7Z" fill="#52845f"/><path d="m219 327 47-45 48 13 27-27 37 27-15 39-51 3-23 29-46-4Z" fill="#4c7950"/><path d="m353 167 42-28 43 8 18 32-28 27-39-8Z" fill="#d19a55"/><path d="m433 257 39-38 43 11 14 35-29 22-44-7Z" fill="#a86342"/><path d="m282 194 25-24 22 26-13 30-26-6Z" fill="#688c65"/>
            <g fill="none" stroke="#f4e6c7" strokeWidth="4" strokeDasharray="3 9" strokeLinecap="round"><path d="M147 222q60 25 100 20t59-39q50-24 97-33t53 70q-16 30-11 44t-86 45"/><path d="M247 242q-27 35-23 81t45 17"/></g>
            <g opacity=".96"><path d="m106 207 17-23 17 23v21h-34z" fill="#d7764f"/><path d="M101 208h44l-22-29z" fill="#eee0bb"/><rect x="117" y="211" width="12" height="17" fill="#315a4c"/><circle cx="167" cy="227" r="16" fill="#24553e"/><circle cx="184" cy="225" r="12" fill="#3c7148"/><circle cx="155" cy="235" r="11" fill="#568355"/><rect x="166" y="235" width="4" height="12" fill="#725a3c"/><path d="M363 128v42h18v-42zm-6 10h30v4h-30m-3 14h36v4h-36" fill="#65766b"/><path d="M444 126h31v37h-31zm4-8h9v8h-9m9 14h4v8h-4m10-8h4v8h-4" fill="#9b6440"/><path d="M209 306q14-22 29 0l-4 23h-21z" fill="#e7b651"/><path d="m477 265 13-24 13 24v20h-26z" fill="#e6eee2"/><path d="M477 265h26l-13-19z" fill="#bc6047"/></g>
            <g fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" letterSpacing="1.5" fill="#264f41"><text x="60" y="283">BOSQUE</text><text x="322" y="112">ENERGÍA</text><text x="471" y="333">MOVILIDAD</text><text x="522" y="215">INDUSTRIA</text><text x="167" y="379">AGRICULTURA</text></g>
            {gameModules.map((game, i) => { const spots: Record<string, number[]> = { energia: [347,145], industria: [488,205], transporte: [488,264], bosques: [130,210], agricultura: [223,311] }; const [x,y] = spots[game.id]; return <a key={game.id} href={unityWorldUrl(game.id, true)} aria-label={`Explorar ${game.title}`}><circle cx={x} cy={y} r="19" fill="#f7efd9" stroke="#244e40" strokeWidth="3"/><circle cx={x} cy={y} r="4" fill="#bd6d48"/><text x={x} y={y+5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#244e40">{String(i+1).padStart(2,'0')}</text></a> })}
            <g transform="translate(662 72)" stroke="#f5eedc" strokeWidth="2"><circle r="29" fill="#204c40"/><path d="M0-19 6 3 0-1-6 3Z" fill="#edc16c"/><text x="0" y="44" textAnchor="middle" stroke="none" fill="#204c40" fontSize="10" fontWeight="700">N</text></g>
            <text x="28" y="416" fill="#315448" fontSize="10" fontFamily="Georgia,serif" letterSpacing="2">MAPA CONCEPTUAL · EXPLORA LOS CINCO MUNDOS</text>
          </svg>
        </div>
        <div className="atlas-index"><p className="eyebrow">ÍNDICE DE CAMPO</p>{gameModules.map((game, i) => <a key={game.id} href={unityWorldUrl(game.id, true)}><span>{String(i+1).padStart(2,'0')}</span><span><strong>{game.title}</strong><small>{game.theme} · {game.era}</small></span><span aria-hidden="true">↗</span></a>)}</div>
      </div>
    </section>
    <section className="discovery"><div className="section-heading"><div><p className="eyebrow">DISTINTAS FORMAS DE APRENDER</p><h2>Una mirada más amplia al planeta.</h2></div><span className="section-aside">Explora a tu ritmo</span></div><div className="cards three">
      <Link className="feature-card" to="/explorador"><span className="card-top">01 <span aria-hidden="true">↗</span></span><h3>Explorar el clima</h3><p>Recorre el planeta, la línea de tiempo y la evolución de las anomalías globales.</p><span className="text-link">Ir al explorador</span></Link>
      <Link className="feature-card" to="/historia"><span className="card-top">02 <span aria-hidden="true">↗</span></span><h3>Recorrer la historia</h3><p>Una estructura por décadas para conectar el pasado con las preguntas del presente.</p><span className="text-link">Ver los períodos</span></Link>
      <Link className="feature-card" to="/minijuegos"><span className="card-top">03 <span aria-hidden="true">↗</span></span><h3>Aprender jugando</h3><p>Entra a cinco mundos donde las decisiones transforman la ciudad, el bosque y la finca.</p><span className="text-link">Elegir un mundo</span></Link>
    </div></section>
    <aside className="development-note"><span className="small-dot" /><p><strong>Un proyecto en construcción.</strong> Explora la serie global de NASA con visualizaciones sincronizadas. Seguimos ampliando las capas climáticas regionales.</p></aside>
  </div>
}


