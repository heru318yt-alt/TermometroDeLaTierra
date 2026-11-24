/**
 * Carga entre ciudades · dibujo del escenario (coordenadas lógicas 640×360).
 */
import { FxLayer, hash, roundRect, vignette } from '../shared/canvas'
import {
  MODES, ORIGIN, ROUND_SECONDS, ROUTES, WORLD, ZONE_HALF,
  batchEmissionsTonnes, batchSpreadHalf, effectiveAngle, flightTime,
  hillBlocks, landingX, maxRange, reaches, routeCenter, trajectory,
  type GameState, type Mode,
} from './engine'
import { MODE_CONTROL } from './slingshot'

export const W = 640
export const H = 360
export const GROUND = 30
export const SCALE = W / WORLD.w
export const px = (x: number) => x * SCALE
export const py = (y: number) => H - GROUND - y * SCALE

export const MODE_COLOR: Record<Mode, string> = { road: '#ff9f43', rail: '#2ec4b6', ship: '#3d8bff', plane: '#ff4f6d' }
const MODE_DARK: Record<Mode, string> = { road: '#b8641c', rail: '#178077', ship: '#1d55b8', plane: '#b52643' }

const CLOUDS = Array.from({ length: 5 }, (_, i) => ({ x: hash(i * 3.3) * W, y: 26 + hash(i * 7.1) * 80, s: 0.7 + hash(i * 1.7) * 0.7, v: 4 + hash(i) * 6 }))

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = '#ffffffd9'
  ctx.beginPath()
  ctx.arc(x, y, 12 * s, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(x + 14 * s, y - 9 * s, 14 * s, Math.PI, Math.PI * 2)
  ctx.arc(x + 32 * s, y - 4 * s, 11 * s, Math.PI * 1.2, Math.PI * 0.5); ctx.closePath(); ctx.fill()
}

