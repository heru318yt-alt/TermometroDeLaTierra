import { useCallback, useEffect, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { useBestScore, useFloaters, useShake } from '../shared/hooks'
import { BestLine, FloaterLayer, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  CARBON, CONFIG, SIZE, STATE_LABEL, applyTool, createGame, indicators, isProtected, protectedCount, step, summarize, totalScore,
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
}

const FOREST_LIKE: ParcelState[] = ['forest', 'young', 'sapling']
const TOOLS: { id: Tool; label: string; hint: string; key: string }[] = [
  { id: 'protect', label: 'Conservar', hint: `protege un bosque de la tala y los incendios (máx. ${CONFIG.protectCap}, ${CONFIG.protectCycles * CONFIG.cycleSeconds} s)`, key: '1' },
  { id: 'cultivate', label: 'Cultivar', hint: 'sube los alimentos; si era bosque, libera su carbono de golpe', key: '2' },
  { id: 'restore', label: 'Restaurar', hint: 'convierte un cultivo o una parcela degradada en brote; tarda varios ciclos', key: '3' },
]

function readView(s: GameState): View {
  return {
    cells: s.parcels.map(p => ({ state: p.state, age: p.age, protectedNow: isProtected(s, p), burning: p.flashUntil > s.t })),
    ind: indicators(s), seconds: s.t, score: totalScore(s), restoreLeft: s.restoreLeft, guards: protectedCount(s), multiplier: s.multiplier, cycle: s.cycle,
  }
}

const place = (index: number) => `fila ${Math.floor(index / SIZE) + 1}, columna ${(index % SIZE) + 1}`
const cellPos = (index: number) => ({ x: ((index % SIZE) + 0.5) / SIZE * 100, y: (Math.floor(index / SIZE) + 0.4) / SIZE * 100 })

function explain(summary: Summary): string {
  const restoreNote = 'Restaurar no es una compensación instantánea: el carbono vuelve a almacenarse durante años, mientras que cultivar un bosque lo libera de golpe.'
  if (summary.cause === 'collapse') return `El bosque se redujo hasta perder gran parte de su carbono almacenado. ${restoreNote}`
  if (summary.cause === 'hunger') return `Los cultivos no alcanzaron para la demanda. Producir alimentos y conservar bosque entran en tensión; usar tierras ya degradadas ayuda a aliviarla. ${restoreNote}`
  return restoreNote
}

export function ForestGame() {
  const game = useRef<GameState>(createGame())
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
    setSummary(result); setNewBest(submitBest(result.total)); setPhase('result'); playSfx('loss')
  }, [submitBest])

  const start = useCallback(() => {
    game.current = createGame(Math.floor(Math.random() * 1e9))
    lastEvent.current = null
    setSummary(null); setNewBest(false); setMessage(''); setView(readView(game.current)); setPhase('playing')
    playSfx('adventure')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    let raf = 0, last = performance.now(), clock = 0, lastMult = game.current.multiplier, wasStable = true
    const frame = (now: number) => {
      const dt = (now - last) / 1000; last = now
      const s = game.current
      step(s, dt)
      clock += dt
      const event = s.events.length ? s.events[s.events.length - 1] : null
      if (event && event !== lastEvent.current) {
        lastEvent.current = event
        const pos = cellPos(event.index)
        if (event.kind === 'fire') { floaters.push('Incendio', pos.x, pos.y, 'bad'); shake(); playSfx('loss') }
        else { floaters.push('Tala', pos.x, pos.y, 'bad'); playSfx('warn') }
        setMessage(event.kind === 'fire' ? `Incendio en ${place(event.index)}: la parcela quedó degradada.` : `Tala en ${place(event.index)}: un bosque sin protección pasó a cultivo.`)
      }
      if (s.multiplier > lastMult) { floaters.push(`RACHA ×${s.multiplier}`, 50, 45, 'combo'); playSfx('combo') }
      lastMult = s.multiplier
      const stable = indicators(s).stable
      if (wasStable && !stable) playSfx('warn')
      wasStable = stable
      if (clock > 0.1 || s.status !== 'playing') { clock = 0; setView(readView(s)) }
      if (s.status !== 'playing') { finish(); return }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest('input, textarea, select')) return
      const t = TOOLS.find(x => x.key === e.key)
      if (t) { tool.current = t.id; setSelected(t.id) }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
  }, [phase, finish, floaters.push, shake])

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

  return <div className={`gs-game forest-game${shaking ? ' is-shaking' : ''}`}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="PUNTAJE" value={view.score} icon={Icon.star} tone="accent" />
      <Streak multiplier={view.multiplier} detail={ind.stable ? 'territorio estable' : 'fuera de equilibrio'} />
      <Stat label="TIEMPO" value={`${Math.floor(view.seconds)} s`} icon={Icon.clock} />
      <Gauge label="ACCIONES DE RESTAURACIÓN" value={view.restoreLeft} max={CONFIG.restoreActions} icon={Icon.sprout} />
      <Gauge label="PROTECCIONES LIBRES" value={CONFIG.protectCap - view.guards} max={CONFIG.protectCap} icon={Icon.shield} />
    </div>

    <div className="forest-main">
      <div className="gs-stage forest-stage">
        <div className="forest-grid" role="group" aria-label="Territorio: cuadrícula de parcelas" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {view.cells.map((cell, i) => <button key={i} type="button" disabled={phase !== 'playing'}
            aria-label={`Parcela ${place(i)}: ${STATE_LABEL[cell.state]}${cell.protectedNow ? ', protegida' : ''}`}
            className={`forest-cell is-${cell.state}${cell.protectedNow ? ' is-protected' : ''}${cell.burning ? ' is-burning' : ''}`} onClick={() => cellClick(i)}>
            <span className="forest-art-wrap" key={cell.state}><ParcelArt state={cell.state} /></span>
            {(cell.state === 'sapling' || cell.state === 'young') && <span className="forest-grow" title={`Crecimiento ${cell.age}/${CONFIG.growCycles}`}><i style={{ width: `${(cell.age / CONFIG.growCycles) * 100}%` }} /></span>}
            {cell.protectedNow && <em aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z" /></svg></em>}
            {cell.burning && <FlameArt />}
          </button>)}
        </div>
        <FloaterLayer items={floaters.items} />

        {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Guardabosques · instrucciones">
          <div className="gs-card">
            <p className="eyebrow">CONTEXTO · USO DEL SUELO Y BOSQUES</p>
            <h3>Guardabosques</h3>
            <p>Un territorio vive de sus cultivos y de su bosque. La demanda de alimentos sube sin parar, y también la presión de tala y los incendios. Mantén alimentos y carbono almacenado por encima de los umbrales el mayor tiempo posible.</p>
            <ul className="gs-legend forest-legend">
              {(['forest', 'young', 'sapling', 'crop', 'degraded'] as ParcelState[]).map(s => <li key={s}><span className={`forest-swatch is-${s}`}><ParcelArt state={s} /></span> <span><b>{STATE_LABEL[s]}</b>: carbono {CARBON[s]}{s === 'crop' ? `, alimentos +${CONFIG.foodPerCrop}` : ''}</span></li>)}
            </ul>
            <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Restaurar es limitado ({CONFIG.restoreActions} acciones) y lento. Cada 5 ciclos seguidos en equilibrio ({CONFIG.cycleSeconds * 5} s) multiplican tus puntos (hasta ×3). Atajos: 1 Conservar · 2 Cultivar · 3 Restaurar.</span></p>
            <button type="button" className="button" onClick={start}>Empezar ↗</button>
          </div>
        </div>}

        {phase === 'result' && summary && <div className="gs-overlay is-loss" role="dialog" aria-label="Resultado de la partida">
          <div className="gs-card">
            <p className="eyebrow">RESULTADO · {summary.cause === 'collapse' ? 'COLAPSO DEL BOSQUE' : 'HAMBRE'}</p>
            <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS · {Math.round(summary.score / 10)} S ESTABLES DE {Math.round(summary.seconds)} S</span></div>
            <ResultGrid items={[
              { label: 'Bono por racha', value: `+${summary.bonus}`, tone: summary.bonus > 0 ? 'ok' : undefined },
              { label: 'Mejor racha', value: `×${summary.bestMultiplier}` },
              { label: 'Bosque maduro final', value: `${summary.forests} parcelas` },
              { label: 'Carbono neto', value: `${summary.netCarbon >= 0 ? '+' : ''}${summary.netCarbon}`, tone: summary.netCarbon >= 0 ? 'ok' : 'warn' },
              { label: 'Convertidas', value: `${summary.converted} (${summary.logged} tala)` },
              { label: 'Incendios', value: summary.fires },
            ]} />
            <p>Restauraste {summary.restored} parcelas.</p>
            <p className="gs-explain">{explain(summary)}</p>
            <BestLine best={best} isNew={newBest} />
            <button type="button" className="button" onClick={start}>Jugar otra vez ↗</button>
          </div>
        </div>}
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
          <p>Marca clara: umbral estable. Marca roja: si baja de ahí, termina.</p>
        </div>
        <div className="forest-tools" role="radiogroup" aria-label="Herramienta">
          {TOOLS.map(t => <button key={t.id} type="button" role="radio" aria-checked={selected === t.id} aria-keyshortcuts={t.key} className={`gs-choice forest-tool${selected === t.id ? ' is-active' : ''}`} onClick={() => choose(t.id)} disabled={phase !== 'playing'}>
            <ToolIcon tool={t.id} /><span>{t.label}</span><small>{t.hint}</small><kbd>{t.key}</kbd>
          </button>)}
        </div>
      </div>
    </div>
    <p className={`gs-help${message ? ' is-alert' : ''}`} role="status">{message || 'Elige una herramienta y toca una parcela. Valores didácticos del escenario; no son mediciones reales de carbono ni de deforestación.'}</p>
  </div>
}
