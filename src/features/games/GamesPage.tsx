import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageIntro } from '../../components/PageIntro'
import { SectionErrorBoundary } from '../../components/SectionErrorBoundary'
import {
  ACHIEVEMENTS,
  isAchievementUnlocked,
  notifyAchievement,
  recordAchievementUnlock,
  resetAchievements,
  syncAchievementsWithProgress,
  useUnlockedAchievements,
} from './achievements'
import { EpochPath } from './EpochPath'
import { ProtectorCelebration } from './ProtectorCelebration'
import { findEpoch, gameEpochs } from './epochs'
import {
  completeEpoch,
  getCompletedEpochs,
  isEpochUnlocked,
  nextEpoch,
  resetProgress,
  useCompletedEpochs,
} from './progress'
import { WorldIllustration } from './WorldIllustration'
import { isWorldId, type WorldId } from './worldLinks'
import { GameFrame } from './shared/GameFrame'
import { gameModules } from './catalog'

const EnergyGame = lazy(() => import('./energy/EnergyGame').then(m => ({ default: m.EnergyGame })))
const BridgeGame = lazy(() => import('./bridge/BridgeGame').then(m => ({ default: m.BridgeGame })))
const CargoGame = lazy(() => import('./cargo/CargoGame').then(m => ({ default: m.CargoGame })))
const ForestGame = lazy(() => import('./forest/ForestGame').then(m => ({ default: m.ForestGame })))
const FarmGame = lazy(() => import('./farm/FarmGame').then(m => ({ default: m.FarmGame })))

const sceneWorlds: Record<string, WorldId> = {
  EnergiaViva: 'energia',
  FabricaCircular: 'industria',
  RutasQueRespiran: 'transporte',
  BosqueGuardian: 'bosques',
  FincaDelFuturo: 'agricultura',
}

type GameProps = {
  onComplete?: () => void
  onNext?: () => void
  nextLabel?: string
}

const GAMES: Record<WorldId, React.ComponentType<GameProps>> = {
  energia: EnergyGame,
  industria: BridgeGame,
  transporte: CargoGame,
  bosques: ForestGame,
  agricultura: FarmGame,
}

const CELEBRATED_KEY = 'termometro:protector-celebrated:v1'

function markCelebrated() {
  try { window.localStorage.setItem(CELEBRATED_KEY, 'true') } catch { /* ignore */ }
}

function clearCelebrated() {
  try { window.localStorage.removeItem(CELEBRATED_KEY) } catch { /* ignore */ }
}

