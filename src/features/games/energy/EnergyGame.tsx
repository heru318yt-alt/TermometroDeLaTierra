import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { FxLayer } from '../shared/canvas'
import { prefersReducedMotion, prepare, safe2d, useBestScore, useHiDpiCanvas, useShake } from '../shared/hooks'
import { BestLine, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  CHALLENGE_TARGET_SCORE, CONFIG, MIN_WIN_CAUGHT, MIN_WIN_IN_ZONE_PCT, RESOURCE_LABEL,
  SCORE_BONUS_STABILITY, SCORE_BONUS_STEP, SCORE_BONUS_STORAGE,
  createGame, demandAt, renewableAvailability, safeZone, step, summarize, totalScore,
  type GameState, type ResourceKind, type Summary,
} from './engine'
import { ResourceBadge } from './icons'
import { H, KIND_COLOR, W, drawScene, type View } from './render'
import './energy.css'

const KEYBOARD_SPEED = 1.15
const KINDS: ResourceKind[] = ['carbon', 'gas', 'renewable', 'storage']

type Phase = 'intro' | 'playing' | 'result'
interface Hud {
  supply: number
  low: number
  high: number
  demand: number
  stored: number
  stability: number
  score: number
  seconds: number
  emissions: number
  renewable: number
  multiplier: number
  cleared: boolean
}

function readHud(s: GameState): Hud {
  const zone = safeZone(s.t)
  return {
    supply: s.supply, low: zone.low, high: zone.high, demand: demandAt(s.t), stored: s.stored, stability: s.stability,
    score: totalScore(s), seconds: s.t, emissions: Math.round(s.emissions),
    renewable: renewableAvailability(s.t), multiplier: s.multiplier, cleared: s.challengeCleared,
  }
}

const LEGEND: Record<ResourceKind, string> = {
  carbon: 'sube mucho la oferta y suelta mucho humo (emisiones)',
  gas: 'sube la oferta con menos emisiones que el carbón',
  renewable: 'sube la oferta sin emisiones por generación; su disponibilidad varía',
  storage: 'guarda energía y la devuelve sola cuando la oferta baja',
}

function explain(summary: Summary): string {
  if (summary.caughtTotal === 0) return 'No atrapaste recursos: la demanda consumió la red hasta apagarla.'
  if (summary.dominant === 'carbon') return 'El carbón sostiene la oferta de golpe, pero dispara las emisiones. Confiabilidad y emisiones son dos indicadores distintos.'
  if (summary.dominant === 'renewable' && summary.emissions < 40) return 'Las renovables no suman emisiones por generación, pero su disponibilidad cambia. Las baterías cubren los huecos.'
  if (summary.dominant === 'storage') return 'El almacenamiento no genera energía nueva: guarda excedentes y los devuelve cuando baja la oferta.'
  if (summary.passed) return 'Superaste la meta arcade combinando estabilidad en la franja verde y respaldo en almacenamiento sin saturar la red.'
  return `Alcanzaste ${summary.total} de ${CHALLENGE_TARGET_SCORE} puntos del reto. Mantén la oferta dentro de la franja verde para activar el multiplicador ×3.`
}

