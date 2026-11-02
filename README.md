# Termómetro de la Tierra

Base funcional de una aplicación educativa sobre el calentamiento global para la asignatura **Arquitectura de Sistemas Multimedia**.

## Inicio rápido

Requiere Node.js 22.12+ de la rama 22, Node.js 24 o Node.js 26+, y npm. Se recomienda Node.js 24, utilizado en la verificación.

```sh
npm install
npm run dev
```

Abrir la URL que indique Vite (normalmente http://127.0.0.1:5173).

```sh
npm test          # Pruebas de navegación, menú y módulos pendientes
npm run build    # Comprobación estricta de TypeScript y build en dist/
npm run preview  # Servir el build localmente
npm run data:update # Descargar y validar la serie oficial completa de NASA
```

## Tecnologías y estructura

React + TypeScript, Vite y React Router. CSS propio, fuentes del sistema, una esfera interactiva dibujada en canvas y gráficos SVG. Contornos de Natural Earth de dominio público almacenados localmente, sin peticiones de imágenes en ejecución. No se añadieron dependencias para el explorador. Vitest, Testing Library y jsdom se usan únicamente en desarrollo para verificar las interacciones.

```text
src/
  main.tsx                    Entrada y BrowserRouter
  app/
    App.tsx                   Rutas y página 404
    App.test.tsx              Pruebas de comportamiento
  components/
    Layout.tsx                Encabezado, menú, contenido y pie compartidos
    PageIntro.tsx             Introducción reutilizable de las páginas
    Globe.tsx                 Ilustración decorativa, no cartografía científica
  features/
    home/HomePage.tsx         Inicio y acceso al explorador
    explorer/ExplorerPage.tsx Explorador interactivo y componentes asociados
    history/HistoryPage.tsx   Seis períodos entre 1970 y 2025
    games/catalog.ts         Tipos y catálogo de los cinco módulos
    games/GamesPage.tsx       Alojamiento del build Unity WebGL y temas
    about/AboutPage.tsx       Objetivos, estado y fuentes
  styles.css                  Estilos compartidos y reglas responsive
unity/README.md               Mapa y flujo de trabajo de la parte Unity
unity/TermometroMinijuegos/    Proyecto Unity 6, escena, tooling y C#
unity/Minijuegos_Termo/        Proyecto Unity 6 verificado con las seis escenas y build WebGL
public/unity-minijuegos/       index.html + archivos del build Unity WebGL
```

## Rutas

| Ruta | Contenido |
| --- | --- |
| `/` | Inicio |
| `/explorador` | Globo giratorio, indicador, gráfico, línea de tiempo, comparación e información contextual |
| `/historia` | 1970–1979, 1980–1989, 1990–1999, 2000–2009, 2010–2019 y 2020–2025 |
| `/minijuegos` | Energía, industria, transporte, bosques y agricultura |
| `/acerca` | Proyecto y fuentes |
| Cualquier otra | Página 404 con regreso al inicio |

BrowserRouter permite enlaces y navegación real con historial. Al desplegar en un alojamiento estático deberá configurarse el fallback de las rutas a `index.html`; Vite ya lo resuelve en desarrollo y preview. No se ha desplegado esta versión.

## Proyecto Unity de minijuegos

La ruta `/minijuegos` aloja el build WebGL de Unity en un iframe adaptable. Unity incluye un mapa de entrada y cinco escenas de misión 2D (energía, industria, transporte, bosques y agricultura), personaje original animado, interacciones distintas por escena, música sintetizada y efectos con controles independientes. El proyecto está en `unity/TermometroMinijuegos`; consulta [la guía de Unity](unity/README.md). Para actualizar la versión web, usa **Termómetro → Compilar WebGL para la web**; se generan todas las escenas en `public/unity-minijuegos/`.

El explorador dispone de una esfera giratoria con el indicador global, gráfico SVG, reproducción y línea de tiempo sincronizados, comparación junto al planeta y procedencia de los datos. No hay backend, autenticación ni base de datos. El explorador no reproduce audio; los minijuegos incluidos en Unity generan música y efectos originales localmente. Sus indicadores son simulaciones didácticas, no factores de emisión medidos ni datos NASA GISTEMP.

## Explorador interactivo (etapa 3)

Se abre en el último mes de `data.lastDate` y permite recorrer desde **enero de 1926** hasta ese límite dinámico. El JSON sigue conservando toda la serie desde 1880. Selección por año/mes, deslizador, botones anterior/siguiente, accesos a los seis períodos narrativos o clic/teclado en el gráfico. Cambiar de vista conserva el año seleccionado; en vista anual se usa exclusivamente J-D. Un año incompleto muestra ausencia de dato y un planeta gris, nunca un promedio parcial.

| Módulo en `src/features/explorer/` | Responsabilidad |
| --- | --- |
| `ExplorerContext.tsx` | Estado único de fecha, resolución, intervalo, reproducción y velocidad; reutiliza `useClimateData` y funciones climáticas |
| `WorldClimateVisualizer.tsx` | Planeta con contornos reconocibles y leyenda de anomalía global |
| `ClimateTimeline.tsx` | Selección de años/meses, deslizador y referencias históricas |
| `ClimatePlaybackControls.tsx` | Reproducir, pausar, anterior/siguiente, reinicio y tres velocidades |
| `ClimateChart.tsx` | Curva, ejes, cero, umbrales calculados, tooltip, marcador y selección por puntero/teclado |
| `ClimatePeriodComparison.tsx` | Rango, cobertura, medias y comparación de extremos |
| `ClimateHistoricalContext.tsx` | Período compartido o contexto general fuera de 1970–2025 |
| `model.ts` | Fechas, formato, escala cromática y coordinación de cálculos existentes |
| `ExplorerErrorBoundary.tsx` | Mensaje de error y recarga ante un fallo del explorador |
| `explorer.css` | Estilos específicos y responsive, conservando la identidad anterior |

`ExplorerPage.tsx` compone estos módulos con el globo a la izquierda y los controles de tiempo/comparación a su lado; el panel anterior `ClimateSummaryPanel` se conserva bajo «Fuente y última actualización», separado de la fecha seleccionada. El gráfico se carga mediante `React.lazy` y `Suspense`, con estado de carga real; el JSON y los contornos ya son locales, por lo que no se simula una carga de NASA. La frontera de error contiene fallos de renderizado o de carga del gráfico y deja la navegación disponible.

### Color y geografía

Escala cromática fija de −1 a +2 °C: azul para anomalías negativas, neutro en cero y tonos cálidos para positivas. Los extremos de la leyenda indican saturación (≤ −1, ≥ +2); el valor numérico siempre conserva la anomalía real. El color uniforme del océano/fondo representa **un indicador global**; la capa oscura de continentes es una referencia constante, no una variable climática regional.

Los contornos se derivaron de Natural Earth 1:110m, dominio público. Procedencia y transformación en `src/assets/README.md`; geometría local en `src/assets/world-land.json`. La esfera rasteriza esos contornos para mostrar una referencia giratoria; la proyección de origen es ilustrativa, no apta para análisis de áreas o distancias. El fondo completo del océano representa un solo valor global y no una lectura regional.

### Reproducción y accesibilidad

Velocidades: 1,4 s, 0,7 s y 0,25 s por paso; un paso es un mes o un año según la vista. Se detiene al final y al navegar manualmente. Reproducir desde el final reinicia en 1926. Cambiar resolución pausa. El intervalo se limpia al pausar, cambiar velocidad o modo, alcanzar el extremo o desmontar, también bajo React StrictMode. Ocultar la pestaña pausa la reproducción.

Con `prefers-reduced-motion: reduce`, se deshabilitan reproducción automática y transiciones; los controles manuales permanecen activos. Un cambio de preferencia durante la reproducción también la detiene. No hay audio. El gráfico admite flechas, Inicio y Fin al recibir foco. En móvil dispone de desplazamiento horizontal interno para preservar la legibilidad de ejes y etiquetas; el resto de la página no necesita desplazamiento horizontal.

### Comparaciones

El intervalo de comparación es independiente del punto temporal, pero vive en el mismo estado compartido y aparece sombreado en el gráfico. En mensual utiliza `averageRange` (todos los meses inclusive, peso igual). En anual considera los J-D de los años indicados completos enero–diciembre, sin importar el mes de los campos; se explica explícitamente en la interfaz. Si falta un registro, la media del intervalo es `null` y se muestra la cobertura observada/esperada.

Las dos ventanas usan `averageAnnualRange`: cinco J-D completos en cada extremo, **sin solapamiento** (se requieren al menos diez años completos). En mensual se excluyen años parcialmente incluidos por el rango. En ambos modos se excluyen años sin J-D en los extremos; si falta un J-D dentro de una ventana, se rechaza esa comparación. La diferencia es última media menos primera, en °C; no se calcula una tasa ni se presenta como prueba causal. No se comparan meses aislados como tendencias.

### Historia y límites

`src/features/history/catalog.ts` extrae y comparte el catálogo que antes estaba en `HistoryPage.tsx`. Se conservan los seis períodos. Las descripciones históricas todavía no están documentadas: el explorador lo indica en lugar de inventar acontecimientos. Fuera de esos años muestra contexto climático general. El gráfico obtiene las líneas de París desde `getParisThresholds`; no incluye constantes históricas duplicadas. Ver la limitación preindustrial más abajo.

Las pruebas nuevas están en `Explorer.test.tsx` y `model.test.ts`: selección inicial/final, sincronización, mensual/anual, J-D incompleto, entradas inválidas, controles y comparación, reproducción/pausa/velocidad, fin del recorrido, movimiento reducido y limpieza de intervalos/listeners. Las pruebas de rutas, menú y procesamiento de etapas anteriores se mantienen.

## Datos climáticos: descarga y almacenamiento

La fuente es el [CSV global Land-Ocean de NASA GISTEMP v4](https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv). Sus valores son **anomalías en °C respecto a 1951–1980**, no temperaturas absolutas. La tabla comienza en 1880. Se conserva toda la historia, aunque Historia tenga un rango educativo diferente.

```sh
npm run data:update
npm test
npm run build
```

El script `scripts/update-climate.mjs` usa `fetch` de Node con un límite de 30 segundos. Si falla, intenta `curl` del sistema (incluido en Windows moderno), también con límite de tiempo y HTTPS/TLS validado; no añade dependencias ni desactiva certificados. Si no hay conexión o falta curl, termina con código 1 y explica el error. En entornos restringidos puede ser necesario permitir la salida HTTPS. No fabrica datos ni reemplaza el archivo previo si falla la descarga, validación o escritura temporal.

`src/features/climate/parse.ts` verifica título, las 19 columnas exactas, números válidos, filas de longitud correcta, años consecutivos sin duplicados desde 1880 y consistencia entre meses y J-D. Interpreta `***` como `null`; cero sigue siendo cero. Rechaza J-D presente cuando faltan meses; si hay doce meses pero falta J-D, conserva J-D como `null`. Valida las columnas estacionales pero no las incorpora al JSON. Un cambio de formato falla explícitamente para revisarlo, en vez de adivinar su significado.

El resultado compacto es `src/data/gistemp.json`, con versión de esquema, fuente, unidad, período de referencia, fecha de descarga UTC, hash SHA-256 del texto descargado, recuentos, primera/última fecha válida y registros anuales `{ year, months, annual }`. `months` tiene 12 posiciones (enero en 0); `annual` es el valor oficial J-D. El JSON se escribe primero a un temporal y se sustituye al terminar. Las actualizaciones pueden revisar valores históricos, pero no eliminar meses o J-D previamente disponibles: si NASA retira un dato habrá que revisar esa situación explícitamente. No se conserva el CSV bruto, ni un archivo por cada versión.

El JSON forma parte del código y del build; abrir la página no consulta NASA. Tras una actualización hay que regenerar y publicar el build para distribuirla. No hay actualización automática. La fecha de descarga no equivale a la fecha de publicación o revisión de NASA y los datos históricos pueden cambiar.

## Servicios y cálculos

| Archivo | Responsabilidad |
| --- | --- |
| `scripts/update-climate.mjs` | Descarga, hash, protección del historial y escritura |
| `src/features/climate/parse.ts` | Parser y metadatos reutilizados por script y pruebas |
| `src/features/climate/types.ts` | Tipos de filas, fechas, intervalos y conjunto |
| `src/features/climate/math.ts` | Consultas y funciones matemáticas puras |
| `src/features/climate/service.ts` | Acceso al JSON y resumen |
| `src/features/climate/useClimateData.ts` | Acceso síncrono desde React |
| `src/features/explorer/ClimateSummaryPanel.tsx` | Último mes, último J-D completo y procedencia |
| `src/features/climate/climate.test.ts` | Pruebas con fixtures sintéticos y validación del JSON real |

Las fechas se expresan como `{ year, month }` con mes de 1 a 12. Los intervalos incluyen ambos extremos. Fechas mal formadas o intervalos invertidos lanzan `RangeError`; fechas válidas fuera de cobertura devuelven `null` (consulta puntual) o una lista vacía (intervalo).

- `getMonthlyAnomaly`, `getAnnualAnomaly`: valor mensual o J-D oficial; el anual requiere los 12 meses y J-D. No reconstruye J-D promediando valores mensuales redondeados.
- `queryInterval`: meses válidos, ordenados, dentro del rango; omite faltantes.
- `averageRange`: media aritmética mensual, con igual peso por mes. Devuelve `{ mean, count, expected, complete }`. Por defecto `mean` es `null` si falta cualquier mes, incluso si el intervalo sale de cobertura. Con `allowPartial = true`, promedia únicamente meses disponibles y mantiene `complete: false`; una ventana vacía siempre devuelve `null`.
- `averageWindows`: aplica ese cálculo a ventanas explícitas, que pueden solaparse. Para una media móvil, el consumidor proporciona ventanas consecutivas de la anchura deseada.
- `compareWindows`: diferencia **segunda media menos primera media**, sin ocultar coberturas; `null` si alguna media no se puede calcular.
- `getFirstRecord`, `getLastRecord`: extremos de los meses válidos, o `null` en una serie vacía.
- `averageAnnualRange`: media aritmética de J-D completos, con igual peso por año; requiere todos los años del intervalo.

Ejemplo (desde un archivo dentro de `src/`):

```ts
import { getClimateData } from './features/climate/service'
import { averageRange, getParisThresholds } from './features/climate/math'

const { years } = getClimateData()
const average = averageRange(years, {
  start: { year: 2000, month: 1 },
  end: { year: 2009, month: 12 },
})
const thresholds = getParisThresholds(years)
```

### Aproximación a los niveles de París

`getParisThresholds` calcula **B = suma de J-D de 1880 a 1900 / 21**, exigiendo todos los J-D completos. Los niveles expresados en la escala NASA 1951–1980 son **B + 1,5 °C** y **B + 2,0 °C**. Para convertir una anomalía NASA A a la referencia aproximada 1880–1900, se utiliza **A − B**. No hay una constante histórica fijada en el código y no se redondea antes de calcular; el panel redondea solo al mostrar.

**1880–1900 es una aproximación educativa**, limitada por el inicio de esta serie; no reproduce toda la referencia preindustrial 1850–1900. Los niveles no son +1,5 y +2,0 en la escala NASA. Un mes o un año por encima de un nivel no demuestra que se haya superado un objetivo de calentamiento a largo plazo del Acuerdo de París. No se estima incertidumbre ni se produce una evaluación oficial del cumplimiento de esos objetivos.

## Accesibilidad y diseño

El pulido visual se concentra en `src/polish.css`: ritmo vertical más compacto en Inicio, cards y enlaces con respuesta de hover/foco, tarjetas editoriales de Historia y el contenedor adaptable de Unity WebGL. Las tarjetas de Minijuegos describen los cinco temas disponibles. Las transiciones duran 170 ms y los desplazamientos de enlaces/cards son de 2–3 px; con movimiento reducido se eliminan desplazamientos y animaciones.

El menú mantiene su comportamiento de navegación desplegable (no es un diálogo modal). Incluye backdrop, estado activo, Escape y cierre exterior. Bloquea el scroll del fondo mientras está abierto y restaura el valor previo al cerrar o desmontar. El panel tiene scroll propio en pantallas bajas; salir de la cabecera con teclado cierra el menú. El planeta comparte un único contorno entre océano y `clipPath`, calculado con la envolvente de la proyección original y un margen mínimo: conserva los continentes sin deformarlos y recorta todas las capas geográficas en el mismo límite.

Diseño adaptable a escritorio, tableta y móvil con rejillas que pasan a una columna. Navegación semántica, un título principal por página, enlace para saltar al contenido, foco visible, título del documento por ruta y foco en el contenido al navegar. El menú utiliza un botón con `aria-expanded` y `aria-controls`; se cierra con el botón, Escape, clic exterior, selección de enlace o al salir de sus enlaces mediante teclado. Escape devuelve el foco al botón.

## Referencias y límites

- GISTEMP Team, 2026: [GISS Surface Temperature Analysis, versión 4](https://data.giss.nasa.gov/gistemp/). NASA Goddard Institute for Space Studies. Primera descarga de esta implementación: 31 de octubre de 2026. Consultar `downloadedAt` para la descarga vigente.
- Lenssen et al. (2024): [A GISTEMPv4 observational uncertainty ensemble](https://doi.org/10.1029/2023JD040179). Journal of Geophysical Research: Atmospheres, 129, e2023JD040179.
- [Referencia del profesor](https://temperatura-mu.vercel.app/): el acceso mediante la herramienta de consulta falló. Se conserva como recurso proporcionado, sin atribuirle funcionalidades ni reutilizar código.

Los períodos de Historia son una estructura editorial, no una cronología documentada todavía. El globo de Inicio es una ilustración conceptual. La línea de tiempo interactiva empieza en 1926 y acaba en el último mes de los metadatos; las bandas históricas no restringen ese recorrido. Este CSV global no contiene datos espaciales para colorear regiones del mapa.
