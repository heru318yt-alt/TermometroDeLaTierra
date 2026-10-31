import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'

const navigation = [['/', 'Inicio'], ['/explorador', 'Explorador climático'], ['/historia', 'Historia'], ['/minijuegos', 'Minijuegos'], ['/acerca', 'Acerca del proyecto']]

export function Layout() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const nav = useRef<HTMLElement>(null)
  const main = useRef<HTMLElement>(null)
  const location = useLocation()
  const previousPath = useRef(location.pathname)
  useEffect(() => {
    setOpen(false)
    const title = navigation.find(([path]) => path === location.pathname)?.[1] ?? 'Página no encontrada'
    document.title = `${title} · Termómetro de la Tierra`
    if (previousPath.current !== location.pathname) {
      main.current?.focus()
      window.scrollTo?.(0, 0)
      previousPath.current = location.pathname
    }
  }, [location.pathname])
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const close = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) {
        setOpen(false)
        if ((event.target as HTMLElement).classList?.contains('menu-backdrop')) {
          event.preventDefault()
          trigger.current?.focus()
        }
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  return <>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    {open && <div className="menu-backdrop" aria-hidden="true" onClick={() => { setOpen(false); trigger.current?.focus() }} />}
    <header className={`header${open ? ' menu-open' : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <div className="brand-group">
        <button ref={trigger} className="menu-button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}><span aria-hidden="true">{open ? '×' : '☰'}</span></button>
        <Link className="brand" to="/">Termómetro <span>de la Tierra<span className="brand-dot">.</span></span></Link>
      </div>
      <span className="header-note"><span className="small-dot" /> APRENDER PARA COMPRENDER</span>
      <nav ref={nav} id="navigation" aria-label="Navegación principal" hidden={!open} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) setOpen(false) }}>
        <span className="eyebrow">EXPLORA EL PROYECTO</span>
        {navigation.map(([path, label], index) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)}><span className="nav-number">0{index + 1}</span>{label}<span aria-hidden="true">↗</span></NavLink>)}
      </nav>
    </header>
    <main id="contenido" ref={main} tabIndex={-1}><Outlet /></main>
    <footer><Link to="/">Termómetro de la Tierra<span className="brand-dot">.</span></Link><span>Arquitectura de Sistemas Multimedia · Proyecto universitario</span><Link to="/acerca">Proyecto y fuentes ↗</Link></footer>
  </>
}