export function EnergyGame({ onComplete, onNext, nextLabel }: { onComplete?: () => void; onNext?: () => void; nextLabel?: string } = {}) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<GameState>(createGame())
  const fx = useRef(new FxLayer())
  const view = useRef<View>({ t: 0, bounce: 0, flash: null, flashT: 0, reduceMotion: prefersReducedMotion() })
  const target = useRef(0.5)
  const keys = useRef({ left: false, right: false })
  const completedThisRun = useRef(false)
  const [phase, setPhase] = useState<Phase>('intro')
  const [hud, setHud] = useState<Hud>(() => readHud(game.current))
  const [summary, setSummary] = useState<Summary | null>(null)
  const [best, submitBest] = useBestScore('energia')
  const [newBest, setNewBest] = useState(false)
  const [shaking, shake] = useShake()

  const redraw = useCallback(() => {
    const ctx = safe2d(canvas.current)
    if (!ctx) return
    prepare(ctx, W, H); drawScene(ctx, game.current, fx.current, view.current)
  }, [])
  useHiDpiCanvas(canvas, W, H, redraw)

  const start = useCallback(() => {
    game.current = createGame(Math.floor(Math.random() * 1e9))
    completedThisRun.current = false
    target.current = 0.5; fx.current.clear()
    setSummary(null); setNewBest(false); setHud(readHud(game.current)); setPhase('playing')
    playSfx('adventure')
    window.requestAnimationFrame(() => canvas.current?.focus({ preventScroll: true }))
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const ctx = safe2d(canvas.current)
    let raf = 0, last = performance.now(), hudClock = 0, wasLow = false, wasHigh = false, warnedStab = false
    const cy = CONFIG.containerY * H
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = game.current, v = view.current, layer = fx.current
      const dir = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0)
      if (dir) target.current = Math.min(1, Math.max(0, target.current + dir * KEYBOARD_SPEED * dt))
      step(s, dt, target.current)

      for (const e of s.fx) {
        if (e.type === 'catch') {
          const x = e.x * W, c = KIND_COLOR[e.kind]
          if (!v.reduceMotion) layer.burst(x, cy, c.light, 12)
          layer.text(x, cy - 24, e.kind === 'storage' ? `+${e.gain} reserva` : `+${e.gain}`, c.light)
          if (e.kind === 'carbon') layer.smoke(x, cy - 6, 6, '#7d808c')
          if (e.kind === 'gas') layer.smoke(x, cy - 6, 3, '#9aa6b8')
          v.bounce = 1; v.flash = e.kind; v.flashT = 0.5
          playSfx(e.kind === 'carbon' ? 'fuel-carbon' : e.kind === 'gas' ? 'fuel-gas' : 'gain')
        } else if (e.type === 'miss') {
          layer.ring(e.x * W, H - 26, '#ff6b6b', 12)
        } else if (e.type === 'streak') {
          layer.text(W / 2, 112, `RACHA ×${e.multiplier}`, '#ffd84d', 24); layer.ring(W / 2, 112, '#ffd84d', 40)
          playSfx('combo')
        } else if (e.type === 'streak-lost') {
          layer.text(W / 2, 146, 'Racha perdida', '#ff8b8b', 16); layer.shake = 0.6
          playSfx('loss'); shake()
        } else if (e.type === 'score-bonus') {
          const parts = [
            e.storage > 0 ? `+${e.storage} batería` : '',
            e.stability > 0 ? `+${e.stability} estabilidad` : '',
          ].filter(Boolean).join(' · ')
          layer.text(W / 2, 82, parts ? `BONO ${parts}` : 'BONO DE RED', '#7ee0a8', 17)
          layer.ring(W / 2, 82, '#7ee0a8', 32)
          playSfx('gain')
        }
      }
      s.fx.length = 0

      if (!completedThisRun.current && s.challengeCleared) {
        completedThisRun.current = true
        submitBest(totalScore(s))
        onCompleteRef.current?.()
      }

      const zone = safeZone(s.t)
      const low = s.supply < zone.low
      const high = s.supply > zone.high
      if ((low && !wasLow) || (high && !wasHigh)) playSfx('warn')
      wasLow = low
      wasHigh = high
      if (!warnedStab && s.stability <= 28) {
        warnedStab = true
        layer.text(W / 2, 184, 'Estabilidad crítica', '#ff8b8b', 17)
        playSfx('warn')
      } else if (s.stability > 45) {
        warnedStab = false
      }

      v.t += dt; v.bounce = Math.max(0, v.bounce - dt * 5); v.flashT = Math.max(0, v.flashT - dt)
      layer.update(dt)
      if (ctx) { prepare(ctx, W, H); drawScene(ctx, s, layer, v) }
      hudClock += dt
      if (hudClock > 0.1) { hudClock = 0; setHud(readHud(s)) }
      if (s.status !== 'playing') {
        const result = summarize(s)
        if (!completedThisRun.current && result.passed) {
          completedThisRun.current = true
          onCompleteRef.current?.()
        } else {
          playSfx(result.passed ? 'win' : 'alarm')
        }
        setHud(readHud(s)); setSummary(result); setNewBest(submitBest(result.total)); setPhase('result')
        return
      }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)

    const onKey = (event: KeyboardEvent, down: boolean) => {
      const targetEl = event.target as HTMLElement | null
      if (down && targetEl?.closest('input, textarea, select, [contenteditable]')) return
      const key = event.key.toLowerCase()
      if (key === 'arrowleft' || key === 'a') { keys.current.left = down; if (down) event.preventDefault() }
      if (key === 'arrowright' || key === 'd') { keys.current.right = down; if (down) event.preventDefault() }
    }
    const kd = (e: KeyboardEvent) => onKey(e, true), ku = (e: KeyboardEvent) => onKey(e, false)
    const onBlur = () => { keys.current = { left: false, right: false } }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', onBlur)
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', onBlur); keys.current = { left: false, right: false } }
  }, [phase, shake, submitBest])

  useEffect(() => { if (phase !== 'playing') redraw() }, [phase, redraw])

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width > 0) target.current = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  }

  function pointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    pointerMove(event)
  }

  const inZone = hud.supply >= hud.low && hud.supply <= hud.high
  const status = hud.supply < hud.low ? 'Oferta baja' : hud.supply > hud.high ? 'Oferta alta' : 'Zona segura'
  const won = summary?.passed ?? false
  const coach = hud.supply < hud.low
    ? { tone: 'bad' as const, tag: 'OFERTA BAJA', text: 'Mueve el colector (puntero o ← →) bajo recursos para evitar el apagón.' }
    : hud.supply > hud.high
      ? { tone: 'warn' as const, tag: 'OFERTA ALTA', text: 'Saliste por arriba de la zona segura: esquiva fuentes altas para no perder estabilidad.' }
      : hud.stored < 10
        ? { tone: 'ok' as const, tag: 'EN ZONA SEGURA', text: `Mantén la franja verde (${hud.cleared ? '¡Reto cumplido! Sigue por tu récord' : `meta: ${CHALLENGE_TARGET_SCORE} pts`}).` }
        : { tone: 'ok' as const, tag: 'RED ESTABLE', text: 'Tienes respaldo en batería. Sigue acumulando racha y puntaje arcade.' }

  return <div className={`gs-game energy-game${shaking ? ' is-shaking' : ''}`}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="PUNTAJE ARCADE" value={hud.score} icon={Icon.star} tone="accent" />
      <Stat label="META DEL RETO" value={hud.cleared ? '★ CUMPLIDO' : `${hud.score} / ${CHALLENGE_TARGET_SCORE}`} icon={Icon.check} tone={hud.cleared ? 'ok' : undefined} />
      <Streak multiplier={hud.multiplier} detail={hud.multiplier > 1 ? 'red estable' : `${CONFIG.streakStep} s en zona`} />
      <Gauge label="ESTABILIDAD DE RED" value={Math.round(hud.stability)} max={CONFIG.startStability} icon={Icon.bolt} />
      <Gauge label="ALMACENADO" value={Math.round(hud.stored)} max={CONFIG.storageCap} icon={Icon.battery} fill />
      <Stat label="EMISIONES (ESCENARIO)" value={hud.emissions} icon={Icon.smoke} tone={hud.emissions > 120 ? 'warn' : undefined} />
      <Stat label="SOL Y VIENTO" value={`${Math.round(hud.renewable * 100)} %`} icon={Icon.leaf} tone={hud.renewable > 0.6 ? 'ok' : undefined} />
    </div>

    <div className="gs-stage gs-stage-fit energy-stage">
      <canvas ref={canvas} width={W} height={H} tabIndex={0}
        aria-label="Área de juego: mueve el colector con el puntero, o con las flechas o las teclas A y D, para atrapar recursos energéticos."
        onPointerMove={pointerMove} onPointerDown={pointerDown} />

      {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Mantén la red · instrucciones">
        <div className="gs-card">
          <p className="eyebrow">MODO ARCADE · LA RED ELÉCTRICA</p>
          <h3>Mantén la red</h3>
          <p>Los recursos caen sin parar cada vez más rápido y la demanda aumenta. Mueve el colector para mantener la oferta dentro de la zona segura y acumular el mayor puntaje posible sin sufrir apagón ni colapso por inestabilidad.</p>
          <ul className="gs-legend">{KINDS.map(kind => <li key={kind}><ResourceBadge kind={kind} /> <span><b>{RESOURCE_LABEL[kind]}</b>: {LEGEND[kind]}</span></li>)}</ul>
          <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Meta para desbloquear el reto: alcanza {CHALLENGE_TARGET_SCORE} puntos (≥ {MIN_WIN_IN_ZONE_PCT} % en zona segura y ≥ {MIN_WIN_CAUGHT} capturas). Cada {SCORE_BONUS_STEP} puntos recibes un pequeño respaldo extra (+{SCORE_BONUS_STORAGE} batería y +{SCORE_BONUS_STABILITY} estabilidad).</span></p>
          <button type="button" className="button" data-sfx="none" onClick={start}>Empezar ↗</button>
        </div>
      </div>}

      {phase === 'result' && summary && <div className={`gs-overlay ${won ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado de la partida">
        <div className="gs-card">
          {won && <span className="gs-win-stamp">★ RETO COMPLETADO</span>}
          <p className="eyebrow">FIN DE PARTIDA ARCADE · {summary.cause === 'blackout' ? 'APAGÓN POR BAJA OFERTA' : 'SOBRECARGA DE RED'}</p>
          <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS · {Math.round(summary.seconds)} S EN LA RED</span></div>
          <ResultGrid items={[
            { label: 'En zona segura', value: `${Math.round(summary.inZonePct)} % (${Math.round(game.current.inZoneTime)} s)`, tone: summary.checks.inZone ? 'ok' : 'warn' },
            { label: 'Bono por racha', value: `+${summary.bonus}`, tone: summary.bonus > 0 ? 'ok' : undefined },
            { label: 'Mejor racha', value: `×${summary.bestMultiplier}` },
            { label: 'Recursos capturados', value: `${summary.caughtTotal}`, tone: summary.checks.active ? 'ok' : 'warn' },
            { label: 'Emisiones', value: summary.emissions, tone: summary.emissionsPerSecond > 1.2 ? 'warn' : 'ok' },
          ]} />
          <ul className="gs-checklist" aria-label="Condiciones del reto">
            <li className={summary.checks.score ? 'is-ok' : 'is-fail'}>
              <b>{summary.checks.score ? '✓' : '✕'}</b>
              <span>Meta de puntaje arcade: {summary.total} / {CHALLENGE_TARGET_SCORE} puntos</span>
            </li>
            <li className={summary.checks.inZone ? 'is-ok' : 'is-fail'}>
              <b>{summary.checks.inZone ? '✓' : '✕'}</b>
              <span>Tiempo en zona segura: {Math.round(summary.inZonePct)} % / {MIN_WIN_IN_ZONE_PCT} % mínimo</span>
            </li>
            <li className={summary.checks.active ? 'is-ok' : 'is-fail'}>
              <b>{summary.checks.active ? '✓' : '✕'}</b>
              <span>Recursos capturados: {summary.caughtTotal} / {MIN_WIN_CAUGHT} mínimo</span>
            </li>
          </ul>
          <p className="gs-explain">{explain(summary)}</p>
          <BestLine best={best} isNew={newBest} />
          <div className="gs-modal-actions">
            {won && onNext && <button type="button" className="button" onClick={onNext}>{nextLabel ?? 'Siguiente minijuego →'}</button>}
            <button type="button" className={won && onNext ? 'gs-retry-btn' : 'button'} data-sfx="none" onClick={start}>{won ? 'Jugar otra vez ↗' : 'Reintentar reto ↗'}</button>
          </div>
        </div>
      </div>}
    </div>

    <div className="energy-bar-wrap">
      {phase === 'playing' && (
        <div className={`gs-coach is-${coach.tone}`} aria-live="polite">
          <span className="gs-coach-tag">{coach.tag}</span>
          <span>{coach.text}</span>
        </div>
      )}
      <div className="energy-bar-label"><span>OFERTA vs. DEMANDA</span><strong className={inZone ? 'is-ok' : 'is-warn'}>{status}</strong></div>
      <div className={`energy-bar${inZone ? '' : ' is-alert'}`} role="meter" aria-label="Oferta eléctrica" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.supply)} aria-valuetext={`${Math.round(hud.supply)} de 100. ${status}`}>
        <div className="energy-zone" style={{ left: `${Math.max(0, hud.low)}%`, width: `${Math.min(100, hud.high) - Math.max(0, hud.low)}%` }} />
        <div className={`energy-fill ${inZone ? 'is-ok' : 'is-warn'}`} style={{ width: `${Math.max(0, Math.min(100, hud.supply))}%` }} />
        <div className="energy-demand" style={{ left: `${hud.demand}%` }} title="Demanda" />
      </div>
      <p className="gs-help">Mueve el puntero sobre el juego, arrastra con el dedo, o usa ← → / A D. La franja verde es la zona segura y exige precisión constante.</p>
    </div>
  </div>
}
