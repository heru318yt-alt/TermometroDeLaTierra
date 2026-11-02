export type HistoryEvent = {
  year: number
  title: string
  detail: string
  source: string
  sourceLabel: string
}

export type HistoricalPeriod = {
  start: number
  end: number
  name: string
  label: string
  description: string
  events: HistoryEvent[]
}

export type NarrativePhase = {
  start: number
  end: number
  label: string
  focus: string
  factor: 'energia' | 'industria' | 'transporte' | 'bosques' | 'agricultura'
  text: string
  source: string
  sourceLabel: string
}

export const historicalPeriods: HistoricalPeriod[] = [
  {
    start: 1970, end: 1979, name: 'La conversación ambiental se vuelve pública', label: '1970–1979',
    description: 'La movilización ciudadana y las primeras conferencias internacionales ayudaron a organizar la conversación sobre ambiente y clima.',
    events: [
      { year: 1970, title: 'El primer Día de la Tierra', detail: 'El 22 de abril se realizaron actividades públicas en Estados Unidos. Ese mismo año abrió sus puertas la Agencia de Protección Ambiental (EPA).', source: 'https://www.epa.gov/history/origins-epa', sourceLabel: 'EPA · Orígenes de la agencia' },
      { year: 1972, title: 'Conferencia de Estocolmo', detail: 'La Conferencia de las Naciones Unidas sobre el Medio Humano reunió por primera vez a países para tratar el ambiente como una cuestión internacional y de desarrollo.', source: 'https://www.un.org/en/conferences/environment/stockholm1972', sourceLabel: 'ONU · Conferencia de Estocolmo' },
      { year: 1979, title: 'Primera Conferencia Mundial sobre el Clima', detail: 'La conferencia pidió una estrategia internacional para comprender mejor el sistema climático y propuso crear el Programa Mundial sobre el Clima.', source: 'https://wmo.int/world-climate-programme-wcp', sourceLabel: 'OMM · Programa Mundial sobre el Clima' },
    ],
  },
  {
    start: 1980, end: 1989, name: 'La ciencia climática se coordina', label: '1980–1989',
    description: 'La cooperación científica internacional creó espacios para evaluar el conocimiento disponible sobre el cambio climático.',
    events: [
      { year: 1988, title: 'Se crea el IPCC', detail: 'La Organización Meteorológica Mundial y el Programa de las Naciones Unidas para el Medio Ambiente establecieron el Panel Intergubernamental sobre Cambio Climático para evaluar la ciencia disponible.', source: 'https://wmo.int/activities/intergovernmental-panel-climate-change-ipcc', sourceLabel: 'OMM · Historia del IPCC' },
    ],
  },
  {
    start: 1990, end: 1999, name: 'Primeros acuerdos entre países', label: '1990–1999',
    description: 'Las evaluaciones científicas y las negociaciones multilaterales dieron paso a tratados internacionales sobre cambio climático.',
    events: [
      { year: 1992, title: 'La Convención sobre el Cambio Climático', detail: 'La Convención Marco de las Naciones Unidas sobre el Cambio Climático fue adoptada en mayo y se abrió para firma durante la Cumbre de la Tierra de Río de Janeiro.', source: 'https://unfccc.int/about-us/unfccc-archives/unfccc-archival-holdings', sourceLabel: 'CMNUCC · Archivo de la Convención' },
      { year: 1997, title: 'Se adopta el Protocolo de Kioto', detail: 'El protocolo fijó compromisos de reducción para países industrializados dentro del marco de la Convención. Su entrada en vigor ocurrió años después, en 2005.', source: 'https://unfccc.int/process-and-meetings/the-kyoto-protocol', sourceLabel: 'CMNUCC · Protocolo de Kioto' },
    ],
  },
  {
    start: 2000, end: 2009, name: 'Los compromisos empiezan a operar', label: '2000–2009',
    description: 'El Protocolo de Kioto entró en vigor y comenzaron sus primeros períodos de compromiso.',
    events: [
      { year: 2005, title: 'Entra en vigor Kioto', detail: 'Tras un proceso de ratificación, el Protocolo de Kioto entró en vigor el 16 de febrero de 2005.', source: 'https://unfccc.int/process-and-meetings/the-kyoto-protocol', sourceLabel: 'CMNUCC · Protocolo de Kioto' },
      { year: 2007, title: 'Cuarto Informe de Evaluación del IPCC', detail: 'El informe concluyó que el calentamiento del sistema climático era inequívoco y que la mayor parte del aumento observado desde mediados del siglo XX era muy probablemente de origen humano.', source: 'https://www.ipcc.ch/report/ar4/syr/', sourceLabel: 'IPCC · Cuarto Informe de Evaluación' },
    ],
  },
  {
    start: 2010, end: 2019, name: 'Un marco climático para todas las partes', label: '2010–2019',
    description: 'El Acuerdo de París estableció un marco común de acción climática para todos los países que forman parte del acuerdo.',
    events: [
      { year: 2015, title: 'Se adopta el Acuerdo de París', detail: 'En la COP21, las Partes adoptaron el acuerdo y fijaron como objetivo mantener el aumento de la temperatura media global muy por debajo de 2 °C, y continuar los esfuerzos para limitarlo a 1,5 °C.', source: 'https://unfccc.int/process-and-meetings/the-paris-agreement', sourceLabel: 'CMNUCC · Acuerdo de París' },
      { year: 2016, title: 'París entra en vigor', detail: 'El acuerdo entró en vigor el 4 de noviembre de 2016, después de alcanzarse las condiciones de ratificación previstas.', source: 'https://unfccc.int/process-and-meetings/the-paris-agreement', sourceLabel: 'CMNUCC · Acuerdo de París' },
      { year: 2018, title: 'El IPCC publica el informe de 1,5 °C', detail: 'El informe especial comparó los impactos de un calentamiento de 1,5 °C y de 2 °C, y mostró que las diferencias son significativas para ecosistemas, costas y medios de vida.', source: 'https://www.ipcc.ch/sr15/', sourceLabel: 'IPCC · Informe especial 1,5 °C' },
    ],
  },
  {
    start: 2020, end: 2025, name: 'Revisar el progreso y acelerar la acción', label: '2020–2025',
    description: 'El primer balance mundial evaluó el progreso colectivo bajo el Acuerdo de París; las conferencias siguientes acordaron pasos para su implementación.',
    events: [
      { year: 2021, title: 'Comienza el primer balance mundial', detail: 'El proceso de balance mundial se lanzó en la COP26 de Glasgow para evaluar el progreso colectivo respecto a los objetivos del Acuerdo de París.', source: 'https://unfccc.int/topics/global-stocktake/about-the-global-stocktake/the-first-global-stocktake', sourceLabel: 'CMNUCC · Primer balance mundial' },
      { year: 2023, title: 'Concluye el primer balance mundial', detail: 'El balance concluyó en la COP28 con una evaluación colectiva y orientaciones para fortalecer la acción climática.', source: 'https://unfccc.int/topics/global-stocktake/about-the-global-stocktake/the-first-global-stocktake', sourceLabel: 'CMNUCC · Primer balance mundial' },
      { year: 2024, title: 'El año más cálido registrado', detail: 'Según la OMM, 2024 fue el año más cálido desde que hay registros y superó por primera vez 1,5 °C respecto al promedio preindustrial aproximado en un año calendario. Ese dato anual no equivale a haber superado el objetivo del Acuerdo de París a largo plazo.', source: 'https://wmo.int/news/media-centre/2024-warmest-year-record', sourceLabel: 'OMM · 2024, el año más cálido' },
      { year: 2025, title: 'La conferencia climática llega a Belém', detail: 'La COP30 se celebró en Belém, Brasil. Sus decisiones abarcaron áreas como adaptación, financiación, tecnología y transición justa.', source: 'https://unfccc.int/cop30/auvs', sourceLabel: 'CMNUCC · Decisiones de la COP30' },
    ],
  },
]

