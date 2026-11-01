using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

/// <summary>
/// Prototipo autónomo de cinco minijuegos educativos. Añade este componente a
/// un GameObject vacío en una escena; crea su interfaz al iniciar.
/// No necesita assets externos. Compatible con controles táctiles y WebGL.
/// </summary>
public sealed class TermometroMinijuegos : MonoBehaviour
{
    private const int TotalRondas = 4;
    private static readonly Color Fondo = new Color32(247, 248, 242, 255);
    private static readonly Color Tarjeta = new Color32(255, 254, 248, 255);
    private static readonly Color Verde = new Color32(23, 63, 53, 255);
    private static readonly Color Texto = new Color32(32, 62, 53, 255);
    private static readonly Color Suave = new Color32(93, 108, 99, 255);

    private Canvas canvas;
    private RectTransform contenido;
    private int juego = -1;
    private int ronda;
    private int puntos;
    private int emisiones;
    private int bienestar;
    private string mensaje = "";
    private bool finalizado;
    private Font fuente;

    private sealed class Juego
    {
        public string titulo;
        public string tema;
        public string intro;
        public string balanceLabel;
        public string[] rondas;
        public string[][] opciones;
        public string[][] consecuencias;
        public int[] recomendada;
        public string unidad;
    }

    private readonly Juego[] juegos =
    {
        new Juego {
            titulo="Energía para todos", tema="ENERGÍA · 1970-1989",
            intro="Mantén el suministro mientras eliges cómo transformar la matriz energética. Cada decisión tiene ventajas y límites.", unidad="puntos de presión climática (simulación)", balanceLabel="Continuidad de la red",
            rondas=new[]{"La demanda eléctrica aumenta en una ciudad.","Una región necesita energía confiable por la noche.","La red debe responder a una semana de alta demanda.","Es hora de planear la siguiente década."},
            opciones=new[]{new[]{"Ampliar carbón","Combinar solar y almacenamiento","Reducir pérdidas de la red"},new[]{"Depender solo de gas","Mezclar renovables con respaldo flexible","Aplazar mejoras de red"},new[]{"Cubrir el pico con carbón","Gestionar demanda y almacenamiento","Racionar energía sin plan"},new[]{"Seguir con la matriz actual","Invertir en eficiencia y renovables","Cerrar toda generación de golpe"}},
            consecuencias=new[]{new[]{"El carbón puede dar respaldo gestionable, pero emite al operar.","La solar y el almacenamiento reducen dependencia fósil; requieren red y respaldo.","Reducir pérdidas baja la energía necesaria para prestar el mismo servicio."},new[]{"El gas puede aportar respaldo; también genera emisiones al operar.","Una mezcla de fuentes y respaldo flexible distribuye riesgos de suministro.","Aplazar la red dificulta integrar fuentes renovables variables."},new[]{"El carbón cubre picos con generación gestionable, pero aumenta la presión climática.","Almacenamiento y gestión de demanda reducen el pico de generación requerido.","Racionar sin plan puede afectar la continuidad y el acceso al servicio."},new[]{"Mantener la matriz actual posterga inversiones en eficiencia y fuentes limpias.","Una transición gradual mejora la matriz y permite planificar la confiabilidad.","Cerrar toda generación de inmediato pone en riesgo el suministro si no hay reemplazos."}},
            recomendada=new[]{2,1,1,1},
        },
        new Juego {
            titulo="Fábrica con futuro", tema="INDUSTRIA · 1990-1999",
            intro="Cumple las metas de producción y compara decisiones sobre cemento, acero y procesos industriales.", unidad="puntos de presión climática (simulación)", balanceLabel="Producción y uso eficiente de materiales",
            rondas=new[]{"Hay que construir viviendas con cemento.","La ciudad necesita acero para reparar un puente.","Una fábrica busca producir más con la misma energía.","Se planea una nueva planta industrial."},
            opciones=new[]{new[]{"Cemento convencional para todo","Usar menos material y cemento de menor huella","Cancelar las viviendas"},new[]{"Acero nuevo con horno convencional","Reutilizar acero y mejorar el proceso","Usar un material sin revisar su ciclo de vida"},new[]{"Mantener equipos antiguos","Electrificar y recuperar calor donde sea viable","Aumentar turnos sin cambiar el proceso"},new[]{"Diseñar para eficiencia y durabilidad","Elegir solo por costo inicial","Construir capacidad sin prever demanda"}},
            consecuencias=new[]{new[]{"El cemento convencional usa energía y libera CO₂ al fabricarse.","Reducir material y elegir cemento de menor huella baja impactos por vivienda.","Cancelar la obra evita materiales, pero no resuelve la necesidad de vivienda."},new[]{"El acero primario requiere energía y emite durante su producción.","Reutilizar acero puede evitar parte de la producción primaria.","Sin revisar el ciclo de vida, el material alternativo puede trasladar impactos."},new[]{"Los equipos antiguos pueden gastar más energía por unidad producida.","Electrificar y recuperar calor puede mejorar la eficiencia del proceso.","Aumentar turnos sin mejorar procesos eleva la energía requerida."},new[]{"Diseñar para durar y ahorrar material evita demanda futura innecesaria.","El costo inicial puede ignorar los materiales usados durante la vida útil.","Ampliar sin prever demanda puede dejar capacidad y materiales sin uso."}},
            recomendada=new[]{1,1,1,0},
        },
        new Juego {
            titulo="Rutas que conectan", tema="TRANSPORTE · 2000-2009",
            intro="Lleva personas y mercancías a su destino. Elige una opción adecuada para cada recorrido.", unidad="puntos de presión climática (simulación)", balanceLabel="Viajes y carga atendidos",
            rondas=new[]{"Una persona viaja al centro en hora pico.","Una familia planea un trayecto interurbano.","Un comercio debe mover carga entre ciudades.","Un equipo necesita cruzar el océano."},
            opciones=new[]{new[]{"Viajar en auto con una sola persona","Usar transporte público","Caminar o ir en bici si el trayecto lo permite"},new[]{"Un auto para cada viajero","Compartir vehículo o tomar tren","Hacer el viaje aunque pueda resolverse a distancia"},new[]{"Envíos urgentes separados por avión","Consolidar carga y usar tren o barco cuando aplique","Enviar vehículos vacíos de regreso"},new[]{"Volar sin revisar alternativas","Comparar rutas y evitar viajes innecesarios","No considerar el combustible del trayecto"}},
            consecuencias=new[]{new[]{"Un auto con una persona suele emitir más por pasajero que un modo compartido.","El transporte público mueve a varias personas con menos vehículos.","Caminar o ir en bici evita emisiones directas en distancias adecuadas."},new[]{"Un auto por viajero multiplica vehículos para cubrir el mismo trayecto.","Compartir el viaje o tomar tren puede reducir emisiones por pasajero.","Resolver a distancia evita emisiones si el viaje no es necesario."},new[]{"Envíos aéreos separados suelen usar más energía que la carga consolidada.","Consolidar carga y elegir tren o barco cuando aplique puede ahorrar energía.","Los viajes vacíos consumen combustible sin mover personas ni mercancías."},new[]{"La aviación emite gases de efecto invernadero durante el vuelo.","Evitar viajes innecesarios y comparar rutas puede reducir emisiones.","Ignorar el combustible oculta una parte del impacto del trayecto."}},
            recomendada=new[]{2,1,1,1},
        },
        new Juego {
            titulo="Bosque en equilibrio", tema="USO DEL SUELO · 2010-2019",
            intro="Toma decisiones sobre bosques y territorio teniendo en cuenta carbono, biodiversidad y necesidades locales.", unidad="puntos de presión climática (simulación)", balanceLabel="Ecosistema y medios de vida",
            rondas=new[]{"Se propone ampliar un cultivo sobre bosque natural.","Una zona degradada necesita recuperar su cobertura.","Una comunidad depende del bosque para su sustento.","Se diseña un plan de uso del suelo a largo plazo."},
            opciones=new[]{new[]{"Talar sin planificación","Producir en áreas ya transformadas y proteger bosque","Prohibir toda actividad sin consultar a la comunidad"},new[]{"Dejar la zona sin seguimiento","Restaurar especies nativas y monitorear","Plantar una sola especie en toda el área"},new[]{"Excluir a quienes viven allí","Acordar manejo sostenible con la comunidad","Permitir extracción sin límites"},new[]{"Expandir sin medir impactos","Planificar producción y conservación juntas","Trasladar el problema a otra región"}},
            consecuencias=new[]{new[]{"Convertir bosque natural libera carbono almacenado y reduce hábitat.","Usar áreas transformadas reduce presión sobre ecosistemas intactos.","Excluir a la comunidad puede perjudicar sus medios de vida."},new[]{"Sin seguimiento, la restauración puede no recuperar funciones del ecosistema.","Especies nativas y monitoreo ayudan a evaluar la recuperación.","Una sola especie aporta menos diversidad que un ecosistema restaurado."},new[]{"Excluir a quienes viven allí ignora sus derechos y conocimientos.","Acordar el manejo puede cuidar bosque y medios de vida locales.","La extracción sin límites puede degradar bosque y carbono almacenado."},new[]{"Expandir sin medir puede convertir ecosistemas y desplazar la deforestación.","Planificar producción y conservación juntas reduce impactos territoriales.","Trasladar la actividad puede mover la deforestación a otro lugar."}},
            recomendada=new[]{1,1,1,1},
        },
        new Juego {
            titulo="Alimentos con menos impacto", tema="AGRICULTURA · 2020-2025",
            intro="Ayuda a producir alimentos mientras consideras metano, fertilizantes, suelo y bienestar rural.", unidad="puntos de presión climática (simulación)", balanceLabel="Alimentos y cuidado del suelo",
            rondas=new[]{"Una finca busca mejorar su producción ganadera.","El cultivo requiere fertilización nitrogenada.","La cosecha deja residuos orgánicos.","Una región quiere fortalecer su sistema alimentario."},
            opciones=new[]{new[]{"Ignorar fugas de metano","Mejorar manejo del estiércol y alimentación","Aumentar el hato sin plan"},new[]{"Aplicar fertilizante sin medir","Ajustar dosis al suelo y al cultivo","Duplicar dosis por seguridad"},new[]{"Quemar residuos en campo","Aprovechar residuos y proteger el suelo","Dejar residuos en un vertedero sin control"},new[]{"Depender de una sola cadena larga","Reducir pérdidas y diversificar producción","Aumentar producción sin evaluar agua y suelo"}},
            consecuencias=new[]{new[]{"El metano del ganado contribuye al calentamiento global.","Mejorar estiércol y alimentación puede reducir emisiones de metano.","Aumentar el hato sin plan puede elevar emisiones y presión sobre recursos."},new[]{"Aplicar fertilizante de más puede aumentar pérdidas de nitrógeno.","Ajustar la dosis al cultivo reduce desperdicio y pérdidas.","Duplicar la dosis no garantiza mejor cosecha y puede aumentar emisiones."},new[]{"Quemar residuos libera gases y reduce materia orgánica del suelo.","Aprovechar residuos y cubrir el suelo puede proteger su estructura.","Un vertedero sin control puede producir metano al descomponerse residuos."},new[]{"Una cadena larga puede ser vulnerable a interrupciones y pérdidas.","Reducir desperdicio y diversificar puede mejorar resiliencia alimentaria.","Producir sin evaluar agua y suelo puede degradar recursos locales."}},
            recomendada=new[]{1,1,1,1},
        }
    };

