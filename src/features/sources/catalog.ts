export type SourceEntry = {
  id: string
  number: string
  name: string
  organization: string
  kind: 'Datos' | 'Ciencia' | 'Método' | 'Recurso'
  description: string
  usedFor: string
  url: string
  linkLabel: string
}

export const sources: SourceEntry[] = [
  {
    id: 'gistemp', number: '01', name: 'GISS Surface Temperature Analysis · GISTEMP v4',
    organization: 'NASA Goddard Institute for Space Studies', kind: 'Datos',
    description: 'Serie global Land-Ocean de anomalías de temperatura superficial. Es la fuente del indicador, el gráfico y la línea de tiempo del proyecto.',
    usedFor: 'Anomalías mensuales y anuales (J-D) desde 1880, con referencia 1951–1980.',
    url: 'https://data.giss.nasa.gov/gistemp/', linkLabel: 'data.giss.nasa.gov/gistemp',
  },
  {
    id: 'lenssen', number: '02', name: 'A GISTEMPv4 observational uncertainty ensemble',
    organization: 'Lenssen et al. · JGR Atmospheres', kind: 'Método',
    description: 'Artículo sobre el conjunto de incertidumbre observacional de GISTEMP v4. Documenta cómo se construye y se evalúa la serie utilizada.',
    usedFor: 'Contexto metodológico y límites de interpretación de la serie.',
    url: 'https://doi.org/10.1029/2023JD040179', linkLabel: 'doi.org/10.1029/2023JD040179',
  },
  {
    id: 'ipcc', number: '03', name: 'Sexto Informe de Evaluación · AR6',
    organization: 'Panel Intergubernamental sobre Cambio Climático', kind: 'Ciencia',
    description: 'Evaluación científica de la física del clima, impactos, adaptación y mitigación. Sustenta las explicaciones sobre causas, riesgos y respuestas.',
    usedFor: 'Contexto de los factores, límites de la atribución causal y marcos de mitigación.',
    url: 'https://www.ipcc.ch/report/ar6/syr/', linkLabel: 'ipcc.ch/report/ar6/syr',
  },
  {
    id: 'nasa-climate', number: '04', name: 'NASA Climate Change',
    organization: 'NASA Science', kind: 'Ciencia',
    description: 'Recursos divulgativos y visualizaciones sobre el sistema climático, el efecto invernadero, el nivel del mar y el hielo.',
    usedFor: 'Explicaciones educativas y contexto de los factores ambientales.',
    url: 'https://science.nasa.gov/climate-change/', linkLabel: 'science.nasa.gov/climate-change',
  },
  {
    id: 'owid', number: '05', name: 'Emissions by sector',
    organization: 'Our World in Data', kind: 'Datos',
    description: 'Desglose de emisiones de gases de efecto invernadero por sector, con datos abiertos y metodología documentada.',
    usedFor: 'Comparación de la magnitud relativa de energía, transporte, industria y agricultura.',
    url: 'https://ourworldindata.org/emissions-by-sector', linkLabel: 'ourworldindata.org/emissions-by-sector',
  },
  {
    id: 'fao', number: '06', name: 'Global Forest Resources Assessment 2020',
    organization: 'Organización de las Naciones Unidas para la Alimentación y la Agricultura', kind: 'Datos',
    description: 'Evaluación mundial de la superficie forestal, su pérdida neta, la deforestación y la restauración.',
    usedFor: 'Dato de pérdida neta de bosque del factor de deforestación.',
    url: 'https://www.fao.org/forest-resources-assessment/2020/en/', linkLabel: 'fao.org/forest-resources-assessment',
  },
  {
    id: 'iea', number: '07', name: 'Energy system · Industry and transport',
    organization: 'Agencia Internacional de la Energía', kind: 'Datos',
    description: 'Seguimiento de demanda, emisiones y tecnologías por sector energético, industria y movilidad.',
    usedFor: 'Contexto de los factores de energía, industria y transporte.',
    url: 'https://www.iea.org/energy-system', linkLabel: 'iea.org/energy-system',
  },
  {
    id: 'unfccc', number: '08', name: 'Acuerdo de París y Convención Marco',
    organization: 'CMNUCC · Naciones Unidas', kind: 'Recurso',
    description: 'Texto del Acuerdo de París, decisiones de las conferencias y documentos del balance mundial.',
    usedFor: 'Contexto histórico y definición de los objetivos de 1,5 °C y 2 °C.',
    url: 'https://unfccc.int/process-and-meetings/the-paris-agreement', linkLabel: 'unfccc.int/paris-agreement',
  },
  {
    id: 'natural-earth', number: '09', name: 'Natural Earth · 1:110m land',
    organization: 'Natural Earth', kind: 'Recurso',
    description: 'Contornos de tierra de dominio público usados para la esfera del explorador y el mapa de la línea del tiempo. No son una capa climática regional.',
    usedFor: 'Geometría local de los continentes en el globo del explorador y el mapa de la línea del tiempo.',
    url: 'https://www.naturalearthdata.com/about/terms-of-use/', linkLabel: 'naturalearthdata.com',
  },
  {
    id: 'course', number: '10', name: 'De NASA GISTEMP a React · Guía de la asignatura',
    organization: 'Arquitectura de Sistemas Multimedia · UAO', kind: 'Recurso',
    description: 'Tutorial interactivo del curso sobre descarga local de GLB.Ts+dSST.csv (índice L-OTI v4), tratamiento de datos ausentes (***), doble escala de referencia (1951–1980 y aproximación preindustrial 1880–1900), visualización en cliente y sonificación con Web Audio API. La implementación de este observatorio es propia y no copia su código.',
    usedFor: 'Guía metodológica y referencia del curso para la arquitectura de datos y sonificación.',
    url: 'https://temperatura-mu.vercel.app/#step-2', linkLabel: 'temperatura-mu.vercel.app',
  },
]

