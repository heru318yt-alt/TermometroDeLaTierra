import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { useBestScore, useFloaters, useShake } from '../shared/hooks'
import { BestLine, FloaterLayer, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  CARBON, CHALLENGE_TARGET_SCORE, CONFIG, MIN_WIN_ACTIONS, MIN_WIN_STABLE_SECONDS,
  SCORE_BONUS_RESTORE, SCORE_BONUS_STEP, SIZE, STATE_LABEL,
  applyTool, createGame, indicators, isProtected, protectedCount, step, summarize, totalScore,
  type GameEvent, type GameState, type Indicators, type ParcelState, type Summary, type Tool,
} from './engine'
import { FlameArt, ParcelArt, ToolIcon } from './ParcelArt'
import './forest.css'

type Phase = 'intro' | 'playing' | 'result'

interface CellView { state: ParcelState; age: number; protectedNow: boolean; burning: boolean }
interface View {
  cells: CellView[]
  ind: Indicators
  seconds: number
  score: number
  restoreLeft: number
  guards: number
  multiplier: number
  cycle: number
  cleared: boolean
}

const FOREST_LIKE: ParcelState[] = ['forest', 'young', 'sapling']
const TOOLS: { id: Tool; label: string; hint: string; key: string }[] = [
  { id: 'protect', label: 'Conservar', hint: `protege un bosque de la tala e incendios (máx. ${CONFIG.protectCap})`, key: '1' },
  { id: 'cultivate', label: 'Cultivar', hint: 'sube alimentos; si era bosque libera su carbono de golpe', key: '2' },
  { id: 'restore', label: 'Restaurar', hint: 'convierte cultivo o suelo degradado en brote', key: '3' },
]

function readView(s: GameState): View {
  return {
    cells: s.parcels.map(p => ({ state: p.state, age: p.age, protectedNow: isProtected(s, p), burning: p.flashUntil > s.t })),
    ind: indicators(s), seconds: s.t, score: totalScore(s), restoreLeft: s.restoreLeft,
    guards: protectedCount(s), multiplier: s.multiplier, cycle: s.cycle, cleared: s.challengeCleared,
  }
}

const place = (index: number) => `fila ${Math.floor(index / SIZE) + 1}, columna ${(index % SIZE) + 1}`
const cellPos = (index: number) => ({ x: ((index % SIZE) + 0.5) / SIZE * 100, y: (Math.floor(index / SIZE) + 0.4) / SIZE * 100 })

function explain(summary: Summary): string {
  const restoreNote = 'Restaurar no es una compensación instantánea: el carbono vuelve durante años, mientras cultivar un bosque lo libera de golpe.'
  if (summary.passed) return `Superaste la meta arcade con equilibrio entre bosque y cultivos. ${restoreNote}`
  if (summary.cause === 'collapse') return `El bosque se redujo hasta perder demasiado carbono almacenado. ${restoreNote}`
  if (summary.cause === 'hunger') return `Los cultivos no cubrieron la demanda creciente. Usa parcelas degradadas antes que bosque maduro. ${restoreNote}`
  if (!summary.checks.active) return `Faltó gestión activa (${summary.actions}/${MIN_WIN_ACTIONS} acciones).`
  return restoreNote
}

