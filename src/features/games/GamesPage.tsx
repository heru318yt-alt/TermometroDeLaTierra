import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { gameModules } from './catalog'
import { WorldIllustration } from './WorldIllustration'
import { isWorldId, unityWorldUrl } from './worldLinks'

export function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const worldParam = searchParams.get('world')
  const world = isWorldId(worldParam) ? worldParam : null
  const frame = useRef<HTMLElement>(null)
  const worldPicker = useRef<HTMLElement>(null)

  function play(id: string) {
    setSearchParams({ world: id })
    window.requestAnimationFrame(() => {
      const section = frame.current
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  function returnToWorlds() {
    setSearchParams({})
    window.requestAnimationFrame(() => {
      const section = worldPicker.current
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }

  useEffect(() => {
    function handleUnityReturn(event: MessageEvent) {
      if (event.origin !== window.location.origin || !['termometro:return-to-worlds', 'termometro:backToAtlas'].includes(event.data?.type)) return
      setSearchParams({})
      window.requestAnimationFrame(() => {
        const section = worldPicker.current
        if (section && typeof section.scrollIntoView === 'function') section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    window.addEventListener('message', handleUnityReturn)
    return () => window.removeEventListener('message', handleUnityReturn)
  }, [setSearchParams])

  return <div className="page-width inner-page games-page">
    <PageIntro number="03" title="Aprender también es jugar.">Cinco mundos ilustrados. Toma decisiones, mira cómo cambia el escenario y prueba otra estrategia cuando algo no sale bien.</PageIntro>
    <section className="game-worlds" aria-labelledby="game-worlds-title" ref={worldPicker}>
      <div className="game-worlds-heading"><div><p className="eyebrow">CINCO MISIONES · UNA TIERRA</p><h2 id="game-worlds-title">¿Qué quieres cuidar hoy?</h2></div><p>Elige una escena para abrir su minijuego directamente.</p></div>
      <div className="game-world-grid">{gameModules.map(game => <article className={`game-world game-world-${game.id}`} key={game.id}>
        <div className={`game-world-scene scene-${game.id}`}><WorldIllustration world={game.id} title={game.title} /><span className="game-world-orbit">{game.scene}</span></div>
        <div className="game-world-copy"><p className="eyebrow">{game.theme} · {game.era}</p><h3>{game.title}</h3><p>{game.description}</p><button type="button" className="world-play-button" onClick={() => play(game.id)} aria-label={`Jugar ${game.title}`}>Jugar <span aria-hidden="true">→</span></button></div>
      </article>)}</div>
    </section>
    <section className="unity-experience" aria-labelledby="unity-heading" ref={frame}>
      <div className="unity-toolbar">
        <div><p className="eyebrow">{world ? 'AVENTURA EN CURSO' : 'EXPERIENCIA INTERACTIVA'}</p><h2 id="unity-heading">{world ? `Juega: ${gameModules.find(game => game.id === world)?.title}` : 'Elige un mundo para empezar'}</h2><p>{world ? 'La misión se abre directamente en Unity. Usa el mouse o la pantalla táctil.' : 'Selecciona una de las cinco misiones para empezar.'}</p></div>
        <div className="unity-toolbar-actions">
          {world && <button className="button unity-map-button" type="button" onClick={returnToWorlds}>Volver a los mundos</button>}
          {world && <a className="button unity-fullscreen" href={unityWorldUrl(world, true)} target="_blank" rel="noreferrer">Abrir juego completo ↗</a>}
        </div>
      </div>
      <div className="unity-frame">{world ? <iframe key={world} title={`Minijuego ${gameModules.find(game => game.id === world)?.title} en Unity WebGL`} src={unityWorldUrl(world, true)} allow="fullscreen; autoplay" allowFullScreen loading="lazy" /> : <div className="unity-empty"><span>ATLAS DE CAMPO · 05 MUNDOS</span><strong>Elige una aventura para abrirla aquí.</strong><p>Las cinco aventuras son independientes y abren directamente en su escenario.</p></div>}</div>
      <p className="unity-note">Los indicadores de cada partida son valores didácticos del escenario; no representan mediciones de emisiones ni datos NASA GISTEMP.</p>
    </section>
  </div>
}