    private void Awake()
    {
        fuente = Resources.GetBuiltinResource<Font>("Arial.ttf");
        CrearCanvas();
        MostrarInicio();
    }

    private void CrearCanvas()
    {
        var go = new GameObject("Termómetro UI", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        go.transform.SetParent(transform, false);
        canvas = go.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        var scaler = go.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(960, 600);
        scaler.matchWidthOrHeight = 0.5f;
        var bg = Panel(go.transform, Fondo, "Fondo");
        Stretch(bg.rectTransform, 0, 0, 0, 0);

        var header = Panel(bg.transform, new Color32(23, 63, 53, 255), "Cabecera");
        Anchor(header.rectTransform, 0, 1, 1, 1, 0, -76, 0, 0);
        var brand = Label(header.transform, "TERMÓMETRO DE LA TIERRA", 25, new Color32(245, 248, 240, 255), FontStyle.Bold, TextAnchor.MiddleLeft);
        Anchor(brand.rectTransform, 0, 0, 1, 1, 42, 0, -42, 0);

        var scrollGo = new GameObject("Área desplazable", typeof(RectTransform), typeof(ScrollRect), typeof(Image), typeof(Mask));
        scrollGo.transform.SetParent(bg.transform, false);
        Anchor(scrollGo.GetComponent<RectTransform>(), 0, 0, 1, 1, 0, 0, 0, -76);
        scrollGo.GetComponent<Image>().color = Fondo;
        scrollGo.GetComponent<Mask>().showMaskGraphic = false;
        var bodyGo = new GameObject("Contenido", typeof(RectTransform), typeof(VerticalLayoutGroup), typeof(ContentSizeFitter));
        bodyGo.transform.SetParent(scrollGo.transform, false);
        contenido = bodyGo.GetComponent<RectTransform>();
        contenido.anchorMin = new Vector2(0.5f, 1); contenido.anchorMax = new Vector2(0.5f, 1);
        contenido.pivot = new Vector2(0.5f, 1); contenido.sizeDelta = new Vector2(980, 0);
        var v = bodyGo.GetComponent<VerticalLayoutGroup>();
        v.padding = new RectOffset(24, 24, 14, 14); v.spacing = 10;
        v.childControlWidth = true; v.childControlHeight = true; v.childForceExpandWidth = true; v.childForceExpandHeight = false;
        bodyGo.GetComponent<ContentSizeFitter>().verticalFit = ContentSizeFitter.FitMode.PreferredSize;
        var scroll = scrollGo.GetComponent<ScrollRect>();
        scroll.content = contenido; scroll.horizontal = false; scroll.vertical = true; scroll.movementType = ScrollRect.MovementType.Clamped;

        if (FindAnyObjectByType<EventSystem>() == null)
        {
            var events = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            events.transform.SetParent(transform, false);
        }
    }

    private void Update()
    {
        if (contenido == null) return;
        float max = Mathf.Min(980, Mathf.Max(300, canvas.GetComponent<RectTransform>().rect.width - 48));
        if (Mathf.Abs(contenido.sizeDelta.x - max) > 2) contenido.sizeDelta = new Vector2(max, contenido.sizeDelta.y);
    }

    private void MostrarInicio()
    {
        juego = -1; ronda = 0; puntos = 0; emisiones = 0; bienestar = 0; mensaje = ""; finalizado = false;
        Limpiar();
        AddCard("UNA EXPERIENCIA INTERACTIVA SOBRE EL CLIMA", "Cinco retos para explorar energía, industria, movilidad, bosques y alimentos. Cada partida presenta compensaciones; no existe una única solución para todos los contextos.", 82);
        AddText("Elige un minijuego", 24, Texto, FontStyle.Bold, 30);
        for (int i = 0; i < juegos.Length; i++)
        {
            int index = i;
            AddButton(juegos[i].tema + "   ·   " + juegos[i].titulo, "JUGAR", () => Iniciar(index), 48);
        }
        AddCard("CÓMO LEER LOS RESULTADOS", "Los puntos son didácticos, no mediciones reales ni datos de NASA GISTEMP. Una decisión individual no explica una variación concreta de temperatura.", 50);
    }

    private void Iniciar(int index)
    {
        juego = index; ronda = 0; puntos = 0; emisiones = 0; bienestar = 0; mensaje = ""; finalizado = false;
        MostrarJuego();
    }

    private void MostrarJuego()
    {
        Limpiar();
        Juego actual = juegos[juego];
        AddButton("← TODOS LOS MINIJUEGOS", "VOLVER", MostrarInicio, 46);
        AddCard(actual.tema, actual.titulo + "\n" + actual.intro, 104);
        if (finalizado)
        {
            AddCard("RETO COMPLETADO", "Decisiones alineadas con el objetivo del escenario: " + puntos + " de " + TotalRondas + "\n" + actual.unidad + ": " + emisiones + "\n" + actual.balanceLabel + ": " + bienestar + " / " + (TotalRondas * 2), 98);
            AddCard("PARA LLEVAR", "Las decisiones climáticas interactúan entre sectores y dependen del lugar, la tecnología y las necesidades locales. Este resultado sirve para conversar, no para comparar países ni medir emisiones reales.", 80);
            AddButton("JUGAR OTRA VEZ", "REPETIR", () => Iniciar(juego), 54);
            AddButton("ELEGIR OTRO RETO", "MENÚ", MostrarInicio, 54);
            return;
        }

        string barra = "DECISIÓN " + (ronda + 1) + " DE " + TotalRondas + "     ·     " + actual.tema;
        AddCard(barra, actual.rondas[ronda], 76);
        AddCard("BALANCE DEL ESCENARIO", actual.balanceLabel + ": " + bienestar + " / " + (TotalRondas * 2) + "   ·   " + actual.unidad + ": " + emisiones, 60);
        if (!string.IsNullOrEmpty(mensaje)) AddCard("RESULTADO DE TU DECISIÓN", mensaje, 74);
        string[] choices = actual.opciones[ronda];
        for (int i = 0; i < choices.Length; i++)
        {
            int choice = i;
            AddButton(choices[i], "ELEGIR", () => Elegir(choice), 56);
        }
        AddText("Avance: " + new string('●', ronda) + new string('○', TotalRondas - ronda), 18, Suave, FontStyle.Normal, 30);
    }

    private void Elegir(int opcion)
    {
        Juego actual = juegos[juego];
        bool buena = opcion == actual.recomendada[ronda];
        if (buena) { puntos++; emisiones += 1; bienestar += 2; }
        else { emisiones += (opcion == 0 ? 3 : 2); bienestar += (opcion == 2 ? 0 : 1); }
        mensaje = (buena ? "Decisión alineada con el reto. " : "Priorizaste otro objetivo. ") + actual.consecuencias[ronda][opcion];
        ronda++;
        if (ronda >= TotalRondas) finalizado = true;
        MostrarJuego();
    }

    private void Limpiar()
    {
        for (int i = contenido.childCount - 1; i >= 0; i--) Destroy(contenido.GetChild(i).gameObject);
    }

    private void AddCard(string eyebrow, string body, float height)
    {
        var card = Panel(contenido, Tarjeta, "Tarjeta");
        var le = card.gameObject.AddComponent<LayoutElement>(); le.minHeight = height; le.preferredHeight = height;
        var title = Label(card.transform, eyebrow, 14, Verde, FontStyle.Bold, TextAnchor.MiddleLeft);
        Anchor(title.rectTransform, 0, 0.68f, 1, 1, 22, -7, -22, -8);
        var text = Label(card.transform, body, 19, Texto, FontStyle.Normal, TextAnchor.UpperLeft);
        Anchor(text.rectTransform, 0, 0, 1, 0.68f, 22, 10, -22, -5);
    }

    private void AddText(string value, int size, Color color, FontStyle style, float height)
    {
        var text = Label(contenido, value, size, color, style, TextAnchor.MiddleLeft);
        text.gameObject.AddComponent<LayoutElement>().preferredHeight = height;
    }

    private void AddButton(string label, string action, Action callback, float height)
    {
        var button = Panel(contenido, Tarjeta, "Opción");
        button.gameObject.AddComponent<LayoutElement>().preferredHeight = height;
        var b = button.gameObject.AddComponent<Button>();
        var colors = b.colors; colors.normalColor = new Color32(255, 254, 248, 255); colors.highlightedColor = new Color32(237, 242, 231, 255); colors.pressedColor = new Color32(228, 236, 218, 255); colors.selectedColor = colors.highlightedColor; b.colors = colors;
        b.targetGraphic = button;
        b.onClick.AddListener(() => callback());
        var main = Label(button.transform, label, 18, Texto, FontStyle.Bold, TextAnchor.MiddleLeft);
        Anchor(main.rectTransform, 0, 0, 0.78f, 1, 20, 0, 0, 0);
        var hint = Label(button.transform, action + "  →", 15, Verde, FontStyle.Bold, TextAnchor.MiddleRight);
        Anchor(hint.rectTransform, 0.78f, 0, 1, 1, 0, 0, -18, 0);
    }

    private Image Panel(Transform parent, Color color, string name)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image));
        go.transform.SetParent(parent, false);
        var image = go.GetComponent<Image>(); image.color = color;
        return image;
    }

    private Text Label(Transform parent, string value, int size, Color color, FontStyle style, TextAnchor alignment)
    {
        var go = new GameObject("Texto", typeof(RectTransform), typeof(Text)); go.transform.SetParent(parent, false);
        var t = go.GetComponent<Text>(); t.text = value; t.font = fuente; t.fontSize = size; t.color = color; t.fontStyle = style; t.alignment = alignment;
        t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Overflow; t.supportRichText = false; t.raycastTarget = false;
        return t;
    }

    private static void Stretch(RectTransform rect, float left, float bottom, float right, float top)
    {
        rect.anchorMin = Vector2.zero; rect.anchorMax = Vector2.one; rect.offsetMin = new Vector2(left, bottom); rect.offsetMax = new Vector2(-right, -top);
    }

    private static void Anchor(RectTransform rect, float xMin, float yMin, float xMax, float yMax, float left, float bottom, float right, float top)
    {
        rect.anchorMin = new Vector2(xMin, yMin); rect.anchorMax = new Vector2(xMax, yMax);
        rect.offsetMin = new Vector2(left, bottom); rect.offsetMax = new Vector2(right, top);
    }
}
