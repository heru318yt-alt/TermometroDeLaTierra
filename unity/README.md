# Unity: minijuegos

Esta carpeta reúne la parte hecha en Unity y su relación con la página web.

## Qué abrir

- **Proyecto editable:** `TermometroMinijuegos/` — ábrelo desde Unity Hub.
- **Escena de entrada:** `TermometroMinijuegos/Assets/Scenes/Inicio.unity`.
- **Misiones 2D:** `Energia`, `Industria`, `Movilidad`, `Bosques` y `Agricultura`.
- **Juego e interacciones:** `TermometroMinijuegos/Assets/Scripts/TermometroMinijuegos.cs`.
- **Arte y personaje original:** `TermometroMinijuegos/Assets/Scripts/TierraArt.cs`.
- **Música y efectos:** `TermometroMinijuegos/Assets/Scripts/TierraAudio.cs`.
- **Herramientas del editor:** `TermometroMinijuegos/Assets/Editor/UnityProjectSetup.cs`.
- **Diseño adaptable para WebGL:** `TermometroMinijuegos/Assets/WebGLTemplates/Tierra/`.
- **Versión que carga la web:** `../public/unity-minijuegos/`.

## Flujo de actualización

1. Abre `TermometroMinijuegos/` en Unity Hub.
2. Si faltan escenas, usa **Termómetro → Crear todas las escenas 2D**. Cada mundo se guarda por separado dentro de `Assets/Scenes/`.
3. Edita la lógica, el arte o el audio dentro de `Assets/Scripts/`.
4. En Unity, usa **Termómetro → Compilar WebGL para la web**.
5. La compilación usa un lienzo 16:9 adaptable, incluye el menú y las cinco misiones, y reemplaza `public/unity-minijuegos/`, que consume `/minijuegos`.

El personaje Terra, los paisajes y los iconos son ilustraciones originales 2D generadas localmente por el proyecto. La música y los efectos también se sintetizan en ejecución, sin depender de descargas externas. El panel `♫` permite ajustar música y efectos por separado. La página mantiene un marco adaptable para escritorio y móvil.

Unity crea `Library/`, `Logs/` y `UserSettings/` al abrir el proyecto. Son cachés locales ignoradas por Git; no hace falta ordenarlas ni subirlas.

Para requisitos, versión de Unity, instalación de WebGL y ejecución por línea de comandos, consulta [la guía del proyecto](TermometroMinijuegos/README.md).