export const methodology = [
  {
    title: 'Anomalía, no temperatura absoluta',
    body: 'Cada valor de GISTEMP es una diferencia en grados Celsius respecto al promedio del período 1951–1980. Una anomalía de +1,20 °C no significa que la Tierra esté a 1,20 °C: significa que ese mes o año estuvo 1,20 °C por encima de esa referencia.',
  },
  {
    title: 'Dos referencias que no deben mezclarse',
    body: 'La serie principal usa 1951–1980. Los niveles de París se aproximan con la media de los años J-D completos de 1880–1900, sumando 1,5 °C o 2,0 °C a esa base. Es una aproximación educativa, no la referencia completa 1850–1900 ni una evaluación oficial del Acuerdo de París.',
  },
  {
    title: 'Una serie global no es un mapa regional',
    body: 'El color del océano en la esfera representa una única anomalía global para la fecha elegida. Los continentes son una referencia geográfica constante. El CSV utilizado no contiene datos espaciales para colorear países o regiones.',
  },
  {
    title: 'Causalidad: lo que una curva no demuestra',
    body: 'Una gráfica de temperatura no identifica por sí sola qué actividad causó una variación concreta. Las relaciones entre emisiones, uso del suelo, industria y clima se sustentan en la literatura científica citada, no en la coincidencia visual de dos series.',
  },
  {
    title: 'Del archivo de NASA a la pantalla',
    body: 'El script local descarga el CSV global de GISTEMP, valida sus columnas y valores, interpreta los huecos como ausencia de dato y genera un JSON versionado con hash SHA-256. La página no consulta NASA en tiempo de ejecución.',
  },
  {
    title: 'Escala cromática fija',
    body: 'La escala va de −1 °C a +2 °C y satura en los extremos. Azul representa anomalías negativas, el tono neutro se acerca a cero y los tonos cálidos representan anomalías positivas. El valor numérico siempre acompaña al color.',
  },
  {
    title: 'Huecos y años incompletos',
    body: 'Un valor ausente nunca se convierte en cero. La vista anual usa exclusivamente la columna oficial J-D y exige los doce meses completos. Un año incompleto se muestra como ausencia de dato y no como un promedio parcial.',
  },
  {
    title: 'Comparaciones sin afirmaciones causales',
    body: 'Las ventanas de comparación usan cinco años J-D completos en cada extremo, sin solapamiento. La diferencia es la última media menos la primera. No es una tasa de cambio ni una prueba de atribución.',
  },
]
