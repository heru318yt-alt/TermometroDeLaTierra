import { useMemo, useState, type ReactNode } from 'react'
import { playSfx } from '../../audio/sfx'
import { useBestScore, useFloaters, useShake } from '../shared/hooks'
import { BestLine, FloaterLayer, Gauge, Icon, ResultGrid, Stat, Streak } from '../shared/ui'
import {
  FERTILIZER_STOCK, FERTS, FERT_LABEL, HERDS, HERD_LABEL, MGMTS, MGMT_LABEL, SEASONS, SOIL_LABEL, SOIL_TEXT, STREAK_ADAPTATION, WATER_STOCK, WEATHER_LABEL,
  canAfford, costOf, createGame, play, streakMultiplier, summarize, totalScore, weakestPart,
  type Choice, type Fert, type GameState, type Herd, type Mgmt, type SeasonResult, type Soil, type Summary,
} from './engine'
import { SoilPicture } from './SoilPicture'
import './farm.css'

type Phase = 'intro' | 'choosing' | 'result' | 'final'

const MGMT_HINT: Record<Mgmt, string> = { rest: 'sin producir: el suelo se recupera', graze: 'animales en pasto, poco cultivo', crop: 'cultivos: mucha producción si el suelo responde' }
const FERT_COST_TEXT: Record<Fert, string> = { 0: '0', 1: '1', 2: '2', 3: '3' }
const HERD_WATER: Record<Herd, number> = { 0: 0, 1: 1, 2: 2, 3: 4 }

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
  if (s.score === 0) return 'No produjiste alimentos: el descanso recupera el suelo pero la gente también necesita comer.'
  if (s.soil === 'degraded' || s.land < 80) return 'Forzar la producción degradó el suelo y redujo la tierra útil. No hay una solución universal: cada terreno pide una combinación distinta.'
  if (s.balanced) return 'Adaptaste cada temporada al terreno: produjiste alimentos con pocas emisiones por unidad y cuidaste el suelo.'
  return 'El metano viene del hato, el óxido nitroso de los fertilizantes y el CO₂ del suelo que se degrada. Producir más suele tener un costo en emisiones o en suelo.'
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toFixed(1)

/* ---- Iconos de las opciones ---- */
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

