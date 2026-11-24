import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { playSfx } from '../../audio/sfx'
import { prefersReducedMotion, useBestScore, useFloaters, useShake } from '../shared/hooks'
import { BestLine, FloaterLayer, Gauge, Icon, ResultGrid, Stars, Stat, Streak } from '../shared/ui'
import {
  LEVELS, MATERIALS, MAX_ROW, MIN_BRIDGES_PASSED, SCORE_BONUS_REFILL, SCORE_BONUS_STEP, START_INVENTORY, STOCK_LABEL,
  canContinue, clearColumn, commitLevel, completedBridges, emptyPlan, evaluate, fits, levelAt,
  passedRun, planCost, refillFor, setDeck, startRun, starsFor, streakBonus, togglePillar, totalScore, totalStars,
  type Evaluation, type Material, type Outcome, type Plan, type Run, type Stock,
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
  if (!passedRun(run)) {
    return `Solo cruzaste ${completedBridges(run)} de los ${MIN_BRIDGES_PASSED} puentes necesarios para superar el reto. Ahorra acero usando concreto con pilares bien ubicados.`
  }
  if (run.used.cement / total > 0.5) return 'En el cemento, parte del CO₂ se libera por la reacción química que forma el clínker, no solo por el combustible del horno. Por eso conviene usar apoyos y piezas justas.'
  if (run.used.steel / total > 0.6) return 'El acero resiste tramos largos, pero su producción necesita mucha energía. Un apoyo bien puesto permite gastar menos metal y recuperar más inventario.'
  return 'Combinar materiales y apoyos permite cruzar usando menos y recuperar inventario circular para seguir rompiendo tu récord.'
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

export function BridgeGame({ onComplete, onNext, nextLabel }: { onComplete?: () => void; onNext?: () => void; nextLabel?: string } = {}) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const completedThisRun = useRef(false)
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

  const level = levelAt(run.levelIndex)
  const cols = level.gap + 2
  const cost = useMemo(() => planCost(plan), [plan])
  const remaining = { steel: run.inventory.steel - cost.steel, cement: run.inventory.cement - cost.cement }
  const risky = useMemo(() => {
    if (phase !== 'building') return new Set<number>()
    const set = new Set<number>()
    for (const r of evaluate(level, plan).runs) if (!r.ok) for (let c = r.from; c <= r.to; c++) set.add(c)
    return set
  }, [phase, level, plan])

  const startLevel = useCallback((nextRun: Run) => {
    setRun(nextRun); setPlan(emptyPlan(levelAt(nextRun.levelIndex))); setEvaluation(null)
    setCar({ x: 0, drop: 0 }); setCollapsed([]); setMessage(''); setPhase('building')
  }, [])

  function restart() {
    playSfx('adventure')
    completedThisRun.current = false
    setNewBest(false)
    startLevel(startRun())
  }

  function tryPlan(next: Plan): boolean {
    if (fits(run.inventory, planCost(next))) { setPlan(next); setMessage(''); return true }
    setMessage('No te alcanza el material para esa pieza. Bórrala o usa otro material.')
    playSfx('warn')
    return false
  }

  function cellClick(col: number, row: number) {
    if (phase !== 'building') return
    const current = plan.deck[col - 1]
    if (tool === 'erase') {
      const had = !!(current || plan.pillar[col - 1])
      setPlan(clearColumn(plan, col)); setMessage('')
      if (had) playSfx('timeline')
      return
    }
    if (tool === 'pillar') {
      if (!current) { setMessage('Primero coloca una pieza de tablero en esa columna.'); playSfx('warn'); return }
      const wasPillar = plan.pillar[col - 1]
      if (tryPlan(togglePillar(plan, col))) playSfx(wasPillar ? 'timeline' : 'gain')
      return
    }
    if (current && current.material === tool && current.row === row) { setPlan(clearColumn(plan, col)); playSfx('timeline'); return }
    if (tryPlan(setDeck(plan, col, row, tool))) playSfx('gain')
  }

  function test() {
    const result = evaluate(level, plan)
    setEvaluation(result); setCar({ x: 0, drop: 0 }); setCollapsed([]); setPhase('testing')
    playSfx('map')
  }

  useEffect(() => {
    if (phase !== 'testing' || !evaluation) return
    const endX = evaluation.outcome === 'ok' ? cols - 1 : evaluation.outcome === 'collapse' ? evaluation.failColumn! : evaluation.driven
    const speed = reduceMotion.current ? 40 : 3.2
    let raf = 0, finishTimer = 0, last = performance.now(), x = 0, drop = 0, cracked = false
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
        finishTimer = window.setTimeout(() => setPhase('level-result'), reduceMotion.current ? 0 : 500); return
      }
      raf = window.requestAnimationFrame(frame)
    }
    raf = window.requestAnimationFrame(frame)
    return () => { window.cancelAnimationFrame(raf); window.clearTimeout(finishTimer) }
  }, [phase, evaluation, cols, shake, floaters.push])

  function next() {
    const { run: nextRun, result } = commitLevel(run, plan)
    if (result.scoreBonus.steel > 0 || result.scoreBonus.cement > 0) {
      floaters.push(`+${result.scoreBonus.steel} acero · +${result.scoreBonus.cement} cemento (bono)`, 50, 22, 'combo')
      playSfx('gain')
    }
    const liveScore = totalScore(nextRun)
    if (liveScore > best) setNewBest(submitBest(liveScore))
    if (!completedThisRun.current && passedRun(nextRun)) {
      completedThisRun.current = true
      onCompleteRef.current?.()
    }
    if (!canContinue(nextRun)) {
      setRun(nextRun); setNewBest(submitBest(totalScore(nextRun))); setPhase('final')
      if (!passedRun(nextRun)) playSfx('loss')
      return
    }
    startLevel(nextRun)
  }

  function finishEarly() {
    setNewBest(submitBest(totalScore(run)))
    setPhase('final')
  }

  const roadRow = (x: number) => {
    const rowOf = (c: number): number => {
      if (c <= 0) return level.leftH
      if (c >= cols - 1) return level.rightH
      if (plan.deck[c - 1]) return plan.deck[c - 1]!.row
      for (let k = c - 1; k >= 1; k--) if (plan.deck[k - 1]) return plan.deck[k - 1]!.row
      return level.leftH
    }
    const a = Math.floor(x), b = Math.min(cols - 1, a + 1), t = x - a
    return rowOf(a) * (1 - t) + rowOf(b) * t
  }

  const slopeAngleDeg = (() => {
    if (car.drop > 0) return car.drop * 42
    const x0 = Math.max(0, car.x - 0.12)
    const x1 = Math.min(cols - 1, car.x + 0.12)
    const dCol = x1 - x0
    if (dCol <= 0) return 0
    const dRow = roadRow(x1) - roadRow(x0)
    const dxVis = dCol * ((11 / 7) / cols)
    const dyVis = dRow / MAX_ROW
    return Math.atan2(-dyVis, dxVis) * (180 / Math.PI)
  })()

  const cx = (c: number) => c * 100 + 50
  const topY = (row: number) => (MAX_ROW - row) * 100
  const surfaceAt = (c: number): { row: number; cliff: boolean; mat: Material | null } | null => {
    if (c === 0) return { row: level.leftH, cliff: true, mat: null }
    if (c === cols - 1) return { row: level.rightH, cliff: true, mat: null }
    const d = plan.deck[c - 1]
    if (!d || collapsed.includes(c)) return null
    return { row: d.row, cliff: false, mat: d.material }
  }

  const renderBeamSpan = (key: string, x1: number, y1: number, x2: number, y2: number, mat: Material) => {
    const h = 30
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const pts = `${x1},${y1} ${x2},${y2} ${x2},${y2 + h} ${x1},${y1 + h}`
    return (
      <g key={key} className={`bridge-svg-span is-${mat}`}>
        <polygon points={pts} fill={mat === 'steel' ? '#7b8ea8' : '#dfd5c2'} stroke={mat === 'steel' ? '#3a485e' : '#8a7d66'} strokeWidth="2.5" strokeLinejoin="round" />
        {mat === 'steel' ? <>
          <line x1={x1} y1={y1 + 6} x2={mx} y2={my + h - 5} stroke="#42526b" strokeWidth="3" />
          <line x1={mx} y1={my + h - 5} x2={x2} y2={y2 + 6} stroke="#42526b" strokeWidth="3" />
          <line x1={x1} y1={y1 + h - 5} x2={mx} y2={my + 6} stroke="#42526b" strokeWidth="3" />
          <line x1={mx} y1={my + 6} x2={x2} y2={y2 + h - 5} stroke="#42526b" strokeWidth="3" />
          <line x1={x1} y1={y1 + 5} x2={x2} y2={y2 + 5} stroke="#495a73" strokeWidth="2" />
          <line x1={x1} y1={y1 + h - 4} x2={x2} y2={y2 + h - 4} stroke="#495a73" strokeWidth="2.5" />
        </> : <>
          <polygon points={`${x1},${y1 + 19} ${x2},${y2 + 19} ${x2},${y2 + h} ${x1},${y1 + h}`} fill="#b7ab94" />
          <line x1={mx} y1={my + 4} x2={mx} y2={my + h - 2} stroke="#8a7d66" strokeWidth="2" opacity="0.65" />
        </>}
        <line x1={x1} y1={y1 + 1.5} x2={x2} y2={y2 + 1.5} stroke="#2a303d" strokeWidth="9" strokeLinecap="round" />
        <line x1={x1} y1={y1 + 1} x2={x2} y2={y2 + 1} stroke="#74829c" strokeWidth="2" strokeDasharray="10 8" strokeLinecap="round" />
      </g>
    )
  }

  const steepCols = useMemo(() => {
    const bad = new Set<number>()
    if (phase !== 'building') return bad
    for (let c = 1; c <= level.gap; c++) {
      const d = plan.deck[c - 1]
      if (!d) continue
      const prevRow = c === 1 ? level.leftH : plan.deck[c - 2]?.row
      const nextRow = c === level.gap ? level.rightH : plan.deck[c]?.row
      if ((prevRow !== undefined && Math.abs(d.row - prevRow) > 1) || (nextRow !== undefined && Math.abs(nextRow - d.row) > 1)) {
        bad.add(c)
      }
    }
    return bad
  }, [phase, level, plan])

  const guideRowOf = (c: number) =>
    Math.round(level.leftH + (level.rightH - level.leftH) * (c / (level.gap + 1)))

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
      const steep = isDeck && steepCols.has(c)
      const prevRow = c === 1 ? level.leftH : plan.deck[c - 2]?.row
      const nextRow = c === level.gap ? level.rightH : plan.deck[c]?.row
      const rampUp = isDeck && !steep && ((prevRow !== undefined && prevRow === r - 1) || (nextRow !== undefined && nextRow === r + 1))
      const rampDown = isDeck && !steep && !rampUp && ((prevRow !== undefined && prevRow === r + 1) || (nextRow !== undefined && nextRow === r - 1))
      const showGuide = phase === 'building' && level.leftH !== level.rightH && !deck && guideRowOf(c) === r
      const label = `Columna ${c}, fila ${r}${isDeck ? `: ${MATERIALS[deck!.material].label}` : isPillar ? ': pilar' : ': vacía'}`
      gridCells.push(<button key={key} type="button" data-col={c} data-row={r} data-sfx="none" aria-label={label} disabled={phase !== 'building'}
        className={`bridge-cell ${isDeck ? `is-deck is-${deck!.material}${fallen ? ' is-fallen' : ''}${risk ? ' is-risk' : ''}${steep ? ' is-steep' : ''}${rampUp ? ' is-ramp-up' : rampDown ? ' is-ramp-down' : ''}` : isPillar ? `is-pillar${fallen ? ' is-fallen' : ''}` : `is-empty${showGuide ? ' is-guide' : ''}`}`}
        onClick={() => cellClick(c, r)}
        onKeyDown={event => {
          let nc = c, nr = r
          if (event.key === 'ArrowRight') nc = Math.min(cols - 2, c + 1)
          else if (event.key === 'ArrowLeft') nc = Math.max(1, c - 1)
          else if (event.key === 'ArrowUp') nr = Math.min(MAX_ROW, r + 1)
          else if (event.key === 'ArrowDown') nr = Math.max(1, r - 1)
          else return
          event.preventDefault()
          playSfx('click')
          const target = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`button[data-col="${nc}"][data-row="${nr}"]`)
          target?.focus()
        }} />)
    }
  }

  const final = phase === 'final'
  const okCount = completedBridges(run)
  const challengeCleared = passedRun(run)
  const shownResult = phase === 'level-result' ? evaluation : null
  const shownStars = shownResult ? starsFor(level, shownResult.outcome, cost) : 0
  const shownBonus = shownResult?.outcome === 'ok' ? streakBonus(shownResult.meters, run.streak + 1) : 0
  const shownRefill = refillFor(level, shownStars)
  const levelLabel = `Puente #${run.levelIndex + 1} · ${level.name}`
  const coach = (() => {
    if (cost.cells === 0) {
      return {
        tone: 'info' as const,
        tag: 'PASO 1',
        text: level.leftH !== level.rightH
          ? 'Elige Acero o Concreto y toca las casillas marcadas con puntos dorados para subir o bajar suavemente.'
          : 'Elige Acero o Concreto y toca una casilla por columna para unir ambos lados sin dejar huecos.',
      }
    }
    if (steepCols.size > 0) {
      return {
        tone: 'warn' as const,
        tag: 'PENDIENTE BRUSCA',
        text: 'El camión solo puede subir o bajar 1 fila por columna. Coloca la pieza vecina a ±1 fila para suavizar la rampa.',
      }
    }
    if (risky.size > 0) {
      return {
        tone: 'warn' as const,
        tag: 'SIN APOYO',
        text: 'Las piezas marcadas con ! van a ceder. Selecciona «Pilar» y toca esa columna, o cámbiala por Acero.',
      }
    }
    if (cost.cells < level.gap) {
      const missing = level.gap - cost.cells
      return {
        tone: 'info' as const,
        tag: 'EN CONSTRUCCIÓN',
        text: `Falta colocar ${missing} columna${missing === 1 ? '' : 's'} más para conectar el puente de un acantilado al otro.`,
      }
    }
    return {
      tone: 'ok' as const,
      tag: 'LISTO PARA PROBAR',
      text: '¡Puente conectado y sin fallas! Pulsa «Probar puente ↗» para hacer pasar el camión.',
    }
  })()

  return <div className={`gs-game bridge-game${shaking ? ' is-shaking' : ''}`} style={{ '--ghost': `var(--piece-${tool})` } as React.CSSProperties}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="TRAMO ARCADE" value={levelLabel} icon={Icon.ruler} />
      <Stat label="PUNTAJE" value={`${totalScore(run)} · ${run.distance} m`} icon={Icon.star} tone="accent" />
      <Stat label="META DEL RETO" value={challengeCleared ? `★ ${okCount} puentes` : `${okCount} / ${MIN_BRIDGES_PASSED} puentes`} icon={Icon.check} tone={challengeCleared ? 'ok' : undefined} />
      <Streak multiplier={run.streak >= 1 ? 1 + 0.5 * (Math.min(run.streak, 4) - 1) : 1} label="RACHA DE PUENTES" detail={`${run.streak} seguido${run.streak === 1 ? '' : 's'}`} />
      {(['steel', 'cement'] as Stock[]).map(stock => <Gauge key={stock} label={`${STOCK_LABEL[stock].toUpperCase()} DISPONIBLE`} value={remaining[stock]} max={Math.max(START_STOCK[stock], remaining[stock])} icon={STOCK_ICON[stock]} />)}
    </div>

    <div className="gs-stage gs-stage-fit bridge-stage" style={{ '--fit-ratio': 11 / 7 } as React.CSSProperties}>
      <div className="gs-fit-box bridge-scene" role="group" aria-label="Zona de construcción del puente">
        <div className="bridge-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${MAX_ROW}, 1fr)` }}>{gridCells}</div>
        <svg className="bridge-deck-svg" viewBox={`0 0 ${cols * 100} ${MAX_ROW * 100}`} preserveAspectRatio="none" aria-hidden="true">
          {Array.from({ length: level.gap }, (_, i) => i + 1).map(c => {
            if (!plan.pillar[c - 1]) return null
            const cur = surfaceAt(c)
            if (!cur) return null
            const yTop = topY(cur.row) + 18
            const xMid = cx(c)
            return (
              <g key={`pil-${c}`} className="bridge-svg-pillar">
                <rect x={xMid - 14} y={yTop} width="28" height={MAX_ROW * 100 - yTop} fill="#b5ab96" stroke="#6f6655" strokeWidth="2" />
                <rect x={xMid - 6} y={yTop} width="8" height={MAX_ROW * 100 - yTop} fill="#dcd2be" opacity="0.55" />
                <rect x={xMid - 20} y={yTop} width="40" height="12" rx="2" fill="#cfc4ae" stroke="#6f6655" strokeWidth="2" />
              </g>
            )
          })}
          {Array.from({ length: cols - 1 }, (_, c) => {
            const a = surfaceAt(c), b = surfaceAt(c + 1)
            if (!a || !b || (a.cliff && b.cliff) || Math.abs(a.row - b.row) > 1) return null
            const x1 = cx(c), y1 = topY(a.row), x2 = cx(c + 1), y2 = topY(b.row)
            if (!a.cliff && !b.cliff && a.mat !== b.mat) {
              const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
              return <g key={`tr-${c}`}>{renderBeamSpan(`tr-${c}a`, x1, y1, mx, my, a.mat!)}{renderBeamSpan(`tr-${c}b`, mx, my, x2, y2, b.mat!)}</g>
            }
            const mat = !a.cliff ? a.mat! : b.mat!
            return renderBeamSpan(`tr-${c}`, x1, y1, x2, y2, mat)
          })}
          {Array.from({ length: level.gap }, (_, i) => i + 1).map(c => {
            const cur = surfaceAt(c)
            if (!cur || !cur.mat) return null
            const left = surfaceAt(c - 1), right = surfaceAt(c + 1)
            const hasLeft = Boolean(left && Math.abs(left.row - cur.row) <= 1)
            const hasRight = Boolean(right && Math.abs(right.row - cur.row) <= 1)
            if (hasLeft && hasRight) return null
            const x = cx(c), y = topY(cur.row)
            const x1 = hasLeft ? x : x - 38
            const x2 = hasRight ? x : x + 38
            return renderBeamSpan(`stub-${c}`, x1, y, x2, y, cur.mat)
          })}
        </svg>
        <div className="bridge-valley" aria-hidden="true" />
        {(phase === 'testing' || phase === 'level-result') && <div className="bridge-car" aria-hidden="true"
          style={{ left: `${((car.x + 0.5) / cols) * 100}%`, bottom: `calc(${(roadRow(Math.min(car.x, cols - 1)) / MAX_ROW) * 100}% - ${car.drop * 70}%)`, transform: `translateX(-50%) rotate(${slopeAngleDeg}deg)`, opacity: 1 - car.drop * 0.6 }}><Truck /></div>}
        <FloaterLayer items={floaters.items} />
      </div>

      {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Puente de materiales · instrucciones">
        <div className="gs-card">
          <p className="eyebrow">MODO ARCADE · INDUSTRIA Y MATERIALES</p>
          <h3>Puente de materiales</h3>
          <p>Construye puentes eficientes en modo arcade continuo. El material inicial es más ajustado: al cruzar con buena eficiencia recuperas parte del material para seguir superando nuevas brechas indefinidamente.</p>
          <ul className="gs-legend">
            {(['steel', 'concrete'] as Material[]).map(m => <li key={m}><i className={`bridge-swatch is-${m}`} /> <span><b>{MATERIALS[m].label}</b>: tramo libre hasta {MATERIALS[m].span} piezas. {MATERIALS[m].note}</span></li>)}
            <li><i className={`bridge-swatch is-pillar`} /> <span><b>Pilar</b>: apoya una pieza y divide el tramo. Cuesta cemento según su altura.</span></li>
          </ul>
          <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Meta del reto: cruza al menos {MIN_BRIDGES_PASSED} puentes en una partida. Cada puente cruzado suma distancia, racha y reabastecimiento según tus estrellas. Cada {SCORE_BONUS_STEP} puntos recibes un pequeño bono extra (+{SCORE_BONUS_REFILL.steel} acero y +{SCORE_BONUS_REFILL.cement} cemento).</span></p>
          <button type="button" className="button" data-sfx="none" onClick={restart}>Empezar ↗</button>
        </div>
      </div>}

      {phase === 'level-result' && shownResult && (() => {
        const preview = commitLevel(run, plan)
        const willFinish = !canContinue(preview.run)
        const sb = preview.result.scoreBonus
        const hasScoreBonus = sb.steel > 0 || sb.cement > 0
        return <div className={`gs-overlay is-compact ${shownResult.outcome === 'ok' ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado del nivel">
          <div className="gs-card">
            <p className="eyebrow">RESULTADO · {level.name.toUpperCase()}</p>
            <h3>{shownResult.outcome === 'ok' ? '¡Puente completado!' : 'El puente no llegó'} <Stars count={shownStars} /></h3>
            <p>
              {OUTCOME_TEXT[shownResult.outcome]} Distancia: {shownResult.meters} m{shownBonus ? ` · bono +${shownBonus}` : ''}.
              {' '}Usaste {cost.steel} acero y {cost.cement} cemento.
              {shownResult.outcome === 'ok' && ` Recuperas +${shownRefill.steel} acero y +${shownRefill.cement} cemento.`}
              {hasScoreBonus && ` Bono por puntaje (cada ${SCORE_BONUS_STEP} pts): +${sb.steel} acero y +${sb.cement} cemento.`}
            </p>
            <button type="button" className="button" data-sfx={willFinish ? 'none' : 'open'} onClick={next}>
              {willFinish ? 'Ver resultado final ↗' : 'Siguiente puente ↗'}
            </button>
          </div>
        </div>
      })()}

      {final && (() => {
        const won = passedRun(run)
        return <div className={`gs-overlay ${won ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado final">
          <div className="gs-card">
            {won && <span className="gs-win-stamp">★ RETO COMPLETADO</span>}
            <p className="eyebrow">FIN DE PARTIDA ARCADE · {okCount} PUENTES CRUZADOS</p>
            <div className="gs-score-big"><strong>{totalScore(run)}</strong><span>PUNTOS · {run.distance} METROS RECORRIDOS</span></div>
            <ul className="bridge-results">{run.results.map((r, idx) => <li key={`${r.levelId}-${idx}`}><span>{r.levelName}</span><span>{r.meters} m{r.bonus ? ` +${r.bonus}` : ''}</span><Stars count={r.stars} /></li>)}</ul>
            <ResultGrid items={[
              { label: 'Puentes cruzados', value: `${okCount}`, tone: won ? 'ok' : 'warn' },
              { label: 'Estrellas totales', value: `${totalStars(run)}` },
              { label: 'Bono por racha', value: `+${run.bonus}`, tone: run.bonus > 0 ? 'ok' : undefined },
              { label: 'Emisiones incorporadas', value: Math.round(run.emissions) },
            ]} />
            <ul className="gs-checklist" aria-label="Requisitos del reto">
              <li className={won ? 'is-ok' : 'is-fail'}>
                <b>{won ? '✓' : '✕'}</b>
                <span>Puentes cruzados con éxito: {okCount} / {MIN_BRIDGES_PASSED} mínimos</span>
              </li>
            </ul>
            <p className="gs-explain">{explain(run)}</p>
            <BestLine best={best} isNew={newBest} />
            <div className="gs-modal-actions">
              {won && onNext && <button type="button" className="button" onClick={onNext}>{nextLabel ?? 'Siguiente minijuego →'}</button>}
              <button type="button" className={won && onNext ? 'gs-retry-btn' : 'button'} data-sfx="none" onClick={restart}>{won ? 'Jugar otra vez ↗' : 'Reintentar reto ↗'}</button>
            </div>
          </div>
        </div>
      })()}
    </div>

    <div className="bridge-controls">
      <div className="bridge-tools" role="radiogroup" aria-label="Herramienta de construcción">
        {tools.map(t => <button key={t} type="button" role="radio" aria-checked={tool === t} className={`gs-choice bridge-tool${tool === t ? ' is-active' : ''}`} onClick={() => setTool(t)} disabled={phase !== 'building'}>
          <i className={`bridge-swatch is-${t}`} /><span>{TOOL_LABEL[t]}</span>
          <small>{t === 'pillar' ? 'cemento = altura − 1' : t === 'erase' ? 'quita la columna' : `${MATERIALS[t].perCell} ${STOCK_LABEL[STOCK_OF[t]].toLowerCase()} · tramo ${MATERIALS[t].span}`}</small>
        </button>)}
      </div>
      <div className="bridge-actions">
        <button type="button" className="button" data-sfx="none" onClick={test} disabled={phase !== 'building' || cost.cells === 0}>Probar puente ↗</button>
        <button type="button" className="bridge-clear" data-sfx="none" onClick={() => { setPlan(emptyPlan(level)); setMessage(''); playSfx('timeline') }} disabled={phase !== 'building'}>Limpiar</button>
        {phase === 'building' && challengeCleared && (
          <button type="button" className="bridge-clear" data-sfx="open" onClick={finishEarly}>Finalizar partida</button>
        )}
      </div>
    </div>
    {phase === 'building' && (
      <div className={`gs-coach is-${coach.tone}`} aria-live="polite">
        <span className="gs-coach-tag">{coach.tag}</span>
        <span>{coach.text}</span>
      </div>
    )}
    <p className={`gs-help${message ? ' is-alert' : ''}`} role="status">{message || (phase === 'building' ? `${level.hint} Elige un material y toca la casilla donde va la pieza.${risky.size ? ' Hay tramos en rojo: necesitan un pilar o un material que resista más.' : ''}` : ' ')}</p>
    <p className="gs-help">Valores didácticos del escenario; no son mediciones de emisiones.</p>
  </div>
}

const START_STOCK: Record<Stock, number> = { ...START_INVENTORY }
