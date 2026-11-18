import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { EpochPath } from './EpochPath'
import { findEpoch, gameEpochs } from './epochs'
import {
  completeEpoch,
  isEpochUnlocked,
  nextEpoch,
  resetProgress,
  useCompletedEpochs,
} from './progress'
import { WorldIllustration } from './WorldIllustration'
import { isWorldId, type WorldId } from './worldLinks'
import { EnergyGame } from './energy/EnergyGame'
import { BridgeGame } from './bridge/BridgeGame'
import { CargoGame } from './cargo/CargoGame'
import { ForestGame } from './forest/ForestGame'
import { FarmGame } from './farm/FarmGame'
import { GameFrame } from './shared/GameFrame'
import { gameModules } from './catalog'

const sceneWorlds: Record<string, WorldId> = {
  EnergiaViva: 'energia',
  FabricaCircular: 'industria',
  RutasQueRespiran: 'transporte',
  BosqueGuardian: 'bosques',
  FincaDelFuturo: 'agricultura',
}

const GAMES: Record<WorldId, () => React.JSX.Element> = {
  energia: EnergyGame,
  industria: BridgeGame,
  transporte: CargoGame,
  bosques: ForestGame,
  agricultura: FarmGame,
}

function scrollMode(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const worldParam = searchParams.get('world')
  const world = isWorldId(worldParam) ? worldParam : null
  const completed = useCompletedEpochs()
  const activeEpoch = findEpoch(world)
  const activeGame = gameModules.find(game => game.id === world)
  const locked = activeEpoch ? !isEpochUnlocked(activeEpoch.id, completed) : false
  const upcoming = nextEpoch(completed)
  const stage = useRef<HTMLElement>(null)
  const worldPicker = useRef<HTMLElement>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const scrollToWorlds = useCallback(() => {
    window.requestAnimationFrame(() => {
      const section = worldPicker.current
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: scrollMode(), block: 'start' })
      }
    })
  }, [])

  const returnToWorlds = useCallback(() => {
    setSearchParams({})
    scrollToWorlds()
  }, [scrollToWorlds, setSearchParams])

  function play(id: WorldId) {
    setSearchParams({ world: id })
    window.requestAnimationFrame(() => {
      const section = stage.current
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: scrollMode(), block: 'start' })
      }
    })
  }

  useEffect(() => {
    function handleUnityMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return

      const data = event.data as { type?: unknown; scene?: unknown; world?: unknown } | null
      if (!data || typeof data.type !== 'string') return

      if (data.type === 'termometro:mission-complete') {
        const candidate = typeof data.world === 'string' && isWorldId(data.world)
          ? data.world
          : typeof data.scene === 'string'
            ? sceneWorlds[data.scene]
            : undefined
        if (!candidate) return

        const epoch = findEpoch(candidate)
        completeEpoch(candidate)
        const unlocked = nextEpoch()
        setNotice(unlocked
          ? `${epoch?.title ?? 'Etapa'} completada. Se abrió ${unlocked.range}: ${unlocked.title}.`
          : `${epoch?.title ?? 'Etapa'} completada. La ruta de cinco etapas está completa.`)
        return
      }

      if (['termometro:return-to-worlds', 'termometro:backToAtlas'].includes(data.type)) {
        returnToWorlds()
      }
    }

    window.addEventListener('message', handleUnityMessage)
    return () => window.removeEventListener('message', handleUnityMessage)
  }, [returnToWorlds])

  function markCompleted(id: WorldId) {
    const epoch = findEpoch(id)
    completeEpoch(id)
    const unlocked = nextEpoch()
    setNotice(unlocked
      ? `${epoch?.title ?? 'Etapa'} completada. Se abrió ${unlocked.range}: ${unlocked.title}.`
      : `${epoch?.title ?? 'Etapa'} completada. La ruta de cinco etapas está completa.`)
  }

  function restartRoute() {
    resetProgress()
    setSearchParams({})
    setNotice('Progreso reiniciado. La etapa 01 vuelve a estar disponible.')
    scrollToWorlds()
  }

  const previousEpoch = activeEpoch && activeEpoch.index > 0 ? gameEpochs[activeEpoch.index - 1] : undefined
  const progress = Math.round((completed.length / gameEpochs.length) * 100)
  const ActiveGame = world ? GAMES[world] : null

  return <div className="games-page">
    <PageIntro number="05" title="Aprender también es jugar." eyebrow="CINCO ETAPAS · CINCO DECISIONES">
      Recorre las cinco etapas de la historia climática. Cada decisión abre el siguiente mundo y deja una consecuencia visible.
    </PageIntro>

    <section className="epoch-journey" id="mundos" aria-labelledby="epoch-journey-title" ref={worldPicker}>
      <div className="epoch-journey-head">
        <div>
          <p className="eyebrow">RUTA DE APRENDIZAJE · 1970—2025</p>
          <h2 id="epoch-journey-title">Una etapa, un reto, una decisión.</h2>
        </div>
        <div className="epoch-progress" aria-label="Progreso de la ruta">
          <div className="epoch-progress-top">
            <span className="eyebrow">PROGRESO NARRATIVO</span>
            <strong>{completed.length} <span>de {gameEpochs.length}</span></strong>
          </div>
          <div className="epoch-meter" role="progressbar" aria-valuemin={0} aria-valuemax={gameEpochs.length} aria-valuenow={completed.length} aria-valuetext={`${completed.length} de ${gameEpochs.length} etapas completadas`}>
            <i style={{ width: `${progress}%` }} />
          </div>
          <p>{upcoming
            ? <>Siguiente etapa: <button type="button" data-sfx="open" onClick={() => play(upcoming.id)}>{upcoming.range} · {upcoming.title}</button></>
            : 'Las cinco etapas están completas. Puedes repetir cualquiera.'}</p>
        </div>
      </div>

      <EpochPath current={world} onSelect={play} />

      {completed.length > 0 && <details className="epoch-reset">
        <summary>Reiniciar progreso</summary>
        <div><p>Borra las etapas completadas en este navegador y vuelve a empezar por 1970.</p><button type="button" className="text-link" data-sfx="loss" onClick={restartRoute}>Reiniciar la ruta</button></div>
      </details>}
    </section>

    <section className="unity-experience" aria-labelledby="unity-heading" ref={stage}>
      {activeEpoch ? <>
        <div className="unity-toolbar">
          <div>
            <p className="eyebrow">ETAPA {String(activeEpoch.index + 1).padStart(2, '0')} · {activeEpoch.range} · {activeEpoch.theme.toUpperCase()}</p>
            <h2 id="unity-heading">{locked ? 'Esta etapa aún está bloqueada' : activeEpoch.title}</h2>
            <p>{locked
              ? `Completa ${previousEpoch ? `${previousEpoch.range} · ${previousEpoch.title}` : 'la etapa anterior'} para abrir este mundo.`
              : activeEpoch.description}</p>
          </div>
          <div className="unity-toolbar-actions">
            <button className="button unity-map-button" type="button" onClick={returnToWorlds}>Volver a la ruta</button>
          </div>
        </div>

        {locked ? <div className="unity-locked">
          <span className="unity-locked-mark" aria-hidden="true">◼</span>
          <div>
            <p className="eyebrow">BLOQUEADA POR PROGRESO</p>
            <strong>La ruta se recorre en orden.</strong>
            <p>{previousEpoch
              ? `Primero completa ${previousEpoch.range} · ${previousEpoch.title}. Al terminar, este mundo se abrirá automáticamente.`
              : 'Completa la etapa anterior para abrir este mundo.'}</p>
            {previousEpoch && <button type="button" className="button" onClick={() => play(previousEpoch.id)}>Ir a la etapa anterior<span aria-hidden="true">→</span></button>}
          </div>
        </div> : <>
          {ActiveGame && <GameFrame world={activeEpoch.id} title={`Misión ${String(activeEpoch.index + 1).padStart(2, '0')} · ${activeGame?.title ?? activeEpoch.title}`}>
            <ActiveGame />
          </GameFrame>}

          <div className="mission-console">
            <p className="unity-note">Los indicadores de cada partida son valores didácticos del escenario; no representan mediciones de emisiones ni datos NASA GISTEMP.</p>
            <div className="mission-console-actions">
              <button type="button" className="text-link" data-sfx="win" onClick={() => markCompleted(activeEpoch.id)}>Marcar reto completado</button>
            </div>
          </div>
          <details className="mission-brief">
            <summary>Ficha del reto</summary>
            <div className="mission-brief-body">
              <div className="mission-brief-art"><WorldIllustration world={activeEpoch.id} title={activeEpoch.title} /><span>{activeEpoch.scene}</span></div>
              <div>
                <p className="eyebrow">PROPÓSITO EDUCATIVO</p>
                <p>{activeEpoch.purpose}</p>
                <blockquote>{activeEpoch.question}</blockquote>
                <p className="mission-brief-context">{activeEpoch.narrative}</p>
                <a href={activeEpoch.source} target="_blank" rel="noreferrer">{activeEpoch.sourceLabel} ↗</a>
              </div>
            </div>
          </details>
        </>}

      </> : <div className="unity-empty">
        <span>ETAPA {String((upcoming ?? gameEpochs[0]).index + 1).padStart(2, '0')} · {(upcoming ?? gameEpochs[0]).range} · {(upcoming ?? gameEpochs[0]).theme.toUpperCase()}</span>
        <strong id="unity-heading">Elige una etapa de la ruta.</strong>
        <p>{upcoming
          ? `${upcoming.range} · ${upcoming.title} ya está disponible. Las demás se abren al completar la anterior.`
          : 'Las cinco etapas están completas. Puedes repetir cualquiera desde la ruta.'}</p>
        <button type="button" className="button" onClick={() => play(upcoming?.id ?? 'energia')}>Abrir {(upcoming ?? gameEpochs[0]).title}<span aria-hidden="true">→</span></button>
      </div>}
      {notice && <div className="epoch-notice" role="status" aria-live="polite"><span>{notice}</span><div className="epoch-notice-actions">{upcoming && <button type="button" onClick={() => { setNotice(null); play(upcoming.id) }}>Abrir siguiente etapa</button>}<button type="button" className="epoch-notice-close" aria-label="Cerrar aviso" onClick={() => setNotice(null)}>×</button></div></div>}
    </section>
  </div>
}
