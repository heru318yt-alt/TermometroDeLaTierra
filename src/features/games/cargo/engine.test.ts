import { describe, expect, it } from 'vitest'
import { MODES, MODE_ORDER, ORIGIN, ROUND_SECONDS, ROUTES, canLaunch, createGame, hillBlocks, landingX, launch, maxRange, nextRound, reaches, routeCenter, solveAim, step, summarize, trajectory, type GameState, type Mode } from './engine'

function run(state: GameState, seconds: number) { for (let t = 0; t < seconds && state.status === 'playing'; t += 1 / 60) step(state, 1 / 60); return state }

/** Jugador automático: reparte la energía entre las rutas y apunta al centro de la zona. */
function play(pick: (route: number, state: GameState) => Mode | null): GameState {
  const state = createGame()
  for (let guard = 0; guard < 10 && state.status !== 'finished'; guard++) {
    if (state.status === 'round-over') { nextRound(state); continue }
    const mode = pick(state.routeIndex, state)
    const aim = mode ? solveAim(mode, ROUTES[state.routeIndex]) : null
    const allotment = state.energy / (ROUTES.length - state.routeIndex)
    const startEnergy = state.energy
    for (let t = 0; t < 60 * 60 && state.status === 'playing'; t++) {
      if (mode && aim && startEnergy - state.energy + MODES[mode].energy <= allotment && canLaunch(state, mode).ok) launch(state, mode, aim.angle, aim.power)
      step(state, 1 / 60)
    }
  }
  return state
}

describe('física y alcance', () => {
  it('la ruta simulada cae donde dice la fórmula', () => {
    for (const mode of MODE_ORDER) {
      const pts = trajectory(mode, 45, 0.7, 0.001), last = pts[pts.length - 1]
      expect(last.x).toBeCloseTo(landingX(mode, 45, 0.7), 1)
    }
  })

  it('cada modo tiene un alcance distinto y define qué rutas puede cubrir', () => {
    expect(maxRange('road')).toBeGreaterThan(40); expect(reaches('road', ROUTES[0])).toBe(true)
    expect(reaches('road', ROUTES[1])).toBe(false)
    expect(reaches('rail', ROUTES[1])).toBe(true); expect(reaches('rail', ROUTES[2])).toBe(false)
    expect(reaches('ship', ROUTES[2])).toBe(true); expect(reaches('plane', ROUTES[2])).toBe(true)
  })

  it('el avión llega mucho más rápido que el barco', () => {
    const plane = trajectory('plane', 45, 0.9, 0.01).length * 0.01, ship = trajectory('ship', 45, 0.9, 0.01).length * 0.01
    expect(ship).toBeGreaterThan(plane * 2)
  })

  it('hay una puntería que despeja la colina para cada modo y ruta que alcanza', () => {
    for (const r of ROUTES) for (const mode of MODE_ORDER) {
      const aim = solveAim(mode, r)
      if (reaches(mode, r)) { expect(aim, `${mode} ${r.id}`).not.toBeNull(); expect(landingX(mode, aim!.angle, aim!.power)).toBeCloseTo(routeCenter(r), 1) }
      else expect(aim).toBeNull()
    }
  })

  it('un tiro plano y bajo choca con la colina', () => {
    const r = ROUTES[0], pts = trajectory('road', 10, 0.95, 0.01)
    expect(pts.some(p => hillBlocks(r, p.x, p.y))).toBe(true)
  })
})

describe('entregas', () => {
  it('una caja que aterriza en la zona cuenta y suma tonelada-kilómetro', () => {
    const s = createGame(), aim = solveAim('plane', ROUTES[0])!
    launch(s, 'plane', aim.angle, aim.power); run(s, 5)
    expect(s.delivered).toBe(MODES.plane.boxes)
    expect(s.deliveredTkm).toBe(MODES.plane.boxes * 400)
  })

  it('un tiro corto se pierde', () => {
    const s = createGame(); launch(s, 'plane', 45, 0.3); run(s, 5)
    expect(s.delivered).toBe(0); expect(s.lost).toBe(MODES.plane.boxes)
  })

  it('un lote grande se reparte: el barco no entrega todas sus cajas aun apuntando perfecto', () => {
    const s = createGame(); s.routeIndex = 2
    const aim = solveAim('ship', ROUTES[2])!
    launch(s, 'ship', aim.angle, aim.power); run(s, 10)
    expect(s.delivered).toBe(5)
    expect(s.delivered).toBeLessThan(MODES.ship.boxes)
  })

  it('el ferrocarril ignora el ángulo del jugador', () => {
    expect(landingX('rail', 20, 0.8)).toBeCloseTo(landingX('rail', 70, 0.8), 6)
  })
})

