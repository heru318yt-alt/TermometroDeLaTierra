# Compilación WebGL

- Abre `Termómetro de la Tierra > Compilar WebGL` en Unity.
- La salida queda en `Build/WebGL/index.html` junto con sus carpetas `Build` y `TemplateData`.
- La salida actual usa compresión Brotli. Al publicar, el servidor debe responder con `Content-Encoding: br` para los archivos `.br`; asigna `application/wasm` a `.wasm.br`, `application/javascript` a `.js.br` y `application/octet-stream` a `.data.br`.
- La configuración del servidor depende del hosting. Consulta la [guía oficial de Unity para publicar WebGL comprimido](https://docs.unity3d.com/es/current/Manual/webgl-deploying.html).

El comando solo limpia una salida anterior si encuentra su marcador en `Build/.termometro-webgl-generated`. Si `Build/WebGL` ya existe con contenido ajeno, se detiene y preserva esos archivos.
