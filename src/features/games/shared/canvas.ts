/** Utilidades de dibujo compartidas por los minijuegos con canvas. */

export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; kind: 'spark' | 'smoke' | 'ring' }
export interface TextFx { x: number; y: number; text: string; color: string; life: number; max: number; size: number }

export class FxLayer {
  particles: Particle[] = []
  texts: TextFx[] = []
  shake = 0

  burst(x: number, y: number, color: string, count = 10, speed = 90) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.5
      const v = speed * (0.5 + Math.random() * 0.7)
      this.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0, max: 0.45 + Math.random() * 0.3, color, size: 2 + Math.random() * 2.5, kind: 'spark' })
    }
  }

  smoke(x: number, y: number, count = 4, color = '#8b8f99') {
    for (let i = 0; i < count; i++) {
      this.particles.push({ x: x + (Math.random() - 0.5) * 14, y, vx: (Math.random() - 0.5) * 14, vy: -26 - Math.random() * 22, life: 0, max: 1.1 + Math.random() * 0.6, color, size: 6 + Math.random() * 5, kind: 'smoke' })
    }
  }

  ring(x: number, y: number, color: string, size = 26) {
    this.particles.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.5, color, size, kind: 'ring' })
  }

  text(x: number, y: number, text: string, color: string, size = 15) {
    this.texts.push({ x, y, text, color, life: 0, max: 1, size })
    if (this.texts.length > 12) this.texts.shift()
  }

  update(dt: number) {
    for (const p of this.particles) {
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt
      if (p.kind === 'spark') p.vy += 220 * dt
      else if (p.kind === 'smoke') { p.size += 10 * dt; p.vx *= 0.98 }
    }
    this.particles = this.particles.filter(p => p.life < p.max)
    for (const t of this.texts) { t.life += dt; t.y -= 34 * dt }
    this.texts = this.texts.filter(t => t.life < t.max)
    this.shake = Math.max(0, this.shake - dt * 2.5)
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const k = 1 - p.life / p.max
      ctx.globalAlpha = p.kind === 'smoke' ? k * 0.45 : k
      if (p.kind === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 3 * k
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.4 - k * 0.8), 0, Math.PI * 2); ctx.stroke()
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.kind === 'spark' ? k : 1), 0, Math.PI * 2); ctx.fill()
      }
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    for (const t of this.texts) {
      const k = t.life / t.max
      ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.55) / 0.45)
      ctx.font = `800 ${t.size}px ui-monospace, 'Cascadia Mono', Consolas, monospace`
      ctx.lineWidth = 4; ctx.strokeStyle = '#06101dcc'; ctx.strokeText(t.text, t.x, t.y)
      ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y)
    }
    ctx.globalAlpha = 1
  }

  clear() { this.particles = []; this.texts = []; this.shake = 0 }
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Pseudoaleatorio estable a partir de un entero (para decorados fijos). */
export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function vignette(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, strength: number) {
  if (strength <= 0) return
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.7)
  g.addColorStop(0, 'transparent'); g.addColorStop(1, color)
  ctx.globalAlpha = Math.min(1, strength)
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = 1
}
