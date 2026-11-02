# Validación visual del rediseño

Capturas de página completa tomadas con el navegador de la aplicación el 2 de noviembre de 2026.

- **Escritorio:** 1440 px de ancho.
- **Móvil:** 390 px de ancho (portada).
- **Rutas comprobadas:** `/`, `/explorador`, `/linea-del-tiempo`, `/historia`, `/factores`, `/minijuegos`, `/fuentes`, `/acerca`.

## Portada

| Antes | Después |
| --- | --- |
| ![Portada anterior](antes/portada.jpg) | ![Portada rediseñada](despues/portada.jpg) |

## Explorador climático

| Antes | Después |
| --- | --- |
| ![Explorador anterior](antes/explorador.jpg) | ![Explorador rediseñado](despues/explorador.jpg) |

## Línea del tiempo

La ruta `/linea-del-tiempo` es nueva. Antes, los controles temporales vivían dentro del explorador; la captura «antes» muestra esa composición anterior.

| Antes: controles dentro del explorador | Después: sala de instrumentos |
| --- | --- |
| ![Línea del tiempo anterior](antes/linea-del-tiempo.jpg) | ![Línea del tiempo rediseñada](despues/linea-del-tiempo.jpg) |

## Historia del clima

| Antes | Después |
| --- | --- |
| ![Historia anterior](antes/historia.jpg) | ![Historia rediseñada](despues/historia.jpg) |

## Factores del cambio climático

La ruta `/factores` es nueva. No existía una página equivalente; la captura «antes» usa Historia como el contenido previo más cercano.

| Antes: contexto histórico | Después: cinco factores |
| --- | --- |
| ![Factores anteriores](antes/factores.jpg) | ![Factores rediseñados](despues/factores.jpg) |

## Minijuegos

| Antes | Después |
| --- | --- |
| ![Minijuegos anteriores](antes/minijuegos.jpg) | ![Minijuegos rediseñados](despues/minijuegos.jpg) |

## Portada en móvil

![Portada en 390 px](despues/portada-movil.jpg)

## Comprobaciones realizadas

- `npm.cmd test`: **62 pruebas superadas**.
- `npm.cmd run build`: TypeScript estricto y build de Vite correctos.
- Sin errores de consola en las rutas comprobadas.
- Sin desbordamiento horizontal a 1440 px ni a 390 px (`scrollWidth` igual o menor que `clientWidth`).
- El explorador sincroniza fecha, anomalía, marcador del gráfico, contexto histórico y lectura al cambiar de año.
- El audio permanece apagado por defecto, recuerda volúmenes y solo crea el contexto Web Audio tras activarlo.
- El menú móvil abre con el botón, bloquea el fondo, cierra con Escape y devuelve el foco al disparador.
- Se conservan los enlaces profundos de Unity (`world=` y `return=`) y el iframe con su título accesible.