function scrollMode(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const worldParam = searchParams.get('world')
  const world = isWorldId(worldParam) ? worldParam : null
  const completed = useCompletedEpochs()
  const unlocks = useUnlockedAchievements()
  const activeEpoch = findEpoch(world)
  const activeGame = gameModules.find(game => game.id === world)
  const locked = activeEpoch ? !isEpochUnlocked(activeEpoch.id, completed) : false
  const upcoming = nextEpoch(completed)
  const allCompleted = completed.length === gameEpochs.length
  const unlockedAchievementCount = ACHIEVEMENTS.filter(def => isAchievementUnlocked(def.id, unlocks, completed)).length
  const nextStage = activeEpoch ? gameEpochs[activeEpoch.index + 1] : undefined
  const stage = useRef<HTMLElement>(null)
  const worldPicker = useRef<HTMLElement>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    syncAchievementsWithProgress()
  }, [completed])

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

  const play = useCallback((id: WorldId) => {
    setSearchParams({ world: id })
    window.requestAnimationFrame(() => {
      const section = stage.current
      if (section && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: scrollMode(), block: 'start' })
      }
    })
  }, [setSearchParams])

  const recordCompletion = useCallback((id: WorldId) => {
    const wasAllCompleted = getCompletedEpochs().length === gameEpochs.length
    const epoch = findEpoch(id)
    completeEpoch(id)
    recordAchievementUnlock(id)
    const unlocked = nextEpoch()
    const triggersGrandCelebration = !unlocked && !wasAllCompleted
    setNotice(unlocked
      ? `${epoch?.title ?? 'Etapa'} completada. Se abrió ${unlocked.range}: ${unlocked.title}.`
      : `${epoch?.title ?? 'Etapa'} completada. Obtuviste el título oficial de Protector Ambiental.`)
    notifyAchievement(id, {
      unlockedNext: unlocked ? `${unlocked.range}: ${unlocked.title}` : undefined,
      playSound: !triggersGrandCelebration,
    })
    if (triggersGrandCelebration) {
      markCelebrated()
      setShowCelebration(true)
    }
  }, [])

  useEffect(() => {
    if (!allCompleted) return
    try {
      if (window.localStorage.getItem(CELEBRATED_KEY) !== 'true') {
        markCelebrated()
        setShowCelebration(true)
      }
    } catch {
      setShowCelebration(true)
    }
  }, [allCompleted])

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

        recordCompletion(candidate)
        return
      }

      if (['termometro:return-to-worlds', 'termometro:backToAtlas'].includes(data.type)) {
        returnToWorlds()
      }
    }

    window.addEventListener('message', handleUnityMessage)
    return () => window.removeEventListener('message', handleUnityMessage)
  }, [recordCompletion, returnToWorlds])

  const markCompleted = useCallback((id: WorldId) => {
    recordCompletion(id)
  }, [recordCompletion])

  function restartRoute() {
    clearCelebrated()
    resetProgress()
    resetAchievements()
    setShowCelebration(false)
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
            <Link to="/logros" className="games-logros-cta">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.5 5.4 5.9.8-4.3 4.2 1 5.9L12 16.5l-5.1 2.8 1-5.9-4.3-4.2 5.9-.8L12 3Z" /></svg>
              <span>Logros y récords</span>
              <b>{unlockedAchievementCount}/{ACHIEVEMENTS.length} ↗</b>
            </Link>
            <strong>{completed.length} <span>de {gameEpochs.length}</span></strong>
          </div>
          <div className="epoch-progress-meta">
            <span className="eyebrow">PROGRESO NARRATIVO</span>
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

      {allCompleted && (
        <div className="protector-banner" role="region" aria-label="Reconocimiento obtenido">
          <div className="protector-banner-copy">
            <span className="protector-banner-tag">★ 5 DE 5 RETOS COMPLETADOS</span>
            <strong>Título obtenido: Protector Ambiental</strong>
            <p>Ya completaste toda la ruta climática. Abre tu diploma o revisa todos tus logros y récords.</p>
          </div>
          <div className="unity-toolbar-actions">
            <Link className="button button-light" to="/logros">
              Ver logros ({unlockedAchievementCount}/{ACHIEVEMENTS.length})<span aria-hidden="true">↗</span>
            </Link>
            <button type="button" className="button" onClick={() => setShowCelebration(true)}>
              Ver diploma y celebración<span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      )}

      {completed.length > 0 && <details className="epoch-reset">
        <summary>Reiniciar progreso</summary>
        <div><p>Borra las etapas completadas en este navegador y vuelve a empezar por 1970.</p><button type="button" className="text-link" data-sfx="loss" onClick={restartRoute}>Reiniciar la ruta</button></div>
      </details>}
    </section>

    <section className="unity-experience" aria-labelledby="unity-heading" ref={stage}>
      {notice && <div className="epoch-notice" role="status" aria-live="polite"><span>{notice}</span><div className="epoch-notice-actions">{upcoming && <button type="button" onClick={() => { setNotice(null); play(upcoming.id) }}>Abrir siguiente etapa</button>}<button type="button" className="epoch-notice-close" aria-label="Cerrar aviso" onClick={() => setNotice(null)}>×</button></div></div>}
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
            <SectionErrorBoundary resetKey={activeEpoch.id} title="No se pudo cargar este minijuego">
              <Suspense fallback={<div className="timeline-loading" role="status">Preparando escenario interactivo…</div>}>
                <ActiveGame
                  key={activeEpoch.id}
                  onComplete={() => markCompleted(activeEpoch.id)}
                  nextLabel={nextStage ? `Siguiente reto: ${nextStage.title} →` : 'Ver título de Protector Ambiental →'}
                  onNext={() => {
                    markCompleted(activeEpoch.id)
                    if (nextStage) play(nextStage.id)
                    else setShowCelebration(true)
                  }}
                />
              </Suspense>
            </SectionErrorBoundary>
          </GameFrame>}

          <div className="mission-console">
            <p className="unity-note">Los indicadores de cada partida son valores didácticos del escenario; no representan mediciones de emisiones ni datos NASA GISTEMP.</p>
            <div className="mission-console-actions">
              <button type="button" className={`text-link${completed.includes(activeEpoch.id) ? ' is-done' : ''}`} data-sfx="win" onClick={() => markCompleted(activeEpoch.id)}>{completed.includes(activeEpoch.id) ? '✓ Reto completado' : 'Marcar reto completado'}</button>
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
    </section>

    <ProtectorCelebration
      open={showCelebration}
      onClose={() => setShowCelebration(false)}
      onRestart={restartRoute}
    />
  </div>
}