/**
 * A second, material reading of the same decades. It is explicitly a
 * narrative overlay, not a claim that each activity began or ended in
 * the decade shown. Every phase links to its supporting source.
 */
export const narrativePhases: NarrativePhase[] = [
  {
    start: 1970, end: 1989, label: '1970–1989', focus: 'Energía y combustibles fósiles', factor: 'energia',
    text: 'La infraestructura energética construida durante la posguerra siguió creciendo. La conversación ambiental se volvió pública mientras la demanda de petróleo, gas y carbón se expandía.',
    source: 'https://ourworldindata.org/co2-emissions', sourceLabel: 'Our World in Data · emisiones de CO₂',
  },
  {
    start: 1990, end: 1999, label: '1990–1999', focus: 'Industria y materiales', factor: 'industria',
    text: 'La globalización de las cadenas de suministro y la expansión urbana aumentaron la demanda de acero, cemento y químicos. Los primeros acuerdos climáticos buscaron medir y coordinar esas emisiones.',
    source: 'https://www.ipcc.ch/report/ar6/wg3/', sourceLabel: 'IPCC AR6 WGIII · Mitigación',
  },
  {
    start: 2000, end: 2009, label: '2000–2009', focus: 'Transporte y actividad económica', factor: 'transporte',
    text: 'El comercio internacional y la movilidad cotidiana crecieron con rapidez. El automóvil, el camión y el barco sostuvieron una economía más conectada, con más recorridos y más combustible por viaje.',
    source: 'https://www.iea.org/energy-system/transport', sourceLabel: 'IEA · Transporte',
  },
  {
    start: 2010, end: 2019, label: '2010–2019', focus: 'Uso del suelo y producción de alimentos', factor: 'bosques',
    text: 'La atención se amplió hacia los bosques, la agricultura y las cadenas de suministro. La deforestación y la ganadería mostraron que el clima también se juega en el territorio y en la alimentación.',
    source: 'https://www.fao.org/forest-resources-assessment/2020/en/', sourceLabel: 'FAO · Evaluación forestal mundial 2020',
  },
  {
    start: 2020, end: 2025, label: '2020–2025', focus: 'Calentamiento reciente y respuesta', factor: 'energia',
    text: 'La década más cálida registrada coincidió con una expansión récord de energías renovables, pero también con emisiones globales todavía altas. La brecha entre lo prometido y lo implementado sigue siendo el centro del debate.',
    source: 'https://wmo.int/news/media-centre/2024-warmest-year-record', sourceLabel: 'OMM · 2024, el año más cálido',
  },
]

export const periods = historicalPeriods.map(period => period.label)
