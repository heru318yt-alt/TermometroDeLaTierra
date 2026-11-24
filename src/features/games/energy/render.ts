/**
 * Mantén la red · dibujo del escenario en canvas (coordenadas lógicas 640×360).
 * Fichas redondas con volumen y un icono reconocible por recurso; ciudad en
 * dos planos cuyas ventanas se encienden según la oferta.
 */
import { FxLayer, hash, roundRect, vignette } from '../shared/canvas'
import { CONFIG, safeZone, type GameState, type ResourceKind } from './engine'
import { GLYPH } from './sprites'

export const W = 640
export const H = 360

export const KIND_COLOR: Record<ResourceKind, { light: string; dark: string; accent: string }> = {
  carbon: { light: '#6b6e7d', dark: '#22232b', accent: '#ff7a2f' },
  gas: { light: '#6cc0ff', dark: '#1b56c2', accent: '#bdf0ff' },
  renewable: { light: '#ffd84d', dark: '#f08a00', accent: '#fff6c9' },
  storage: { light: '#79f2a4', dark: '#119447', accent: '#eaffef' },
}

interface Building { x: number; w: number; h: number; antenna: boolean }
function skyline(seed: number, minH: number, maxH: number, gap: number): Building[] {
  const out: Building[] = []
  let x = -6, i = 0
  while (x < W + 10) {
    const w = 26 + Math.round(hash(seed + i) * 34), h = minH + Math.round(hash(seed + i * 3.1) * (maxH - minH))
    out.push({ x, w, h, antenna: hash(seed + i * 7.7) > 0.72 }); x += w + gap; i++
  }
  return out
}
const FAR = skyline(11, 46, 104, 3)
const NEAR = skyline(47, 28, 74, 5)
const STARS = Array.from({ length: 56 }, (_, i) => ({ x: hash(i * 2.3) * W, y: hash(i * 5.9) * 170, r: 0.6 + hash(i * 9.1) * 1.1, p: hash(i) * 6 }))

/** Icono de cada recurso dentro de una ficha de radio r. */
export function drawIcon(ctx: CanvasRenderingContext2D, kind: ResourceKind, r: number, t: number) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  if (kind === 'carbon') {
    const pts: [number, number][] = [[-0.55, 0.18], [-0.32, -0.36], [0.1, -0.5], [0.52, -0.18], [0.55, 0.3], [0.1, 0.5], [-0.42, 0.44]]
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x * r, y * r) : ctx.moveTo(x * r, y * r)); ctx.closePath()
    ctx.fillStyle = '#16171d'; ctx.fill(); ctx.strokeStyle = '#b9bdcb'; ctx.lineWidth = r * 0.09; ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-0.32 * r, -0.36 * r); ctx.lineTo(0.02 * r, 0.02 * r); ctx.lineTo(0.52 * r, -0.18 * r); ctx.moveTo(0.02 * r, 0.02 * r); ctx.lineTo(0.1 * r, 0.5 * r)
    ctx.strokeStyle = '#6d7180'; ctx.lineWidth = r * 0.06; ctx.stroke()
    const glow = 0.55 + 0.45 * Math.sin(t * 6)
    ctx.fillStyle = `rgba(255,122,47,${0.65 + 0.35 * glow})`; ctx.beginPath(); ctx.arc(-0.18 * r, 0.22 * r, r * 0.11, 0, Math.PI * 2); ctx.fill()
  } else if (kind === 'gas') {
    const flame = (s: number, dy: number) => {
      ctx.beginPath(); ctx.moveTo(0, (-0.62 + dy) * r * s)
      ctx.bezierCurveTo(0.52 * r * s, (-0.08 + dy) * r * s, 0.5 * r * s, (0.5 + dy) * r * s, 0, (0.52 + dy) * r * s)
      ctx.bezierCurveTo(-0.5 * r * s, (0.5 + dy) * r * s, -0.52 * r * s, (-0.08 + dy) * r * s, 0, (-0.62 + dy) * r * s)
      ctx.closePath()
    }
    flame(1, 0); ctx.fillStyle = '#f2fbff'; ctx.fill()
    flame(0.55, 0.32); ctx.fillStyle = '#2b8cff'; ctx.fill()
  } else if (kind === 'renewable') {
    ctx.save(); ctx.rotate(t * 0.9)
    ctx.strokeStyle = '#fffbe8'; ctx.lineWidth = r * 0.13
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.46, Math.sin(a) * r * 0.46); ctx.lineTo(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66); ctx.stroke() }
    ctx.restore()
    ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fill()
  } else {
    roundRect(ctx, -0.48 * r, -0.3 * r, 0.86 * r, 0.6 * r, r * 0.12)
    ctx.strokeStyle = '#f2fff5'; ctx.lineWidth = r * 0.11; ctx.stroke()
    ctx.fillStyle = '#f2fff5'; ctx.fillRect(0.4 * r, -0.13 * r, 0.12 * r, 0.26 * r)
    ctx.beginPath(); ctx.moveTo(0.02 * r, -0.24 * r); ctx.lineTo(-0.2 * r, 0.04 * r); ctx.lineTo(-0.02 * r, 0.04 * r); ctx.lineTo(-0.1 * r, 0.25 * r); ctx.lineTo(0.16 * r, -0.06 * r); ctx.lineTo(-0.02 * r, -0.06 * r); ctx.closePath()
    ctx.fillStyle = '#ffe14d'; ctx.fill()
  }
}