export function FarmGame() {
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

  function start() { playSfx('adventure'); setGame(createGame(Math.floor(Math.random() * 1e9))); setResult(null); setMessage(''); setNewBest(false); setPhase('choosing') }

  function confirm() {
    if (!afford.ok) { setMessage(afford.reason ?? ''); playSfx('warn'); return }
    const next = structuredClone(game)
    const season = play(next, choice)
    if (!season) return
    const gained = season.food + season.bonus
    floaters.push(`+${fmt(gained)} alimentos`, 50, 40, season.multiplier > 1 ? 'combo' : gained > 0 ? 'good' : 'info')
    if (season.trend === 'worsens') { shake(); playSfx('loss') } else if (season.multiplier > 1) playSfx('combo'); else playSfx('gain')
    setGame(next); setResult(season); setMessage(''); setPhase('result')
  }

  function proceed() {
    if (game.status === 'finished') { const s = summarize(game); setNewBest(submitBest(s.total)); setPhase('final'); playSfx(s.balanced ? 'victory' : 'win'); return }
    setResult(null); setPhase('choosing')
  }

  const shownSoil: Soil = phase === 'result' && result ? result.soilBefore : game.soil
  const weatherNote = game.weatherSoilBefore !== game.soil
    ? `${WEATHER_LABEL[game.weather]}: el terreno pasó de ${SOIL_LABEL[game.weatherSoilBefore].toLowerCase()} a ${SOIL_LABEL[game.soil].toLowerCase()}.`
    : game.season === 0 ? 'Temporada normal.' : `${WEATHER_LABEL[game.weather]}: el terreno no cambió.`
  const seasonNumber = Math.min(game.season + 1, SEASONS)
  const nextMult = streakMultiplier(game.streak + 1)

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
      <Stat label="TEMPORADA" value={`${seasonNumber} de ${SEASONS}`} icon={Icon.calendar} />
      <Stat label="ALIMENTOS (PUNTAJE)" value={totalScore(game)} icon={Icon.wheat} tone="accent" />
      <Streak multiplier={streakMultiplier(game.streak)} detail={`${game.streak} temporada${game.streak === 1 ? '' : 's'} adaptada${game.streak === 1 ? '' : 's'}`} />
      <Gauge label="AGUA" value={game.water} max={WATER_STOCK} icon={Icon.drop} />
      <Gauge label="FERTILIZANTE" value={game.fertilizer} max={FERTILIZER_STOCK} icon={Icon.sack} />
      <Gauge label="TIERRA ÚTIL" value={game.land} max={100} icon={Icon.land} text={`${game.land} %`} />
    </div>

    <div className="farm-main">
      <aside className="farm-side" aria-label="Terreno actual">
        <div className="farm-picture">
          <SoilPicture soil={shownSoil} weather={game.weather} herd={choice.herd} mgmt={choice.mgmt} />
          <span className={`farm-soil-tag is-${shownSoil}`}>Suelo {SOIL_LABEL[shownSoil].toLowerCase()}</span>
          <FloaterLayer items={floaters.items} />
        </div>
        <p className="eyebrow">TERRENO ACTUAL</p>
        <h3>Suelo {SOIL_LABEL[shownSoil].toLowerCase()}</h3>
        <p>{SOIL_TEXT[shownSoil]}</p>
        <p className={`farm-weather is-${game.weather}`}>{weatherNote}</p>
      </aside>

      <div className="gs-stage farm-center">
        {phase === 'choosing' && <>
        {group<Mgmt>('Manejo de la tierra', MGMTS, choice.mgmt, mgmt => setChoice({ ...choice, mgmt }), v => MGMT_LABEL[v], v => MGMT_HINT[v], v => MGMT_ICON[v])}
        {group<Fert>('Fertilizante', FERTS, choice.fert, fert => setChoice({ ...choice, fert }), v => FERT_LABEL[v], v => `cuesta ${FERT_COST_TEXT[v]} de fertilizante`, v => FERT_ICON[v])}
        {group<Herd>('Tamaño del hato', HERDS, choice.herd, herd => setChoice({ ...choice, herd }), v => HERD_LABEL[v], v => `agua +${HERD_WATER[v]}`, v => HERD_ICON[v])}
        <div className="farm-confirm">
          <p className={afford.ok ? '' : 'is-over'}>
            <span className="farm-chip">{Icon.drop} agua {cost.water}</span>
            <span className="farm-chip">{Icon.sack} fertilizante {cost.fertilizer}</span>
            <span className="farm-cost-text">Costo de la combinación: agua {cost.water} · fertilizante {cost.fertilizer}</span>
          </p>
          <button type="button" className="button" disabled={phase !== 'choosing' || !afford.ok} onClick={confirm}>Confirmar temporada ↗</button>
        </div>
        <p className="farm-streak-hint">Si esta temporada se adapta al terreno (≥ {Math.round(STREAK_ADAPTATION * 100)} %), sus alimentos valen ×{nextMult}.</p>
        </>}

        {phase === 'intro' && <div className="gs-overlay" role="dialog" aria-label="Finca equilibrada · instrucciones">
          <div className="gs-card">
            <p className="eyebrow">CONTEXTO · AGRICULTURA Y GANADERÍA</p>
            <h3>Finca equilibrada</h3>
            <p>Durante {SEASONS} temporadas, combina el manejo de la tierra, el fertilizante y el tamaño del hato. No hay una mejor combinación para todo: el estado del suelo, que se ve en el costado, cambia con el clima y con tus decisiones.</p>
            <p>El agua ({WATER_STOCK}) y el fertilizante ({FERTILIZER_STOCK}) no se reponen, y la tierra degradada se pierde. Después de cada temporada verás las emisiones de metano (hato), óxido nitroso (fertilizantes) y CO₂ (suelo).</p>
            <p className="gs-rule"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" /></svg><span>Racha: temporadas seguidas bien adaptadas al terreno multiplican los alimentos (×1.25 desde la 2.ª, ×1.5 desde la 4.ª).</span></p>
            <button type="button" className="button" onClick={start}>Empezar ↗</button>
          </div>
        </div>}

        {phase === 'result' && result && <div className={`gs-overlay ${result.trend === 'worsens' ? 'is-loss' : 'is-win'}`} role="dialog" aria-label="Resultado de la temporada">
          <div className="gs-card">
            <p className="eyebrow">TEMPORADA {result.season + 1} · {WEATHER_LABEL[result.weather].toUpperCase()}</p>
            <div className="gs-score-big"><strong>+{fmt(result.food + result.bonus)}</strong><span>ALIMENTOS{result.multiplier > 1 ? ` · RACHA ×${result.multiplier} (+${fmt(result.bonus)})` : ''}</span></div>
            <div className="farm-adapt"><span>Adaptación al terreno: {Math.round(result.adaptation * 100)} %</span><i><b style={{ width: `${result.adaptation * 100}%` }} className={result.adaptation >= STREAK_ADAPTATION ? 'is-ok' : result.adaptation < 0.5 ? 'is-bad' : ''} /></i></div>
            <p className="farm-soil-change">Suelo: <span className={`farm-soil-tag is-${result.soilBefore}`}>{SOIL_LABEL[result.soilBefore].toLowerCase()}</span> → <span className={`farm-soil-tag is-${result.soilAfter}`}>{SOIL_LABEL[result.soilAfter].toLowerCase()}</span> {result.trend === 'improves' ? '(mejoró)' : result.trend === 'worsens' ? '(empeoró)' : '(igual)'}.{result.landAfter < 100 && result.soilAfter === 'degraded' ? ` Tierra útil: ${result.landAfter} %.` : ''}</p>
            <p className="farm-em-title">Emisiones del escenario: metano, óxido nitroso y CO₂ del suelo</p>
            <EmissionBars ch4={result.ch4} n2o={result.n2o} co2={result.co2} />
            <p className="gs-explain">{tipFor(result)}</p>
            <button type="button" className="button" onClick={proceed}>{game.status === 'finished' ? 'Ver resultado final ↗' : 'Siguiente temporada ↗'}</button>
          </div>
        </div>}

        {phase === 'final' && summary && <div className={`gs-overlay ${summary.balanced ? 'is-win' : 'is-loss'}`} role="dialog" aria-label="Resultado final">
          <div className="gs-card">
            <p className="eyebrow">RESULTADO FINAL{summary.balanced ? ' · MEDALLA «FINCA EQUILIBRADA»' : ''}</p>
            <div className="gs-score-big"><strong>{summary.total}</strong><span>PUNTOS DE ALIMENTOS{summary.bonus ? ` · +${summary.bonus} POR RACHA` : ''}</span></div>
            <ResultGrid items={[
              { label: 'Emisiones por alimento', value: summary.perFood.toFixed(2), tone: summary.perFood <= 0.7 ? 'ok' : 'warn' },
              { label: 'Suelo final', value: SOIL_LABEL[summary.soil], tone: summary.soil === 'degraded' ? 'warn' : 'ok' },
              { label: 'Tierra útil', value: `${summary.land} %`, tone: summary.land >= 80 ? 'ok' : 'warn' },
              { label: 'Mejor racha', value: `${summary.bestStreak} temporadas` },
              { label: 'Agua restante', value: summary.water },
              { label: 'Fertilizante', value: summary.fertilizer },
            ]} />
            <p>Emisiones del escenario: metano {fmt(summary.ch4)} · óxido nitroso {fmt(summary.n2o)} · CO₂ del suelo {fmt(summary.co2)}.</p>
            <p className="gs-explain">{explain(summary)}</p>
            <ol className="farm-history">{game.history.map(h => <li key={h.season}><b>{h.season + 1}</b><span className={`farm-soil-tag is-${h.soilBefore}`}>{SOIL_LABEL[h.soilBefore]}</span><span>{MGMT_LABEL[h.choice.mgmt]}, {FERT_LABEL[h.choice.fert].toLowerCase()}, hato {HERD_LABEL[h.choice.herd].toLowerCase()}</span><em>+{fmt(h.food + h.bonus)}</em></li>)}</ol>
            <BestLine best={best} isNew={newBest} />
            <button type="button" className="button" onClick={start}>Jugar otra vez ↗</button>
          </div>
        </div>}
      </div>
    </div>
    <p className={`gs-help${message ? ' is-alert' : ''}`} role="status">{message || 'Elige una combinación y confírmala. Los valores son didácticos del escenario; no son mediciones reales de producción ni de emisiones.'}</p>
  </div>
}
