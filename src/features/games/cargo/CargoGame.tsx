import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { FxLayer } from '../shared/canvas'
import { prefersReducedMotion, prepare, useBestScore, useHiDpiCanvas, useShake } from '../shared/hooks'
import { BestLine, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  ENERGY_BUDGET, MIN_POWER, MODES, MODE_ORDER, ORIGIN, ROUND_SECONDS, ROUTES, canLaunch, createGame, launch, nextRound, reaches, routeCenter, routeKm,
  step, streakMultiplier, summarize, totalScore, type GameState, type Mode, type Summary,
} from './engine'
import { VehicleIcon } from './icons'
import { H, MODE_COLOR, W, drawScene, px, py, type View } from './render'
import './cargo.css'

const PULL_MAX = 110

type Phase = 'intro' | 'briefing' | 'playing' | 'round-over' | 'final'
interface Hud { route: number; timeLeft: number; energy: number; cooldown: number; score: number; delivered: number; emissions: number; streak: number }

function readHud(s: GameState): Hud {
  return { route: s.routeIndex, timeLeft: Math.max(0, ROUND_SECONDS - s.roundTime), energy: s.energy, cooldown: s.cooldown, score: totalScore(s), delivered: s.delivered, emissions: s.emissionsKg / 1000, streak: s.streak }
}

function explain(summary: Summary, state: GameState): string {
  if (summary.score === 0) return 'No lograste entregar cajas. Revisa el alcance de cada modo: no todos llegan a todas las rutas.'
  if (summary.dominant === 'plane') return 'El avión llega rápido y lejos, pero emite muchísimo más por tonelada-km. Para comparar modos hay que normalizar el servicio: la misma carga y la misma distancia.'
  if (state.deliveredByRoute[2] === 0) return 'El ferrocarril y la carretera no alcanzaron la ruta más larga. El modo adecuado depende de la distancia, la carga y el tiempo disponible.'
  if (summary.cleanRoute) return 'Elegiste modos eficientes por tonelada-km y repartiste la energía entre las rutas. Aun así, cada modo tiene un compromiso entre tiempo, alcance y precisión.'
  return 'El mismo envío puede tener resultados muy distintos según la distancia, la carga y el modo. No hay un modo mejor en todos los casos.'
}

