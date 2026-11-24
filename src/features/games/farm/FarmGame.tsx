import { useMemo, useRef, useState, type ReactNode } from 'react'
import { playSfx } from '../../audio/sfx'
import { useBestScore, useFloaters, useShake } from '../shared/hooks'
import { BestLine, FloaterLayer, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  FERTILIZER_STOCK, FERTS, FERT_LABEL, HERDS, HERD_LABEL, LAND_LOSS, MAX_FAMINE_STREAK, MAX_WIN_PER_FOOD, MAX_WIN_REPEAT,
  MGMTS, MGMT_LABEL, MIN_LAND_ALIVE, MIN_WIN_ADAPTED, MIN_WIN_FOOD, MIN_WIN_LAND, MIN_WIN_MGMT,
  SCORE_BONUS_FERTILIZER, SCORE_BONUS_STEP, SCORE_BONUS_WATER,
  SOIL_LABEL, SOIL_TEXT, STREAK_ADAPTATION, WATER_STOCK, WEATHER_LABEL,
  adaptation, canAfford, costOf, createGame, finishManual, play, streakMultiplier, summarize, totalScore, weakestPart,
  type Choice, type Fert, type GameState, type Herd, type Mgmt, type SeasonResult, type Soil, type Summary,
} from './engine'
import { SoilPicture } from './SoilPicture'
import './farm.css'

type Phase = 'intro' | 'choosing' | 'result' | 'final'

const MGMT_HINT: Record<Mgmt, string> = { rest: 'sin producir: el suelo se recupera', graze: 'animales en pasto, poco cultivo', crop: 'cultivos: mucha producción si el suelo responde' }
const FERT_COST_TEXT: Record<Fert, string> = { 0: '0', 1: '1', 2: '2', 3: '3' }
const HERD_WATER: Record<Herd, number> = { 0: 0, 1: 1, 2: 2, 3: 4 }
const SOIL_GUIDE: Record<Soil, string> = {
  fertile: 'Recomendación: Cultivo con fertilizante Orgánico o Nitrogenado medio y hato pequeño o mediano.',
  dry: 'Recomendación: Pastoreo o Descanso, fertilizante Orgánico y hato pequeño o sin hato para conservar humedad.',
  waterlogged: 'Recomendación: Descanso o Pastoreo suave, fertilizante Orgánico o Ninguno y hato pequeño o sin hato.',
  degraded: 'Recomendación: Descanso, fertilizante Orgánico y Sin hato para recuperar la tierra útil.',
}

const TIP: Record<Soil, Record<'mgmt' | 'fert' | 'herd', string>> = {
  fertile: { mgmt: 'Un suelo fértil rinde más cultivado que en descanso.', fert: 'En suelo fértil, el exceso de nitrógeno se desperdicia y emite óxido nitroso.', herd: 'Un hato muy grande sobrepastorea incluso un suelo fértil.' },
  dry: { mgmt: 'El cultivo intensivo agota rápido un suelo seco: conviene pastoreo suave o descanso.', fert: 'En suelo seco, el nitrogenado rinde poco; la materia orgánica retiene humedad.', herd: 'Un hato grande sobrepastorea un suelo seco.' },
  waterlogged: { mgmt: 'Un suelo encharcado se compacta con el pisoteo y el cultivo; el descanso ayuda a que drene.', fert: 'En suelo encharcado el nitrogenado se pierde como óxido nitroso.', herd: 'Un hato grande compacta aún más un suelo encharcado.' },
  degraded: { mgmt: 'Un suelo degradado necesita descanso antes de producir.', fert: 'Un suelo degradado necesita materia orgánica antes que nitrógeno.', herd: 'Un hato mediano o grande termina de degradar un suelo pobre.' },
}

function tipFor(result: SeasonResult): string {
  const weak = weakestPart(result.soilBefore, result.choice)
  if (weak) return TIP[result.soilBefore][weak]
  if (result.trend === 'improves') return 'La combinación se adaptó bien al terreno y el suelo mejoró.'
  return 'La combinación fue razonable para el terreno, pero no bastó para mejorarlo.'
}

