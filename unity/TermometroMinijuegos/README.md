# Minijuegos de Termómetro de la Tierra (Unity)

Proyecto independiente de Unity 6 para los cinco minijuegos educativos. La web carga el build WebGL que se genera en `public/unity-minijuegos/`; el código y la escena nativos permanecen aquí.

## Abrir en Unity

1. En Unity Hub, añade la carpeta `unity/TermometroMinijuegos`.
2. Ábrela con Unity **6000.3.14f1** o una versión Unity 6 compatible. El Package Manager resolverá `com.unity.ugui`.
3. Abre `Assets/Scenes/Inicio.unity` para ver el mapa de aventuras. Cada misión tiene su propia escena y su interfaz se crea al iniciar.
4. Las seis escenas incluidas en el build están en `Assets/Scenes/`: `Inicio`, `Energia`, `Industria`, `Movilidad`, `Bosques` y `Agricultura`.
5. Para reconstruir las seis escenas: menú **Termómetro → Crear todas las escenas 2D**. La escena `Minijuegos.unity`, si aparece en el proyecto, es un prototipo anterior y no forma parte del build.

## Crear/actualizar el juego en la web

Instala el módulo **WebGL Build Support** para la versión de Unity usada. Luego, desde Unity, selecciona **Termómetro → Compilar WebGL para la web**. El build se guarda en `../../public/unity-minijuegos`, ruta relativa al proyecto Unity. Contiene `index.html`, `style.css` y `Build/`; la página `/minijuegos` lo carga en un iframe adaptable.

También puede ejecutarse con Unity en modo batch:

```powershell
& 'C:\Program Files\Unity\Hub\Editor\6000.3.14f1\Editor\Unity.exe' `
  -batchmode -quit `
  -projectPath 'D:\ComputacionGrafica\TermometroDeLaTierra\unity\TermometroMinijuegos' `
  -executeMethod UnityProjectSetup.BuildWebGl `
  -logFile 'D:\ComputacionGrafica\TermometroDeLaTierra\work\unity-webgl-build.log'
```

## Temas y alcance

- Energía: continuidad, eficiencia y transición de la matriz.
- Industria: cemento, acero, materiales y procesos.
- Transporte: viajes cotidianos con bus, bicicleta, caminata y auto compartido.
- Bosques: uso del suelo, restauración y comunidades.
- Agricultura: metano, nitrógeno, residuos y resiliencia alimentaria.

Los marcadores de cada reto son valores internos de una simulación educativa; no son factores de emisión medidos, datos GISTEMP ni una predicción. La aplicación explica los límites para no confundir las partidas con la visualización climática.