export function drawToken(ctx: CanvasRenderingContext2D, kind: ResourceKind, x: number, y: number, r: number, t: number, glyph = true) {
  const c = KIND_COLOR[kind]
  ctx.save(); ctx.translate(x, y)
  ctx.fillStyle = '#0006'; ctx.beginPath(); ctx.ellipse(1.5, r * 0.95, r * 0.8, r * 0.22, 0, 0, Math.PI * 2); ctx.fill()
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r)
  g.addColorStop(0, c.light); g.addColorStop(1, c.dark)
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1.5; ctx.stroke()
  ctx.fillStyle = '#ffffff30'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.5, r * 0.45, r * 0.22, -0.5, 0, Math.PI * 2); ctx.fill()
  drawIcon(ctx, kind, r, t)
  if (glyph) {
    ctx.fillStyle = '#0b1424'; ctx.beginPath(); ctx.arc(r * 0.72, r * 0.72, r * 0.36, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = c.light; ctx.lineWidth = 1.2; ctx.stroke()
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(r * 0.48)}px ui-monospace, Consolas, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(GLYPH[kind], r * 0.72, r * 0.75)
  }
  ctx.restore()
}

export interface View { t: number; bounce: number; flash: ResourceKind | null; flashT: number; reduceMotion: boolean }