describe('recursos y tiempo', () => {
  it('lanzar gasta energía, activa la recarga y suma emisiones del modo', () => {
    const s = createGame(), before = s.energy
    expect(launch(s, 'road', 45, 0.8)).toBe(true)
    expect(s.energy).toBe(before - MODES.road.energy)
    expect(canLaunch(s, 'road').ok).toBe(false)
    expect(launch(s, 'road', 45, 0.8)).toBe(false)
    expect(s.emissionsKg).toBeCloseTo((MODES.road.boxes * 100 * 400) / 1000, 6)
  })

  it('las emisiones por tonelada-km: avión ≫ carretera ≫ ferrocarril > barco', () => {
    expect(MODES.plane.gPerTkm).toBeGreaterThan(MODES.road.gPerTkm * 5)
    expect(MODES.road.gPerTkm).toBeGreaterThan(MODES.rail.gPerTkm * 3)
    expect(MODES.rail.gPerTkm).toBeGreaterThan(MODES.ship.gPerTkm)
  })

  it('no se puede lanzar sin energía suficiente', () => {
    const s = createGame(); s.energy = 2
    expect(canLaunch(s, 'road').ok).toBe(false)
    expect(launch(s, 'road', 45, 0.8)).toBe(false)
  })

  it('al acabar el tiempo, las cajas en vuelo llegan tarde y se pierden', () => {
    const s = createGame(); s.roundTime = ROUND_SECONDS - 0.5
    launch(s, 'ship', 45, 0.95); run(s, 2)
    expect(s.status).toBe('round-over'); expect(s.endReason).toBe('time')
    expect(s.late).toBe(MODES.ship.boxes); expect(s.delivered).toBe(0)
  })

  it('la energía es compartida entre rutas y la partida termina en la última', () => {
    const s = createGame(); launch(s, 'road', 45, 0.5)
    const left = s.energy; s.status = 'round-over'; nextRound(s)
    expect(s.routeIndex).toBe(1); expect(s.energy).toBe(left); expect(s.status).toBe('playing')
    s.status = 'round-over'; nextRound(s); s.status = 'round-over'; nextRound(s)
    expect(s.status).toBe('finished')
  })

  it('sin energía y sin cajas en vuelo, la ronda termina antes', () => {
    const s = createGame(); s.energy = 2; step(s, 0.05)
    expect(s.status).toBe('round-over'); expect(s.endReason).toBe('energy')
  })
})

describe('partidas completas con un jugador perfecto', () => {
  const smart = (route: number): Mode => (route === 0 ? 'rail' : route === 1 ? 'rail' : 'ship')
  it('usar el modo adecuado a la distancia rinde más que insistir en uno que no alcanza', () => {
    const good = play(smart), roadOnly = play(() => 'road')
    expect(good.delivered).toBeGreaterThan(roadOnly.delivered)
    expect(good.deliveredByRoute[2]).toBeGreaterThan(0)
    expect(roadOnly.deliveredByRoute[1] + roadOnly.deliveredByRoute[2]).toBe(0)
  })

  it('el avión puede entregar en las tres rutas, pero con emisiones mucho mayores', () => {
    const plane = play(() => 'plane'), good = play(smart)
    expect(plane.deliveredByRoute.every(n => n > 0)).toBe(true)
    expect(summarize(plane).gPerTkm).toBeGreaterThan(summarize(good).gPerTkm * 5)
  })

  it('una partida eficiente puede ganar la medalla de ruta limpia', () => {
    const good = play(smart), s = summarize(good)
    expect(s.score).toBeGreaterThanOrEqual(20)
    expect(s.cleanRoute).toBe(true)
  })

  it('gastar toda la energía en la primera ruta deja sin recursos para las siguientes', () => {
    const greedy = createGame(), aim = solveAim('plane', ROUTES[0])!
    for (let t = 0; t < 60 * 24 && greedy.status === 'playing'; t++) { if (canLaunch(greedy, 'plane').ok) launch(greedy, 'plane', aim.angle, aim.power); step(greedy, 1 / 60) }
    expect(greedy.energy).toBeLessThan(MODES.ship.energy)
    expect(play(smart).delivered).toBeGreaterThan(greedy.delivered)
  })

  it('el origen está a la izquierda y el destino siempre a la derecha', () => {
    for (const r of ROUTES) expect(routeCenter(r)).toBeGreaterThan(ORIGIN.x + 30)
    expect(MODES.rail.fixedAngle).toBe(45)
  })
})

describe('Carga entre ciudades · racha de lotes precisos', () => {
  it('lotes precisos seguidos suben el multiplicador y suman bono', () => {
    const state = createGame(), aim = solveAim('road', ROUTES[0])!
    for (let i = 0; i < 5; i++) { launch(state, 'road', aim.angle, aim.power); run(state, MODES.road.cooldown + 0.05) }
    expect(state.streak).toBe(5)
    expect(state.bonus).toBeGreaterThan(0)
    expect(summarize(state).total).toBe(state.delivered + state.bonus)
    expect(state.fx.some(f => f.type === 'land' && f.ok)).toBe(true)
  })

  it('un lote fuera de la zona reinicia la racha', () => {
    const state = createGame(), aim = solveAim('road', ROUTES[0])!
    launch(state, 'road', aim.angle, aim.power); run(state, 2)
    expect(state.streak).toBe(1)
    launch(state, 'road', 45, 0.25); run(state, 2)
    expect(state.streak).toBe(0)
    expect(Object.keys(state.batches)).toHaveLength(0)
  })
})