function explain(s: Summary): string {
  if (s.passed) return 'Adaptaste el manejo a cada cambio de terreno, superaste la meta arcade con bajas emisiones por unidad y cuidaste la finca.'
  if (s.score === 0) return `No produjiste alimentos: la finca necesita al menos ${MIN_WIN_FOOD} puntos adaptando tu estrategia.`
  if (s.endReason === 'land') return `La tierra útil cayó a ${s.land} % por degradación repetida. Deja descansar los suelos frágiles.`
  if (s.endReason === 'famine') return `Acumulaste ${MAX_FAMINE_STREAK} temporadas seguidas sin cosecha.`
  if (!s.checks.soil) return 'Forzar la producción degradó el suelo. No hay una solución universal: cada terreno pide una combinación distinta.'
  if (!s.checks.variety) return `Faltó variedad de manejo (${s.distinctMgmt} tipo usado). Combina manejos distintos al cambiar el clima.`
  if (!s.checks.adapted) return `Solo lograste ${s.adaptedSeasons} de ${MIN_WIN_ADAPTED} temporadas adaptadas (≥ 80 %).`
  if (!s.checks.food) return `Alcanzaste ${s.total} de ${MIN_WIN_FOOD} puntos mínimos de alimentos.`
  return `Las emisiones por alimento (${s.perFood.toFixed(2)}) superaron el máximo de ${MAX_WIN_PER_FOOD.toFixed(2)}.`
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

const ic = (children: ReactNode, bg: string) => <svg viewBox="0 0 32 32" aria-hidden="true" className="gs-choice-icon"><rect x="1" y="1" width="30" height="30" rx="8" fill={bg} />{children}</svg>
const cowHead = (x: number, y: number, s = 1) => <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}><rect x="-4" y="-3.5" width="8" height="7.5" rx="3" fill="#f7f3ea" /><rect x="-2.6" y="1.5" width="5.2" height="3" rx="1.4" fill="#f2a5a0" /><path d="M-4-2.5-6-4.5M4-2.5l2-2" stroke="#d8c7a0" strokeWidth="1.2" strokeLinecap="round" /><circle cx="-1.6" cy="-.8" r=".7" fill="#2c2626" /><circle cx="1.6" cy="-.8" r=".7" fill="#2c2626" /><path d="M-4-1q1.5-2 3-1" stroke="#2c2626" strokeWidth="1.2" fill="none" /></g>
const MGMT_ICON: Record<Mgmt, ReactNode> = {
  rest: ic(<g><ellipse cx="16" cy="24" rx="10" ry="3" fill="#7a5233" /><g fill="#7fcf6a"><circle cx="13" cy="19" r="3" /><circle cx="19" cy="19" r="3" /><circle cx="16" cy="15" r="3" /></g><path d="M16 22v-4" stroke="#3f8a2e" strokeWidth="1.5" /></g>, '#6fcf4f2e'),
  graze: ic(<g>{cowHead(16, 15, 1.35)}<path d="M8 26l-1-3m1 3v-4m0 4 1-3M24 26l-1-3m1 3v-4m0 4 1-3" stroke="#5aa64f" strokeWidth="1.3" strokeLinecap="round" /></g>, '#8fbf7a33'),
  crop: ic(<g strokeLinecap="round"><path d="M16 26V9" stroke="#c4962a" strokeWidth="1.7" />{[11, 15, 19].map(y => <g key={y}><ellipse cx="13.3" cy={y} rx="2.6" ry="1.5" fill="#f2c53d" transform={`rotate(-30 13.3 ${y})`} /><ellipse cx="18.7" cy={y} rx="2.6" ry="1.5" fill="#e8b42c" transform={`rotate(30 18.7 ${y})`} /></g>)}</g>, '#f2c53d2e'),
}
const sack = (label: string, color: string) => <g><path d="M12 9h8l-2 3c4 1 6 4 6 8a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4c0-4 2-7 6-8Z" fill={color} /><path d="M12 9h8" stroke="#0004" strokeWidth="1.4" /><text x="16" y="21.5" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff" fontFamily="monospace">{label}</text></g>
const FERT_ICON: Record<Fert, ReactNode> = {
  0: ic(<g stroke="#e3cda5" strokeWidth="1.8" fill="none"><circle cx="16" cy="16" r="7" /><path d="m11 21 10-10" /></g>, '#ffffff12'),
  1: ic(<g><path d="M9 23c0-8 5-13 14-13 0 9-5 13-14 13Z" fill="#6fcf4f" /><path d="M9 23l8-8" stroke="#2f7a2a" strokeWidth="1.4" strokeLinecap="round" /></g>, '#6fcf4f2e'),
  2: ic(sack('N', '#4d8fd6'), '#4d8fd62e'),
  3: ic(sack('N+', '#d6534d'), '#d6534d2e'),
}
const HERD_ICON: Record<Herd, ReactNode> = {
  0: ic(<g stroke="#e3cda5" strokeWidth="1.6" fill="none"><rect x="9" y="12" width="14" height="10" rx="2" /><path d="M9 16h14M13 12v10M19 12v10" /></g>, '#ffffff12'),
  1: ic(cowHead(16, 16, 1.4), '#ffffff14'),
  2: ic(<>{cowHead(11.5, 17, 1.05)}{cowHead(20.5, 15, 1.05)}</>, '#ffffff14'),
  3: ic(<>{cowHead(9.5, 18, .9)}{cowHead(16, 13.5, .9)}{cowHead(22.5, 18, .9)}</>, '#ffffff14'),
}

