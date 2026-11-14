import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { FxLayer } from '../shared/canvas'
import { prefersReducedMotion, prepare, useBestScore, useHiDpiCanvas, useShake } from '../shared/hooks'
import { BestLine, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  CONFIG, RESOURCE_LABEL, createGame, demandAt, remainingResources, renewableAvailability, safeZone, step, summarize, totalScore,
  type GameState, type ResourceKind, type Summary,
} from './engine'
import { ResourceBadge } from './icons'
import { H, KIND_COLOR, W, drawScene, type View } from './render'
import './energy.css'

const KEYBOARD_SPEED = 1.1 // fracciones del ancho por segundo
const KINDS: ResourceKind[] = ['carbon', 'gas', 'renewable', 'storage']

type Phase = 'intro' | 'playing' | 'result'
interface Hud { supply: number; low: number; high: number; demand: number; stored: number; fuel: number; score: number; seconds: number; emissions: number; remaining: number; renewable: number; multiplier: number }

function readHud(s: GameState): Hud {
  const zone = safeZone(s.t)
  return {
    supply: s.supply, low: zone.low, high: zone.high, demand: demandAt(s.t), stored: s.stored, fuel: s.fuel,
    score: totalScore(s), seconds: s.t, emissions: Math.round(s.emissions),
    remaining: remainingResources(s), renewable: renewableAvailability(s.t), multiplier: s.multiplier,
  }
}

const LEGEND: Record<ResourceKind, string> = {
  carbon: 'sube mucho la oferta y suelta mucho humo (emisiones)',
  gas: 'sube la oferta con menos emisiones que el carbón',
  renewable: 'sube la oferta sin emisiones por generación; su disponibilidad varía',
  storage: 'guarda energía y la devuelve sola cuando la oferta baja',
}

function explain(summary: Summary): string {
  if (summary.caughtTotal === 0) return 'No llegaste a atrapar recursos: el colector gastó su combustible sin generar nada nuevo y la demanda agotó la red.'
  if (summary.dominant === 'carbon') return 'El carbón mantiene la barra de forma inmediata, pero cada captura suma muchas emisiones. Confiabilidad y emisiones son dos indicadores distintos.'
  if (summary.dominant === 'renewable' && summary.emissions < 40) return 'Las renovables no suman emisiones por generación, pero su disponibilidad cambia. El almacenamiento ayuda a cubrir los huecos.'
  if (summary.dominant === 'storage') return 'El almacenamiento no genera energía: solo guarda la que ya hay para devolverla cuando la demanda sube.'
  return 'Una mezcla de fuentes cubre la demanda sin depender de una sola. Aun así, cada opción tiene un compromiso entre estabilidad, disponibilidad y emisiones.'
}

