# Unity: minijuegos

El proyecto Unity editable es `Minijuegos_Termo/` (Unity 6.3.14f1). Ábrelo desde Unity Hub.

- Escena principal: `Assets/GAME/SCENES/Mapa.unity`.
- Misiones: energía, fábrica, rutas, bosque y finca.
- Informe de pruebas: `Assets/DOCUMENTATION/VALIDATION_REPORT.md`.
- Créditos y licencias: `Assets/DOCUMENTATION/ASSET_CREDITS.md`.
- Build WebGL editable: `Build/WebGL/`.
- Build que carga la página: `../public/unity-minijuegos/`.

Para recompilar, abre el proyecto y usa `Termómetro de la Tierra > Compilar WebGL`. Copia la salida a `public/unity-minijuegos/` conservando la plantilla de la página (`index.html` y `style.css`) y los nombres de archivos que indica su configuración. El build publicado se guarda sin compresión Brotli para que funcione en el hosting estático sin configuración adicional de cabeceras.

Unity regenera `Library/`, `Logs/` y `UserSettings/` al abrir el proyecto; no es necesario subir esas carpetas.
