export type GameModule = {
  id: string
  title: string
  description: string
  purpose: string
  question: string
  symbol: string
  scene: string
  theme: string
  era: string
}

export const gameModules: GameModule[] = [
  { id: 'energia', title: 'Energía viva', description: 'Conecta fuentes con el barrio y cubre una noche sin dejar sectores a oscuras.', purpose: 'Entender que una matriz eléctrica es una decisión de equilibrio entre fuentes, demanda y resiliencia.', question: '¿Qué combinación mantiene las luces encendidas sin disparar las emisiones?', symbol: '☀', scene: 'red', theme: 'Energía', era: 'La ciudad', },
  { id: 'industria', title: 'Fábrica circular', description: 'Clasifica materiales, elige cómo transformarlos y mira qué vuelve a la obra.', purpose: 'Descubrir que el diseño de un material determina cuánto dura, cuánto se reutiliza y cuánta energía exige.', question: '¿Puede una fábrica producir más valor con menos materia nueva?', symbol: '▥', scene: 'ciclo', theme: 'Industria', era: 'El taller', },
  { id: 'transporte', title: 'Rutas que respiran', description: 'Resuelve seis viajes según distancia, seguridad, accesibilidad y compañía.', purpose: 'Comparar decisiones de movilidad más allá de la velocidad: distancia, ocupación, seguridad y acceso.', question: '¿Cómo se mueve una ciudad sin que cada viaje cueste aire?', symbol: '↗', scene: 'ruta', theme: 'Movilidad', era: 'La ciudad', },
  { id: 'bosques', title: 'Bosque guardián', description: 'Planta en claros, cuida los brotes y observa crecer un bosque de varias estaciones.', purpose: 'Ver el bosque como un sistema que crece despacio: suelo, sombra, agua y tiempo.', question: '¿Dónde plantar para que el bosque se sostenga solo?', symbol: '♧', scene: 'raíces', theme: 'Bosques', era: 'La ladera', },
  { id: 'agricultura', title: 'La finca del futuro', description: 'Rota cultivos, cuida el suelo y administra el agua hasta llegar a la cosecha.', purpose: 'Experimentar la tensión entre productividad, agua, suelo vivo y diversidad de cultivos.', question: '¿Se puede cosechar sin agotar lo que produce la cosecha?', symbol: '≋', scene: 'cosecha', theme: 'Agricultura', era: 'La parcela', },
]
