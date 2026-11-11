import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { AudioProvider } from '../features/audio/AudioProvider'
import { AudioControls } from './AudioControls'

export const navigation = [
  { path: '/', label: 'Inicio', short: 'Inicio', number: '00', title: 'Inicio' },
  { path: '/explorador', label: 'Explorador climático', short: 'Explorador', number: '01', title: 'Explorador climático' },
  { path: '/linea-del-tiempo', label: 'Línea del tiempo', short: 'Línea de tiempo', number: '02', title: 'Línea del tiempo' },
  { path: '/historia', label: 'Historia del clima', short: 'Historia', number: '03', title: 'Historia del clima' },
  { path: '/factores', label: 'Factores del cambio climático', short: 'Factores', number: '04', title: 'Factores del cambio climático' },
  { path: '/minijuegos', label: 'Minijuegos', short: 'Minijuegos', number: '05', title: 'Minijuegos' },
  { path: '/fuentes', label: 'Fuentes y metodología', short: 'Fuentes', number: '06', title: 'Fuentes y metodología' },
]

const pageTitles: Record<string, string> = {
  '/acerca': 'Acerca del proyecto',
}

export function Layout() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const nav = useRef<HTMLElement>(null)
  const main = useRef<HTMLElement>(null)
  const location = useLocation()
  const previousPath = useRef(location.pathname)

  useEffect(() => {
    setOpen(false)
    const title = navigation.find(item => item.path === location.pathname)?.title ?? pageTitles[location.pathname] ?? 'Página no encontrada'
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

  return <AudioProvider>
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    {open && <div className="menu-backdrop" aria-hidden="true" onClick={() => { setOpen(false); trigger.current?.focus() }} />}
    <header className={`site-header${open ? ' menu-open' : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Termómetro de la Tierra, ir al inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="brand-type"><strong>Termómetro</strong><em>de la Tierra</em></span>
          <span className="brand-meta">Observatorio climático</span>
        </Link>

        <nav className="chapter-nav" aria-label="Recorrido principal">
          {navigation.map(item => <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => isActive ? 'is-active' : undefined}>
            <span className="chapter-number">{item.number}</span><span>{item.short}</span>
          </NavLink>)}
        </nav>

        <div className="header-tools">
          <AudioControls />
          <button ref={trigger} className="menu-button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="navigation" onClick={() => setOpen(!open)}>
            <span className="menu-lines" aria-hidden="true"><i /><i /></span>
            <span className="menu-word">Índice</span>
          </button>
        </div>
      </div>

      {open && <nav ref={nav} id="navigation" className="menu-panel" aria-label="Navegación principal" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) setOpen(false) }}>
        <div className="menu-panel-head"><span>RECORRIDO DEL OBSERVATORIO</span><span>07 CAPÍTULOS</span></div>
        {navigation.map(item => <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setOpen(false)}>
          <span className="menu-number">{item.number}</span>
          <span className="menu-link-copy"><strong>{item.label}</strong><small>{item.number === '00' ? 'El planeta como punto de partida' : 'Abrir capítulo'}</small></span>
          <span aria-hidden="true">↗</span>
        </NavLink>)}
        <div className="menu-panel-foot"><Link to="/acerca" onClick={() => setOpen(false)}>Acerca del proyecto ↗</Link><span>NASA GISTEMP v4 · 1951–1980</span></div>
      </nav>}
    </header>

    <main id="contenido" ref={main} tabIndex={-1}><div className="route-stage" key={location.pathname}><Outlet /></div></main>

    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-statement">
          <span className="footer-kicker">TERMÓMETRO DE LA TIERRA · OBSERVATORIO CLIMÁTICO</span>
          <p>No hace falta memorizar una cifra.<br /><em>Hace falta entender la historia que hay detrás.</em></p>
        </div>
        <div className="footer-index">
          <span>RECORRIDO</span>
          {navigation.map(item => <Link key={item.path} to={item.path}><span>{item.number}</span>{item.label}</Link>)}
        </div>
        <div className="footer-meta">
          <p>Proyecto universitario de <strong>Arquitectura de Sistemas Multimedia</strong>.</p>
          <p>Datos: <a href="https://data.giss.nasa.gov/gistemp/" target="_blank" rel="noreferrer">NASA GISTEMP v4 ↗</a></p>
          <p><Link to="/acerca">Acerca del proyecto</Link> · <Link to="/fuentes">Metodología</Link></p>
          <small>Las anomalías se expresan respecto a 1951–1980. No son temperaturas absolutas.</small>
        </div>
      </div>
    </footer>
  </AudioProvider>
}
