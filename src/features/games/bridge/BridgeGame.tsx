import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { prefersReducedMotion, useBestScore, useFloaters, useShake } from '../shared/hooks'
import { BestLine, FloaterLayer, Gauge, Icon, ResultGrid, Stars, Stat, Streak } from '../shared/ui'
import {
  LEVELS, MATERIALS, MAX_ROW, START_INVENTORY, STOCK_LABEL, canContinue, clearColumn, commitLevel, emptyPlan, evaluate, fits, metersPerUnit,
  planCost, setDeck, startRun, starsFor, streakBonus, togglePillar, totalScore, totalStars, type Evaluation, type Material, type Outcome, type Plan, type Run, type Stock,
} from './engine'
import './bridge.css'

type Tool = Material | 'pillar' | 'erase'
type Phase = 'intro' | 'building' | 'testing' | 'level-result' | 'final'

const TOOL_LABEL: Record<Tool, string> = { steel: 'Acero', concrete: 'Concreto', pillar: 'Pilar', erase: 'Borrar' }
const STOCK_OF: Record<Material, Stock> = { steel: 'steel', concrete: 'cement' }
const STOCK_ICON: Record<Stock, React.ReactNode> = { steel: <i className="bridge-mini is-steel" />, cement: <i className="bridge-mini is-concrete" /> }
const OUTCOME_TEXT: Record<Outcome, string> = {
  ok: 'El camión cruzó al otro lado.',
  gap: 'Faltaba una pieza: el camión se detuvo antes del hueco.',
  slope: 'La pendiente era demasiado fuerte: el camión no pudo subir.',
  collapse: 'Un tramo sin apoyo cedió: el camión cayó.',
}

function explain(run: Run): string {
  const total = run.used.steel + run.used.cement
  if (!total) return 'No usaste material: sin estructura no hay forma de cruzar.'
  if (run.used.cement / total > 0.5) return 'En el cemento, parte del CO₂ se libera por la reacción química que forma el clínker, no solo por el combustible del horno. Por eso conviene usar apoyos y piezas justas.'
  if (run.used.steel / total > 0.6) return 'El acero resiste tramos largos, pero su producción necesita mucha energía. Un apoyo bien puesto permite gastar menos metal.'
  return 'Combinar materiales y apoyos permite cruzar usando menos. Diseñar con la cantidad justa reduce las emisiones incorporadas.'
}

/** Camión de carga, mirando a la derecha. */
function Truck() {
  return <svg viewBox="0 0 60 34" aria-hidden="true">
    <rect x="2" y="6" width="34" height="18" rx="3" fill="#ff6b4a" /><rect x="4" y="8" width="30" height="4" rx="1.5" fill="#ffffff55" />
    <path d="M36 12h12l8 7v5H36Z" fill="#ffb547" /><path d="M41 14h6l5 5H41Z" fill="#bfe6ff" />
    <rect x="0" y="23" width="58" height="3" rx="1.5" fill="#2a3242" />
    {[11, 26, 47].map(x => <g key={x}><circle cx={x} cy="28" r="5" fill="#1d2430" /><circle cx={x} cy="28" r="2" fill="#c9d2de" /></g>)}
  </svg>
}

