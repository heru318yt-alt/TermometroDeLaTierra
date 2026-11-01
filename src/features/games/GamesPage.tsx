import { PageIntro } from '../../components/PageIntro'
import { gameModules } from './catalog'
export function GamesPage() {
  const unityUrl = `${import.meta.env.BASE_URL}unity-minijuegos/index.html`
  return <div className="page-width inner-page games-page">
    <PageIntro number="03" title="Aprender también será jugar.">Cinco minijuegos hechos en Unity para explorar nuestras decisiones sobre energía, industria, movilidad, bosques y alimentos.</PageIntro>
    <section className="unity-experience" aria-labelledby="unity-heading">
      <div className="unity-toolbar">
        <div><p className="eyebrow">EXPERIENCIA INTERACTIVA</p><h2 id="unity-heading">Elige un reto y juega</h2><p>Se ejecuta en Unity WebGL dentro de esta página. Usa el mouse, el teclado o la pantalla táctil.</p></div>
        <a className="button unity-fullscreen" href={unityUrl} target="_blank" rel="noreferrer">Abrir juego completo ↗</a>
      </div>
      <div className="unity-frame"><iframe title="Minijuegos Termómetro de la Tierra (Unity WebGL)" src={unityUrl} allow="fullscreen; autoplay" allowFullScreen loading="lazy" /></div>
      <p className="unity-note">Los indicadores de cada partida son valores didácticos del escenario; no representan mediciones de emisiones ni datos NASA GISTEMP.</p>
    </section>
    <h2 className="game-list-heading">Los cinco temas</h2>
    <div className="cards three game-grid">{gameModules.map(game => <article className="game-card" key={game.id} aria-labelledby={`game-${game.id}-title`} aria-describedby={`game-${game.id}-status`}><span className="game-symbol" aria-hidden="true">{game.symbol}</span><h3 id={`game-${game.id}-title`}>{game.title}</h3><p>{game.description}</p><span className="badge" id={`game-${game.id}-status`}>Disponible en Unity</span></article>)}</div>
  </div>
}

