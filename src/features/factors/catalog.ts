export type FactorSource = {
  label: string
  url: string
}

export type Factor = {
  id: 'energia' | 'industria' | 'transporte' | 'bosques' | 'agricultura'
  number: string
  title: string
  kicker: string
  summary: string
  climate: string
  history: string
  data: {
    label: string
    value: string
    note: string
    source: FactorSource
  }
  levers: string[]
  sources: FactorSource[]
}

/**
 * The figures below are deliberately qualitative or explicitly attributed.
 * The project's only measured temperature series is NASA GISTEMP; these
 * factors contextualise it and never claim causal attribution by themselves.
 */
export const factors: Factor[] = [
  {
    id: 'energia',
    number: '01',
    title: 'Energía y combustibles fósiles',
    kicker: 'La matriz que sostiene la vida cotidiana',
    summary: 'Electricidad, calefacción y transporte dependen en buena medida de carbón, petróleo y gas. Al quemarse, liberan dióxido de carbono que permanece en la atmósfera durante siglos.',
    climate: 'La producción de electricidad y calor es el mayor bloque de emisiones de gases de efecto invernadero del mundo. Por eso, descarbonizar la matriz energética es una de las palancas de mayor escala para limitar el calentamiento.',
    history: 'La electrificación masiva del siglo XX transformó ciudades, hogares e industrias. Desde 1970, la demanda mundial de energía no ha dejado de crecer y la infraestructura fósil construida entonces sigue operando hoy.',
    data: {
      label: 'Dónde se concentran las emisiones',
      value: 'Electricidad y calor',
      note: 'Es el mayor bloque sectorial de gases de efecto invernadero a escala global; le siguen transporte, manufactura y construcción, y agricultura.',
      source: { label: 'Our World in Data · emisiones por sector', url: 'https://ourworldindata.org/emissions-by-sector' },
    },
    levers: ['Eficiencia y reducción de demanda', 'Renovables y almacenamiento', 'Electrificación del calor y la industria', 'Cierre ordenado de infraestructura fósil'],
    sources: [
      { label: 'IEA · Industry and emissions data', url: 'https://www.iea.org/energy-system/industry' },
      { label: 'Our World in Data · emisiones por sector', url: 'https://ourworldindata.org/emissions-by-sector' },
      { label: 'IPCC AR6 · Informe de síntesis', url: 'https://www.ipcc.ch/report/ar6/syr/' },
    ],
  },
  {
    id: 'industria',
    number: '02',
    title: 'Industria y materiales',
    kicker: 'Lo que se fabrica también tiene un clima',
    summary: 'Acero, cemento, aluminio, químicos y plásticos requieren calor intenso y procesos que hoy dependen en gran parte de combustibles fósiles. La demanda de materiales crece con la urbanización.',
    climate: 'La manufactura y la construcción forman uno de los grandes bloques de emisiones. El cemento es especialmente intensivo: una parte de su CO₂ se libera por la propia química de la caliza, no solo por la energía utilizada.',
    history: 'La reconstrucción de posguerra y la expansión urbana global multiplicaron la producción de cemento y acero. La industria actual hereda plantas, cadenas de suministro y hábitos de diseño de esa expansión.',
    data: {
      label: 'Un material clave',
      value: 'Cemento',
      note: 'Combina emisiones por combustión y por proceso químico; la IEA sigue su producción y sus emisiones dentro del sector industrial.',
      source: { label: 'IEA · Cement', url: 'https://www.iea.org/energy-system/industry/cement' },
    },
    levers: ['Materiales con menor contenido de carbono', 'Reutilización y reciclaje de alta calidad', 'Calor industrial electrificado', 'Diseño de edificios con menos material'],
    sources: [
      { label: 'IEA · Industry', url: 'https://www.iea.org/energy-system/industry' },
      { label: 'IPCC AR6 WGIII · Mitigación', url: 'https://www.ipcc.ch/report/ar6/wg3/' },
      { label: 'UNEP · Global Status Report for Buildings and Construction', url: 'https://www.unep.org/resources/report/2024-global-status-report-buildings-and-construction' },
    ],
  },
  {
    id: 'transporte',
    number: '03',
    title: 'Transporte y movilidad',
    kicker: 'La distancia entre las cosas y las personas',
    summary: 'Autos, camiones, barcos y aviones conectan territorios, pero también estructuran una demanda constante de combustibles líquidos. La forma de la ciudad decide cuánto hace falta moverse.',
    climate: 'El transporte es el segundo gran bloque de emisiones globales después de electricidad y calor. La mayor parte proviene del transporte por carretera, y la aviación y el transporte marítimo añaden emisiones difíciles de electrificar.',
    history: 'La expansión suburbana y el automóvil privado reorganizaron el siglo XX. En las últimas décadas, el aumento del comercio internacional multiplicó el transporte de mercancías por barco, camión y avión.',
    data: {
      label: 'Una decisión urbana',
      value: 'Movilidad cotidiana',
      note: 'La distancia, el modo de transporte y la ocupación del vehículo determinan las emisiones de cada viaje; no solo el tipo de motor.',
      source: { label: 'IEA · Transport', url: 'https://www.iea.org/energy-system/transport' },
    },
    levers: ['Transporte público y tren de cercanías', 'Calles caminables y ciclovías seguras', 'Vehículos más eficientes y electrificados', 'Logística de cercanía y carga compartida'],
    sources: [
      { label: 'IEA · Transport', url: 'https://www.iea.org/energy-system/transport' },
      { label: 'IPCC AR6 WGIII · Mitigación', url: 'https://www.ipcc.ch/report/ar6/wg3/' },
      { label: 'Our World in Data · emisiones por sector', url: 'https://ourworldindata.org/emissions-by-sector' },
    ],
  },
  {
    id: 'bosques',
    number: '04',
    title: 'Deforestación y cambio de uso del suelo',
    kicker: 'El carbono guardado en los árboles y el suelo',
    summary: 'Los bosques almacenan carbono en troncos, raíces y suelos. Cuando se talan o se queman para abrir tierras agrícolas o ganaderas, parte de ese carbono regresa a la atmósfera.',
    climate: 'El cambio de uso del suelo puede emitir CO₂ y alterar ciclos de agua y temperatura local. La pérdida de bosque también reduce la capacidad de absorber carbono y de regular el clima regional.',
    history: 'La frontera agrícola ha avanzado históricamente hacia bosques tropicales y templados. En las últimas décadas, la deforestación se concentró en América Latina, África subsahariana y el sudeste asiático, con presiones ligadas a commodities y ganadería.',
    data: {
      label: 'Superficie forestal',
      value: '4,7 millones de ha',
      note: 'Pérdida neta anual estimada de bosque entre 2010 y 2020, según la evaluación forestal mundial de la FAO. La pérdida bruta es mayor: parte de ella se compensa con nuevas plantaciones y regeneración.',
      source: { label: 'FAO · Global Forest Resources Assessment 2020', url: 'https://www.fao.org/forest-resources-assessment/2020/en/' },
    },
    levers: ['Protección de bosques primarios', 'Restauración con especies nativas', 'Trazabilidad de commodities', 'Reconocimiento de derechos territoriales'],
    sources: [
      { label: 'FAO · FRA 2020', url: 'https://www.fao.org/forest-resources-assessment/2020/en/' },
      { label: 'IPCC · Informe especial sobre uso de la tierra', url: 'https://www.ipcc.ch/srccl/' },
      { label: 'NASA · Climate Change', url: 'https://science.nasa.gov/climate-change/' },
    ],
  },
  {
    id: 'agricultura',
    number: '05',
    title: 'Agricultura, ganadería y otros gases',
    kicker: 'Alimentar a ocho mil millones de personas',
    summary: 'La agricultura emite metano por el ganado y los arrozales, óxido nitroso por fertilizantes y CO₂ por cambios de uso del suelo. La alimentación conecta clima, suelo, agua y biodiversidad.',
    climate: 'Los sistemas agroalimentarios son una parte sustancial de las emisiones globales. La agricultura es la principal fuente de metano y casi toda la de óxido nitroso de origen humano, dos gases con un potencial de calentamiento superior al CO₂.',
    history: 'La revolución verde aumentó los rendimientos y la dependencia de fertilizantes y riego. Al mismo tiempo, la producción ganadera creció y la dieta global se transformó, con diferencias enormes entre regiones.',
    data: {
      label: 'Un gas distinto',
      value: 'Metano y óxido nitroso',
      note: 'La agricultura es la mayor fuente de metano y casi la única de óxido nitroso de origen humano; ambos calientan más por molécula que el CO₂.',
      source: { label: 'Our World in Data · gases por sector', url: 'https://ourworldindata.org/emissions-by-sector' },
    },
    levers: ['Dietas con menor desperdicio', 'Suelo vivo y fertilización precisa', 'Riego eficiente y captación de agua', 'Agroecología y diversificación'],
    sources: [
      { label: 'FAO · sistemas agroalimentarios', url: 'https://www.fao.org/agrifood-economics/areas-of-work/agrifood-systems/en/' },
      { label: 'IPCC · Informe especial sobre uso de la tierra', url: 'https://www.ipcc.ch/srccl/' },
      { label: 'Our World in Data · emisiones por sector', url: 'https://ourworldindata.org/emissions-by-sector' },
    ],
  },
]
