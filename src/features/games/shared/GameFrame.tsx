import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import './game-shell.css'

type FullscreenMode = 'off' | 'native' | 'expanded'

const FullscreenContext = createContext(false)

/** true cuando el minijuego ocupa toda la pantalla (API nativa o modo expandido). */
export function useIsFullscreen() { return useContext(FullscreenContext) }

function nativeSupported(el: HTMLElement | null): boolean {
  return !!el && typeof el.requestFullscreen === 'function' && typeof document !== 'undefined' && document.fullscreenEnabled !== false
}

/**
 * Marco común de los minijuegos: barra con el título y el botón de pantalla
 * completa. Usa la Fullscreen API del navegador y, si no está disponible
 * (p. ej. iPhone), un modo expandido a 100vw × 100dvh que se cierra con Esc.
 */
export function GameFrame({ world, title, children }: { world: string; title: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<FullscreenMode>('off')
  const active = mode !== 'off'

  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement === root.current) setMode('native')
      else setMode(current => current === 'native' ? 'off' : current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Modo expandido: Esc para salir y sin scroll de la página de fondo.
  useEffect(() => {
    if (mode !== 'expanded') return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMode('off') }
    const html = document.documentElement, previous = html.style.overflow
    html.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); html.style.overflow = previous }
  }, [mode])

  // Al salir, el foco vuelve al botón para no perder la posición del teclado.
  const button = useRef<HTMLButtonElement>(null)

  const toggle = useCallback(async () => {
    const el = root.current
    if (active) {
      if (mode === 'native' && document.fullscreenElement) await document.exitFullscreen().catch(() => {})
      setMode('off')
      window.requestAnimationFrame(() => button.current?.focus({ preventScroll: true }))
      return
    }
    if (nativeSupported(el)) {
      try { await el!.requestFullscreen({ navigationUI: 'hide' }); setMode('native'); return } catch { /* cae al modo expandido */ }
    }
    setMode('expanded')
  }, [active, mode])

  return <FullscreenContext.Provider value={active}>
    <div ref={root} className={`gf-root gf-${world}${active ? ' is-fullscreen' : ''}${mode === 'expanded' ? ' is-expanded' : ''}`}
      role={mode === 'expanded' ? 'dialog' : undefined} aria-modal={mode === 'expanded' ? true : undefined} aria-label={mode === 'expanded' ? `${title} en pantalla completa` : undefined}>
      <div className="gf-bar">
        <span className="gf-title"><i aria-hidden="true" />{title}</span>
        <button ref={button} type="button" className="gf-fullscreen" onClick={toggle} aria-pressed={active}
          aria-label={active ? 'Salir de pantalla completa' : 'Pantalla completa'} title={active ? 'Salir (Esc)' : 'Pantalla completa'}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{active
            ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
            : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}</svg>
          <span>{active ? 'Salir' : 'Pantalla completa'}</span>{active && <kbd>Esc</kbd>}
        </button>
      </div>
      <div className="gf-body">{children}</div>
    </div>
  </FullscreenContext.Provider>
}
