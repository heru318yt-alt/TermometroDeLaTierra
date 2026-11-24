import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { playVictoryFanfare } from '../../audio/victorySound'
import { FxLayer } from '../shared/canvas'
import { prefersReducedMotion, prepare, safe2d, useBestScore, useHiDpiCanvas, useShake } from '../shared/hooks'
import { BestLine, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  ENERGY_BUDGET, MIN_POWER, MODES, MODE_ORDER, ORIGIN, ROUND_SECONDS, ROUTES, ZONE_HALF, canLaunch, createGame, hillBlocks, landingX, launch, nextRound, reaches, routeCenter, routeKm,
  step, streakMultiplier, summarize, totalScore, trajectory, type GameState, type Mode, type Summary,
} from './engine'
import { VehicleIcon } from './icons'
import { H, MODE_COLOR, W, drawScene, px, py, type DragView, type View } from './render'
import { MODE_CONTROL, evaluateDrag, handlePos, isInLauncherZone, stepSmoothedAim, type Point } from './slingshot'
import './cargo.css'

type Phase = 'intro' | 'briefing' | 'playing' | 'round-over' | 'final'
interface Hud { route: number; timeLeft: number; energy: number; cooldown: number; score: number; delivered: number; emissions: number; streak: number }
interface DragSession {
  active: boolean
  pointerId: number | null
  start: Point
  current: Point
  armed: boolean
  atMax: boolean
  offAxisWarning: boolean
  tension: number
  lastStep: number
  targetAngle: number
  targetPower: number
  steppedInRaf: boolean
}

const emptyDragView = (): DragView => ({
  active: false,
  armed: false,
  hovered: false,
  canFire: true,
  atMax: false,
  offAxisWarning: false,
  tension: 0,
  pointer: null,
  pull: null,
  showIntroCue: true,
})

const idleSession = (): DragSession => ({
  active: false,
  pointerId: null,
  start: { x: 0, y: 0 },
  current: { x: 0, y: 0 },
  armed: false,
  atMax: false,
  offAxisWarning: false,
  tension: 0,
  lastStep: -1,
  targetAngle: 45,
  targetPower: 0.7,
  steppedInRaf: false,
})

function readHud(s: GameState): Hud {
  return { route: s.routeIndex, timeLeft: Math.max(0, ROUND_SECONDS - s.roundTime), energy: s.energy, cooldown: s.cooldown, score: totalScore(s), delivered: s.delivered, emissions: s.emissionsKg / 1000, streak: s.streak }
}

function explain(summary: Summary, state: GameState): string {
  if (summary.score === 0) return 'No lograste entregar cajas dentro de la plataforma destino. Revisa el alcance de cada modo y apunta al área marcada.'
  if (!summary.passed) {
    const missed = summary.routeChecks.filter(r => !r.ok).map(r => `${r.name} (${r.delivered}/${r.minDelivered})`).join(', ')
    if (state.deliveredByRoute[2] < ROUTES[2].minDelivered) {
      return `No completaste el mínimo en ${missed}. Conserva energía para la ruta larga y usa barco o avión, los únicos que llegan a ${routeKm(ROUTES[2])} km.`
    }
    return `Faltaron cajas dentro de la plataforma en ${missed}. Las cajas que caen fuera no suman: ajusta potencia y ángulo antes de lanzar.`
  }
  if (summary.dominant === 'plane') return 'Completaste las rutas, aunque el avión emite muchísimo más por tonelada-km. Para comparar modos hay que normalizar el servicio: la misma carga y la misma distancia.'
  if (summary.cleanRoute) return 'Superaste el mínimo en todas las rutas eligiendo modos eficientes por tonelada-km y repartiendo la energía. Cada modo tiene un compromiso entre tiempo, alcance y precisión.'
  return 'El mismo envío puede tener resultados muy distintos según la distancia, la carga y el modo. No hay un modo mejor en todos los casos.'
}