export function EnergyGame() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<GameState>(createGame())
  const fx = useRef(new FxLayer())
  const view = useRef<View>({ t: 0, bounce: 0, flash: null, flashT: 0, reduceMotion: prefersReducedMotion() })
  const target = useRef(0.5)
  const keys = useRef({ left: false, right: false })
  const [phase, setPhase] = useState<Phase>('intro')
  const [hud, setHud] = useState<Hud>(() => readHud(game.current))
  const [summary, setSummary] = useState<Summary | null>(null)
  const [best, submitBest] = useBestScore('energia')
  const [newBest, setNewBest] = useState(false)
  const [shaking, shake] = useShake()

  const redraw = useCallback(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    prepare(ctx, W, H); drawScene(ctx, game.current, fx.current, view.current)
  }, [])
  useHiDpiCanvas(canvas, W, H, redraw)

  const start = useCallback(() => {
    game.current = createGame(Math.floor(Math.random() * 1e9))
    target.current = 0.5; fx.current.clear()
    setSummary(null); setNewBest(false); setHud(readHud(game.current)); setPhase('playing')
    playSfx('adventure')
    window.requestAnimationFrame(() => canvas.current?.focus({ preventScroll: true }))
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const ctx = canvas.current?.getContext('2d') ?? null
    let raf = 0, last = performance.now(), hudClock = 0, wasLow = false, warnedLast = false, warnedFuel = false
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
          playSfx('gain')
        } else if (e.type === 'miss') {
          layer.ring(e.x * W, H - 26, '#ff6b6b', 12)
        } else if (e.type === 'streak') {
          layer.text(W / 2, 112, `RACHA ×${e.multiplier}`, '#ffd84d', 24); layer.ring(W / 2, 112, '#ffd84d', 40)
          playSfx('combo')
        } else if (e.type === 'streak-lost') {
          layer.text(W / 2, 146, 'Racha perdida', '#ff8b8b', 16); layer.shake = 0.6
          playSfx('loss'); shake()
        }
      }
      s.fx.length = 0

      const low = s.supply < safeZone(s.t).low
      if (low && !wasLow) playSfx('warn')
      wasLow = low
      if (!warnedLast && remainingResources(s) <= 10 && s.spawned >= CONFIG.pool - 10) { warnedLast = true; layer.text(W / 2, 150, 'Quedan 10 recursos', '#ffb02e', 17) }
      if (!warnedFuel && s.fuel <= 30) { warnedFuel = true; layer.text(W / 2, 184, 'Combustible bajo', '#ff8b8b', 17); playSfx('warn') }

      v.t += dt; v.bounce = Math.max(0, v.bounce - dt * 5); v.flashT = Math.max(0, v.flashT - dt)
      layer.update(dt)
      if (ctx) { prepare(ctx, W, H); drawScene(ctx, s, layer, v) }
      hudClock += dt
      if (hudClock > 0.1) { hudClock = 0; setHud(readHud(s)) }
      if (s.status !== 'playing') {
        const result = summarize(s)
        playSfx(result.exhausted ? 'win' : 'loss')
        setHud(readHud(s)); setSummary(result); setNewBest(submitBest(result.total)); setPhase('result')
        return
      }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)

    // Teclado activo durante la partida aunque el foco no esté en el lienzo.
    const onKey = (event: KeyboardEvent, down: boolean) => {
      const key = event.key.toLowerCase()
      if (key === 'arrowleft' || key === 'a') { keys.current.left = down; event.preventDefault() }
      if (key === 'arrowright' || key === 'd') { keys.current.right = down; event.preventDefault() }
    }
    const kd = (e: KeyboardEvent) => onKey(e, true), ku = (e: KeyboardEvent) => onKey(e, false)
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); keys.current = { left: false, right: false } }
  }, [phase, shake, submitBest])

  // Dibujo estático en la introducción y el resultado.
  useEffect(() => { if (phase !== 'playing') redraw() }, [phase, redraw])

  function pointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width > 0) target.current = (event.clientX - rect.left) / rect.width
  }

  const inZone = hud.supply >= hud.low && hud.supply <= hud.high
  const status = hud.supply < hud.low ? 'Oferta baja' : hud.supply > hud.high ? 'Oferta alta' : 'Zona segura'
  const exhausted = summary?.exhausted ?? false

  return <div className={`gs-game energy-game${shaking ? ' is-shaking' : ''}`}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="PUNTAJE" value={hud.score} icon={Icon.star} tone="accent" />
      <Streak multiplier={hud.multiplier} detail={hud.multiplier > 1 ? 'red estable' : `${CONFIG.streakStep} s en zona`} />
      <Gauge label="RESERVA DE RECURSOS" value={hud.remaining} max={CONFIG.pool} icon={Icon.box} />
      <Gauge label="COMBUSTIBLE DEL COLECTOR" value={Math.round(hud.fuel)} max={CONFIG.startFuel} icon={Icon.bolt} />
      <Gauge label="ALMACENADO" value={Math.round(hud.stored)} max={CONFIG.storageCap} icon={Icon.battery} fill />
      <Stat label="EMISIONES (ESCENARIO)" value={hud.emissions} icon={Icon.smoke} tone={hud.emissions > 120 ? 'warn' : undefined} />
      <Stat label="SOL Y VIENTO" value={`${Math.round(hud.renewable * 100)} %`} icon={Icon.leaf} tone={hud.renewable > 0.6 ? 'ok' : undefined} />
    </div>

    <div className="gs-stage gs-stage-fit energy-stage">
      <canvas ref={canvas} width={W} height={H} tabIndex={0}
        aria-label="Área de juego: mueve el colector con el puntero, o con las flechas o las teclas A y D, para atrapar recursos energéticos."
        onPointerMove={pointerMove} onPointerDown={pointerMove} />

      {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Mantén la red · instrucciones">
        <div className="gs-card">
          <p className="eyebrow">CONTEXTO · LA RED ELÉCTRICA</p>
          <h3>Mantén la red</h3>
          <p>La ciudad consume energía sin parar. Mueve el colector y atrapa los recursos que caen para que la barra de oferta se quede dentro de la zona segura el mayor tiempo posible. La reserva es finita y el colector gasta combustible cada vez más rápido: la partida termina cuando no queda nada.</p>
          <ul className="gs-legend">{KINDS.map(kind => <li key={kind}><ResourceBadge kind={kind} /> <span><b>{RESOURCE_LABEL[kind]}</b>: {LEGEND[kind]}</span></li>)}</ul>
          <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Racha: cada {CONFIG.streakStep} s seguidos en zona segura multiplica tus puntos (hasta ×{CONFIG.maxMultiplier}). El combustible del colector se agota solo y cada vez más rápido.</span></p>
          <button type="button" className="button" onClick={start}>Empezar ↗</button>
        </div>
      </div>}

      {phase === 'result' && summary && <div className={`gs-overlay ${exhausted ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado de la partida">
        <div className="gs-card">
          <p className="eyebrow">RESULTADO · {exhausted ? 'SIN COMBUSTIBLE' : 'APAGÓN'}</p>
          <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS</span></div>
          <ResultGrid items={[
            { label: 'En zona segura', value: `${Math.round(game.current.inZoneTime)} s de ${Math.round(summary.seconds)} s` },
            { label: 'Bono por racha', value: `+${summary.bonus}`, tone: summary.bonus > 0 ? 'ok' : undefined },
            { label: 'Mejor racha', value: `×${summary.bestMultiplier}` },
            { label: 'Combustible restante', value: `${summary.fuelLeft} / ${CONFIG.startFuel}`, tone: summary.fuelLeft === 0 ? 'warn' : undefined },
            { label: 'Emisiones', value: summary.emissions, tone: summary.emissionsPerSecond > 1.2 ? 'warn' : 'ok' },
          ]} />
          <p>{exhausted ? 'La red se quedó sin combustible: ya no queda reserva para seguir.' : 'La red se apagó antes de agotar el combustible.'}{summary.cleanGrid ? ' Medalla «red limpia»: buen puntaje con pocas emisiones por segundo.' : ''}</p>
          <p className="gs-explain">{explain(summary)}</p>
          <BestLine best={best} isNew={newBest} />
          <button type="button" className="button" onClick={start}>Jugar otra vez ↗</button>
        </div>
      </div>}
    </div>

    <div className="energy-bar-wrap">
      <div className="energy-bar-label"><span>OFERTA vs. DEMANDA</span><strong className={inZone ? 'is-ok' : 'is-warn'}>{status}</strong></div>
      <div className={`energy-bar${inZone ? '' : ' is-alert'}`} role="meter" aria-label="Oferta eléctrica" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.supply)} aria-valuetext={`${Math.round(hud.supply)} de 100. ${status}`}>
        <div className="energy-zone" style={{ left: `${Math.max(0, hud.low)}%`, width: `${Math.min(100, hud.high) - Math.max(0, hud.low)}%` }} />
        <div className={`energy-fill ${inZone ? 'is-ok' : 'is-warn'}`} style={{ width: `${Math.max(0, Math.min(100, hud.supply))}%` }} />
        <div className="energy-demand" style={{ left: `${hud.demand}%` }} title="Demanda" />
      </div>
      <p className="gs-help">Mueve el puntero sobre el juego, arrastra con el dedo, o usa ← → / A D. La franja verde es la zona segura; la línea blanca marca la demanda.</p>
    </div>
  </div>
}
