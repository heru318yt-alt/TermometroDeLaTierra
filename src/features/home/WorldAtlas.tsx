import type { MouseEvent as ReactMouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { gameModules } from '../games/catalog'
import { isEpochUnlocked, useCompletedEpochs } from '../games/progress'
import { gameRoute, type WorldId } from '../games/worldLinks'

const spots: Record<string, [number, number]> = {
  energia: [347, 145], industria: [488, 205], transporte: [488, 264], bosques: [130, 210], agricultura: [223, 311],
}

/** Conceptual field map. It links each world; it is not a climate layer. */
export function WorldAtlas() {
  const navigate = useNavigate()
  const completed = useCompletedEpochs()

  function openWorld(event: ReactMouseEvent<Element>, id: WorldId) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(gameRoute(id))
  }

  return <div className="atlas-spread">
    <div className="atlas-map-art">
      <svg viewBox="0 0 760 450" role="img" aria-labelledby="atlas-title atlas-desc">
        <title id="atlas-title">Atlas ilustrado de los cinco mundos</title><desc id="atlas-desc">Mapa conceptual con rutas que conectan la ciudad, la fábrica, el bosque, las rutas de movilidad y la finca. No es una capa de datos climáticos.</desc>
        <defs>
          <linearGradient id="atlas-paper" x2="0" y2="1"><stop stopColor="#f4ead4" /><stop offset="1" stopColor="#e8d6b4" /></linearGradient>
          <linearGradient id="atlas-water" x2="0" y2="1"><stop stopColor="#a9cec1" /><stop offset="1" stopColor="#4f8e83" /></linearGradient>
        </defs>
        <rect width="760" height="450" fill="url(#atlas-paper)" />
        <path d="M0 0h760v44H0z" fill="#173f38" />
        <text x="26" y="28" fill="#f4eedc" fontSize="11" fontFamily="Georgia,serif" letterSpacing="3">TERMÓMETRO DE LA TIERRA / ATLAS DE EXPLORACIÓN</text>
        <g opacity=".4" stroke="#a88b5e" fill="none">
          <path d="M0 92h760M0 180h760M0 268h760M0 356h760" strokeDasharray="2 10" />
          <path d="M120 44v406M290 44v406M460 44v406M630 44v406" strokeDasharray="2 10" />
        </g>
        <path d="M0 110q105-55 205-20t177-11q81-44 154 2t224-7v376H0Z" fill="url(#atlas-water)" />
        <path d="m37 206 78-57 82 18 36-34 91 11 28 46 73 7 40 59-39 42-9 64-77 32-53-26-56 13-56-32-77 9-52-44-76-10Z" fill="#d7bc83" stroke="#9c845d" strokeWidth="4" />
        <path d="m76 217 53-41 57 13 40-29 45 15 17 37-36 13-15 44-55 4-26 40-44-13-21-40-41-7Z" fill="#4f805c" /><path d="m219 327 47-45 48 13 27-27 37 27-15 39-51 3-23 29-46-4Z" fill="#48784e" /><path d="m353 167 42-28 43 8 18 32-28 27-39-8Z" fill="#d19a55" /><path d="m433 257 39-38 43 11 14 35-29 22-44-7Z" fill="#a86342" /><path d="m282 194 25-24 22 26-13 30-26-6Z" fill="#688c65" />
        <g fill="none" stroke="#f4e6c7" strokeWidth="4" strokeDasharray="3 9" strokeLinecap="round"><path d="M147 222q60 25 100 20t59-39q50-24 97-33t53 70q-16 30-11 44t-86 45" /><path d="M247 242q-27 35-23 81t45 17" /></g>
        <g opacity=".96">
          <path d="m106 207 17-23 17 23v21h-34z" fill="#d7764f" /><path d="M101 208h44l-22-29z" fill="#eee0bb" /><rect x="117" y="211" width="12" height="17" fill="#315a4c" />
          <circle cx="167" cy="227" r="16" fill="#24553e" /><circle cx="184" cy="225" r="12" fill="#3c7148" /><circle cx="155" cy="235" r="11" fill="#568355" /><rect x="166" y="235" width="4" height="12" fill="#725a3c" />
          <path d="M363 128v42h18v-42zm-6 10h30v4h-30m-3 14h36v4h-36" fill="#65766b" />
          <path d="M444 126h31v37h-31zm4-8h9v8h-9m9 14h4v8h-4m10-8h4v8h-4" fill="#9b6440" />
          <path d="M209 306q14-22 29 0l-4 23h-21z" fill="#e7b651" />
          <path d="m477 265 13-24 13 24v20h-26z" fill="#e6eee2" /><path d="M477 265h26l-13-19z" fill="#bc6047" />
        </g>
        <g fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" letterSpacing="1.5" fill="#264f41"><text x="60" y="283">BOSQUE</text><text x="322" y="112">ENERGÍA</text><text x="471" y="333">MOVILIDAD</text><text x="522" y="215">INDUSTRIA</text><text x="167" y="379">AGRICULTURA</text></g>
        {gameModules.map((game, i) => {
          const [x, y] = spots[game.id]
          const id = game.id as WorldId
          const unlocked = isEpochUnlocked(id, completed)
          const label = unlocked ? `Explorar ${game.title}` : `Explorar ${game.title}. Etapa bloqueada: completa la anterior.`
          return <a key={game.id} href={gameRoute(id)} onClick={event => openWorld(event, id)} aria-label={label} className={unlocked ? undefined : 'is-locked'}>
            <circle cx={x} cy={y} r="21" fill={unlocked ? '#f7efd9' : '#ded8c8'} stroke={unlocked ? '#244e40' : '#9d927b'} strokeWidth="3" />
            <circle cx={x} cy={y} r="4" fill={unlocked ? '#bd6d48' : '#9d927b'} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={unlocked ? '#244e40' : '#6d6556'} fontFamily="Arial,sans-serif">{String(i + 1).padStart(2, '0')}</text>
            {!unlocked && <text x={x} y={y + 34} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c6a4f" fontFamily="Arial,sans-serif">BLOQUEADA</text>}
          </a>
        })}
        <g transform="translate(662 84)" stroke="#f5eedc" strokeWidth="2"><circle r="29" fill="#204c40" /><path d="M0-19 6 3 0-1-6 3Z" fill="#edc16c" /><text x="0" y="44" textAnchor="middle" stroke="none" fill="#204c40" fontSize="10" fontWeight="700">N</text></g>
        <text x="26" y="422" fill="#315448" fontSize="10" fontFamily="Georgia,serif" letterSpacing="2">MAPA CONCEPTUAL · NO ES UNA CAPA CLIMÁTICA</text>
      </svg>
    </div>
    <div className="atlas-index">
      <p className="eyebrow">ÍNDICE DE CAMPO</p>
      {gameModules.map((game, i) => {
        const id = game.id as WorldId
        const unlocked = isEpochUnlocked(id, completed)
        return <Link key={game.id} to={gameRoute(id)} className={unlocked ? undefined : 'is-locked'}>
          <span>{String(i + 1).padStart(2, '0')}</span>
          <span><strong>{game.title}</strong><small>{game.theme} · {game.era}{unlocked ? '' : ' · Bloqueada'}</small></span>
          <span aria-hidden="true">{unlocked ? '↗' : '◼'}</span>
        </Link>
      })}
      <p className="atlas-index-note">Los cinco puntos abren su etapa del recorrido. El orden se desbloquea al completar cada reto. No son lugares geográficos reales.</p>
    </div>
  </div>
}