export function BridgeGame() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [run, setRun] = useState<Run>(() => startRun())
  const [plan, setPlan] = useState<Plan>(() => emptyPlan(LEVELS[0]))
  const [tool, setTool] = useState<Tool>('steel')
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [car, setCar] = useState({ x: 0, drop: 0 })
  const [collapsed, setCollapsed] = useState<number[]>([])
  const [message, setMessage] = useState('')
  const [best, submitBest] = useBestScore('industria')
  const [newBest, setNewBest] = useState(false)
  const floaters = useFloaters()
  const [shaking, shake] = useShake()
  const reduceMotion = useRef(prefersReducedMotion())

  const level = LEVELS[Math.min(run.levelIndex, LEVELS.length - 1)]
  const cols = level.gap + 2
  const cost = useMemo(() => planCost(plan), [plan])
  const remaining = { steel: run.inventory.steel - cost.steel, cement: run.inventory.cement - cost.cement }
  // Vista previa: tramos sin apoyo más largos de lo que resiste su material.
  const risky = useMemo(() => {
    if (phase !== 'building') return new Set<number>()
    const cols = new Set<number>()
    for (const r of evaluate(level, plan).runs) if (!r.ok) for (let c = r.from; c <= r.to; c++) cols.add(c)
    return cols
  }, [phase, level, plan])

  const startLevel = useCallback((nextRun: Run) => {
    setRun(nextRun); setPlan(emptyPlan(LEVELS[nextRun.levelIndex])); setEvaluation(null)
    setCar({ x: 0, drop: 0 }); setCollapsed([]); setMessage(''); setPhase('building')
  }, [])

  function restart() { playSfx('adventure'); setNewBest(false); startLevel(startRun()) }

  function tryPlan(next: Plan): boolean {
    if (fits(run.inventory, planCost(next))) { setPlan(next); setMessage(''); return true }
    setMessage('No te alcanza el material para esa pieza. Bórrala o usa otro material.')
    playSfx('warn')
    return false
  }

  function cellClick(col: number, row: number) {
    if (phase !== 'building') return
    const current = plan.deck[col - 1]
    if (tool === 'erase') { setPlan(clearColumn(plan, col)); setMessage(''); return }
    if (tool === 'pillar') {
      if (!current) { setMessage('Primero coloca una pieza de tablero en esa columna.'); return }
      tryPlan(togglePillar(plan, col)); return
    }
    if (current && current.material === tool && current.row === row) { setPlan(clearColumn(plan, col)); return }
    tryPlan(setDeck(plan, col, row, tool))
  }

  function test() {
    const result = evaluate(level, plan)
    setEvaluation(result); setCar({ x: 0, drop: 0 }); setCollapsed([]); setPhase('testing')
    playSfx('map')
  }

  // Animación del camión.
  useEffect(() => {
    if (phase !== 'testing' || !evaluation) return
    const endX = evaluation.outcome === 'ok' ? cols - 1 : evaluation.outcome === 'collapse' ? evaluation.failColumn! : evaluation.driven
    const speed = reduceMotion.current ? 40 : 3.2
    let raf = 0, last = performance.now(), x = 0, drop = 0, cracked = false
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      if (x < endX) x = Math.min(endX, x + speed * dt)
      else if (evaluation.outcome === 'collapse') {
        if (!cracked) {
          cracked = true; playSfx('loss'); shake()
          setCollapsed(evaluation.runs.filter(r => !r.ok && r.from <= evaluation.failColumn! && evaluation.failColumn! <= r.to).flatMap(r => Array.from({ length: r.length }, (_, i) => r.from + i)))
        }
        drop = Math.min(1, drop + (reduceMotion.current ? 1 : 1.8 * dt))
      } else if (evaluation.outcome !== 'ok') drop = 0.0001
      setCar({ x, drop })
      const finished = x >= endX && (evaluation.outcome !== 'collapse' || drop >= 1)
      if (finished) {
        if (evaluation.outcome === 'ok') { playSfx('win'); floaters.push('¡Cruzó!', 88, 30, 'combo') }
        else if (evaluation.outcome !== 'collapse') playSfx('loss')
        window.setTimeout(() => setPhase('level-result'), reduceMotion.current ? 0 : 500); return
      }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    return () => window.cancelAnimationFrame(raf)
  }, [phase, evaluation, cols, shake, floaters.push])

  function next() {
    const { run: nextRun } = commitLevel(run, plan)
    if (!canContinue(nextRun)) { setRun(nextRun); setNewBest(submitBest(totalScore(nextRun))); setPhase('final'); return }
    startLevel(nextRun)
  }

  const roadRow = (x: number) => {
    const rowOf = (c: number) => c === 0 ? level.leftH : c === cols - 1 ? level.rightH : (plan.deck[c - 1]?.row ?? level.leftH)
    const a = Math.floor(x), b = Math.min(cols - 1, a + 1), t = x - a
    return rowOf(a) * (1 - t) + rowOf(b) * t
  }

  const tools: Tool[] = ['steel', 'concrete', 'pillar', 'erase']

  const gridCells: React.ReactNode[] = []
  for (let r = MAX_ROW; r >= 1; r--) {
    for (let c = 0; c < cols; c++) {
      const key = `${c}-${r}`
      if (c === 0 || c === cols - 1) {
        const h = c === 0 ? level.leftH : level.rightH
        gridCells.push(<div key={key} className={`bridge-cell ${r <= h ? 'is-cliff' : 'is-sky'}${r === h ? ' is-top' : ''}${c === 0 ? ' is-left' : ' is-right'}`} aria-hidden="true" />)
        continue
      }
      const deck = plan.deck[c - 1]
      const isDeck = deck?.row === r
      const isPillar = plan.pillar[c - 1] && deck && r < deck.row
      const fallen = collapsed.includes(c)
      const risk = isDeck && risky.has(c)
      const label = `Columna ${c}, fila ${r}${isDeck ? `: ${MATERIALS[deck!.material].label}` : isPillar ? ': pilar' : ': vacía'}`
      gridCells.push(<button key={key} type="button" aria-label={label} disabled={phase !== 'building'}
        className={`bridge-cell ${isDeck ? `is-deck is-${deck!.material}${fallen ? ' is-fallen' : ''}${risk ? ' is-risk' : ''}` : isPillar ? `is-pillar${fallen ? ' is-fallen' : ''}` : 'is-empty'}`}
        onClick={() => cellClick(c, r)} />)
    }
  }

  const final = phase === 'final'
  const finishedAll = run.levelIndex >= LEVELS.length
  const lastResult = run.results[run.results.length - 1]
  const shownResult = phase === 'level-result' ? evaluation : null
  const shownStars = shownResult ? starsFor(level, shownResult.outcome, cost) : 0
  const shownBonus = shownResult?.outcome === 'ok' ? streakBonus(shownResult.meters, run.streak + 1) : 0
  const levelLabel = `Nivel ${Math.min(run.levelIndex + 1, LEVELS.length)} de ${LEVELS.length} · ${level.name}`

  return <div className={`gs-game bridge-game${shaking ? ' is-shaking' : ''}`} style={{ '--ghost': `var(--piece-${tool})` } as React.CSSProperties}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="NIVEL" value={levelLabel} icon={Icon.ruler} />
      <Stat label="PUNTAJE" value={`${totalScore(run)} · ${run.distance} m`} icon={Icon.star} tone="accent" />
      <Streak multiplier={run.streak >= 1 ? 1 + 0.5 * (Math.min(run.streak, 4) - 1) : 1} label="RACHA DE PUENTES" detail={`${run.streak} seguido${run.streak === 1 ? '' : 's'}`} />
      {(['steel', 'cement'] as Stock[]).map(stock => <Gauge key={stock} label={`${STOCK_LABEL[stock].toUpperCase()} DISPONIBLE`} value={remaining[stock]} max={START_STOCK[stock]} icon={STOCK_ICON[stock]} />)}
    </div>

    <div className="gs-stage gs-stage-fit bridge-stage" style={{ '--fit-ratio': 11 / 7 } as React.CSSProperties}>
      <div className="gs-fit-box bridge-scene" role="group" aria-label="Zona de construcción del puente">
        <div className="bridge-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${MAX_ROW}, 1fr)` }}>{gridCells}</div>
        <div className="bridge-valley" aria-hidden="true" />
        {(phase === 'testing' || phase === 'level-result') && <div className="bridge-car" aria-hidden="true"
          style={{ left: `${((car.x + 0.5) / cols) * 100}%`, bottom: `calc(${(roadRow(Math.min(car.x, cols - 1)) / MAX_ROW) * 100}% - ${car.drop * 70}%)`, transform: `translateX(-50%) rotate(${car.drop * 40}deg)`, opacity: 1 - car.drop * 0.6 }}><Truck /></div>}
        <FloaterLayer items={floaters.items} />
      </div>

      {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Puente de materiales · instrucciones">
        <div className="gs-card">
          <p className="eyebrow">CONTEXTO · INDUSTRIA Y MATERIALES</p>
          <h3>Puente de materiales</h3>
          <p>Construye un puente para que pase el camión. El material es fijo y se gasta nivel tras nivel: si el puente cae, lo gastado no se recupera. Gana distancia llegando cada vez más lejos.</p>
          <ul className="gs-legend">
            {(['steel', 'concrete'] as Material[]).map(m => <li key={m}><i className={`bridge-swatch is-${m}`} /> <span><b>{MATERIALS[m].label}</b>: tramo libre hasta {MATERIALS[m].span} piezas. {MATERIALS[m].note}</span></li>)}
            <li><i className="bridge-swatch is-pillar" /> <span><b>Pilar</b>: apoya una pieza y divide el tramo. Cuesta cemento según su altura.</span></li>
          </ul>
          <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Puentes completados seguidos suman metros extra, y gastar menos material por tramo da hasta 3 estrellas. Los tramos marcados en rojo van a ceder.</span></p>
          <button type="button" className="button" onClick={restart}>Empezar ↗</button>
        </div>
      </div>}

      {phase === 'level-result' && shownResult && <div className={`gs-overlay is-compact ${shownResult.outcome === 'ok' ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado del nivel">
        <div className="gs-card">
          <p className="eyebrow">RESULTADO · {level.name.toUpperCase()}</p>
          <h3>{shownResult.outcome === 'ok' ? '¡Puente completado!' : 'El puente no llegó'} <Stars count={shownStars} /></h3>
          <p>{OUTCOME_TEXT[shownResult.outcome]} Distancia del nivel: {shownResult.meters} m{shownBonus ? ` · bono por racha +${shownBonus}` : ''}. Material usado: {cost.steel} acero, {cost.cement} cemento — no se recupera.</p>
          <button type="button" className="button" onClick={next}>{run.levelIndex + 1 >= LEVELS.length ? 'Ver resultado final ↗' : 'Siguiente nivel ↗'}</button>
        </div>
      </div>}

      {final && <div className={`gs-overlay ${run.distance > 0 ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado final">
        <div className="gs-card">
          <p className="eyebrow">RESULTADO FINAL · {finishedAll ? 'NIVELES COMPLETADOS' : 'SIN MATERIAL'}</p>
          <div className="gs-score-big"><strong>{totalScore(run)}</strong><span>PUNTOS · {run.distance} METROS RECORRIDOS</span></div>
          <ul className="bridge-results">{run.results.map((r, i) => <li key={r.levelId}><span>{LEVELS[i].name}</span><span>{r.meters} m{r.bonus ? ` +${r.bonus}` : ''}</span><Stars count={r.stars} /></li>)}</ul>
          <ResultGrid items={[
            { label: 'Estrellas', value: `${totalStars(run)} / ${LEVELS.length * 3}` },
            { label: 'Bono por racha', value: `+${run.bonus}`, tone: run.bonus > 0 ? 'ok' : undefined },
            { label: 'Emisiones incorporadas', value: Math.round(run.emissions) },
            { label: 'm por unidad', value: metersPerUnit(run).toFixed(1) },
          ]} />
          {lastResult && !finishedAll && <p>Te quedaste sin material para seguir construyendo.</p>}
          <p className="gs-explain">{explain(run)}</p>
          <BestLine best={best} isNew={newBest} />
          <button type="button" className="button" onClick={restart}>Jugar otra vez ↗</button>
        </div>
      </div>}
    </div>

    <div className="bridge-controls">
      <div className="bridge-tools" role="radiogroup" aria-label="Herramienta de construcción">
        {tools.map(t => <button key={t} type="button" role="radio" aria-checked={tool === t} className={`gs-choice bridge-tool${tool === t ? ' is-active' : ''}`} onClick={() => setTool(t)} disabled={phase !== 'building'}>
          <i className={`bridge-swatch is-${t}`} /><span>{TOOL_LABEL[t]}</span>
          <small>{t === 'pillar' ? 'cemento = altura − 1' : t === 'erase' ? 'quita la columna' : `${MATERIALS[t].perCell} ${STOCK_LABEL[STOCK_OF[t]].toLowerCase()} · tramo ${MATERIALS[t].span}`}</small>
        </button>)}
      </div>
      <div className="bridge-actions">
        <button type="button" className="button" onClick={test} disabled={phase !== 'building' || cost.cells === 0}>Probar puente ↗</button>
        <button type="button" className="bridge-clear" onClick={() => { setPlan(emptyPlan(level)); setMessage('') }} disabled={phase !== 'building'}>Limpiar</button>
      </div>
    </div>
    <p className={`gs-help${message ? ' is-alert' : ''}`} role="status">{message || (phase === 'building' ? `${level.hint} Elige un material y toca la casilla donde va la pieza; la fila es su altura. La carretera sube o baja como máximo una fila por columna.${risky.size ? ' Hay tramos en rojo: necesitan un pilar o un material que resista más.' : ''}` : ' ')}</p>
    <p className="gs-help">Valores didácticos del escenario; no son mediciones de emisiones.</p>
  </div>
}

const START_STOCK: Record<Stock, number> = { ...START_INVENTORY }