/** Vehículo icónico de cada modo, apoyado en (x, y) con ancho ~34. */
export function drawVehicle(ctx: CanvasRenderingContext2D, mode: Mode, x: number, y: number, k = 1) {
  const c = MODE_COLOR[mode], d = MODE_DARK[mode]
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k)
  const wheel = (wx: number) => { ctx.fillStyle = '#1d2430'; ctx.beginPath(); ctx.arc(wx, -3.5, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#c9d2de'; ctx.beginPath(); ctx.arc(wx, -3.5, 1.3, 0, Math.PI * 2); ctx.fill() }
  if (mode === 'road') {
    ctx.fillStyle = c; roundRect(ctx, -17, -21, 22, 15, 2); ctx.fill()
    ctx.fillStyle = '#ffffff40'; ctx.fillRect(-15, -19, 18, 3)
    ctx.fillStyle = d; roundRect(ctx, 5, -16, 11, 10, 3); ctx.fill()
    ctx.fillStyle = '#bfe6ff'; roundRect(ctx, 9, -14, 5, 4, 1); ctx.fill()
    wheel(-11); wheel(-2); wheel(11)
  } else if (mode === 'rail') {
    ctx.fillStyle = '#5b6573'; ctx.fillRect(-20, -2, 40, 2)
    ctx.fillStyle = c; roundRect(ctx, -17, -20, 30, 15, 3); ctx.fill()
    ctx.fillStyle = d; roundRect(ctx, 5, -26, 10, 21, 2); ctx.fill()
    ctx.fillStyle = '#bfe6ff'; roundRect(ctx, 7, -23, 6, 5, 1); ctx.fill()
    ctx.fillStyle = '#ffffff55'; ctx.fillRect(-15, -15, 18, 2)
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(16, -10, 2, 0, Math.PI * 2); ctx.fill()
    wheel(-11); wheel(-2); wheel(8)
  } else if (mode === 'ship') {
    ctx.fillStyle = '#4fa3e3'; roundRect(ctx, -22, -4, 44, 6, 3); ctx.fill()
    ctx.fillStyle = d; ctx.beginPath(); ctx.moveTo(-20, -11); ctx.lineTo(20, -11); ctx.lineTo(15, -2); ctx.lineTo(-16, -2); ctx.closePath(); ctx.fill()
    ;['#ff9f43', '#2ec4b6', '#ffd84d'].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(-15 + i * 8, -18, 7, 7) })
    ctx.fillStyle = '#f4f7fb'; roundRect(ctx, 9, -23, 8, 12, 1.5); ctx.fill()
    ctx.fillStyle = c; ctx.fillRect(10, -20, 6, 2)
  } else {
    ctx.fillStyle = '#e9eef5'; roundRect(ctx, -18, -15, 34, 8, 4); ctx.fill()
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(6, -12); ctx.lineTo(-6, -2); ctx.lineTo(-12, -2); ctx.closePath(); ctx.fill()
    ctx.beginPath(); ctx.moveTo(-17, -14); ctx.lineTo(-12, -14); ctx.lineTo(-16, -23); ctx.lineTo(-20, -23); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#7fb8e6'; for (let i = 0; i < 4; i++) ctx.fillRect(-8 + i * 5, -13, 2.5, 2.5)
    ctx.fillStyle = '#1d2430'; ctx.fillRect(-2, -7, 1.5, 4); ctx.beginPath(); ctx.arc(-1.3, -2.5, 1.8, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function crate(ctx: CanvasRenderingContext2D, x: number, y: number, mode: Mode, rot: number, size = 9) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
  const h = size / 2
  ctx.fillStyle = '#0003'; ctx.fillRect(-h + 1.5, -h + 1.5, size, size)
  const g = ctx.createLinearGradient(-h, -h, h, h); g.addColorStop(0, '#f0c27a'); g.addColorStop(1, '#b97a35')
  ctx.fillStyle = g; ctx.fillRect(-h, -h, size, size)
  ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 1.2; ctx.strokeRect(-h, -h, size, size)
  ctx.beginPath(); ctx.moveTo(-h, -h); ctx.lineTo(h, h); ctx.moveTo(h, -h); ctx.lineTo(-h, h); ctx.lineWidth = 0.9; ctx.stroke()
  ctx.fillStyle = MODE_COLOR[mode]; ctx.fillRect(-h, -1, size, 2)
  ctx.restore()
}

function pill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  bg = '#0f2320eb',
  border = '#ffffff44',
  fg = '#fbf7ec',
) {
  ctx.save()
  ctx.font = '700 9.5px ui-monospace, Consolas, monospace'
  const padX = 8
  const h = 18
  const w = ctx.measureText(text).width + padX * 2
  const x = Math.max(6, Math.min(W - w - 6, cx - w / 2))
  const y = Math.max(6, Math.min(H - h - 6, cy - h / 2))
  ctx.fillStyle = bg
  roundRect(ctx, x, y, w, h, 5)
  ctx.fill()
  ctx.strokeStyle = border
  ctx.lineWidth = 1.2
  ctx.stroke()
  ctx.fillStyle = fg
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x + w / 2, y + h / 2 + 0.5)
  ctx.restore()
}

function city(ctx: CanvasRenderingContext2D, x0: number, palette: string[], seed: number, count = 5) {
  for (let i = 0; i < count; i++) {
    const w = 13 + Math.round(hash(seed + i) * 9), h = 20 + Math.round(hash(seed + i * 2.7) * 30)
    const x = x0 + i * 15, top = py(0) - h
    ctx.fillStyle = palette[i % palette.length]; roundRect(ctx, x, top, w, h, 2); ctx.fill()
    ctx.fillStyle = '#00000022'; ctx.fillRect(x + w - 4, top, 4, h)
    ctx.fillStyle = '#fff6cf'
    for (let wy = top + 5; wy < py(0) - 6; wy += 7) for (let wx = x + 3; wx < x + w - 5; wx += 5) if (hash(wx + wy * 3) > 0.35) ctx.fillRect(wx, wy, 2.5, 3)
  }
}

export interface DragView {
  active: boolean
  armed: boolean
  hovered: boolean
  canFire: boolean
  atMax: boolean
  offAxisWarning: boolean
  tension: number
  pointer: { x: number; y: number } | null
  pull: { x: number; y: number } | null
  showIntroCue: boolean
}

