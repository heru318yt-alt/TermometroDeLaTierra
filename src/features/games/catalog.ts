export type GameModule = {
  id: string
  title: string
  description: string
  symbol: string
  scene: string
  theme: string
  era: string
}

export const gameModules: GameModule[] = [
  { id: 'energia', title: 'Energía viva', description: 'Conecta fuentes con el barrio y cubre una noche sin dejar sectores a oscuras.', symbol: '☀', scene: 'red', theme: 'Energía', era: 'La ciudad', },
  { id: 'industria', title: 'Fábrica circular', description: 'Clasifica materiales, elige cómo transformarlos y mira qué vuelve a la obra.', symbol: '▥', scene: 'ciclo', theme: 'Industria', era: 'El taller', },
  { id: 'transporte', title: 'Rutas que respiran', description: 'Resuelve seis viajes según distancia, seguridad, accesibilidad y compañía.', symbol: '↗', scene: 'ruta', theme: 'Movilidad', era: 'La ciudad', },
  { id: 'bosques', title: 'Bosque guardián', description: 'Planta en claros, cuida los brotes y observa crecer un bosque de varias estaciones.', symbol: '♧', scene: 'raíces', theme: 'Bosques', era: 'La ladera', },
  { id: 'agricultura', title: 'La finca del futuro', description: 'Rota cultivos, cuida el suelo y administra el agua hasta llegar a la cosecha.', symbol: '≋', scene: 'cosecha', theme: 'Agricultura', era: 'La parcela', },
]
