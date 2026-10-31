import { Link, Route, Routes } from 'react-router'
import { Layout } from '../components/Layout'
import { HomePage } from '../features/home/HomePage'
import { ExplorerPage } from '../features/explorer/ExplorerPage'
import { HistoryPage } from '../features/history/HistoryPage'
import { GamesPage } from '../features/games/GamesPage'
import { AboutPage } from '../features/about/AboutPage'

export function App() {
  return <Routes><Route element={<Layout />}><Route index element={<HomePage />} /><Route path="explorador" element={<ExplorerPage />} /><Route path="historia" element={<HistoryPage />} /><Route path="minijuegos" element={<GamesPage />} /><Route path="acerca" element={<AboutPage />} /><Route path="*" element={<div className="page-width inner-page"><p className="eyebrow">404</p><h1>Página no encontrada</h1><p>Esta dirección no pertenece al recorrido.</p><Link className="button" to="/">Volver al inicio ↗</Link></div>} /></Route></Routes>
}