export interface View {
  t: number
  drag: DragView
  reduceMotion: boolean
}

export function drawScene(ctx: CanvasRenderingContext2D, s: GameState, mode: Mode, angle: number, power: number, preview: boolean, fx: FxLayer, v: View) {
  const r = ROUTES[s.routeIndex], center = routeCenter(r)
  const t = v.reduceMotion ? 0 : v.t
  const effAngle = effectiveAngle(mode, angle)
  const a = (effAngle * Math.PI) / 180
  const def = MODES[mode]
  const profile = MODE_CONTROL[mode]
  const drag = v.drag

  ctx.save()
  if (fx.shake > 0 && !v.reduceMotion) ctx.translate((Math.random() - 0.5) * fx.shake * 6, 0)

  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#58b4ef'); sky.addColorStop(0.7, '#bfe6fb'); sky.addColorStop(1, '#eaf7ff')
  ctx.fillStyle = sky; ctx.fillRect(-10, 0, W + 20, H)
  const sun = ctx.createRadialGradient(560, 58, 6, 560, 58, 70); sun.addColorStop(0, '#fff7c2'); sun.addColorStop(0.3, '#ffe27a88'); sun.addColorStop(1, 'transparent')
  ctx.fillStyle = sun; ctx.fillRect(480, 0, 160, 140)
  ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(560, 58, 17, 0, Math.PI * 2); ctx.fill()
  for (const c of CLOUDS) cloud(ctx, ((c.x + t * c.v) % (W + 80)) - 40, c.y, c.s)

  // Montañas lejanas y colinas medias.
  ctx.fillStyle = '#9cc7d9'
  ctx.beginPath(); ctx.moveTo(-10, py(0)); for (let x = -10; x <= W + 10; x += 20) ctx.lineTo(x, py(0) - 62 - 26 * Math.sin(x / 70) - 14 * Math.sin(x / 23)); ctx.lineTo(W + 10, py(0)); ctx.fill()
  ctx.fillStyle = '#7fbf7a'
  ctx.beginPath(); ctx.moveTo(-10, py(0)); for (let x = -10; x <= W + 10; x += 16) ctx.lineTo(x, py(0) - 22 - 12 * Math.sin(x / 45 + 1)); ctx.lineTo(W + 10, py(0)); ctx.fill()

  city(ctx, px(ORIGIN.x) - 46, ['#2f6f8f', '#e07a5f', '#3d405b', '#81b29a'], 3, 3)
  city(ctx, px(center) - 34, ['#f2cc8f', '#e07a5f', '#3d405b', '#2f6f8f', '#81b29a'], 9, 5)

  // Suelo: pasto, carretera y tierra.
  const ground = ctx.createLinearGradient(0, py(0), 0, H); ground.addColorStop(0, '#4caf50'); ground.addColorStop(0.25, '#3a8f3e'); ground.addColorStop(1, '#2d6b30')
  ctx.fillStyle = ground; ctx.fillRect(-10, py(0), W + 20, GROUND)
  ctx.fillStyle = '#3b4252'; ctx.fillRect(-10, py(0) + 9, W + 20, 9)
  ctx.fillStyle = '#ffe08a'; for (let x = 0; x < W; x += 22) ctx.fillRect(x, py(0) + 13, 11, 1.5)

  // Límite de alcance del modo activo cuando no cubre la ruta.
  if (!reaches(mode, r)) {
    const mx = px(ORIGIN.x + maxRange(mode))
    ctx.save()
    ctx.strokeStyle = '#ff9f43'
    ctx.lineWidth = 1.6
    ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(mx, py(0) - 24); ctx.lineTo(mx, py(0) + 2); ctx.stroke()
    ctx.setLineDash([])
    pill(ctx, mx, py(0) - 34, `MÁX. ${def.label.toUpperCase()}`, '#241602e0', '#ffb02e', '#ffd88a')
    ctx.restore()
  }

  // Colina que bloquea los tiros bajos.
  const hx = px(r.hillX), hw = r.hillHalf * SCALE, hh = r.hillHeight * SCALE
  const hill = ctx.createLinearGradient(0, py(r.hillHeight), 0, py(0)); hill.addColorStop(0, '#9b7b55'); hill.addColorStop(1, '#5e4630')
  ctx.fillStyle = hill
  ctx.beginPath(); ctx.moveTo(hx - hw, py(0)); ctx.quadraticCurveTo(hx - hw * 0.35, py(0) - hh * 0.9, hx, py(0) - hh); ctx.quadraticCurveTo(hx + hw * 0.35, py(0) - hh * 0.9, hx + hw, py(0)); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#5aa64f'
  ctx.beginPath(); ctx.moveTo(hx - hw * 0.42, py(0) - hh * 0.72); ctx.quadraticCurveTo(hx, py(0) - hh * 1.12, hx + hw * 0.42, py(0) - hh * 0.72); ctx.quadraticCurveTo(hx, py(0) - hh * 0.82, hx - hw * 0.42, py(0) - hh * 0.72); ctx.fill()
  for (const k of [-0.6, 0.55]) { const tx = hx + hw * k, ty = py(0) - hh * (1 - Math.abs(k)) * 0.9; ctx.fillStyle = '#2f7d3a'; ctx.beginPath(); ctx.moveTo(tx, ty - 10); ctx.lineTo(tx + 5, ty); ctx.lineTo(tx - 5, ty); ctx.closePath(); ctx.fill() }

  // Plataforma de entrega con diana y bandera.
  const zx = px(center - ZONE_HALF), zw = ZONE_HALF * 2 * SCALE, zy = py(0)
  ctx.fillStyle = '#1f2633'; roundRect(ctx, zx - 2, zy - 5, zw + 4, 7, 2); ctx.fill()
  ctx.save(); roundRect(ctx, zx, zy - 4, zw, 4, 1); ctx.clip()
  for (let x = zx - 10; x < zx + zw + 10; x += 8) { ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.moveTo(x, zy); ctx.lineTo(x + 4, zy - 4); ctx.lineTo(x + 8, zy - 4); ctx.lineTo(x + 4, zy); ctx.closePath(); ctx.fill() }
  ctx.restore()
  const pulse = 1 + 0.06 * Math.sin(t * 4)
  ;[1, 0.66, 0.33].forEach((k, i) => { ctx.strokeStyle = i % 2 ? '#ffffffcc' : '#ff4f6dcc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px(center), zy - 9, zw / 2 * k * pulse, 4 * k * pulse, 0, 0, Math.PI * 2); ctx.stroke() })
  const fx0 = zx + zw + 4
  ctx.fillStyle = '#e9eef5'; ctx.fillRect(fx0, zy - 34, 2, 34)
  ctx.fillStyle = '#ff4f6d'; ctx.beginPath(); ctx.moveTo(fx0 + 2, zy - 34); ctx.quadraticCurveTo(fx0 + 10, zy - 31 + Math.sin(t * 5) * 2, fx0 + 17, zy - 30); ctx.lineTo(fx0 + 2, zy - 25); ctx.closePath(); ctx.fill()

  ctx.font = '700 9px ui-monospace, Consolas, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ffffffcc'; ctx.fillText('ORIGEN', px(ORIGIN.x), H - 3); ctx.fillText('DESTINO', px(center), H - 3)

  const ox = px(ORIGIN.x), oy = py(ORIGIN.y)

  // Halo de selección del lanzador cuando está listo para agarrar.
  if (preview && s.status === 'playing' && !drag.active && drag.canFire) {
    const haloPulse = v.reduceMotion ? 0 : Math.sin(t * 4.5) * 2.2
    const haloR = (drag.hovered ? 29 : 25) + haloPulse
    ctx.save()
    ctx.strokeStyle = drag.hovered ? MODE_COLOR[mode] : '#ffffffaa'
    ctx.lineWidth = drag.hovered ? 2.4 : 1.6
    ctx.setLineDash(drag.hovered ? [] : [5, 4])
    ctx.beginPath(); ctx.arc(ox - 4, oy - 6, haloR, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  // Guía de puntería y huella de dispersión del lote.
  const ft = flightTime(mode, effAngle, power)
  const remainingSec = Math.max(0, ROUND_SECONDS - s.roundTime)
  const arrivesInTime = ft <= remainingSec

  if (preview) {
    const pts = trajectory(mode, angle, power, mode === 'plane' ? 0.06 : 0.08)
    let hit: { x: number; y: number } | null = null
    const stepStride = mode === 'ship' ? 3 : mode === 'plane' ? 1 : 2
    const trailTint = drag.active && drag.armed ? MODE_COLOR[mode] : '#ffffff'
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      if (hillBlocks(r, p.x, p.y)) { hit = p; break }
      if (i % stepStride) continue
      const k = 1 - i / pts.length
      ctx.globalAlpha = drag.active ? 0.42 + 0.55 * k : 0.28 + 0.48 * k
      ctx.fillStyle = trailTint
      const dotR = mode === 'ship' ? 1.8 + 1.8 * k : mode === 'plane' ? 1 + 1.4 * k : 1.2 + 1.6 * k
      ctx.beginPath(); ctx.arc(px(p.x), py(p.y), dotR, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    if (hit) {
      const hx0 = px(hit.x), hy0 = py(hit.y)
      ctx.strokeStyle = '#ff4f6d'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(hx0 - 5, hy0 - 5); ctx.lineTo(hx0 + 5, hy0 + 5); ctx.moveTo(hx0 + 5, hy0 - 5); ctx.lineTo(hx0 - 5, hy0 + 5); ctx.stroke()
      ctx.lineCap = 'butt'
    } else {
      const lxWorld = landingX(mode, angle, power)
      const lx = px(lxWorld)
      const onTarget = Math.abs(lxWorld - center) <= ZONE_HALF
      const spreadPx = batchSpreadHalf(mode) * SCALE
      const spreadY = zy - 4
      if (lx + spreadPx >= -12 && lx - spreadPx <= W + 12) {
        ctx.save()
        ctx.strokeStyle = onTarget ? '#4fe08a' : '#ff9f43'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(lx - spreadPx, spreadY - 4); ctx.lineTo(lx - spreadPx, spreadY)
        ctx.lineTo(lx + spreadPx, spreadY); ctx.lineTo(lx + spreadPx, spreadY - 4)
        ctx.stroke()
        for (let bi = 0; bi < def.boxes; bi++) {
          const bxWorld = lxWorld + (bi - (def.boxes - 1) / 2) * def.spacing
          const bx = px(bxWorld)
          const boxOk = Math.abs(bxWorld - center) <= ZONE_HALF
          ctx.fillStyle = boxOk ? '#4fe08a' : '#ff8b8b'
          ctx.fillRect(bx - 1.5, spreadY - 3, 3, 4)
        }
        ctx.restore()
      }
      ctx.fillStyle = onTarget ? '#27c96f' : '#ff4f6d'
      ctx.beginPath(); ctx.arc(lx, py(0) - 16, 4.2, Math.PI, 0); ctx.lineTo(lx, py(0) - 5); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, py(0) - 16, 1.6, 0, Math.PI * 2); ctx.fill()
    }
  }

  // Arco de guía angular (mientras se apunta activamente con el mouse).
  if (drag.active && drag.armed) {
    ctx.save()
    ctx.strokeStyle = `${MODE_COLOR[mode]}88`
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    const minRad = (profile.minAngle * Math.PI) / 180
    const maxRad = (profile.maxAngle * Math.PI) / 180
    if (profile.angleLocked === null) {
      // Arco posterior abajo-izquierda mostrando los límites reales del modo.
      ctx.beginPath()
      ctx.arc(ox, oy, 26, Math.PI - maxRad, Math.PI - minRad)
      ctx.stroke()
    } else {
      // Riel fijo a 45° hacia atrás y abajo con muescas graduadas.
      const bx = -Math.SQRT1_2, by = Math.SQRT1_2
      ctx.setLineDash([])
      ctx.strokeStyle = '#9adbd4'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + bx * profile.pullVisualMax, oy + by * profile.pullVisualMax); ctx.stroke()
      for (const q of [0.25, 0.5, 0.75, 1]) {
        const mx = ox + bx * (10 + q * (profile.pullVisualMax - 10))
        const my = oy + by * (10 + q * (profile.pullVisualMax - 10))
        ctx.strokeStyle = q <= drag.tension ? '#2ec4b6' : '#ffffff88'
        ctx.lineWidth = 1.6
        ctx.beginPath(); ctx.moveTo(mx - 3, my - 3); ctx.lineTo(mx + 3, my + 3); ctx.stroke()
      }
    }
    ctx.restore()
  }

  // Lanzador: vehículo del modo y mecanismo visual diferenciado.
  drawVehicle(ctx, mode, ox - 14, py(0) + 2, 0.95)
  ctx.fillStyle = '#2a3242'; roundRect(ctx, ox - 6, oy - 2, 12, 9, 2); ctx.fill()
  const len = 22 + power * 6

  if (drag.active) {
    if (!drag.armed) {
      ctx.save()
      ctx.strokeStyle = '#ffffff88'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.arc(ox, oy, 16, 0, Math.PI * 2); ctx.stroke()
      if (drag.pointer) {
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(drag.pointer.x, drag.pointer.y); ctx.stroke()
      }
      ctx.restore()
    } else if (drag.pull) {
      const hx0 = drag.pull.x, hy0 = drag.pull.y
      ctx.save()
      if (mode === 'road') {
        ctx.strokeStyle = '#5c3314'
        ctx.lineWidth = 4
        ctx.beginPath(); ctx.moveTo(ox - 4, oy - 4); ctx.lineTo(hx0, hy0); ctx.lineTo(ox + 4, oy - 2); ctx.stroke()
        ctx.strokeStyle = MODE_COLOR.road
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(ox - 4, oy - 4); ctx.lineTo(hx0, hy0); ctx.lineTo(ox + 4, oy - 2); ctx.stroke()
        crate(ctx, hx0 - 3, hy0 + 2, 'road', -0.2, 6.5)
        crate(ctx, hx0 + 3, hy0 - 1, 'road', 0.15, 6.5)
      } else if (mode === 'rail') {
        ctx.strokeStyle = '#178077'
        ctx.lineWidth = 4.5
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(hx0, hy0); ctx.stroke()
        ctx.strokeStyle = '#2ec4b6'
        ctx.lineWidth = 2.2
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(hx0, hy0); ctx.stroke()
        if (drag.offAxisWarning && drag.pointer) {
          ctx.strokeStyle = '#ffd84daa'
          ctx.lineWidth = 1.3
          ctx.setLineDash([3, 3])
          ctx.beginPath(); ctx.moveTo(hx0, hy0); ctx.lineTo(drag.pointer.x, drag.pointer.y); ctx.stroke()
          ctx.setLineDash([])
        }
        ctx.fillStyle = '#134e48'
        roundRect(ctx, hx0 - 7, hy0 - 5, 14, 10, 3); ctx.fill()
        ctx.strokeStyle = '#9ff5eb'; ctx.lineWidth = 1.5; ctx.stroke()
        crate(ctx, hx0, hy0 - 6, 'rail', -Math.PI / 4, 7)
      } else if (mode === 'ship') {
        // Cabo náutico con curvatura natural según tensión.
        const sag = (1 - drag.tension) * 14
        const mx = (ox + hx0) / 2
        const my = (oy + hy0) / 2 + sag
        ctx.strokeStyle = '#1d55b8'
        ctx.lineWidth = 5
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(mx, my, hx0, hy0); ctx.stroke()
        ctx.strokeStyle = '#8ec0ff'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 4])
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(mx, my, hx0, hy0); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#1d55b8'; ctx.strokeStyle = '#dbeaff'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(hx0, hy0, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        crate(ctx, hx0, hy0 - 3, 'ship', 0, 7.5)
      } else {
        // Avión: vector aerodinámico con chevrons propulsores.
        const angPull = Math.atan2(hy0 - oy, hx0 - ox)
        ctx.strokeStyle = '#ff4f6d'
        ctx.lineWidth = 2.5
        ctx.setLineDash([4, 3])
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(hx0, hy0); ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = '#ff4f6d'
        for (const k of [0.35, 0.65, 0.92]) {
          const cx0 = hx0 + (ox - hx0) * k, cy0 = hy0 + (oy - hy0) * k
          ctx.save(); ctx.translate(cx0, cy0); ctx.rotate(angPull + Math.PI)
          ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -4); ctx.lineTo(-1, 0); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fill()
          ctx.restore()
        }
        ctx.strokeStyle = `rgba(255,79,109,${0.35 + drag.tension * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(hx0, hy0, 7 + drag.tension * 5, 0, Math.PI * 2); ctx.stroke()
        crate(ctx, hx0, hy0, 'plane', a * -0.5, 7)
      }
      if (drag.atMax) {
        ctx.strokeStyle = '#ffd84d'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(hx0, hy0, 10, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.restore()
    }
  }

  ctx.strokeStyle = MODE_DARK[mode]; ctx.lineWidth = 7; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * len, oy - Math.sin(a) * len); ctx.stroke()
  ctx.strokeStyle = MODE_COLOR[mode]; ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * len, oy - Math.sin(a) * len); ctx.stroke()
  ctx.lineCap = 'butt'
  ctx.fillStyle = '#1d2430'; ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI * 2); ctx.fill()
  if (drag.hovered || drag.active) {
    ctx.fillStyle = MODE_COLOR[mode]
    ctx.beginPath(); ctx.arc(ox + Math.cos(a) * len, oy - Math.sin(a) * len, 3.6, 0, Math.PI * 2); ctx.fill()
  }

  // Etiquetas de telemetría contextual sobre el lanzador (sin saturar la intro).
  if (preview && s.status === 'playing') {
    if (drag.active) {
      if (!drag.armed) {
        pill(ctx, ox + 78, oy - 56, 'Arrastra ↙ · Suelta aquí para cancelar', '#1d2430eb', '#ffffff55', '#e4ecf5')
      } else {
        const angLabel = profile.angleLocked !== null ? `${profile.angleLocked}° FIJO` : `${Math.round(effAngle)}°`
        const pwrLabel = `${Math.round(power * 100)}%${drag.atMax ? ' MÁX' : ''}`
        const timeLabel = `⏱ ${ft.toFixed(1)} s`
        const timeColor = arrivesInTime ? '#fbf7ec' : '#ff8b8b'
        pill(
          ctx,
          ox + 86,
          oy - 68,
          `${angLabel} · ${pwrLabel} · ${timeLabel}`,
          '#0f2320f0',
          drag.atMax ? '#ffd84d' : MODE_COLOR[mode],
          timeColor,
        )
        if (drag.offAxisWarning && mode === 'rail') {
          pill(ctx, ox + 86, oy - 46, 'VÍA FIJA A 45° · solo fuerza', '#103531ee', '#2ec4b6', '#aef7ee')
        } else if (mode === 'plane') {
          pill(ctx, ox + 86, oy - 46, `+${batchEmissionsTonnes('plane', r).toFixed(1)} t CO₂e por lote`, '#3b121aee', '#ff4f6d', '#ffd4da')
        }
      }
    } else if (drag.hovered || drag.showIntroCue) {
      pill(
        ctx,
        ox + 68,
        oy - 54,
        drag.hovered ? `${profile.label} · arrastra ↙` : 'Arrastra desde aquí ↙',
        '#0f2320e6',
        MODE_COLOR[mode],
        '#fbf7ec',
      )
    }
  }

  // Cajas en vuelo.
  for (const b of s.boxes) crate(ctx, px(b.x), py(b.y), b.mode, v.reduceMotion ? 0 : b.x * 0.35 + b.id)

  fx.draw(ctx)

  // Tensión: últimos segundos de la ruta.
  const left = ROUND_SECONDS - s.roundTime
  if (s.status === 'playing' && left <= 5) vignette(ctx, W, H, '#ff3b3b', 0.35 + 0.25 * Math.sin(v.t * 8))
  ctx.restore()
}

export { MODES }