export function CargoGame({ onComplete, onNext, nextLabel }: { onComplete?: () => void; onNext?: () => void; nextLabel?: string } = {}) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<GameState>(createGame())
  const fx = useRef(new FxLayer())
  const view = useRef<View>({ t: 0, drag: emptyDragView(), reduceMotion: prefersReducedMotion() })
  const dragSession = useRef<DragSession>(idleSession())
  const hasDragged = useRef(false)
  const roundStart = useRef({ lost: 0, late: 0, delivered: 0, launched: 0 })
  const [phase, setPhase] = useState<Phase>('intro')
  const [hud, setHud] = useState<Hud>(() => readHud(game.current))
  const [mode, setMode] = useState<Mode>('rail')
  const [angle, setAngle] = useState(45)
  const [power, setPower] = useState(0.7)
  const [cursorMode, setCursorMode] = useState<'idle' | 'grab' | 'grabbing'>('idle')
  const [message, setMessage] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [best, submitBest] = useBestScore('transporte')
  const [newBest, setNewBest] = useState(false)
  const [shaking, shake] = useShake()
  const aim = useRef({ mode, angle, power }); aim.current = { mode, angle, power }
  const phaseRef = useRef(phase); phaseRef.current = phase

  const syncDragView = useCallback((m: Mode, a: number, p: number) => {
    const ds = dragSession.current
    const ox = px(ORIGIN.x), oy = py(ORIGIN.y)
    const dView = view.current.drag
    dView.active = ds.active
    dView.armed = ds.armed
    dView.atMax = ds.atMax
    dView.offAxisWarning = ds.offAxisWarning
    dView.tension = ds.tension
    dView.canFire = phaseRef.current === 'playing' && canLaunch(game.current, m).ok
    dView.showIntroCue = !hasDragged.current
    dView.pointer = ds.active ? ds.current : null
    const visualTension = ds.active && ds.armed ? (m === 'ship' ? Math.max(0, Math.min(1, (p - MIN_POWER) / (1 - MIN_POWER))) : ds.tension) : 0
    dView.pull = ds.active && ds.armed ? handlePos(ox, oy, m, a, visualTension, W, H) : null
  }, [])

  const resetDrag = useCallback(() => {
    const el = canvas.current
    const pid = dragSession.current.pointerId
    if (el && pid !== null && typeof el.releasePointerCapture === 'function') {
      try { if (el.hasPointerCapture?.(pid)) el.releasePointerCapture(pid) } catch { /* ignore */ }
    }
    dragSession.current = idleSession()
    view.current.drag.active = false
    view.current.drag.armed = false
    view.current.drag.atMax = false
    view.current.drag.offAxisWarning = false
    view.current.drag.tension = 0
    view.current.drag.pointer = null
    view.current.drag.pull = null
    setCursorMode(view.current.drag.hovered ? 'grab' : 'idle')
  }, [])

  const redraw = useCallback(() => {
    const ctx = safe2d(canvas.current)
    if (!ctx) return
    syncDragView(aim.current.mode, aim.current.angle, aim.current.power)
    prepare(ctx, W, H)
    drawScene(ctx, game.current, aim.current.mode, aim.current.angle, aim.current.power, phaseRef.current === 'briefing' || phaseRef.current === 'playing', fx.current, view.current)
  }, [syncDragView])
  useHiDpiCanvas(canvas, W, H, redraw)

  const beginRound = useCallback(() => {
    resetDrag()
    const s = game.current
    const currentRoute = ROUTES[s.routeIndex]
    const prevMode = aim.current.mode
    let notice = ''
    if (!reaches(prevMode, currentRoute)) {
      const nextMode = MODE_ORDER.find(m => reaches(m, currentRoute)) ?? 'plane'
      setMode(nextMode)
      aim.current.mode = nextMode
      notice = `Cambiamos automáticamente a ${MODES[nextMode].label}: ${MODES[prevMode].label} no alcanza los ${routeKm(currentRoute)} km de esta ruta.`
    }
    roundStart.current = { lost: s.lost, late: s.late, delivered: s.delivered, launched: s.launched }
    fx.current.clear()
    setHud(readHud(s)); setMessage(notice); setPhase('briefing')
  }, [resetDrag])

  const start = useCallback(() => { resetDrag(); game.current = createGame(); setSummary(null); setNewBest(false); playSfx('adventure'); beginRound() }, [beginRound, resetDrag])
  const play = useCallback(() => {
    playSfx('map'); setPhase('playing')
    window.requestAnimationFrame(() => canvas.current?.focus({ preventScroll: true }))
  }, [])

  const selectMode = useCallback((nextMode: Mode) => {
    resetDrag()
    setMode(nextMode)
    aim.current.mode = nextMode
    setMessage('')
  }, [resetDrag])

  const fireWith = useCallback((m: Mode, a: number, p: number) => {
    const s = game.current
    const can = canLaunch(s, m)
    if (!can.ok) { setMessage(can.reason ?? ''); playSfx('warn'); return }
    if (p < MIN_POWER) { setMessage('Sube la potencia para lanzar.'); playSfx('warn'); return }
    launch(s, m, a, p)
    setMessage('')
    playSfx(m === 'road' ? 'launch-road' : 'launch')
    setHud(readHud(s))
    const ox = px(ORIGIN.x), oy = py(ORIGIN.y)
    if (m === 'road') {
      fx.current.smoke(ox, oy - 6, 3, '#e2d8c5')
    } else if (m === 'rail') {
      fx.current.smoke(ox, oy - 6, 4, '#c7f5ef')
      if (!view.current.reduceMotion) fx.current.burst(ox + 8, oy - 4, '#2ec4b6', 5, 45)
    } else if (m === 'ship') {
      fx.current.smoke(ox, oy - 4, 4, '#cfe6ff')
      fx.current.ring(ox - 10, py(0), '#3d8bff', 18)
    } else {
      fx.current.smoke(ox, oy - 8, 5, '#9ea4b0')
      if (!view.current.reduceMotion) fx.current.burst(ox + 4, oy - 8, '#ff4f6d', 6, 65)
    }
  }, [])

  const fire = useCallback(() => {
    fireWith(aim.current.mode, aim.current.angle, aim.current.power)
  }, [fireWith])

  useEffect(() => {
    if (phase !== 'playing') return
    const ctx = safe2d(canvas.current)
    let raf = 0, last = performance.now(), clock = 0, lastTick = Math.ceil(ROUND_SECONDS - game.current.roundTime)
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now
      const s = game.current, layer = fx.current, v = view.current

      // En modo barco con arrastre activo, aplica inercia pesada suave hacia el objetivo del puntero.
      const ds = dragSession.current
      if (ds.active && ds.armed && aim.current.mode === 'ship') {
        ds.steppedInRaf = true
        const nextAim = stepSmoothedAim(
          { angle: aim.current.angle, power: aim.current.power },
          { angle: ds.targetAngle, power: ds.targetPower },
          'ship',
          dt,
          v.reduceMotion,
        )
        if (nextAim.angle !== aim.current.angle || nextAim.power !== aim.current.power) {
          aim.current.angle = nextAim.angle
          aim.current.power = nextAim.power
          setAngle(nextAim.angle)
          setPower(nextAim.power)
        }
      }

      step(s, dt)
      for (const e of s.fx) {
        const x = px(e.type === 'land' ? e.x : routeCenter(ROUTES[s.routeIndex]))
        if (e.type === 'land') {
          if (e.ok) { if (!v.reduceMotion) layer.burst(x, py(0) - 4, '#ffd84d', 8, 70); playSfx('gain') }
          else layer.smoke(x, py(0) - 2, 3, '#a68a64')
        } else if (e.type === 'batch') {
          if (e.delivered > 0) layer.text(x, py(0) - 48, e.multiplier > 1 ? `+${e.delivered} ×${e.multiplier}` : `+${e.delivered}`, e.multiplier > 1 ? '#ffd84d' : '#7dffae', e.multiplier > 1 ? 18 : 15)
          else { layer.text(x, py(0) - 40, 'Lote perdido', '#ff8b8b', 13); playSfx('loss') }
          if (e.multiplier > 1) { layer.ring(x, py(0) - 48, '#ffd84d', 30); playSfx('combo') }
        } else if (e.type === 'streak-lost') {
          layer.shake = 0.5; playSfx('loss'); shake()
        }
      }
      s.fx.length = 0
      const secs = Math.ceil(ROUND_SECONDS - s.roundTime)
      if (secs !== lastTick) { lastTick = secs; if (secs <= 5 && secs > 0) playSfx('warn') }
      v.t += dt; layer.update(dt)
      syncDragView(aim.current.mode, aim.current.angle, aim.current.power)
      if (ctx) { prepare(ctx, W, H); drawScene(ctx, s, aim.current.mode, aim.current.angle, aim.current.power, true, layer, v) }
      clock += dt
      if (clock > 0.08) { clock = 0; setHud(readHud(s)) }
      if (s.status !== 'playing') {
        resetDrag()
        setHud(readHud(s))
        if (s.status === 'round-over') {
          const deliveredInRound = s.delivered - roundStart.current.delivered
          const minNeeded = ROUTES[s.routeIndex].minDelivered
          playSfx(deliveredInRound >= minNeeded ? 'win' : deliveredInRound > 0 ? 'loss' : 'alarm')
          setPhase('round-over')
        }
        return
      }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(raf)
  }, [phase, resetDrag, shake, syncDragView])

  useEffect(() => {
    if (!phase || phase !== 'playing') {
      const onBlur = () => { if (dragSession.current.active) resetDrag() }
      window.addEventListener('blur', onBlur)
      return () => window.removeEventListener('blur', onBlur)
    }
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dragSession.current.active) {
        event.preventDefault()
        resetDrag()
        playSfx('click')
        setMessage('Tiro cancelado.')
      }
    }
    const onBlur = () => { if (dragSession.current.active) resetDrag() }
    window.addEventListener('keydown', onWindowKeyDown)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onWindowKeyDown)
      window.removeEventListener('blur', onBlur)
    }
  }, [phase, resetDrag])

  useEffect(() => { if (phase !== 'playing') redraw() }, [phase, mode, angle, power, hud.route, redraw])

  function nextOrFinish() {
    const s = game.current
    nextRound(s)
    if (s.status === 'finished') {
      const result = summarize(s)
      setSummary(result); setNewBest(submitBest(result.total)); setPhase('final')
      if (result.passed) {
        playSfx('victory')
        playVictoryFanfare(false)
        onCompleteRef.current?.()
      } else {
        playSfx('loss')
      }
      return
    }
    beginRound()
  }

  function toLogical(event: React.PointerEvent<HTMLCanvasElement>): Point | null {
    if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return null
    return {
      x: ((event.clientX - rect.left) * W) / rect.width,
      y: ((event.clientY - rect.top) * H) / rect.height,
    }
  }

  function onCanvasPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (phase !== 'playing') return
    const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen'
    if (!isTouch && event.button !== 0) {
      if (dragSession.current.active) {
        resetDrag()
        playSfx('click')
        setMessage('Tiro cancelado.')
      }
      return
    }
    const pt = toLogical(event)
    if (!pt) return
    const ox = px(ORIGIN.x), oy = py(ORIGIN.y)
    const curMode = aim.current.mode
    const armDeg = MODES[curMode].fixedAngle ?? aim.current.angle

    if (!isInLauncherZone(pt.x, pt.y, ox, oy, armDeg, aim.current.power, isTouch)) {
      if (!hasDragged.current) {
        setMessage('Selecciona y arrastra desde el vehículo lanzador (izquierda) para apuntar.')
      }
      return
    }

    const can = canLaunch(game.current, curMode)
    if (!can.ok) {
      setMessage(can.reason ?? '')
      playSfx('warn')
      return
    }

    event.currentTarget.focus({ preventScroll: true })
    if (event.pointerId !== undefined) event.currentTarget.setPointerCapture?.(event.pointerId)
    dragSession.current = {
      active: true,
      pointerId: event.pointerId ?? null,
      start: pt,
      current: pt,
      armed: false,
      atMax: false,
      offAxisWarning: false,
      tension: 0,
      lastStep: -1,
      targetAngle: armDeg,
      targetPower: aim.current.power,
      steppedInRaf: false,
    }
    view.current.drag.hovered = true
    syncDragView(curMode, aim.current.angle, aim.current.power)
    setCursorMode('grabbing')
    setMessage('')
    playSfx('click')
  }

  function onCanvasPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const pt = toLogical(event)
    if (!pt) return
    const ds = dragSession.current
    const curMode = aim.current.mode

    if (!ds.active) {
      if (phase === 'playing') {
        const ox = px(ORIGIN.x), oy = py(ORIGIN.y)
        const armDeg = MODES[curMode].fixedAngle ?? aim.current.angle
        const isTouch = event.pointerType === 'touch' || event.pointerType === 'pen'
        const hover = isInLauncherZone(pt.x, pt.y, ox, oy, armDeg, aim.current.power, isTouch)
        if (hover !== view.current.drag.hovered) {
          view.current.drag.hovered = hover
          const ready = hover && canLaunch(game.current, curMode).ok
          setCursorMode(ready ? 'grab' : 'idle')
        }
      }
      return
    }

    if (ds.pointerId !== null && event.pointerId !== ds.pointerId) return
    ds.current = pt
    const res = evaluateDrag(curMode, ds.start, pt, aim.current.angle, aim.current.power)
    ds.armed = res.armed
    ds.atMax = res.atMax
    ds.offAxisWarning = res.offAxisWarning
    ds.tension = res.tension
    ds.targetAngle = res.angle
    ds.targetPower = res.power

    if (res.armed) {
      const stepIdx = Math.floor(res.tension * 4)
      if (stepIdx !== ds.lastStep) {
        ds.lastStep = stepIdx
        if (stepIdx > 0) playSfx('timeline')
      }
      if (curMode !== 'ship') {
        if (MODES[curMode].fixedAngle === null && res.angle !== aim.current.angle) {
          aim.current.angle = res.angle
          setAngle(res.angle)
        }
        if (res.power !== aim.current.power) {
          aim.current.power = res.power
          setPower(res.power)
        }
      }
    } else {
      ds.lastStep = -1
    }
    syncDragView(curMode, aim.current.angle, aim.current.power)
  }

  function onCanvasPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const ds = dragSession.current
    if (!ds.active) return
    if (ds.pointerId !== null && event.pointerId !== ds.pointerId) return
    const pt = toLogical(event) ?? ds.current
    const curMode = aim.current.mode
    const finalEval = evaluateDrag(curMode, ds.start, pt, aim.current.angle, aim.current.power)
    const wasArmed = finalEval.armed || ds.armed
    const movedPx = Math.hypot(pt.x - ds.start.x, pt.y - ds.start.y)
    const steppedInRaf = ds.steppedInRaf

    resetDrag()

    if (!wasArmed || phase !== 'playing') {
      if (movedPx > 3) {
        playSfx('click')
        setMessage('Tiro cancelado: arrastra un poco más atrás desde el lanzador para disparar.')
      }
      return
    }

    hasDragged.current = true
    view.current.drag.showIntroCue = false

    // Si hubo arrastre rápido en un solo cuadro (o prueba sin RAF), sincroniza al objetivo final.
    let launchAngle = aim.current.angle
    let launchPower = aim.current.power
    if (curMode !== 'ship' || !steppedInRaf) {
      if (MODES[curMode].fixedAngle === null) {
        launchAngle = finalEval.angle
        aim.current.angle = finalEval.angle
        setAngle(finalEval.angle)
      }
      launchPower = finalEval.power
      aim.current.power = finalEval.power
      setPower(finalEval.power)
    }
    fireWith(curMode, launchAngle, launchPower)
  }

  function onCanvasPointerCancel(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragSession.current.active) return
    if (dragSession.current.pointerId !== null && event.pointerId !== dragSession.current.pointerId) return
    resetDrag()
    playSfx('click')
  }

  function onCanvasPointerLeave() {
    if (!dragSession.current.active && view.current.drag.hovered) {
      view.current.drag.hovered = false
      setCursorMode('idle')
    }
  }

  const round = ROUTES[hud.route]
  const def = MODES[mode]
  const control = MODE_CONTROL[mode]
  const canFire = hud.cooldown <= 0 && hud.energy >= def.energy && phase === 'playing'
  const roundDelivered = game.current.delivered - roundStart.current.delivered
  const roundLost = game.current.lost - roundStart.current.lost
  const roundLate = game.current.late - roundStart.current.late
  const multiplier = streakMultiplier(hud.streak)

  const coach = (() => {
    if (!reaches(mode, round)) {
      const valid = MODE_ORDER.filter(m => reaches(m, round)).map(m => MODES[m].label).join(' o ')
      return { tone: 'bad' as const, tag: 'FUERA DE ALCANCE', text: `${MODES[mode].label} no alcanza esta distancia (${routeKm(round)} km). Cambia a ${valid}.` }
    }
    const pts = trajectory(mode, angle, power, 0.08)
    if (pts.some(p => hillBlocks(round, p.x, p.y))) {
      return { tone: 'warn' as const, tag: 'COLINA EN MEDIO', text: 'El tiro choca con la colina (× roja): sube el ángulo o la potencia para pasar por encima.' }
    }
    const lx = landingX(mode, angle, power)
    const target = routeCenter(round)
    if (Math.abs(lx - target) <= ZONE_HALF) {
      return { tone: 'ok' as const, tag: 'EN EL BLANCO', text: 'La guía apunta directo a la plataforma: suelta el arrastre o pulsa «Lanzar ↗».' }
    }
    if (lx < target - ZONE_HALF) {
      return { tone: 'warn' as const, tag: 'TIRO CORTO', text: 'Arrastra más atrás desde el vehículo o usa ←/→ y deslizador para subir la potencia.' }
    }
    return { tone: 'warn' as const, tag: 'TIRO PASADO', text: 'Acorta el arrastre hacia el vehículo o baja un poco la potencia para caer en la plataforma.' }
  })()

  return <div className={`gs-game cargo-game${shaking ? ' is-shaking' : ''}`}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="PUNTAJE" value={hud.score} icon={Icon.star} tone="accent" />
      <Streak multiplier={multiplier} detail={`${hud.streak} lote${hud.streak === 1 ? '' : 's'} preciso${hud.streak === 1 ? '' : 's'}`} />
      <Stat label={`RUTA ${hud.route + 1} DE ${ROUTES.length}`} value={`${round.name} · ${routeKm(round)} km`} icon={Icon.route} />
      <Stat label="META DE LA RUTA" value={`${roundDelivered} / ${round.minDelivered} cajas`} icon={Icon.box} tone={roundDelivered >= round.minDelivered ? 'ok' : 'warn'} />
      <Stat label="TIEMPO DE LA RUTA" value={`${Math.ceil(hud.timeLeft)} s`} icon={Icon.clock} tone={phase === 'playing' && hud.timeLeft <= 5 ? 'warn' : undefined} />
      <Gauge label="ENERGÍA (COMPARTIDA)" value={hud.energy} max={ENERGY_BUDGET} icon={Icon.bolt} />
      <Stat label="EMISIONES (ESCENARIO)" value={`${hud.emissions.toFixed(1)} t CO₂e`} icon={Icon.smoke} />
    </div>

    <div className="gs-stage gs-stage-fit cargo-stage">
      <canvas ref={canvas} width={W} height={H} tabIndex={0}
        className={cursorMode === 'grabbing' ? 'is-grabbing' : cursorMode === 'grab' ? 'is-grab' : undefined}
        aria-label="Zona de lanzamiento: agarra el vehículo o el lanzador en la ciudad de origen y arrastra hacia atrás para apuntar y soltar, o usa las flechas del teclado y Espacio/Enter para lanzar."
        onContextMenu={event => {
          if (dragSession.current.active) {
            event.preventDefault()
            resetDrag()
            playSfx('click')
            setMessage('Tiro cancelado.')
          }
        }}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerCancel}
        onPointerLeave={onCanvasPointerLeave}
        onKeyDown={event => {
          if (phase !== 'playing') return
          if (event.key === 'ArrowUp' && MODES[mode].fixedAngle === null) { event.preventDefault(); playSfx('click'); setAngle(a => Math.min(80, a + 2)) }
          else if (event.key === 'ArrowDown' && MODES[mode].fixedAngle === null) { event.preventDefault(); playSfx('click'); setAngle(a => Math.max(10, a - 2)) }
          else if (event.key === 'ArrowRight') { event.preventDefault(); playSfx('click'); setPower(p => Math.min(1, Math.round((p + 0.05) * 100) / 100)) }
          else if (event.key === 'ArrowLeft') { event.preventDefault(); playSfx('click'); setPower(p => Math.max(0.2, Math.round((p - 0.05) * 100) / 100)) }
          else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); fire() }
        }} />

      {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Carga entre ciudades · instrucciones">
        <div className="gs-card">
          <p className="eyebrow">CONTEXTO · TRANSPORTE DE CARGA</p>
          <h3>Carga entre ciudades</h3>
          <p>Agarra el vehículo lanzador, arrastra hacia atrás según la respuesta de cada transporte y suelta para enviar cajas hasta la plataforma destino antes de que termine el tiempo. También puedes usar controles y teclado.</p>
          <ul className="gs-legend">{MODE_ORDER.map(m => <li key={m}><VehicleIcon mode={m} /> <span><b>{MODES[m].label}</b> ({MODE_CONTROL[m].label}): {MODES[m].boxes} caja{MODES[m].boxes > 1 ? 's' : ''}, {MODES[m].energy} de energía. {MODES[m].note}</span></li>)}</ul>
          <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Meta obligatoria: entrega al menos el mínimo en cada una de las {ROUTES.length} rutas ({ROUTES.map(r => r.minDelivered).join(' · ')} cajas) con {ENERGY_BUDGET} unidades de energía compartida ({ROUND_SECONDS} s por ruta). Lotes precisos seguidos multiplican puntos.</span></p>
          <button type="button" className="button" data-sfx="none" onClick={start}>Empezar ↗</button>
        </div>
      </div>}

      {phase === 'briefing' && <div className="gs-overlay is-compact" role="dialog" aria-label="Información de la ruta">
        <div className="gs-card">
          <p className="eyebrow">RUTA {hud.route + 1} DE {ROUTES.length} · {round.name.toUpperCase()}</p>
          <p>{round.text} Distancia: {routeKm(round)} km. Tiempo: {ROUND_SECONDS} s. Energía disponible: {hud.energy}.</p>
          <p>Alcanzan: {MODE_ORDER.filter(m => reaches(m, round)).map(m => MODES[m].label).join(', ')}.</p>
          <p className="gs-explain">Meta mínima de esta ruta: <b>{round.minDelivered} cajas</b> dentro de la plataforma.</p>
          <button type="button" className="button" data-sfx="none" onClick={play}>Empezar la ruta ↗</button>
        </div>
      </div>}

      {phase === 'round-over' && (() => {
        const roundPassed = roundDelivered >= round.minDelivered
        const missing = round.minDelivered - roundDelivered
        return <div className={`gs-overlay is-compact ${roundPassed ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado de la ruta">
          <div className="gs-card">
            <p className="eyebrow">FIN DE LA RUTA {hud.route + 1} · {roundPassed ? 'META CUMPLIDA' : game.current.endReason === 'energy' ? 'SIN ENERGÍA' : 'NO ALCANZÓ EL MÍNIMO'}</p>
            <p>Entregaste {roundDelivered} caja{roundDelivered === 1 ? '' : 's'}. Se perdieron {roundLost} por caer fuera de la zona o chocar con la colina{roundLate ? ` y ${roundLate} llegaron tarde` : ''}. Energía restante: {hud.energy}.</p>
            <p className="gs-explain">{roundPassed ? `✓ Alcanzaste el mínimo requerido de ${round.minDelivered} cajas en la plataforma.` : `✕ Faltaron ${missing} caja${missing === 1 ? '' : 's'} para el mínimo de esta ruta (${roundDelivered}/${round.minDelivered}). Las cajas que caen fuera no cuentan.`}</p>
            <div className="gs-modal-actions">
              <button type="button" className="button" data-sfx={hud.route + 1 >= ROUTES.length ? 'none' : 'open'} onClick={nextOrFinish}>{hud.route + 1 >= ROUTES.length ? 'Ver resultado final ↗' : 'Siguiente ruta ↗'}</button>
              {!roundPassed && hud.route + 1 < ROUTES.length && <button type="button" className="gs-retry-btn" data-sfx="none" onClick={start}>Reiniciar desde ruta 1 ↗</button>}
            </div>
          </div>
        </div>
      })()}

      {phase === 'final' && summary && <div className={`gs-overlay ${summary.passed ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado final">
        <div className="gs-card">
          {summary.passed && <span className="gs-win-stamp">★ RETO COMPLETADO</span>}
          <p className="eyebrow">RESULTADO FINAL · {summary.routesPassed} DE {ROUTES.length} RUTAS CUMPLIDAS</p>
          <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS · {summary.score} CAJAS ENTREGADAS</span></div>
          <ResultGrid items={[
            { label: 'Por ruta', value: game.current.deliveredByRoute.join(' · '), tone: summary.passed ? 'ok' : 'warn' },
            { label: 'Bono por racha', value: `+${summary.bonus}`, tone: summary.bonus > 0 ? 'ok' : undefined },
            { label: 'Mejor racha', value: `${summary.bestStreak} lotes` },
            { label: 'g CO₂e por t-km', value: Math.round(summary.gPerTkm), tone: summary.gPerTkm > 0 && summary.gPerTkm <= 100 ? 'ok' : 'warn' },
          ]} />
          <ul className="gs-checklist" aria-label="Requisitos por ruta">
            {summary.routeChecks.map(r => (
              <li key={r.id} className={r.ok ? 'is-ok' : 'is-fail'}>
                <b>{r.ok ? '✓' : '✕'}</b>
                <span>{r.name}: {r.delivered} / {r.minDelivered} cajas dentro de la plataforma</span>
              </li>
            ))}
          </ul>
          <p>Lanzaste {summary.launched} cajas. Emisiones del escenario: {summary.emissionsTonnes.toFixed(1)} t CO₂e.{summary.cleanRoute ? ' Medalla «ruta limpia».' : ''}</p>
          <p className="gs-explain">{explain(summary, game.current)}</p>
          <BestLine best={best} isNew={newBest} />
          <div className="gs-modal-actions">
            {summary.passed && onNext && <button type="button" className="button" onClick={onNext}>{nextLabel ?? 'Siguiente minijuego →'}</button>}
            <button type="button" className={summary.passed && onNext ? 'gs-retry-btn' : 'button'} data-sfx="none" onClick={start}>{summary.passed ? 'Jugar otra vez ↗' : 'Reintentar reto ↗'}</button>
          </div>
        </div>
      </div>}
    </div>

    <div className="cargo-mode-profile" style={{ '--mode': MODE_COLOR[mode] } as React.CSSProperties}>
      <span className="cargo-mode-badge">{control.label}</span>
      <span>{control.dragHint}</span>
    </div>

    <div className="cargo-controls">
      <div className="cargo-modes" role="radiogroup" aria-label="Modo de transporte">
        {MODE_ORDER.map(m => <button key={m} type="button" role="radio" aria-checked={mode === m} className={`gs-choice cargo-mode${mode === m ? ' is-active' : ''}${phase !== 'intro' && !reaches(m, round) ? ' is-short' : ''}`} style={{ '--mode': MODE_COLOR[m] } as React.CSSProperties} onClick={() => selectMode(m)}>
          <VehicleIcon mode={m} /><span>{MODES[m].label}</span>
          <small>{MODES[m].boxes} caja{MODES[m].boxes > 1 ? 's' : ''} · {MODES[m].energy} energía · {MODES[m].gPerTkm} g/t-km{phase !== 'intro' && !reaches(m, round) ? ' · no alcanza' : ''}</small>
        </button>)}
      </div>
      <div className="cargo-aim">
        <label>Ángulo: {MODES[mode].fixedAngle !== null ? `${MODES[mode].fixedAngle}° (fijo)` : `${angle}°`}
          <input type="range" min={10} max={80} step={1} value={MODES[mode].fixedAngle ?? angle} disabled={MODES[mode].fixedAngle !== null} onChange={event => { setAngle(Number(event.target.value)); playSfx('timeline') }} aria-label="Ángulo de lanzamiento" />
        </label>
        <label>Potencia: {Math.round(power * 100)} %
          <input type="range" min={20} max={100} step={1} value={Math.round(power * 100)} onChange={event => { setPower(Number(event.target.value) / 100); playSfx('timeline') }} aria-label="Potencia de lanzamiento" />
        </label>
        <button type="button" className="button cargo-fire" data-sfx="none" disabled={!canFire} onClick={fire}>{hud.cooldown > 0 ? `Recargando ${hud.cooldown.toFixed(1)} s` : 'Lanzar ↗'}</button>
      </div>
    </div>
    {(phase === 'briefing' || phase === 'playing') && (
      <div className={`gs-coach is-${coach.tone}`} aria-live="polite">
        <span className="gs-coach-tag">{coach.tag}</span>
        <span>{coach.text}</span>
      </div>
    )}
    <p className={`gs-help${message ? ' is-alert' : ''}`} role="status">{message || `${def.note} Destino a ${routeKm(round)} km; el corchete en tierra muestra dónde cae todo el lote. Arrastra desde el lanzador, usa los deslizadores o ←/→/↑/↓ + Espacio.`}</p>
  </div>
}
