// Cada tema del catálogo tiene un minijuego disponible en el runtime Unity.
export type GameModule = { id: string; title: string; description: string; symbol: string; status: 'available' }
export const gameModules: GameModule[] = [
  { id: 'energia', title: 'Energía', description: 'Mantén el suministro mientras exploras eficiencia y alternativas energéticas.', symbol: '☀', status: 'available' },
  { id: 'industria', title: 'Industria', description: 'Compara decisiones sobre cemento, acero y procesos de producción.', symbol: '▥', status: 'available' },
  { id: 'transporte', title: 'Transporte', description: 'Resuelve rutas de personas y mercancías con distintas opciones de movilidad.', symbol: '↗', status: 'available' },
  { id: 'bosques', title: 'Bosques', description: 'Equilibra uso del suelo, restauración y necesidades de las comunidades.', symbol: '♧', status: 'available' },
  { id: 'agricultura', title: 'Agricultura', description: 'Toma decisiones sobre metano, fertilizantes, residuos y alimentos.', symbol: '≋', status: 'available' },
]
