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

export const historicalPeriods: HistoricalPeriod[] = [
  {
    start: 1970, end: 1979, name: 'La conversación ambiental se vuelve pública', label: '1970–1979',
    description: 'La movilización ciudadana y las primeras conferencias internacionales ayudaron a organizar la conversación sobre ambiente y clima.',
    events: [
      { year: 1970, title: 'El primer Día de la Tierra', detail: 'El 22 de abril se realizaron actividades públicas en Estados Unidos. Ese mismo año abrió sus puertas la Agencia de Protección Ambiental (EPA).', source: 'https://www.epa.gov/history/origins-epa', sourceLabel: 'EPA · Orígenes de la agencia' },
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
    ],
  },
  {
    start: 2010, end: 2019, name: 'Un marco climático para todas las partes', label: '2010–2019',
    description: 'El Acuerdo de París estableció un marco común de acción climática para todos los países que forman parte del acuerdo.',
    events: [
      { year: 2015, title: 'Se adopta el Acuerdo de París', detail: 'En la COP21, las Partes adoptaron el acuerdo y fijaron como objetivo mantener el aumento de la temperatura media global muy por debajo de 2 °C, y continuar los esfuerzos para limitarlo a 1,5 °C.', source: 'https://unfccc.int/process-and-meetings/the-paris-agreement', sourceLabel: 'CMNUCC · Acuerdo de París' },
      { year: 2016, title: 'París entra en vigor', detail: 'El acuerdo entró en vigor el 4 de noviembre de 2016, después de alcanzarse las condiciones de ratificación previstas.', source: 'https://unfccc.int/process-and-meetings/the-paris-agreement', sourceLabel: 'CMNUCC · Acuerdo de París' },
    ],
  },
  {
    start: 2020, end: 2025, name: 'Revisar el progreso y acelerar la acción', label: '2020–2025',
    description: 'El primer balance mundial evaluó el progreso colectivo bajo el Acuerdo de París; las conferencias siguientes acordaron pasos para su implementación.',
    events: [
      { year: 2021, title: 'Comienza el primer balance mundial', detail: 'El proceso de balance mundial se lanzó en la COP26 de Glasgow para evaluar el progreso colectivo respecto a los objetivos del Acuerdo de París.', source: 'https://unfccc.int/topics/global-stocktake/about-the-global-stocktake/the-first-global-stocktake', sourceLabel: 'CMNUCC · Primer balance mundial' },
      { year: 2023, title: 'Concluye el primer balance mundial', detail: 'El balance concluyó en la COP28 con una evaluación colectiva y orientaciones para fortalecer la acción climática.', source: 'https://unfccc.int/topics/global-stocktake/about-the-global-stocktake/the-first-global-stocktake', sourceLabel: 'CMNUCC · Primer balance mundial' },
      { year: 2025, title: 'La conferencia climática llega a Belém', detail: 'La COP30 se celebró en Belém, Brasil. Sus decisiones abarcaron áreas como adaptación, financiación, tecnología y transición justa.', source: 'https://unfccc.int/cop30/auvs', sourceLabel: 'CMNUCC · Decisiones de la COP30' },
    ],
  },
]

export const periods = historicalPeriods.map(period => period.label)