export function CargoGame() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<GameState>(createGame())
  const fx = useRef(new FxLayer())
  const view = useRef<View>({ t: 0, aiming: false, pull: null, reduceMotion: prefersReducedMotion() })
  const roundStart = useRef({ lost: 0, late: 0, delivered: 0, launched: 0 })
  const [phase, setPhase] = useState<Phase>('intro')
  const [hud, setHud] = useState<Hud>(() => readHud(game.current))
  const [mode, setMode] = useState<Mode>('rail')
  const [angle, setAngle] = useState(45)
  const [power, setPower] = useState(0.7)
  const [message, setMessage] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [best, submitBest] = useBestScore('transporte')
  const [newBest, setNewBest] = useState(false)
  const [shaking, shake] = useShake()
  const aim = useRef({ mode, angle, power }); aim.current = { mode, angle, power }
  const phaseRef = useRef(phase); phaseRef.current = phase

  const redraw = useCallback(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    prepare(ctx, W, H)
    drawScene(ctx, game.current, aim.current.mode, aim.current.angle, aim.current.power, phaseRef.current === 'briefing' || phaseRef.current === 'playing', fx.current, view.current)
  }, [])
  useHiDpiCanvas(canvas, W, H, redraw)

  const beginRound = useCallback(() => {
    const s = game.current
    roundStart.current = { lost: s.lost, late: s.late, delivered: s.delivered, launched: s.launched }
    fx.current.clear()
    setHud(readHud(s)); setMessage(''); setPhase('briefing')
  }, [])

  const start = useCallback(() => { game.current = createGame(); setSummary(null); setNewBest(false); playSfx('adventure'); beginRound() }, [beginRound])
  const play = useCallback(() => { playSfx('map'); setPhase('playing') }, [])

  const fire = useCallback(() => {
    const s = game.current, { mode: m, angle: a, power: p } = aim.current
    const can = canLaunch(s, m)
    if (!can.ok) { setMessage(can.reason ?? ''); return }
    if (p < MIN_POWER) { setMessage('Sube la potencia para lanzar.'); return }
    launch(s, m, a, p); setMessage(''); playSfx('click'); setHud(readHud(s))
    fx.current.smoke(px(ORIGIN.x), py(ORIGIN.y) - 6, 2, '#eef2f7')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    const ctx = canvas.current?.getContext('2d') ?? null
    let raf = 0, last = performance.now(), clock = 0, lastTick = Math.ceil(ROUND_SECONDS - game.current.roundTime)
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = game.current, layer = fx.current, v = view.current
      step(s, dt)
      for (const e of s.fx) {
        const x = px(e.type === 'land' ? e.x : routeCenter(ROUTES[s.routeIndex]))
        if (e.type === 'land') {
          if (e.ok) { if (!v.reduceMotion) layer.burst(x, py(0) - 4, '#ffd84d', 8, 70); playSfx('gain') }
          else layer.smoke(x, py(0) - 2, 3, '#a68a64')
        } else if (e.type === 'batch') {
          if (e.delivered > 0) layer.text(x, py(0) - 48, e.multiplier > 1 ? `+${e.delivered} ×${e.multiplier}` : `+${e.delivered}`, e.multiplier > 1 ? '#ffd84d' : '#7dffae', e.multiplier > 1 ? 18 : 15)
          else layer.text(x, py(0) - 40, 'Lote perdido', '#ff8b8b', 13)
          if (e.multiplier > 1) { layer.ring(x, py(0) - 48, '#ffd84d', 30); playSfx('combo') }
        } else if (e.type === 'streak-lost') {
          layer.shake = 0.5; playSfx('loss'); shake()
        }
      }
      s.fx.length = 0
      const secs = Math.ceil(ROUND_SECONDS - s.roundTime)
      if (secs !== lastTick) { lastTick = secs; if (secs <= 5 && secs > 0) playSfx('warn') }
      v.t += dt; layer.update(dt)
      if (ctx) { prepare(ctx, W, H); drawScene(ctx, s, aim.current.mode, aim.current.angle, aim.current.power, true, layer, v) }
      clock += dt
      if (clock > 0.08) { clock = 0; setHud(readHud(s)) }
      if (s.status !== 'playing') {
        setHud(readHud(s))
        if (s.status === 'round-over') setPhase('round-over')
        return
      }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(raf)
  }, [phase, shake])

  useEffect(() => { if (phase !== 'playing') redraw() }, [phase, mode, angle, power, hud.route, redraw])

  function nextOrFinish() {
    const s = game.current
    nextRound(s)
    if (s.status === 'finished') {
      const result = summarize(s)
      setSummary(result); setNewBest(submitBest(result.total)); setPhase('final'); playSfx(result.score > 0 ? 'win' : 'loss')
      return
    }
    beginRound()
  }

  function aimFromPointer(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    const k = W / rect.width
    const lx = (event.clientX - rect.left) * k, ly = (event.clientY - rect.top) * k
    const dx = px(ORIGIN.x) - lx, dy = ly - py(ORIGIN.y)
    const dist = Math.hypot(dx, dy), clamped = Math.min(dist, PULL_MAX)
    if (dx > 2) setAngle(Math.round(Math.min(80, Math.max(10, (Math.atan2(dy, dx) * 180) / Math.PI))))
    setPower(Math.round(Math.min(1, dist / PULL_MAX) * 100) / 100)
    const u = dist > 0 ? clamped / dist : 0
    view.current.pull = { x: px(ORIGIN.x) - dx * u * 0.45, y: py(ORIGIN.y) + dy * u * 0.45 }
  }

  const round = ROUTES[hud.route]
  const def = MODES[mode]
  const canFire = hud.cooldown <= 0 && hud.energy >= def.energy && phase === 'playing'
  const roundDelivered = game.current.delivered - roundStart.current.delivered
  const roundLost = game.current.lost - roundStart.current.lost
  const roundLate = game.current.late - roundStart.current.late
  const multiplier = streakMultiplier(hud.streak)

  return <div className={`gs-game cargo-game${shaking ? ' is-shaking' : ''}`}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="PUNTAJE" value={hud.score} icon={Icon.star} tone="accent" />
      <Streak multiplier={multiplier} detail={`${hud.streak} lote${hud.streak === 1 ? '' : 's'} preciso${hud.streak === 1 ? '' : 's'}`} />
      <Stat label={`RUTA ${hud.route + 1} DE ${ROUTES.length}`} value={`${round.name} · ${routeKm(round)} km`} icon={Icon.route} />
      <Stat label="TIEMPO DE LA RUTA" value={`${Math.ceil(hud.timeLeft)} s`} icon={Icon.clock} tone={phase === 'playing' && hud.timeLeft <= 5 ? 'warn' : undefined} />
      <Gauge label="ENERGÍA (COMPARTIDA)" value={hud.energy} max={ENERGY_BUDGET} icon={Icon.bolt} />
      <Stat label="EMISIONES (ESCENARIO)" value={`${hud.emissions.toFixed(1)} t CO₂e`} icon={Icon.smoke} />
    </div>

    <div className="gs-stage gs-stage-fit cargo-stage">
      <canvas ref={canvas} width={W} height={H} aria-label="Zona de lanzamiento: arrastra desde la ciudad de origen hacia atrás para apuntar y suelta para lanzar, o usa los controles de ángulo, potencia y el botón Lanzar."
        onPointerDown={event => { if (phase !== 'playing') return; view.current.aiming = true; event.currentTarget.setPointerCapture?.(event.pointerId); aimFromPointer(event) }}
        onPointerMove={event => { if (view.current.aiming) aimFromPointer(event) }}
        onPointerUp={() => { if (view.current.aiming) { view.current.aiming = false; view.current.pull = null; fire() } }}
        onPointerCancel={() => { view.current.aiming = false; view.current.pull = null }} />

      {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Carga entre ciudades · instrucciones">
        <div className="gs-card">
          <p className="eyebrow">CONTEXTO · TRANSPORTE DE CARGA</p>
          <h3>Carga entre ciudades</h3>
          <p>Lanza cajas desde la ciudad de origen hasta la plataforma del destino antes de que se acabe el tiempo de cada ruta. Arrastra hacia atrás para apuntar o usa los controles. Cada modo de transporte es un lanzador distinto.</p>
          <ul className="gs-legend">{MODE_ORDER.map(m => <li key={m}><VehicleIcon mode={m} /> <span><b>{MODES[m].label}</b>: {MODES[m].boxes} caja{MODES[m].boxes > 1 ? 's' : ''} por lanzamiento, {MODES[m].energy} de energía. {MODES[m].note}</span></li>)}</ul>
          <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>La energía es una sola para las tres rutas y no se recupera. Lotes precisos seguidos (al menos la mitad en la plataforma) multiplican las cajas: ×2 desde el 3.º y ×3 desde el 5.º. Una colina bloquea los tiros bajos.</span></p>
          <button type="button" className="button" onClick={start}>Empezar ↗</button>
        </div>
      </div>}

      {phase === 'briefing' && <div className="gs-overlay is-compact" role="dialog" aria-label="Información de la ruta">
        <div className="gs-card">
          <p className="eyebrow">RUTA {hud.route + 1} DE {ROUTES.length} · {round.name.toUpperCase()}</p>
          <p>{round.text} Distancia: {routeKm(round)} km. Tiempo: {ROUND_SECONDS} s. Energía disponible: {hud.energy}.</p>
          <p>Alcanzan: {MODE_ORDER.filter(m => reaches(m, round)).map(m => MODES[m].label).join(', ')}.</p>
          <button type="button" className="button" onClick={play}>Empezar la ruta ↗</button>
        </div>
      </div>}

      {phase === 'round-over' && <div className="gs-overlay is-compact" role="dialog" aria-label="Resultado de la ruta">
        <div className="gs-card">
          <p className="eyebrow">FIN DE LA RUTA {hud.route + 1} · {game.current.endReason === 'energy' ? 'SIN ENERGÍA' : 'SE ACABÓ EL TIEMPO'}</p>
          <p>Entregaste {roundDelivered} caja{roundDelivered === 1 ? '' : 's'}. Se perdieron {roundLost} por caer fuera de la zona o chocar con la colina{roundLate ? ` y ${roundLate} llegaron tarde` : ''}. Energía restante para lo que queda: {hud.energy}.</p>
          <button type="button" className="button" onClick={nextOrFinish}>{hud.route + 1 >= ROUTES.length ? 'Ver resultado final ↗' : 'Siguiente ruta ↗'}</button>
        </div>
      </div>}

      {phase === 'final' && summary && <div className={`gs-overlay ${summary.score > 0 ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado final">
        <div className="gs-card">
          <p className="eyebrow">RESULTADO FINAL</p>
          <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS · {summary.score} CAJAS ENTREGADAS</span></div>
          <ResultGrid items={[
            { label: 'Por ruta', value: game.current.deliveredByRoute.join(' · ') },
            { label: 'Bono por racha', value: `+${summary.bonus}`, tone: summary.bonus > 0 ? 'ok' : undefined },
            { label: 'Mejor racha', value: `${summary.bestStreak} lotes` },
            { label: 'g CO₂e por t-km', value: Math.round(summary.gPerTkm), tone: summary.gPerTkm > 0 && summary.gPerTkm <= 100 ? 'ok' : 'warn' },
          ]} />
          <p>Lanzaste {summary.launched} cajas. Emisiones del escenario: {summary.emissionsTonnes.toFixed(1)} t CO₂e.{summary.cleanRoute ? ' Medalla «ruta limpia».' : ''}</p>
          <p className="gs-explain">{explain(summary, game.current)}</p>
          <BestLine best={best} isNew={newBest} />
          <button type="button" className="button" onClick={start}>Jugar otra vez ↗</button>
        </div>
      </div>}
    </div>

    <div className="cargo-controls">
      <div className="cargo-modes" role="radiogroup" aria-label="Modo de transporte">
        {MODE_ORDER.map(m => <button key={m} type="button" role="radio" aria-checked={mode === m} className={`gs-choice cargo-mode${mode === m ? ' is-active' : ''}${phase !== 'intro' && !reaches(m, round) ? ' is-short' : ''}`} style={{ '--mode': MODE_COLOR[m] } as React.CSSProperties} onClick={() => setMode(m)}>
          <VehicleIcon mode={m} /><span>{MODES[m].label}</span>
          <small>{MODES[m].boxes} caja{MODES[m].boxes > 1 ? 's' : ''} · {MODES[m].energy} energía · {MODES[m].gPerTkm} g/t-km{phase !== 'intro' && !reaches(m, round) ? ' · no alcanza' : ''}</small>
        </button>)}
      </div>
      <div className="cargo-aim">
        <label>Ángulo: {MODES[mode].fixedAngle !== null ? `${MODES[mode].fixedAngle}° (fijo)` : `${angle}°`}
          <input type="range" min={10} max={80} step={1} value={MODES[mode].fixedAngle ?? angle} disabled={MODES[mode].fixedAngle !== null} onChange={event => setAngle(Number(event.target.value))} aria-label="Ángulo de lanzamiento" />
        </label>
        <label>Potencia: {Math.round(power * 100)} %
          <input type="range" min={20} max={100} step={1} value={Math.round(power * 100)} onChange={event => setPower(Number(event.target.value) / 100)} aria-label="Potencia de lanzamiento" />
        </label>
        <button type="button" className="button cargo-fire" disabled={!canFire} onClick={fire}>{hud.cooldown > 0 ? `Recargando ${hud.cooldown.toFixed(1)} s` : 'Lanzar ↗'}</button>
      </div>
    </div>
    <p className={`gs-help${message ? ' is-alert' : ''}`} role="status">{message || `${def.note} Destino a ${routeKm(round)} km; el marcador rojo muestra dónde caería el centro del lote. Valores didácticos del escenario, no mediciones reales.`}</p>
  </div>
}
