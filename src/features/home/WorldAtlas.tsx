import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { gameModules } from '../games/catalog'
import { isEpochUnlocked, nextEpoch, useCompletedEpochs } from '../games/progress'
import { gameHref, gameRoute, type WorldId } from '../games/worldLinks'

type NodeSpec = {
  id: WorldId
  label: string
  x: number
  y: number
  labelX: number
  labelY: number
  pillW: number
}

const NODES: Record<WorldId, NodeSpec> = {
  energia: { id: 'energia', label: 'ENERGÍA', x: 204, y: 214, labelX: 204, labelY: 132, pillW: 84 },
  industria: { id: 'industria', label: 'INDUSTRIA', x: 458, y: 212, labelX: 458, labelY: 128, pillW: 94 },
  transporte: { id: 'transporte', label: 'MOVILIDAD', x: 656, y: 234, labelX: 656, labelY: 168, pillW: 94 },
  bosques: { id: 'bosques', label: 'BOSQUES', x: 446, y: 376, labelX: 446, labelY: 312, pillW: 86 },
  agricultura: { id: 'agricultura', label: 'AGRICULTURA', x: 224, y: 372, labelX: 224, labelY: 310, pillW: 108 },
}

const ROUTE_SEGMENTS: { from: WorldId; to: WorldId; d: string }[] = [
  { from: 'energia', to: 'industria', d: 'M204 214Q330 242 458 212' },
  { from: 'industria', to: 'transporte', d: 'M458 212Q558 256 656 234' },
  { from: 'transporte', to: 'bosques', d: 'M656 234Q534 292 446 376' },
  { from: 'bosques', to: 'agricultura', d: 'M446 376Q335 352 224 372' },
]

