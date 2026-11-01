import { useRef, useState } from 'react'
import { PageIntro } from '../../components/PageIntro'
import { gameModules } from './catalog'

export function GamesPage() {
  const unityUrl = `${import.meta.env.BASE_URL}unity-minijuegos/index.html`
  const [world, setWorld] = useState<string | null>(null)
  const frame = useRef<HTMLElement>(null)
  const worldPicker = useRef<HTMLElement>(null)

  function play(id: string) {
    setWorld(id)
    window.requestAnimationFrame(() => {
      const section = frame.current
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  function returnToWorlds() {
    setWorld(null)
    window.requestAnimationFrame(() => {
      const section = worldPicker.current
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  return <div className="page-width inner-page games-page">
    <PageIntro number="03" title="Aprender también es jugar.">Cinco mundos ilustrados. Toma decisiones, mira cómo cambia el escenario y prueba otra estrategia cuando algo no sale bien.</PageIntro>
    <section className="game-worlds" aria-labelledby="game-worlds-title" ref={worldPicker}>
      <div className="game-worlds-heading"><div><p className="eyebrow">CINCO MISIONES · UNA TIERRA</p><h2 id="game-worlds-title">¿Qué quieres cuidar hoy?</h2></div><p>Elige una escena para abrir su minijuego directamente.</p></div>
      <div className="game-world-grid">{gameModules.map(game => <article className={`game-world game-world-${game.id}`} key={game.id}>
        <div className="game-world-scene" aria-hidden="true"><span className="game-world-sun" /><span className="game-world-cloud" /><span className="game-world-landscape">{game.symbol}</span><span className="game-world-orbit">{game.scene}</span></div>
        <div className="game-world-copy"><p className="eyebrow">{game.theme} · {game.era}</p><h3>{game.title}</h3><p>{game.description}</p><button type="button" className="world-play-button" onClick={() => play(game.id)} aria-label={`Jugar ${game.title}`}>Jugar <span aria-hidden="true">→</span></button></div>
      </article>)}</div>
    </section>
    <section className="unity-experience" aria-labelledby="unity-heading" ref={frame}>
      <div className="unity-toolbar">
        <div><p className="eyebrow">{world ? 'AVENTURA EN CURSO' : 'EXPERIENCIA INTERACTIVA'}</p><h2 id="unity-heading">{world ? `Juega: ${gameModules.find(game => game.id === world)?.title}` : 'Elige un mundo para empezar'}</h2><p>{world ? 'La misión se abre directamente en Unity. Usa el mouse o la pantalla táctil.' : 'Selecciona una de las cinco misiones para empezar.'}</p></div>
        <div className="unity-toolbar-actions">
          {world && <button className="button unity-map-button" type="button" onClick={returnToWorlds}>Volver a los mundos</button>}
          <a className="button unity-fullscreen" href={world ? `${unityUrl}?world=${world}` : unityUrl} target="_blank" rel="noreferrer">Abrir juego completo ↗</a>
        </div>
      </div>
      <div className="unity-frame"><iframe key={world ?? 'mapa'} title="Minijuegos Termómetro de la Tierra (Unity WebGL)" src={world ? `${unityUrl}?world=${world}` : unityUrl} allow="fullscreen; autoplay" allowFullScreen loading="lazy" /></div>
      <p className="unity-note">Los indicadores de cada partida son valores didácticos del escenario; no representan mediciones de emisiones ni datos NASA GISTEMP.</p>
    </section>
  </div>
}
