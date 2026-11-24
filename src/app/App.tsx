import { Link, Route, Routes } from 'react-router'
import { Layout } from '../components/Layout'
import { AboutPage } from '../features/about/AboutPage'
import { ExplorerPage } from '../features/explorer/ExplorerPage'
import { FactorsPage } from '../features/factors/FactorsPage'
import { AchievementsPage } from '../features/games/AchievementsPage'
import { GamesPage } from '../features/games/GamesPage'
import { HistoryPage } from '../features/history/HistoryPage'
import { HomePage } from '../features/home/HomePage'
import { SourcesPage } from '../features/sources/SourcesPage'
import { TimelinePage } from '../features/timeline/TimelinePage'

export function App() {
  return <Routes>
    <Route element={<Layout />}>
      <Route index element={<HomePage />} />
      <Route path="explorador" element={<ExplorerPage />} />
      <Route path="linea-del-tiempo" element={<TimelinePage />} />
      <Route path="historia" element={<HistoryPage />} />
      <Route path="factores" element={<FactorsPage />} />
      <Route path="minijuegos" element={<GamesPage />} />
      <Route path="logros" element={<AchievementsPage />} />
      <Route path="fuentes" element={<SourcesPage />} />
      <Route path="acerca" element={<AboutPage />} />
      <Route path="*" element={<div className="not-found"><p className="eyebrow">ERROR 404 · FUERA DE RUTA</p><h1>Esta coordenada no existe.</h1><p>La dirección no pertenece al recorrido del observatorio. Vuelve al inicio o abre el explorador para retomar la serie.</p><div className="not-found-links"><Link className="button" to="/">Volver al inicio ↗</Link><Link className="text-link" to="/explorador">Ir al explorador →</Link></div></div>} />
    </Route>
  </Routes>
}
