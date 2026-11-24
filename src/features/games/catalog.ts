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
  { id: 'energia', title: 'Mantén la red', description: 'Modo arcade continuo: atrapa carbón, gas, renovables y almacenamiento mientras sube la demanda y mantienes la red en zona segura para romper tu récord.', purpose: 'Entender que confiabilidad y emisiones son indicadores distintos y que una mezcla baja en carbono requiere planificación y almacenamiento.', question: '¿Qué combinación mantiene la red estable sin disparar las emisiones?', symbol: '☀', scene: 'red', theme: 'Energía', era: 'La ciudad', },
  { id: 'industria', title: 'Puente de materiales', description: 'Modo arcade con recuperación circular: construye puentes eficientes con acero y concreto para cruzar tantas brechas seguidas como logres sin agotar el inventario.', purpose: 'Distinguir emisiones de combustión y de proceso (como el cemento) y ver que diseñar con menos material y apoyos bien puestos reduce emisiones incorporadas.', question: '¿Cuánto puedes cruzar con la cantidad justa de material?', symbol: '▥', scene: 'ciclo', theme: 'Industria', era: 'El taller', },
  { id: 'transporte', title: 'Carga entre ciudades', description: 'Lanza cajas de una ciudad a otra con carretera, ferrocarril, barco o avión antes de que se acabe el tiempo. Cada modo alcanza distinto y la energía se reparte entre tres rutas.', purpose: 'Comparar modos de carga por distancia, tiempo y emisiones por tonelada-kilómetro: el mismo envío da resultados distintos según el modo.', question: '¿Qué modo conviene para cada distancia sin disparar las emisiones?', symbol: '↗', scene: 'ruta', theme: 'Movilidad', era: 'La ciudad', },
  { id: 'bosques', title: 'Guardabosques', description: 'Modo arcade sin tope de ciclos: reparte parcelas entre bosque, cultivo y restauración mientras sube la demanda y llegan talas e incendios más intensos.', purpose: 'Ver que convertir bosque libera carbono de golpe, que restaurar tarda años y que producir alimentos y conservar bosque entran en tensión.', question: '¿Cómo alimentar a un territorio sin perder su bosque?', symbol: '♧', scene: 'raíces', theme: 'Bosques', era: 'La ladera', },
  { id: 'agricultura', title: 'Finca equilibrada', description: 'Modo arcade por temporadas continuas: adapta manejo, fertilizante y tamaño del hato ante suelos y climas cada vez más exigentes para maximizar cosechas.', purpose: 'Ver que no hay una solución universal: metano del hato, óxido nitroso de los fertilizantes y CO₂ del suelo cambian según el terreno y la combinación.', question: '¿Qué combinación alimenta sin degradar el suelo ni disparar las emisiones?', symbol: '≋', scene: 'cosecha', theme: 'Agricultura', era: 'La parcela', },
]
