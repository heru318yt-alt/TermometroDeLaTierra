import { PageIntro } from '../../components/PageIntro'
import { periods } from './catalog'
export { periods } from './catalog'
export function HistoryPage() {
  return <div className="page-width inner-page"><PageIntro number="02" title="El clima, a través del tiempo.">Seis períodos para organizar un recorrido educativo entre 1970 y 2025.</PageIntro><p className="notice">Estructura editorial preparada. Los contenidos históricos y sus fuentes se incorporarán en una siguiente etapa.</p><div className="history-list">{periods.map((period, index) => <section className="history-period" key={period}><span className="period-number">0{index + 1}</span><div><h2>{period}</h2><p>Espacio para contexto histórico, actividades humanas y preguntas de aprendizaje.</p><div className="topic-tags"><span>Contexto</span><span>Hitos y fuentes</span><span>Reflexión</span></div></div><span className="badge">Contenido pendiente</span></section>)}</div></div>
}
