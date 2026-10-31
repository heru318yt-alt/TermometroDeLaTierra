import { PageIntro } from '../../components/PageIntro'
import { gameModules } from './catalog'
export function GamesPage() {
  return <div className="page-width inner-page"><PageIntro number="03" title="Aprender también será jugar.">Cinco temáticas, distintas maneras de explorar nuestra relación con el clima.</PageIntro><p className="notice">Los minijuegos aún no están disponibles. Cada módulo se desarrollará de forma independiente.</p><div className="cards three game-grid">{gameModules.map(game => <article className="game-card" key={game.id} tabIndex={0} aria-labelledby={`game-${game.id}-title`} aria-describedby={`game-${game.id}-status`}><span className="game-symbol" aria-hidden="true">{game.symbol}</span><h2 id={`game-${game.id}-title`}>{game.title}</h2><p>{game.description}</p><span className="badge" id={`game-${game.id}-status`}>Pendiente de implementación</span></article>)}</div></div>
}

