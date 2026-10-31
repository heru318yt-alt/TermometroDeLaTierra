// Los futuros juegos podrán añadir su componente y ruta aquí, manteniendo su lógica aislada.
export type GameModule = { id: string; title: string; description: string; symbol: string; status: 'pending' }
export const gameModules: GameModule[] = [
  { id: 'energia', title: 'Energía', description: 'Producción, consumo y alternativas energéticas.', symbol: '☀', status: 'pending' },
  { id: 'industria', title: 'Industria', description: 'Procesos de producción y uso de recursos.', symbol: '▥', status: 'pending' },
  { id: 'transporte', title: 'Transporte', description: 'Movilidad y formas de conectar nuestro mundo.', symbol: '↗', status: 'pending' },
  { id: 'bosques', title: 'Bosques', description: 'Cobertura forestal, conservación y cambios del paisaje.', symbol: '♧', status: 'pending' },
  { id: 'agricultura', title: 'Agricultura', description: 'Sistemas alimentarios y uso de la tierra.', symbol: '≋', status: 'pending' },
]