export function drawScene(ctx: CanvasRenderingContext2D, s: GameState, fx: FxLayer, v: View) {
  const lit = Math.max(0, Math.min(1, s.supply / 100))
  const t = v.reduceMotion ? 0 : v.t
  const shake = fx.shake > 0 && !v.reduceMotion ? (Math.random() - 0.5) * fx.shake * 8 : 0
  ctx.save(); ctx.translate(shake, 0)

  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0, '#081120'); sky.addColorStop(0.62, '#1a3258'); sky.addColorStop(1, '#2c4a78')
  ctx.fillStyle = sky; ctx.fillRect(-10, 0, W + 20, H)
  const horizon = ctx.createLinearGradient(0, 190, 0, H)
  horizon.addColorStop(0, 'transparent'); horizon.addColorStop(1, `rgba(255,150,80,${0.12 + 0.3 * lit})`)
  ctx.fillStyle = horizon; ctx.fillRect(-10, 190, W + 20, H - 190)

  for (const st of STARS) { ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 1.6 + st.p); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill() }
  ctx.globalAlpha = 1

  // Luna creciente con halo.
  const halo = ctx.createRadialGradient(566, 52, 8, 566, 52, 54); halo.addColorStop(0, '#fff3c955'); halo.addColorStop(1, 'transparent')
  ctx.fillStyle = halo; ctx.fillRect(500, 0, 140, 120)
  ctx.save(); ctx.beginPath(); ctx.rect(530, 20, 80, 70); ctx.arc(575, 46, 15, 0, Math.PI * 2); ctx.clip('evenodd')
  ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.arc(566, 52, 17, 0, Math.PI * 2); ctx.fill(); ctx.restore()

  // Plano lejano.
  ctx.fillStyle = '#1b3157'
  for (const b of FAR) { roundRect(ctx, b.x, H - 26 - b.h, b.w, b.h + 26, 3); ctx.fill() }
  // Plano cercano con ventanas.
  NEAR.forEach((b, bi) => {
    const top = H - 20 - b.h
    const body = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0); body.addColorStop(0, '#0f1d33'); body.addColorStop(1, '#0a1526')
    ctx.fillStyle = body; roundRect(ctx, b.x, top, b.w, b.h + 20, 3); ctx.fill()
    if (b.antenna) { ctx.fillStyle = '#0f1d33'; ctx.fillRect(b.x + b.w / 2 - 1, top - 12, 2, 12); ctx.fillStyle = Math.sin(t * 3 + bi) > 0 ? '#ff5d5d' : '#7a2a2a'; ctx.beginPath(); ctx.arc(b.x + b.w / 2, top - 13, 2, 0, Math.PI * 2); ctx.fill() }
    for (let wy = top + 7; wy < H - 26; wy += 9) {
      for (let wx = b.x + 5; wx < b.x + b.w - 6; wx += 8) {
        const on = hash(wx * 0.37 + wy * 1.91) < lit
        if (on) { ctx.fillStyle = '#ffcf5c33'; ctx.fillRect(wx - 1.5, wy - 1.5, 7, 7); ctx.fillStyle = '#ffd66b' } else ctx.fillStyle = '#18294a'
        roundRect(ctx, wx, wy, 4, 4, 1); ctx.fill()
      }
    }
  })
  // Calle.
  ctx.fillStyle = '#060d18'; ctx.fillRect(-10, H - 20, W + 20, 20)
  ctx.fillStyle = '#ffd66b55'
  for (let x = ((-t * 40) % 40) - 40; x < W; x += 40) ctx.fillRect(x, H - 11, 18, 2)

  // Riel del colector.
  const cy = CONFIG.containerY * H
  ctx.fillStyle = '#2f4e7a'; ctx.fillRect(-10, cy + 30, W + 20, 3)
  ctx.fillStyle = '#5b82b8'; ctx.fillRect(-10, cy + 30, W + 20, 1)

  // Recursos que caen (con estela).
  for (const item of s.items) {
    const x = item.x * W, y = item.y * H
    const trail = ctx.createLinearGradient(0, y - 46, 0, y)
    trail.addColorStop(0, 'transparent'); trail.addColorStop(1, KIND_COLOR[item.kind].light + '66')
    ctx.fillStyle = trail; ctx.fillRect(x - 5, y - 46, 10, 40)
    drawToken(ctx, item.kind, x, y, 16, t + item.id)
  }

  // Colector.
  const cx = s.containerX * W, cw = CONFIG.containerHalf * W
  const squash = 1 - v.bounce * 0.18
  if (v.flash && v.flashT > 0) {
    const glow = ctx.createRadialGradient(cx, cy + 8, 4, cx, cy + 8, cw * 1.6)
    glow.addColorStop(0, KIND_COLOR[v.flash].light + 'aa'); glow.addColorStop(1, 'transparent')
    ctx.globalAlpha = Math.min(1, v.flashT * 2.5); ctx.fillStyle = glow; ctx.fillRect(cx - cw * 2, cy - cw, cw * 4, cw * 2.4); ctx.globalAlpha = 1
  }
  ctx.save(); ctx.translate(cx, cy + 26); ctx.scale(1 + v.bounce * 0.08, squash); ctx.translate(-cx, -(cy + 26))
  ctx.fillStyle = '#0007'; ctx.beginPath(); ctx.ellipse(cx, cy + 30, cw * 0.9, 4, 0, 0, Math.PI * 2); ctx.fill()
  const body = ctx.createLinearGradient(0, cy, 0, cy + 24); body.addColorStop(0, '#f6b26b'); body.addColorStop(1, '#a9542a')
  ctx.beginPath(); ctx.moveTo(cx - cw, cy); ctx.lineTo(cx + cw, cy); ctx.lineTo(cx + cw - 11, cy + 24); ctx.lineTo(cx - cw + 11, cy + 24); ctx.closePath()
  ctx.fillStyle = body; ctx.fill()
  ctx.fillStyle = '#ffe3c2'; roundRect(ctx, cx - cw - 3, cy - 4, cw * 2 + 6, 6, 3); ctx.fill()
  ctx.fillStyle = '#7e3a1b'; ctx.beginPath(); ctx.arc(cx, cy + 8, 6, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.moveTo(cx + 1, cy + 3.5); ctx.lineTo(cx - 3, cy + 9); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx - 1.5, cy + 12.5); ctx.lineTo(cx + 3, cy + 7.5); ctx.lineTo(cx, cy + 7.5); ctx.closePath(); ctx.fill()
  // Celdas de almacenamiento.
  const cells = 6, filled = (s.stored / CONFIG.storageCap) * cells
  for (let i = 0; i < cells; i++) {
    const x0 = cx - cw + 14 + i * ((cw * 2 - 28) / cells)
    const k = Math.max(0, Math.min(1, filled - i))
    ctx.fillStyle = '#0b1424'; roundRect(ctx, x0, cy + 16, (cw * 2 - 28) / cells - 2, 5, 2); ctx.fill()
    if (k > 0) { ctx.fillStyle = '#4fe08a'; roundRect(ctx, x0, cy + 16, ((cw * 2 - 28) / cells - 2) * k, 5, 2); ctx.fill() }
  }
  ctx.restore()

  fx.draw(ctx)

  // Alerta: oferta fuera de la zona segura.
  const zone = safeZone(s.t)
  if (s.status === 'playing') {
    if (s.supply < zone.low) vignette(ctx, W, H, '#ff2d2d', 0.55 + 0.25 * Math.sin(v.t * 7))
    else if (s.supply > zone.high) vignette(ctx, W, H, '#ffae2d', 0.4)
  }
  if (s.status !== 'playing') { ctx.fillStyle = '#000000a8'; ctx.fillRect(-10, 0, W + 20, H) }
  ctx.restore()
}
