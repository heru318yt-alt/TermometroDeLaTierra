# Informe de validación

**Proyecto:** `Minijuegos_Termo`  
**Entorno:** Unity 6.3.14f1, compilación WebGL local  
**Fecha:** 2 de noviembre de 2026

## Escenas y TextMeshPro

El menú `Termómetro de la Tierra > Validar escenas y TMP` validó seis escenas y encontró 116 objetos `TextMeshProUGUI` serializados. No encontró etiquetas legacy:

| Escena | TextMeshProUGUI |
| --- | ---: |
| Mapa | 22 |
| Energía viva | 22 |
| Fábrica circular | 23 |
| Rutas que respiran | 17 |
| Bosque guardián | 16 |
| Finca del futuro | 16 |
| **Total** | **116** |

## Partidas en Play Mode

- **Energía viva:** se completaron tres rondas; las fuentes actualizaron generación y carbono, y la evaluación mostró el estado de la red.
- **Fábrica circular:** se clasificaron 12 de 12 materiales, incluido cartón en su quinta categoría; el resultado tuvo contaminación cero y rango destacado.
- **Rutas que respiran:** se completaron los seis viajes y el informe evaluó los medios elegidos.
- **Bosque guardián:** se completaron las tres estaciones; el resultado registró 8 árboles, 2/2 nidos protegidos, 6 semillas y 6 riegos. Después se comprobó que regar cambia la semilla a la etapa de planta joven con el sprite de `PlantData`.
- **Finca del futuro:** se completaron tres temporadas; el resultado registró cosecha 30, diversidad 9/9 y 12 cambios de rotación. En esa partida se usaron 0 riegos y 0 aplicaciones de compost, dato que el informe ahora presenta correctamente.

## WebGL

La compilación local terminó con resultado `Succeeded`: 14,5 MB y 26 min 32 s en la primera compilación del proyecto. Los archivos se encuentran en `Build/WebGL`, con `index.html` en la raíz. La salida usa Brotli; revisa [WEBGL_BUILD.md](WEBGL_BUILD.md) para las cabeceras necesarias al publicarla.

## Audio

El `TierraAudioManager` y sus campos opcionales están serializados en las escenas. No se añadieron clips de audio; el juego sigue funcionando sin ellos.