export function ForestGame({ onComplete, onNext, nextLabel }: { onComplete?: () => void; onNext?: () => void; nextLabel?: string } = {}) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const completedThisRun = useRef(false)
  const game = useRef<GameState>(createGame(1982, 0))
  const tool = useRef<Tool>('protect')
  const [phase, setPhase] = useState<Phase>('intro')
  const [view, setView] = useState<View>(() => readView(game.current))
  const [selected, setSelected] = useState<Tool>('protect')
  const [message, setMessage] = useState('')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [best, submitBest] = useBestScore('bosques')
  const [newBest, setNewBest] = useState(false)
  const floaters = useFloaters(1200)
  const [shaking, shake] = useShake()
  const lastEvent = useRef<GameEvent | null>(null)

  const finish = useCallback(() => {
    const result = summarize(game.current)
    const won = result.passed
    if (!completedThisRun.current && won) {
      completedThisRun.current = true
      onCompleteRef.current?.()
    } else {
      playSfx(won ? 'win' : 'loss')
    }
    setSummary(result); setNewBest(submitBest(result.total)); setPhase('result')
  }, [submitBest])

  const start = useCallback(() => {
    game.current = createGame(Math.floor(Math.random() * 1e9), 0)
    completedThisRun.current = false
    lastEvent.current = null
    setSummary(null); setNewBest(false); setMessage(''); setView(readView(game.current)); setPhase('playing')
    playSfx('adventure')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0, last = performance.now(), clock = 0, lastMult = game.current.multiplier, lastMilestones = game.current.scoreMilestonesClaimed, wasStable = true
    const frame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now
      const s = game.current
      const beforeForests = indicators(s).forests
      step(s, dt)
      clock += dt
      const startAt = lastEvent.current ? s.events.indexOf(lastEvent.current) + 1 : 0
      const pendingEvents = startAt > 0 ? s.events.slice(startAt) : s.events
      for (const event of pendingEvents) {
        lastEvent.current = event
        const pos = cellPos(event.index)
        if (event.kind === 'fire') { floaters.push('Incendio', pos.x, pos.y, 'bad'); shake(); playSfx('alarm') }
        else { floaters.push('Tala', pos.x, pos.y, 'bad'); playSfx('warn') }
        setMessage(event.kind === 'fire' ? `Incendio en ${place(event.index)}: la parcela quedó degradada.` : `Tala en ${place(event.index)}: un bosque sin protección pasó a cultivo.`)
      }
      if (s.multiplier > lastMult) { floaters.push(`RACHA ×${s.multiplier}`, 50, 45, 'combo'); playSfx('combo') }
      lastMult = s.multiplier
      if (s.scoreMilestonesClaimed > lastMilestones) {
        const gained = (s.scoreMilestonesClaimed - lastMilestones) * SCORE_BONUS_RESTORE
        lastMilestones = s.scoreMilestonesClaimed
        floaters.push(`+${gained} restauración (bono puntaje)`, 50, 28, 'good')
        playSfx('gain')
      }

      if (!completedThisRun.current && s.challengeCleared) {
        completedThisRun.current = true
        submitBest(totalScore(s))
        onCompleteRef.current?.()
      }

      const indNow = indicators(s)
      if (indNow.forests > beforeForests) playSfx('gain')
      if (wasStable && !indNow.stable) playSfx('warn')
      wasStable = indNow.stable
      if (clock > 0.1 || s.status !== 'playing') { clock = 0; setView(readView(s)) }
      if (s.status !== 'playing') { finish(); return }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select')) return
      const t = TOOLS.find(x => x.key === e.key)
      if (t) { tool.current = t.id; setSelected(t.id); playSfx('toggle') }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [phase, finish, floaters.push, shake, submitBest])

  function choose(next: Tool) { tool.current = next; setSelected(next) }

  function cellClick(index: number) {
    if (phase !== 'playing') return
    const before = game.current.parcels[index].state
    const result = applyTool(game.current, tool.current, index)
    const pos = cellPos(index)
    if (result.ok) {
      setMessage('')
      if (tool.current === 'protect') { floaters.push('Protegida', pos.x, pos.y, 'info'); playSfx('click') }
      else if (tool.current === 'cultivate') {
        if (FOREST_LIKE.includes(before)) { floaters.push(`−${CARBON[before]} carbono`, pos.x, pos.y, 'bad'); playSfx('loss') }
        else { floaters.push(`+${CONFIG.foodPerCrop} alimento`, pos.x, pos.y, 'good'); playSfx('gain') }
      } else { floaters.push('Brote', pos.x, pos.y, 'good'); playSfx('gain') }
    } else { setMessage(result.reason ?? ''); playSfx('warn') }
    setView(readView(game.current))
    if (game.current.status !== 'playing') finish()
  }

  const { ind } = view
  const foodScale = 120
  const foodWidth = Math.min(ind.coverage, foodScale) / foodScale * 100
  const carbonWidth = Math.min(ind.carbonPct, 100)
  const foodOk = ind.coverage >= CONFIG.stableFood, carbonOk = ind.carbonPct >= CONFIG.stableCarbon
  const coach = !foodOk
    ? { tone: 'bad' as const, tag: 'ALIMENTOS BAJOS', text: 'Elige «Cultivar» (tecla 2) y toca una parcela degradada (marrón) para sumar alimento sin talar bosque.' }
    : !carbonOk
      ? { tone: 'warn' as const, tag: 'CARBONO BAJO', text: 'Usa «Restaurar» (3) en cultivos o parcelas degradadas y protege tus bosques con «Conservar» (1).' }
      : view.guards < 3
        ? { tone: 'ok' as const, tag: 'PROTEGE TUS BOSQUES', text: 'Territorio estable. Selecciona «Conservar» (1) y toca bosques maduros para frenar talas e incendios.' }
        : { tone: 'ok' as const, tag: 'EN EQUILIBRIO', text: view.cleared ? '¡Reto cumplido! Sigue defendiendo el bosque para romper tu récord arcade.' : `Sostén alimentos y carbono sobre la marca clara hasta alcanzar ${CHALLENGE_TARGET_SCORE} puntos.` }

  return <div className={`gs-game forest-game${shaking ? ' is-shaking' : ''}`}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="PUNTAJE ARCADE" value={view.score} icon={Icon.star} tone="accent" />
      <Stat label="META DEL RETO" value={view.cleared ? '★ CUMPLIDO' : `${view.score} / ${CHALLENGE_TARGET_SCORE}`} icon={Icon.check} tone={view.cleared ? 'ok' : undefined} />
      <Streak multiplier={view.multiplier} detail={ind.stable ? 'territorio estable' : 'fuera de equilibrio'} />
      <Stat label="CICLO ACTUAL" value={`#${view.cycle + 1} · ${Math.floor(view.seconds)} s`} icon={Icon.clock} />
      <Gauge label="ACCIONES DE RESTAURACIÓN" value={view.restoreLeft} max={CONFIG.restoreMax} icon={Icon.sprout} />
      <Gauge label="PROTECCIONES LIBRES" value={CONFIG.protectCap - view.guards} max={CONFIG.protectCap} icon={Icon.shield} />
    </div>

    <div className="forest-main">
      <div className="gs-stage forest-stage">
        <div className="forest-grid" role="group" aria-label="Territorio: cuadrícula de parcelas" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {view.cells.map((cell, i) => <button key={i} type="button" data-index={i} data-sfx="none" disabled={phase !== 'playing'}
            aria-label={`Parcela ${place(i)}: ${STATE_LABEL[cell.state]}${cell.protectedNow ? ', protegida' : ''}`}
            className={`forest-cell is-${cell.state}${cell.protectedNow ? ' is-protected' : ''}${cell.burning ? ' is-burning' : ''}`}
            onClick={() => cellClick(i)}
            onKeyDown={event => {
              const row = Math.floor(i / SIZE), col = i % SIZE
              let nr = row, nc = col
              if (event.key === 'ArrowRight') nc = Math.min(SIZE - 1, col + 1)
              else if (event.key === 'ArrowLeft') nc = Math.max(0, col - 1)
              else if (event.key === 'ArrowDown') nr = Math.min(SIZE - 1, row + 1)
              else if (event.key === 'ArrowUp') nr = Math.max(0, row - 1)
              else return
              event.preventDefault()
              playSfx('click')
              const nextIdx = nr * SIZE + nc
              event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`button[data-index="${nextIdx}"]`)?.focus()
            }}>
            <span className="forest-art-wrap" key={cell.state}><ParcelArt state={cell.state} /></span>
            {(cell.state === 'sapling' || cell.state === 'young') && <span className="forest-grow" title={`Crecimiento ${cell.age}/${CONFIG.growCycles}`}><i style={{ width: `${(cell.age / CONFIG.growCycles) * 100}%` }} /></span>}
            {cell.protectedNow && <em aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" /></svg></em>}
            {cell.burning && <FlameArt />}
          </button>)}
        </div>
        <FloaterLayer items={floaters.items} />

        {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Guardabosques · instrucciones">
          <div className="gs-card">
            <p className="eyebrow">MODO ARCADE · USO DEL SUELO Y BOSQUES</p>
            <h3>Guardabosques</h3>
            <p>La demanda sube más rápido y las presiones de tala e incendios aumentan con los ciclos. Defiende el territorio indefinidamente en modo arcade sin sufrir hambre ni colapso forestal.</p>
            <ul className="gs-legend forest-legend">
              {(['forest', 'young', 'sapling', 'crop', 'degraded'] as ParcelState[]).map(s => <li key={s}><span className={`forest-swatch is-${s}`}><ParcelArt state={s} /></span> <span><b>{STATE_LABEL[s]}</b>: carbono {CARBON[s]}{s === 'crop' ? `, alimentos +${CONFIG.foodPerCrop}` : ''}</span></li>)}
            </ul>
            <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Meta para desbloquear el reto: alcanza {CHALLENGE_TARGET_SCORE} puntos con ≥ {MIN_WIN_STABLE_SECONDS} s estables y ≥ {MIN_WIN_ACTIONS} acciones. Recargas +{SCORE_BONUS_RESTORE} restauración cada {CONFIG.restoreRechargeEvery} ciclos estables o cada {SCORE_BONUS_STEP} puntos. Atajos: 1 Conservar · 2 Cultivar · 3 Restaurar.</span></p>
            <button type="button" className="button" data-sfx="none" onClick={start}>Empezar ↗</button>
          </div>
        </div>}

        {phase === 'result' && summary && (() => {
          const won = summary.passed
          return <div className={`gs-overlay ${won ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado de la partida">
            <div className="gs-card">
              {won && <span className="gs-win-stamp">★ RETO COMPLETADO</span>}
              <p className="eyebrow">FIN DE PARTIDA ARCADE · {summary.cause === 'collapse' ? 'COLAPSO DEL BOSQUE' : summary.cause === 'hunger' ? 'HAMBRE' : 'PARTIDA GUARDADA'}</p>
              <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS · {summary.cycles} CICLOS ({summary.stableSeconds} S ESTABLES)</span></div>
              <ResultGrid items={[
                { label: 'Bono por racha', value: `+${summary.bonus}`, tone: summary.bonus > 0 ? 'ok' : undefined },
                { label: 'Acciones', value: `${summary.actions}`, tone: summary.checks.active ? 'ok' : 'warn' },
                { label: 'Bosque maduro final', value: `${summary.forests} parcelas` },
                { label: 'Carbono neto', value: `${summary.netCarbon >= 0 ? '+' : ''}${summary.netCarbon}`, tone: summary.netCarbon >= 0 ? 'ok' : 'warn' },
                { label: 'Convertidas', value: `${summary.converted} (${summary.logged} tala)` },
                { label: 'Incendios', value: summary.fires },
              ]} />
              <ul className="gs-checklist" aria-label="Condiciones del reto">
                <li className={summary.checks.score ? 'is-ok' : 'is-fail'}>
                  <b>{summary.checks.score ? '✓' : '✕'}</b>
                  <span>Meta de puntaje arcade: {summary.total} / {CHALLENGE_TARGET_SCORE} puntos</span>
                </li>
                <li className={summary.checks.stable ? 'is-ok' : 'is-fail'}>
                  <b>{summary.checks.stable ? '✓' : '✕'}</b>
                  <span>Tiempo en equilibrio: {summary.stableSeconds} s / {MIN_WIN_STABLE_SECONDS} s mínimo</span>
                </li>
                <li className={summary.checks.active ? 'is-ok' : 'is-fail'}>
                  <b>{summary.checks.active ? '✓' : '✕'}</b>
                  <span>Gestión activa del territorio: {summary.actions} / {MIN_WIN_ACTIONS} acciones mínimo</span>
                </li>
              </ul>
              <p className="gs-explain">{explain(summary)}</p>
              <BestLine best={best} isNew={newBest} />
              <div className="gs-modal-actions">
                {won && onNext && <button type="button" className="button" onClick={onNext}>{nextLabel ?? 'Siguiente minijuego →'}</button>}
                <button type="button" className={won && onNext ? 'gs-retry-btn' : 'button'} data-sfx="none" onClick={start}>{won ? 'Jugar otra vez ↗' : 'Reintentar reto ↗'}</button>
              </div>
            </div>
          </div>
        })()}
      </div>

      <div className="forest-side">
        <div className={`forest-meter${foodOk ? '' : ' is-alert'}`}>
          <div className="forest-meter-label"><span>{Icon.wheat} ALIMENTOS (cobertura)</span><strong className={foodOk ? 'is-ok' : 'is-warn'}>{Math.round(ind.coverage)} %</strong></div>
          <div className="forest-bar" role="meter" aria-label="Cobertura de la demanda de alimentos" aria-valuemin={0} aria-valuemax={foodScale} aria-valuenow={Math.round(ind.coverage)} aria-valuetext={`${Math.round(ind.coverage)} %. Mínimo estable ${CONFIG.stableFood} %, límite ${CONFIG.endFood} %`}>
            <div className={`forest-fill is-food ${foodOk ? 'is-ok' : 'is-warn'}`} style={{ width: `${foodWidth}%` }} />
            <i className="forest-mark is-stable" style={{ left: `${CONFIG.stableFood / foodScale * 100}%` }} title="Zona estable" />
            <i className="forest-mark is-end" style={{ left: `${CONFIG.endFood / foodScale * 100}%` }} title="Límite: hambre" />
          </div>
          <p>Producción {ind.supply} / demanda {Math.round(ind.demand)}</p>
        </div>
        <div className={`forest-meter${carbonOk ? '' : ' is-alert'}`}>
          <div className="forest-meter-label"><span>{Icon.leaf} CARBONO ALMACENADO</span><strong className={carbonOk ? 'is-ok' : 'is-warn'}>{Math.round(ind.carbonPct)} %</strong></div>
          <div className="forest-bar" role="meter" aria-label="Carbono almacenado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ind.carbonPct)} aria-valuetext={`${Math.round(ind.carbonPct)} %. Mínimo estable ${CONFIG.stableCarbon} %, límite ${CONFIG.endCarbon} %`}>
            <div className={`forest-fill is-carbon ${carbonOk ? 'is-ok' : 'is-warn'}`} style={{ width: `${carbonWidth}%` }} />
            <i className="forest-mark is-stable" style={{ left: `${CONFIG.stableCarbon}%` }} title="Zona estable" />
            <i className="forest-mark is-end" style={{ left: `${CONFIG.endCarbon}%` }} title="Límite: colapso" />
          </div>
          <p>Cada {CONFIG.restoreRechargeEvery} ciclos estables seguidos o cada {SCORE_BONUS_STEP} puntos recargas +{SCORE_BONUS_RESTORE} restauración.</p>
        </div>
        <div className="forest-tools" role="radiogroup" aria-label="Herramienta">
          {TOOLS.map(t => <button key={t.id} type="button" role="radio" aria-checked={selected === t.id} aria-keyshortcuts={t.key} className={`gs-choice forest-tool${selected === t.id ? ' is-active' : ''}`} onClick={() => choose(t.id)} disabled={phase !== 'playing'}>
            <ToolIcon tool={t.id} /><span>{t.label}</span><small>{t.hint}</small><kbd>{t.key}</kbd>
          </button>)}
        </div>
        {phase === 'playing' && view.cleared && (
          <button type="button" className="gs-retry-btn" data-sfx="open" onClick={finish}>Finalizar y guardar</button>
        )}
        {phase === 'playing' && (
          <div className={`gs-coach is-${coach.tone}`} aria-live="polite">
            <span className="gs-coach-tag">{coach.tag}</span>
            <span>{coach.text}</span>
          </div>
        )}
      </div>
    </div>
    <p className={`gs-help${message ? ' is-alert' : ''}`} role="status">{message || 'Elige una herramienta y toca una parcela. Valores didácticos del escenario; no son mediciones reales de carbono ni de deforestación.'}</p>
  </div>
}
