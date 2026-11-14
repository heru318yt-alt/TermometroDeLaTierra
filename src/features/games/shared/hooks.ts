import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Mantiene la resolución interna del canvas igual a su tamaño en pantalla ×
 * devicePixelRatio, para que se vea nítido embebido y en pantalla completa.
 * El dibujo sigue usando coordenadas lógicas W×H: `prepare` fija la escala.
 */
export function useHiDpiCanvas(ref: RefObject<HTMLCanvasElement | null>, W: number, H: number, onResize?: () => void) {
  const resizeCb = useRef(onResize); resizeCb.current = onResize
  useEffect(() => {
    const canvas = ref.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const fit = () => {
      const dpr = Math.min(3, window.devicePixelRatio || 1)
      const w = Math.max(W, Math.round(canvas.clientWidth * dpr)), h = Math.max(H, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; resizeCb.current?.() }
    }
    const observer = new ResizeObserver(fit)
    observer.observe(canvas); fit()
    return () => observer.disconnect()
  }, [ref, W, H])
}

/** Ajusta la transformación para dibujar en coordenadas lógicas W×H. */
export function prepare(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.setTransform(ctx.canvas.width / W, 0, 0, ctx.canvas.height / H, 0, 0)
}

export const prefersReducedMotion = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Mejor puntaje por minijuego, guardado en el navegador (si está disponible). */
export function useBestScore(id: string): [number, (score: number) => boolean] {
  const key = `tt-best-${id}`
  const [best, setBest] = useState(() => {
    try { return Number(window.localStorage.getItem(key)) || 0 } catch { return 0 }
  })
  const bestRef = useRef(best)
  const submit = useCallback((score: number) => {
    if (score <= bestRef.current) return false
    bestRef.current = score; setBest(score)
    try { window.localStorage.setItem(key, String(score)) } catch { /* almacenamiento no disponible */ }
    return true
  }, [key])
  return [best, submit]
}

export interface Floater { id: number; text: string; x: number; y: number; tone: 'good' | 'bad' | 'combo' | 'info' }

/** Textos flotantes («+10», «racha ×2») para los juegos hechos con DOM. */
export function useFloaters(life = 1100) {
  const [items, setItems] = useState<Floater[]>([])
  const next = useRef(1)
  const push = useCallback((text: string, x: number, y: number, tone: Floater['tone'] = 'good') => {
    const id = next.current++
    setItems(list => [...list.slice(-8), { id, text, x, y, tone }])
    window.setTimeout(() => setItems(list => list.filter(f => f.id !== id)), life)
  }, [life])
  return { items, push }
}

/** Sacudida breve del contenedor (se omite con movimiento reducido). */
export function useShake(): [boolean, () => void] {
  const [on, setOn] = useState(false)
  const timer = useRef(0)
  const shake = useCallback(() => {
    if (prefersReducedMotion()) return
    window.clearTimeout(timer.current); setOn(false)
    window.requestAnimationFrame(() => { setOn(true); timer.current = window.setTimeout(() => setOn(false), 420) })
  }, [])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return [on, shake]
}