/** Conceptual field map rendered in minimalist lineless Samurai Jack style. */
export function WorldAtlas() {
  const navigate = useNavigate()
  const completed = useCompletedEpochs()
  const upcoming = nextEpoch(completed)
  const [activeId, setActiveId] = useState<WorldId | null>(null)
  const doneCount = completed.length
  const badgeText = doneCount === gameModules.length
    ? '5 / 5 · PROTECTOR AMBIENTAL'
    : `${doneCount} / ${gameModules.length} COMPLETADAS`

  function openWorld(event: ReactMouseEvent<Element>, id: WorldId) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(gameRoute(id))
  }

  return <div className="atlas-spread">
    <div className="atlas-map-art">
      <svg className="atlas-svg" viewBox="0 0 800 508" role="img" aria-labelledby="atlas-title atlas-desc">
        <title id="atlas-title">Atlas ilustrado de los cinco mundos</title>
        <desc id="atlas-desc">
          Mapa geométrico minimalista con siluetas sin contorno y una ruta ordenada del 01 al 05 que conecta energía, industria, movilidad, bosques y agricultura. No es una capa de datos climáticos.
        </desc>

        <defs>
          <linearGradient id="atlas-sj-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--atlas-sky-top)" />
            <stop offset="28%" stopColor="var(--atlas-sky-low)" />
            <stop offset="28.1%" stopColor="var(--atlas-sea-top)" />
            <stop offset="100%" stopColor="var(--atlas-sea-deep)" />
          </linearGradient>
          <radialGradient id="atlas-sj-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--atlas-sun)" stopOpacity="1" />
            <stop offset="72%" stopColor="var(--atlas-sun)" stopOpacity=".4" />
            <stop offset="100%" stopColor="var(--atlas-sun)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Top Observatory Bar */}
        <rect width="800" height="38" fill="var(--atlas-bar)" />
        <text x="22" y="23" fill="var(--atlas-bar-ink)" fontSize="10.5" fontFamily="Georgia,serif" letterSpacing="2.8">
          TERMÓMETRO DE LA TIERRA / ATLAS DE EXPLORACIÓN
        </text>
        <g transform="translate(572 7)">
          <rect width="208" height="24" rx="12" fill="#ffffff14" stroke="#ffffff33" strokeWidth="1" />
          <text x="104" y="15.5" textAnchor="middle" fill="#f3cf86" fontSize="9" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="1">
            {badgeText}
          </text>
        </g>

        {/* Sky & Stratified Minimalist Sea */}
        <rect x="0" y="38" width="800" height="436" fill="url(#atlas-sj-sea)" />
        <circle cx="92" cy="88" r="52" fill="url(#atlas-sj-sun)" />
        <circle cx="92" cy="88" r="22" fill="var(--atlas-sun)" />

        {/* Distant Horizon Ridge & Stylized Ocean Ripples */}
        <path d="M0 158Q210 132 420 150T800 144V162H0Z" fill="var(--atlas-horizon)" opacity=".42" />
        <path d="M0 248Q180 232 390 250T800 238V264H0Z" fill="var(--atlas-wave)" opacity=".35" />
        <path d="M0 364Q220 344 460 364T800 352V382H0Z" fill="var(--atlas-wave)" opacity=".32" />
        <g fill="var(--atlas-foam)" opacity=".45" className="art-ripple">
          <rect x="54" y="294" width="52" height="3" rx="1.5" />
          <rect x="304" y="286" width="66" height="3" rx="1.5" />
          <rect x="614" y="408" width="58" height="3" rx="1.5" />
          <rect x="44" y="432" width="76" height="3" rx="1.5" />
        </g>

        {/* Upper Island Mass (01 Energía + 02 Industria) */}
        <path
          d="M68 206Q92 152 174 150Q250 148 302 168Q364 140 448 142Q522 144 544 190Q554 224 510 246Q456 264 388 258Q316 254 268 268Q210 278 148 268Q62 254 68 206Z"
          fill="var(--atlas-land-shadow)"
        />
        <path
          d="M74 198Q98 148 176 146Q250 146 298 168Q362 138 448 140Q518 142 538 184Q544 218 496 236Q448 252 392 246Q334 244 282 258Q234 270 180 262Q118 254 84 228Q66 214 74 198Z"
          fill="var(--atlas-land-main)"
        />
        <path
          d="M88 204Q118 162 192 162Q252 162 272 200Q238 230 176 230Q114 230 88 204Z"
          fill="var(--atlas-region-energy)"
        />
        <path
          d="M356 200Q376 150 448 150Q504 150 522 188Q500 226 438 228Q376 228 356 200Z"
          fill="var(--atlas-region-industry)"
        />

        {/* Causeway Viaduct Bridge anchored squarely FROM Upper Island (x=514) TO Movilidad Peninsula (x=616) */}
        <g aria-hidden="true">
          <rect x="514" y="198" width="102" height="6" fill="var(--atlas-silhouette)" />
          <path d="M518 204H614V218H600a14 14 0 0 0-28 0H560a14 14 0 0 0-28 0H518Z" fill="var(--atlas-silhouette)" />
          <g transform="translate(544 191)">
            <g className="art-vehicle">
              <rect x="0" y="0" width="32" height="7" rx="3" fill="var(--atlas-accent-gold)" />
              <rect x="4" y="2" width="10" height="2.5" fill="var(--atlas-silhouette)" />
              <rect x="17" y="2" width="10" height="2.5" fill="var(--atlas-silhouette)" />
            </g>
          </g>
        </g>

        {/* Eastern Peninsula (03 Movilidad) */}
        <path
          d="M594 232Q618 184 680 186Q740 190 746 240Q750 284 696 294Q634 306 598 272Q582 254 594 232Z"
          fill="var(--atlas-land-shadow)"
        />
        <path
          d="M598 224Q622 180 680 182Q734 186 740 232Q744 272 690 282Q634 292 602 262Q586 244 598 224Z"
          fill="var(--atlas-region-mobility)"
        />

        {/* Lower Island (04 Bosques right, 05 Agricultura left) */}
        <path
          d="M96 376Q126 324 222 324Q302 324 346 350Q404 322 480 326Q554 330 568 382Q582 436 504 448Q424 460 342 442Q248 462 154 448Q78 434 96 376Z"
          fill="var(--atlas-land-shadow)"
        />
        <path
          d="M102 368Q132 320 224 320Q302 320 344 346Q406 318 480 322Q548 326 560 374Q568 424 494 434Q422 444 344 428Q248 448 160 434Q88 420 102 368Z"
          fill="var(--atlas-region-farm)"
        />
        <path
          d="M356 368Q404 322 480 326Q544 330 554 374Q546 424 474 430Q392 436 356 368Z"
          fill="var(--atlas-region-forest)"
        />
        {/* Agricultural terraced contours inside SW headland */}
        <path d="M124 388Q204 358 292 386Q248 422 164 420Q132 418 124 388Z" fill="var(--atlas-terrace-a)" />
        <path d="M138 408Q208 384 278 406Q234 428 158 424Z" fill="var(--atlas-terrace-b)" />

        {/* ---- Grounded Lineless Samurai Jack Concept Landmarks ---- */}

        {/* 01 Energía: Fossil thermal plant + Grid pylon + Clean wind turbines + Solar panels */}
        <g aria-hidden="true">
          {/* Small coal/gas station on western point */}
          <rect x="98" y="198" width="16" height="14" fill="var(--atlas-silhouette)" />
          <polygon points="103,198 109,198 108,180 104,180" fill="var(--atlas-silhouette-alt)" />
          <g transform="translate(106 177)">
            <g className="atlas-smoke" fill="var(--atlas-foam)" opacity=".68">
              <circle cx="0" cy="-3" r="3" />
              <circle cx="5" cy="-8" r="3.6" />
            </g>
          </g>
          {/* Wind turbines firmly planted on upper ridge */}
          <g transform="translate(136 200)">
            <polygon points="-2.2,0 2.2,0 .9,-28 -.9,-28" fill="var(--atlas-light-accent)" />
            <g transform="translate(0 -28)">
              <g className="atlas-rotor">
                <circle r="15" fill="transparent" />
                <polygon points="-1.4,0 1.4,0 0,-15" fill="var(--atlas-light-accent)" />
                <polygon points="-1.4,0 1.4,0 0,-15" fill="var(--atlas-light-accent)" transform="rotate(120)" />
                <polygon points="-1.4,0 1.4,0 0,-15" fill="var(--atlas-light-accent)" transform="rotate(240)" />
              </g>
              <circle r="2.4" fill="var(--atlas-accent-gold)" />
            </g>
          </g>
          <g transform="translate(160 194)">
            <polygon points="-1.8,0 1.8,0 .7,-22 -.7,-22" fill="var(--atlas-light-accent)" />
            <g transform="translate(0 -22)">
              <g className="atlas-rotor atlas-rotor-slow">
                <circle r="12" fill="transparent" />
                <polygon points="-1.2,0 1.2,0 0,-12" fill="var(--atlas-light-accent)" />
                <polygon points="-1.2,0 1.2,0 0,-12" fill="var(--atlas-light-accent)" transform="rotate(120)" />
                <polygon points="-1.2,0 1.2,0 0,-12" fill="var(--atlas-light-accent)" transform="rotate(240)" />
              </g>
              <circle r="2" fill="var(--atlas-accent-gold)" />
            </g>
          </g>
          {/* Grounded solar collector slabs */}
          <polygon points="122,216 146,204 154,210 130,222" fill="var(--atlas-silhouette)" />
          <polygon points="146,218 170,206 178,212 154,224" fill="var(--atlas-silhouette-alt)" />
        </g>

        {/* 02 Industria: Foundry + smokestack + raw material silo */}
        <g aria-hidden="true">
          <path d="M368 202V178L382 170V180L396 170V202Z" fill="var(--atlas-silhouette)" />
          <polygon points="389,174 396,174 394,150 391,150" fill="var(--atlas-silhouette-alt)" />
          <rect x="402" y="172" width="14" height="30" fill="var(--atlas-light-accent)" />
          <ellipse cx="409" cy="172" rx="7" ry="3" fill="var(--atlas-accent-gold)" />
          <g transform="translate(392 146)">
            <g className="atlas-smoke" fill="var(--atlas-foam)" opacity=".76">
              <circle cx="0" cy="-3" r="4" />
              <circle cx="8" cy="-10" r="5" />
              <circle cx="16" cy="-16" r="3.5" />
            </g>
          </g>
        </g>

        {/* 03 Movilidad: Road/rail corridor on peninsula + Cargo vessel cleanly IN OPEN SEA below it */}
        <g aria-hidden="true">
          {/* City transit station silhouette on peninsula */}
          <rect x="692" y="218" width="24" height="16" fill="var(--atlas-silhouette)" />
          <rect x="696" y="222" width="6" height="5" fill="var(--atlas-accent-gold)" />
          <rect x="706" y="222" width="6" height="5" fill="var(--atlas-accent-gold)" />
          {/* Cargo vessel gliding on open turquoise sea well south of peninsula */}
          <g transform="translate(676 346)">
            <g className="art-vehicle">
              <polygon points="-24,0 24,0 18,10 -18,10" fill="var(--atlas-silhouette)" />
              <rect x="-15" y="-7" width="10" height="7" fill="var(--atlas-accent-gold)" />
              <rect x="-3" y="-7" width="9" height="7" fill="var(--atlas-light-accent)" />
              <rect x="8" y="-10" width="7" height="10" fill="var(--atlas-silhouette-alt)" />
              <rect x="-30" y="12" width="60" height="2.5" rx="1.25" fill="var(--atlas-foam)" opacity=".8" />
            </g>
          </g>
        </g>

        {/* 04 Bosques: Cleared stumps (deforestación) vs dense Samurai Jack pine grove */}
        <g aria-hidden="true">
          {/* Cleared stumps on western side of 04 */}
          <polygon points="376,408 382,408 381,400 377,400" fill="var(--atlas-trunk)" />
          <polygon points="391,414 397,414 396,406 392,406" fill="var(--atlas-trunk)" />
          {/* Layered pines firmly inside emerald island (486..548) */}
          {[
            { x: 500, y: 396, s: 0.94, c: 'var(--atlas-silhouette)' },
            { x: 518, y: 388, s: 1.12, c: 'var(--atlas-silhouette-alt)' },
            { x: 536, y: 400, s: 0.86, c: 'var(--atlas-silhouette)' },
          ].map((tree, idx) => (
            <g key={idx} transform={`translate(${tree.x} ${tree.y}) scale(${tree.s})`}>
              <polygon points="-2,0 2,0 1.4,-10 -1.4,-10" fill="var(--atlas-trunk)" />
              <polygon points="0,-38 -11,-12 11,-12" fill={tree.c} />
              <polygon points="0,-49 -8,-26 8,-26" fill={tree.c} />
            </g>
          ))}
        </g>

        {/* 05 Agricultura: Barn + Silo + Grazing cow + Golden crop rows on SW headland */}
        <g aria-hidden="true">
          <g transform="translate(136 368)">
            <rect x="-18" y="6" width="8" height="16" fill="var(--atlas-light-accent)" />
            <path d="M-18 6a4 3.5 0 0 1 8 0Z" fill="var(--atlas-accent-gold)" />
            <polygon points="-8,22 14,22 14,9 3,-2 -8,9" fill="var(--atlas-silhouette)" />
            <polygon points="3,-2 14,9 14,22 3,22" fill="var(--atlas-silhouette-alt)" />
            <rect x="0" y="13" width="6" height="9" fill="var(--atlas-light-accent)" />
          </g>
          {/* Minimalist grazing cow silhouette on pasture */}
          <g transform="translate(164 402)">
            <rect x="-7" y="-5" width="13" height="7" rx="2" fill="var(--atlas-light-accent)" />
            <rect x="5" y="-7" width="4" height="5" rx="1.2" fill="var(--atlas-silhouette)" />
            <rect x="-6" y="2" width="2" height="4" fill="var(--atlas-silhouette)" />
            <rect x="3" y="2" width="2" height="4" fill="var(--atlas-silhouette)" />
            <rect x="-3" y="-4" width="5" height="3.5" fill="var(--atlas-silhouette)" />
          </g>
        </g>

        {/* Ordered Expedition Route (01 -> 02 -> 03 -> 04 -> 05) */}
        <g fill="none" strokeLinecap="round" pointerEvents="none">
          {ROUTE_SEGMENTS.map(seg => {
            const segDone = completed.includes(seg.from)
            return <g key={`${seg.from}-${seg.to}`}>
              <path d={seg.d} stroke="var(--atlas-route-casing)" strokeWidth="6" />
              <path
                d={seg.d}
                className={segDone ? 'atlas-route-done' : 'atlas-route-pending'}
                stroke={segDone ? 'var(--atlas-route-done)' : 'var(--atlas-route-pending)'}
                strokeWidth={segDone ? '3.4' : '2.8'}
                strokeDasharray={segDone ? undefined : '5 8'}
              />
            </g>
          })}
        </g>

        {/* Interactive Region Labels & Waypoint Medallions */}
        {gameModules.map((game, i) => {
          const id = game.id as WorldId
          const spec = NODES[id]
          const isDone = completed.includes(id)
          const unlocked = isEpochUnlocked(id, completed)
          const isNext = !isDone && upcoming?.id === id
          const isActive = activeId === id
          const stateText = isDone
            ? 'Etapa completada.'
            : unlocked
              ? 'Etapa disponible para explorar.'
              : 'Etapa bloqueada: completa la anterior.'
          const label = `Explorar ${game.title}. ${stateText}`

          return <g key={game.id}>
            <g transform={`translate(${spec.labelX} ${spec.labelY})`} pointerEvents="none">
              <rect
                x={-spec.pillW / 2}
                y="-10"
                width={spec.pillW}
                height="20"
                rx="10"
                fill="var(--atlas-label-bg)"
                stroke={isActive ? '#e5a958' : 'var(--atlas-label-border)'}
                strokeWidth={isActive ? '1.8' : '1'}
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                fontFamily="Arial,sans-serif"
                fontWeight="700"
                fontSize="9.2"
                letterSpacing="1.3"
                fill="var(--atlas-label-ink)"
              >
                {spec.label}
              </text>
            </g>

            <a
              href={gameHref(id)}
              onClick={event => openWorld(event, id)}
              onMouseEnter={() => setActiveId(id)}
              onMouseLeave={() => setActiveId(prev => (prev === id ? null : prev))}
              onFocus={() => setActiveId(id)}
              onBlur={() => setActiveId(prev => (prev === id ? null : prev))}
              data-sfx={unlocked ? 'nav' : 'warn'}
              aria-label={label}
              className={`atlas-node${isDone ? ' is-done' : isNext ? ' is-next' : unlocked ? '' : ' is-locked'}${isActive ? ' is-highlighted' : ''}`}
            >
              {(isNext || isActive) && (
                <circle
                  className={isNext ? 'atlas-pulse-ring' : undefined}
                  cx={spec.x}
                  cy={spec.y}
                  r="26"
                  fill="none"
                  stroke="#f3cf86"
                  strokeWidth="2.2"
                  opacity={isActive ? '.95' : '.75'}
                />
              )}
              <circle
                className="atlas-node-ring"
                cx={spec.x}
                cy={spec.y}
                r="19"
                fill={isDone ? '#1e5c4a' : unlocked ? '#f8f0da' : '#dfd8c7'}
                stroke={isDone ? '#e5a958' : unlocked ? '#163e36' : '#6c6659'}
                strokeWidth="2.6"
                strokeDasharray={unlocked ? undefined : '4 3'}
              />
              <text
                x={spec.x}
                y={spec.y + 4.5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill={isDone ? '#f6efe0' : unlocked ? '#163e36' : '#4a453c'}
                fontFamily="var(--font-mono)"
              >
                {String(i + 1).padStart(2, '0')}
              </text>
              {isDone && (
                <g pointerEvents="none" transform={`translate(${spec.x + 15} ${spec.y - 15})`}>
                  <circle r="8" fill="#e5a958" />
                  <path d="M-3.5 0l2.4 2.4 4.6-4.8" fill="none" stroke="#163e36" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {!unlocked && (
                <g className="atlas-locked-tag" pointerEvents="none">
                  <rect x={spec.x - 34} y={spec.y + 23} width="68" height="15" rx="7.5" fill="var(--atlas-label-bg)" stroke="var(--atlas-label-border)" strokeWidth="1" />
                  <text x={spec.x} y={spec.y + 33.5} textAnchor="middle" fontSize="7.8" fontWeight="700" fill="var(--atlas-label-ink)" fontFamily="Arial,sans-serif">
                    BLOQUEADA
                  </text>
                </g>
              )}
            </a>
          </g>
        })}

        {/* Minimalist Lineless Compass Rose */}
        <g transform="translate(744 96)" aria-hidden="true">
          <circle r="23" fill="var(--atlas-compass-bg)" />
          <path d="M0-16 4.2 0 0-3-4.2 0Z" fill="#edc16c" />
          <path d="M0 16 4.2 0 0 3-4.2 0Z" fill="#f4eedc" opacity=".82" />
          <path d="M-12 0 0-3.2 12 0 0 3.2Z" fill="#f4eedc" opacity=".55" />
          <circle r="2" fill="#edc16c" />
          <g fill="var(--atlas-compass-ink)" fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700" textAnchor="middle">
            <text x="0" y="-28">N</text>
            <text x="0" y="35">S</text>
            <text x="31" y="3">E</text>
            <text x="-31" y="3">O</text>
          </g>
        </g>

        {/* Bottom Cartographic Footer Bar */}
        <rect y="474" width="800" height="34" fill="var(--atlas-bar)" />
        <text x="22" y="495" fill="var(--atlas-bar-ink)" fontSize="9.5" fontFamily="Georgia,serif" letterSpacing="2" opacity=".88">
          MAPA CONCEPTUAL · NO ES UNA CAPA CLIMÁTICA
        </text>
        <g transform="translate(504 493)" fontFamily="var(--font-mono)" fontSize="8.5" fill="var(--atlas-bar-ink)">
          <circle cx="0" cy="-2.5" r="4.5" fill="#1e5c4a" stroke="#e5a958" strokeWidth="1.4" />
          <text x="9" y="1">COMPLETADA</text>
          <circle cx="90" cy="-2.5" r="4.5" fill="#f8f0da" stroke="#e5a958" strokeWidth="1.8" />
          <text x="99" y="1">SIGUIENTE</text>
          <line x1="172" y1="-2.5" x2="196" y2="-2.5" stroke="var(--atlas-route-done)" strokeWidth="2.4" />
          <text x="202" y="1">RUTA 01 → 05</text>
        </g>
      </svg>
    </div>

    <div className="atlas-index">
      <p className="eyebrow">ÍNDICE DE CAMPO · {doneCount}/{gameModules.length}</p>
      {gameModules.map((game, i) => {
        const id = game.id as WorldId
        const isDone = completed.includes(id)
        const unlocked = isEpochUnlocked(id, completed)
        const isNext = !isDone && upcoming?.id === id
        const isActive = activeId === id
        const statusLabel = isDone ? ' · Completada' : isNext ? ' · Siguiente' : unlocked ? '' : ' · Bloqueada'

        return <Link
          key={game.id}
          to={gameRoute(id)}
          data-sfx={unlocked ? 'nav' : 'warn'}
          onMouseEnter={() => setActiveId(id)}
          onMouseLeave={() => setActiveId(prev => (prev === id ? null : prev))}
          onFocus={() => setActiveId(id)}
          onBlur={() => setActiveId(prev => (prev === id ? null : prev))}
          className={[
            isDone ? 'is-done' : isNext ? 'is-next' : unlocked ? '' : 'is-locked',
            isActive ? 'is-highlighted' : '',
          ].filter(Boolean).join(' ') || undefined}
        >
          <span>{String(i + 1).padStart(2, '0')}</span>
          <span><strong>{game.title}</strong><small>{game.theme} · {game.era}{statusLabel}</small></span>
          <span aria-hidden="true">{isDone ? '✓' : unlocked ? '↗' : '◼'}</span>
        </Link>
      })}
      <p className="atlas-index-note">Los cinco puntos siguen la ruta 01–05 y se desbloquean al completar cada reto. No representan ubicaciones geográficas reales.</p>
    </div>
  </div>
}