function EmissionBars({ ch4, n2o, co2 }: { ch4: number; n2o: number; co2: number }) {
  const max = Math.max(8, ch4, n2o, Math.abs(co2))
  const row = (label: string, value: number, cls: string) => <div className={`farm-em ${cls}`}>
    <span>{label}</span><i><b style={{ width: `${Math.min(100, Math.abs(value) / max * 100)}%` }} className={value < 0 ? 'is-neg' : ''} /></i><em>{value > 0 && cls === 'is-co2' ? '+' : ''}{fmt(value)}</em>
  </div>
  return <div className="farm-ems">{row('Metano (hato)', ch4, 'is-ch4')}{row('Óxido nitroso (fertilizante)', n2o, 'is-n2o')}{row('CO₂ del suelo', co2, 'is-co2')}</div>
}

export function FarmGame({ onComplete, onNext, nextLabel }: { onComplete?: () => void; onNext?: () => void; nextLabel?: string } = {}) {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const completedThisRun = useRef(false)
  const [game, setGame] = useState<GameState>(() => createGame())
  const [phase, setPhase] = useState<Phase>('intro')
  const [choice, setChoice] = useState<Choice>({ mgmt: 'crop', fert: 1, herd: 1 })
  const [result, setResult] = useState<SeasonResult | null>(null)
  const [message, setMessage] = useState('')
  const [best, submitBest] = useBestScore('agricultura')
  const [newBest, setNewBest] = useState(false)
  const floaters = useFloaters(1300)
  const [shaking, shake] = useShake()

  const cost = useMemo(() => costOf(game.soil, game.weather, choice), [game.soil, game.weather, choice])
  const afford = canAfford(game, choice)
  const summary = phase === 'final' ? summarize(game) : null
  const helpAlert = message || (phase === 'choosing' && !afford.ok ? (afford.reason ?? '') : '')

  function start() {
    playSfx('adventure')
    completedThisRun.current = false
    setGame(createGame(Math.floor(Math.random() * 1e9)))
    setResult(null); setMessage(''); setNewBest(false); setPhase('choosing')
  }

  function confirm() {
    if (phase !== 'choosing') return
    if (!afford.ok) { setMessage(afford.reason ?? ''); playSfx('warn'); return }
    const next = structuredClone(game)
    const season = play(next, choice)
    if (!season) return
    const gained = season.food + season.bonus
    floaters.push(`+${fmt(gained)} alimentos`, 50, 40, season.multiplier > 1 ? 'combo' : gained > 0 ? 'good' : 'info')
    if (season.scoreBonus) {
      const bonusParts = [
        season.scoreBonus.water > 0 ? `+${season.scoreBonus.water} agua` : '',
        season.scoreBonus.fertilizer > 0 ? `+${season.scoreBonus.fertilizer} fert.` : '',
      ].filter(Boolean).join(' · ')
      if (bonusParts) floaters.push(`${bonusParts} (bono puntaje)`, 50, 58, 'good')
    }
    if (season.trend === 'worsens') { shake(); playSfx('loss') } else if (season.multiplier > 1) playSfx('combo'); else playSfx('gain')
    if (next.challengeCleared && !completedThisRun.current) {
      completedThisRun.current = true
      submitBest(totalScore(next))
      onCompleteRef.current?.()
    }
    setGame(next); setResult(season); setMessage(''); setPhase('result')
  }

  function proceed() {
    if (phase !== 'result') return
    if (game.status === 'finished') {
      const s = summarize(game)
      setNewBest(submitBest(s.total)); setPhase('final')
      if (!completedThisRun.current && s.passed) {
        completedThisRun.current = true
        onCompleteRef.current?.()
      } else {
        playSfx(s.passed ? 'win' : 'loss')
      }
      return
    }
    playSfx('open')
    setResult(null); setPhase('choosing')
  }

  function finishEarly() {
    if (phase !== 'choosing' || game.season === 0) return
    const next = structuredClone(game)
    finishManual(next)
    const s = summarize(next)
    setGame(next)
    setNewBest(submitBest(s.total))
    setPhase('final')
    if (!completedThisRun.current && s.passed) {
      completedThisRun.current = true
      onCompleteRef.current?.()
    } else {
      playSfx(s.passed ? 'win' : 'loss')
    }
  }

  const shownSoil: Soil = phase === 'result' && result ? result.soilBefore : game.soil
  const shownWeather = phase === 'result' && result ? result.weather : game.weather
  const weatherNote = phase === 'result' && result
    ? `${WEATHER_LABEL[result.weather]} · temporada ${result.season + 1} evaluada.`
    : game.weatherSoilBefore !== game.soil
      ? `${WEATHER_LABEL[game.weather]}: el terreno pasó de ${SOIL_LABEL[game.weatherSoilBefore].toLowerCase()} a ${SOIL_LABEL[game.soil].toLowerCase()}.`
      : game.season === 0 ? 'Temporada normal.' : `${WEATHER_LABEL[game.weather]}: el terreno no cambió.`
  const seasonNumber = game.season + 1
  const nextMult = streakMultiplier(game.streak + 1)
  const adaptedSoFar = game.history.filter(h => h.adaptation >= STREAK_ADAPTATION).length
  const sameChoiceCount = game.history.filter(
    h => h.choice.mgmt === choice.mgmt && h.choice.fert === choice.fert && h.choice.herd === choice.herd,
  ).length
  const repeatLimit = Math.max(MAX_WIN_REPEAT, Math.floor(game.history.length * 0.65))
  const usedMgmts = new Set(game.history.map(h => h.choice.mgmt))
  const lateSingleMgmt = !game.challengeCleared && game.season >= 5 && usedMgmts.size === 1 && usedMgmts.has(choice.mgmt)

  const liveFit = adaptation(game.soil, choice)
  const liveWeak = weakestPart(game.soil, choice)
  const coach = (() => {
    if (!afford.ok) {
      return {
        tone: 'bad' as const,
        tag: 'RECURSOS INSUFICIENTES',
        text: 'Te falta agua o fertilizante para esta mezcla: baja fertilizante, reduce el hato o usa Descanso/Pastoreo.',
      }
    }
    if (!game.challengeCleared && (sameChoiceCount >= repeatLimit || lateSingleMgmt)) {
      return {
        tone: 'warn' as const,
        tag: 'VARÍA TU ESTRATEGIA',
        text: lateSingleMgmt
          ? 'Solo usaste un tipo de manejo. Combina al menos dos manejos distintos según cambie el terreno.'
          : `Evita repetir exactamente la misma mezcla sin adaptar al terreno.`,
      }
    }
    if (liveFit >= STREAK_ADAPTATION) {
      return {
        tone: 'ok' as const,
        tag: 'BUENA COMBINACIÓN',
        text: game.challengeCleared
          ? `¡Reto cumplido! Se adapta bien al suelo ${SOIL_LABEL[game.soil].toLowerCase()} (${Math.round(liveFit * 100)} %). Sigue sumando tu récord.`
          : `Se adapta muy bien al suelo ${SOIL_LABEL[game.soil].toLowerCase()} (${Math.round(liveFit * 100)} %) y mantiene tu racha.`,
      }
    }
    if (liveFit >= 0.5) {
      return {
        tone: 'warn' as const,
        tag: 'ADAPTACIÓN MEDIA',
        text: liveWeak
          ? `Ajuste sugerido: ${TIP[game.soil][liveWeak]}`
          : 'Combinación aceptable, aunque puedes afinar una opción para llegar al 80 % y sumar racha.',
      }
    }
    return {
      tone: 'bad' as const,
      tag: 'DEGRADARÁ EL SUELO',
      text: liveWeak ? TIP[game.soil][liveWeak] : SOIL_GUIDE[game.soil],
    }
  })()

  const group = <T extends string | number>(label: string, items: T[], current: T, set: (v: T) => void, text: (v: T) => string, hint: (v: T) => string, icon: (v: T) => ReactNode) =>
    <div className="farm-group" role="radiogroup" aria-label={label}>
      <h4>{label}</h4>
      <div className="farm-options">
        {items.map(v => <button key={String(v)} type="button" role="radio" aria-checked={current === v} disabled={phase !== 'choosing'} className={`gs-choice farm-option${current === v ? ' is-active' : ''}`} onClick={() => set(v)}>
          {icon(v)}<span>{text(v)}</span><small>{hint(v)}</small>
        </button>)}
      </div>
    </div>

  return <div className={`gs-game farm-game${shaking ? ' is-shaking' : ''}`}>
    <div className="gs-hud" aria-label="Indicadores de la partida">
      <Stat label="TEMPORADA ARCADE" value={`#${seasonNumber}`} icon={Icon.calendar} />
      <Stat label="ALIMENTOS (PUNTAJE)" value={totalScore(game)} icon={Icon.wheat} tone="accent" />
      <Stat label="META DEL RETO" value={game.challengeCleared ? '★ CUMPLIDO' : `${totalScore(game)} / ${MIN_WIN_FOOD}`} icon={Icon.check} tone={game.challengeCleared ? 'ok' : undefined} />
      <Streak multiplier={streakMultiplier(game.streak)} detail={`${game.streak} adaptada${game.streak === 1 ? '' : 's'} · ${adaptedSoFar}/${MIN_WIN_ADAPTED} meta`} />
      <Gauge label="AGUA" value={game.water} max={WATER_STOCK} icon={Icon.drop} />
      <Gauge label="FERTILIZANTE" value={game.fertilizer} max={FERTILIZER_STOCK} icon={Icon.sack} />
      <Gauge label="TIERRA ÚTIL" value={game.land} max={100} icon={Icon.land} text={`${game.land} %`} />
    </div>

    <div className="farm-main">
      <aside className="farm-side" aria-label="Terreno actual">
        <div className="farm-picture">
          <SoilPicture soil={shownSoil} weather={shownWeather} herd={choice.herd} mgmt={choice.mgmt} />
          <span className={`farm-soil-tag is-${shownSoil}`}>Suelo {SOIL_LABEL[shownSoil].toLowerCase()}</span>
          <FloaterLayer items={floaters.items} />
        </div>
        <p className="eyebrow">TERRENO ACTUAL</p>
        <h3>Suelo {SOIL_LABEL[shownSoil].toLowerCase()}</h3>
        <p>{SOIL_TEXT[shownSoil]}</p>
        <p className="farm-soil-guide">{SOIL_GUIDE[shownSoil]}</p>
        <p className={`farm-weather is-${game.weather}`}>{weatherNote}</p>
      </aside>

      <div className="gs-stage farm-center">
        {phase === 'choosing' && <>
          <div className="farm-steps" aria-label="Pasos de decisión">
            <span><b>1.</b> Lee el suelo (izquierda)</span>
            <span><b>2.</b> Elige manejo, fertilizante y hato</span>
            <span><b>3.</b> Confirma temporada</span>
          </div>
          {group<Mgmt>('Manejo de la tierra', MGMTS, choice.mgmt, mgmt => setChoice({ ...choice, mgmt }), v => MGMT_LABEL[v], v => MGMT_HINT[v], v => MGMT_ICON[v])}
          {group<Fert>('Fertilizante', FERTS, choice.fert, fert => setChoice({ ...choice, fert }), v => FERT_LABEL[v], v => `cuesta ${FERT_COST_TEXT[v]} de fertilizante`, v => FERT_ICON[v])}
          {group<Herd>('Tamaño del hato', HERDS, choice.herd, herd => setChoice({ ...choice, herd }), v => HERD_LABEL[v], v => `agua +${HERD_WATER[v]}`, v => HERD_ICON[v])}
          <div className={`gs-coach is-${coach.tone}`} aria-live="polite">
            <span className="gs-coach-tag">{coach.tag}</span>
            <span>{coach.text}</span>
          </div>
          <div className="farm-confirm">
            <p className={afford.ok ? '' : 'is-over'}>
              <span className="farm-chip">{Icon.drop} agua {cost.water}</span>
              <span className="farm-chip">{Icon.sack} fertilizante {cost.fertilizer}</span>
              <span className="farm-cost-text">Costo de la combinación: agua {cost.water} · fertilizante {cost.fertilizer}</span>
            </p>
            <div className="unity-toolbar-actions">
              <button type="button" className="button" data-sfx="none" disabled={phase !== 'choosing' || !afford.ok} onClick={confirm}>Confirmar temporada ↗</button>
              {game.season >= 1 && <button type="button" className="gs-retry-btn" data-sfx="open" onClick={finishEarly}>Finalizar y guardar</button>}
            </div>
          </div>
          <p className="farm-streak-hint">Si esta temporada se adapta (≥ {Math.round(STREAK_ADAPTATION * 100)} %), sumas ×{nextMult} y recuperas +1 de fertilizante orgánico. Cada {SCORE_BONUS_STEP} pts recibes +{SCORE_BONUS_WATER} de agua y +{SCORE_BONUS_FERTILIZER} de fertilizante.</p>
        </>}

        {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Finca equilibrada · instrucciones">
          <div className="gs-card">
            <p className="eyebrow">MODO ARCADE · AGRICULTURA Y GANADERÍA</p>
            <h3>Finca equilibrada</h3>
            <p>Gestiona la finca temporada tras temporada sin tope fijo. El agua ({WATER_STOCK}) y el fertilizante ({FERTILIZER_STOCK}) parten más ajustados y recuperan un pequeño margen al adaptarte bien al clima cambiante. La tierra degradada pierde {LAND_LOSS} % por golpe (límite mínimo {MIN_LAND_ALIVE} %).</p>
            <ul className="farm-goals">
              <li>Meta del reto: alcanza <b>{MIN_WIN_FOOD} puntos</b> de alimentos con ≤ <b>{MAX_WIN_PER_FOOD.toFixed(2)}</b> emisiones por alimento.</li>
              <li>Logra mínimo <b>{MIN_WIN_ADAPTED} temporadas</b> adaptadas (≥ {Math.round(STREAK_ADAPTATION * 100)} %), mantén la tierra en <b>≥ {MIN_WIN_LAND} %</b> y combina ≥ <b>{MIN_WIN_MGMT} manejos</b>.</li>
              <li>Después de cumplir la meta seguirás jugando sin pausa para conseguir el mayor puntaje posible.</li>
            </ul>
            <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Racha: temporadas seguidas bien adaptadas multiplican los alimentos (×1.25 desde la 2.ª, ×1.5 desde la 4.ª). Cada {SCORE_BONUS_STEP} puntos obtienes un margen extra (+{SCORE_BONUS_WATER} agua y +{SCORE_BONUS_FERTILIZER} fertilizante).</span></p>
            <button type="button" className="button" data-sfx="none" onClick={start}>Empezar ↗</button>
          </div>
        </div>}

        {phase === 'result' && result && <div className={`gs-overlay ${result.trend === 'worsens' ? 'is-loss' : 'is-win'}`} role="dialog" aria-label="Resultado de la temporada">
          <div className="gs-card">
            <p className="eyebrow">TEMPORADA {result.season + 1} · {WEATHER_LABEL[result.weather].toUpperCase()}</p>
            <div className="gs-score-big"><strong>+{fmt(result.food + result.bonus)}</strong><span>ALIMENTOS{result.multiplier > 1 ? ` · RACHA ×${result.multiplier} (+${fmt(result.bonus)})` : ''}</span></div>
            <div className="farm-adapt"><span>Adaptación al terreno: {Math.round(result.adaptation * 100)} %</span><i><b style={{ width: `${result.adaptation * 100}%` }} className={result.adaptation >= STREAK_ADAPTATION ? 'is-ok' : result.adaptation < 0.5 ? 'is-bad' : ''} /></i></div>
            <p className="farm-soil-change">Suelo: <span className={`farm-soil-tag is-${result.soilBefore}`}>{SOIL_LABEL[result.soilBefore].toLowerCase()}</span> → <span className={`farm-soil-tag is-${result.soilAfter}`}>{SOIL_LABEL[result.soilAfter].toLowerCase()}</span> {result.trend === 'improves' ? '(mejoró)' : result.trend === 'worsens' ? '(empeoró)' : '(igual)'}.{result.landAfter < 100 ? ` Tierra útil: ${result.landAfter} %.` : ''}</p>
            {result.scoreBonus && (
              <p className="farm-streak-hint">
                Bono por puntaje (cada {SCORE_BONUS_STEP} pts):
                {result.scoreBonus.water > 0 ? ` +${result.scoreBonus.water} agua` : ''}
                {result.scoreBonus.fertilizer > 0 ? ` +${result.scoreBonus.fertilizer} fertilizante` : ''}.
              </p>
            )}
            <p className="farm-em-title">Emisiones del escenario: metano, óxido nitroso y CO₂ del suelo</p>
            <EmissionBars ch4={result.ch4} n2o={result.n2o} co2={result.co2} />
            <p className="gs-explain">{tipFor(result)}</p>
            <button type="button" className="button" data-sfx="none" onClick={proceed}>{game.status === 'finished' ? 'Ver resultado final ↗' : 'Siguiente temporada ↗'}</button>
          </div>
        </div>}

        {phase === 'final' && summary && (() => {
          const won = summary.passed
          const checkRow = (ok: boolean, label: string) => <li className={ok ? 'is-ok' : 'is-fail'}><b>{ok ? '✓' : '✕'}</b><span>{label}</span></li>
          return <div className={`gs-overlay ${won ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado final">
            <div className="gs-card">
              {won && <span className="gs-win-stamp">★ RETO COMPLETADO</span>}
              <p className="eyebrow">FIN DE PARTIDA ARCADE · {summary.seasons} TEMPORADAS{summary.balanced && won ? ' · MEDALLA «FINCA EQUILIBRADA»' : ''}</p>
              <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS DE ALIMENTOS{summary.bonus ? ` · +${summary.bonus} POR RACHA` : ''}</span></div>
              <ResultGrid items={[
                { label: 'Emisiones por alimento', value: summary.perFood.toFixed(2), tone: summary.checks.emissions ? 'ok' : 'warn' },
                { label: 'Suelo final', value: SOIL_LABEL[summary.soil], tone: summary.soil === 'degraded' ? 'warn' : 'ok' },
                { label: 'Tierra útil', value: `${summary.land} %`, tone: summary.land >= MIN_WIN_LAND ? 'ok' : 'warn' },
                { label: 'Temporadas adaptadas', value: `${summary.adaptedSeasons} / ${summary.seasons}`, tone: summary.checks.adapted ? 'ok' : 'warn' },
                { label: 'Agua restante', value: summary.water },
                { label: 'Fertilizante', value: summary.fertilizer },
              ]} />
              <ul className="farm-checklist" aria-label="Condiciones del reto">
                {checkRow(summary.checks.food, `Alimentos suficientes: ${summary.total} / ${MIN_WIN_FOOD} mín.`)}
                {checkRow(summary.checks.adapted, `Adaptación al terreno: ${summary.adaptedSeasons} / ${MIN_WIN_ADAPTED} temporadas (≥ 80 %)`)}
                {checkRow(summary.checks.soil, `Suelo sano (${SOIL_LABEL[summary.soil].toLowerCase()}) y tierra útil: ${summary.land} % / ${MIN_WIN_LAND} % mín.`)}
                {checkRow(summary.checks.emissions, `Bajas emisiones por alimento: ${summary.score > 0 ? summary.perFood.toFixed(2) : 'sin cosecha'} / ${MAX_WIN_PER_FOOD.toFixed(2)} máx.`)}
                {checkRow(
                  summary.checks.variety,
                  summary.checks.variety
                    ? `Estrategia variada: ${summary.distinctMgmt} manejos distintos`
                    : summary.distinctMgmt < MIN_WIN_MGMT
                      ? `Estrategia variada: solo usaste ${summary.distinctMgmt} tipo de manejo (mín. ${MIN_WIN_MGMT})`
                      : `Estrategia variada: repetiste demasiado la misma combinación (${summary.maxRepeatedChoice} veces)`,
                )}
              </ul>
              <p className="gs-explain">{explain(summary)}</p>
              <ol className="farm-history">{game.history.map(h => <li key={h.season}><b>{h.season + 1}</b><span className={`farm-soil-tag is-${h.soilBefore}`}>{SOIL_LABEL[h.soilBefore]}</span><span>{MGMT_LABEL[h.choice.mgmt]}, {FERT_LABEL[h.choice.fert].toLowerCase()}, hato {HERD_LABEL[h.choice.herd].toLowerCase()}</span><em>+{fmt(h.food + h.bonus)}</em></li>)}</ol>
              <BestLine best={best} isNew={newBest} />
              <div className="gs-modal-actions">
                {won && onNext && <button type="button" className="button" onClick={onNext}>{nextLabel ?? 'Ver título de Protector Ambiental →'}</button>}
                <button type="button" className={won && onNext ? 'gs-retry-btn' : 'button'} data-sfx="none" onClick={start}>{won ? 'Jugar otra vez ↗' : 'Reintentar reto ↗'}</button>
              </div>
            </div>
          </div>
        })()}
      </div>
    </div>
    <p className={`gs-help${helpAlert ? ' is-alert' : ''}`} role="status">{helpAlert || 'Elige una combinación y confírmala. Los valores son didácticos del escenario; no son mediciones reales de producción ni de emisiones.'}</p>
  </div>
}
