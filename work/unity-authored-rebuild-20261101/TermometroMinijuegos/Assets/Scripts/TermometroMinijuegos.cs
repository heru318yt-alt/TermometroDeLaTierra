using System;
using System.Collections;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

/// <summary>Experiencia 2D de cinco retos climáticos para Unity y WebGL.</summary>
public sealed class TermometroMinijuegos : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern void VolverAlAtlasWeb();
#endif

    [Tooltip("-1 para el menú; 0 energía; 1 industria; 2 movilidad; 3 bosque; 4 agricultura")]
    public int sector = -1;

    private static readonly Color Verde = C(24, 67, 56);
    private static readonly Color VerdeClaro = C(54, 126, 91);
    private static readonly Color Tinta = C(37, 58, 51);
    private static readonly Color Suave = C(103, 120, 111);
    private static readonly Color Papel = C(250, 247, 237);
    private static readonly Color Tarjeta = C(255, 254, 249);
    private static readonly Color Coral = C(232, 119, 91);
    private static readonly Color Oro = C(244, 190, 77);
    private static readonly Color Azul = C(77, 155, 174);
    private static readonly string[] Escenas = { "EnergiaViva", "FabricaCircular", "RutasQueRespiran", "BosqueGuardian", "FincaDelFuturo" };
    private static readonly string[] Titulos = { "Energía viva", "Fábrica circular", "Rutas que respiran", "Bosque guardián", "La finca del futuro" };
    private static readonly string[] Temas = { "ENERGÍA", "INDUSTRIA", "TRANSPORTE", "BOSQUES", "AGRICULTURA" };
    private static readonly string[] Anios = { "1970-1989", "1990-1999", "2000-2009", "2010-2019", "2020-2025" };
    private static readonly string[] Descripciones =
    {
        "Equilibra la demanda eléctrica con sol, viento, agua, baterías y respaldo.",
        "Produce lo que necesita la ciudad usando menos materiales y energía.",
        "Lleva a las personas por rutas cómodas con menos tráfico y humo.",
        "Recupera el bosque sin perder agua, suelo ni refugios de fauna.",
        "Cultiva una cosecha diversa cuidando agua y nutrientes del suelo."
    };

    private Font fuente;
    private Canvas canvas;
    private RectTransform root;
    private RectTransform mascota;
    private Vector2 mascotaBase;
    private TierraAudio audioManager;
    private int pantalla; // 0 inicio, 1 misión, 2 partida, 3 resultado
    private int ronda;
    private int puntos;
    private int impacto;
    private int bienestar;
    private bool ajustes;
    private bool maquinaActiva;
    private bool industriaEnProceso;
    private string mensaje = "";
    private readonly RectTransform[] materialesCinta = new RectTransform[4];
    private readonly RectTransform[] etiquetasCinta = new RectTransform[4];
    private RectTransform maquinaVisual;

    private readonly bool[] fuentesElegidas = new bool[6];
    private readonly int[] conexionesEnergia = { -1, -1, -1 };
    private int fuenteActiva = -1;
    private int materialActual = -1;
    private readonly int[] procesos = { -1, -1, -1, -1 };
    private readonly int[][] procesosObras =
    {
        new[] { -1, -1, -1, -1 }, new[] { -1, -1, -1, -1 }, new[] { -1, -1, -1, -1 }
    };
    private int viaje;
    private readonly int[] eleccionesRuta = { -1, -1, -1, -1, -1, -1 };
    private readonly int[] parcelasBosque = { 0, 0, 2, 0, 1, 0, 0, 2, 0, 0, 1, 0 };
    private readonly bool[] riegoBosque = new bool[12];
    private readonly bool[] bosquePlantado = new bool[12];
    private int semillas = 2;
    private int aguaBosque = 2;
    private int modoBosque;
    private int plantadosEstaTemporada;
    private int totalPlantados;
    private int totalRegados;
    private readonly int[] parcelasCultivo = { 0, 0, 0, 0, 0, 0 };
    private readonly int[] cultivoAnterior = { -1, -1, -1, -1, -1, -1 };
    private readonly bool[] compostado = new bool[6];
    private readonly bool[] riegoCultivo = new bool[6];
    private int parcelaSeleccionada = -1;
    private int compost = 2;
    private int aguaCultivo = 2;
    private bool ciudadEncendida;
    private int mezclaVisualEnergia;
    private int pasajeroVisual = -1;
    private int modoViajeVisual = -1;
    private int rutasAdecuadas;
    private float inicioAnimacionRuta;
    private RectTransform vehiculoRuta;
    private readonly int[] usosFuentes = new int[6];
    private readonly int[] usosProcesos = new int[4];
    private readonly int[] usosViajes = new int[4];
    private readonly int[] usosCultivos = new int[3];
    private int turnosEnergiaCubiertos;
    private int turnosEnergiaLimpios;
    private int ahorrosEnergia;
    private int rotacionesTotales;
    private int compostTotal;
    private int riegoTotal;
    private bool planAhorro;
    private static readonly string[] Viajeros =
    {
        "Lina · escuela a 1 km", "Mateo · campus a 8 km", "Sara · mercado con bolsas",
        "Nico · turno nocturno", "Grupo del barrio · parque", "Eva · centro de salud"
    };
    private static readonly string[] ContextosViaje =
    {
        "Trayecto corto y con aceras seguras.", "El camino es largo; caminar no alcanza hoy.",
        "Llevan compras pesadas: piensen en espacio y compañía.", "Es tarde y el grupo prioriza una ruta segura.",
        "Varias personas salen del mismo punto.", "El destino tiene acceso sin escalones y poco espacio para estacionar."
    };
    private static readonly int[,] HuellaViaje =
    {
        { 1, 0, 0, 2 }, { 1, 1, 4, 2 }, { 1, 2, 2, 1 },
        { 1, 2, 2, 1 }, { 1, 2, 3, 0 }, { 1, 2, 2, 1 }
    };
    // 0 = opción poco adecuada; 1 = sirve con una concesión; 2 = responde bien al contexto.
    private static readonly int[,] CalidadViaje =
    {
        { 1, 2, 2, 0 }, { 2, 1, 0, 1 }, { 1, 0, 0, 2 },
        { 2, 0, 0, 2 }, { 1, 1, 1, 2 }, { 2, 0, 0, 2 }
    };

    private sealed class Fuente
    {
        public string nombre;
        public string clave;
        public int energia;
        public int huella;
        public Color color;
        public Fuente(string n, string k, int e, int h, Color c) { nombre = n; clave = k; energia = e; huella = h; color = c; }
    }

    private static readonly Fuente[] Fuentes =
    {
        new Fuente("Solar", "SOL", 2, 1, C(244, 190, 77)),
        new Fuente("Eólica", "VIENTO", 2, 1, C(105, 183, 185)),
        new Fuente("Hidro", "AGUA", 3, 2, C(91, 155, 200)),
        new Fuente("Batería", "RED", 2, 0, C(119, 165, 113)),
        new Fuente("Gas", "GAS", 3, 4, C(191, 141, 102)),
        new Fuente("Carbón", "CARBÓN", 4, 7, C(96, 105, 101))
    };

    private void Awake()
    {
        fuente = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        audioManager = TierraAudio.Instancia;
        if (sector < 0)
        {
            int mundo = MundoDesdeUrl(Application.absoluteURL);
            if (mundo >= 0) { SceneManager.LoadScene(Escenas[mundo]); return; }
#if UNITY_WEBGL && !UNITY_EDITOR
            VolverAlAtlasWeb();
            return;
#endif
        }
        CrearCanvas();
        if (sector < 0) pantalla = 0;
        else PrepararPartida(false);
        Render();
    }

    private void Update()
    {
        if (mascota != null)
            mascota.anchoredPosition = mascotaBase + Vector2.up * Mathf.Sin(Time.unscaledTime * 2.15f) * 7f;
        if (vehiculoRuta != null)
        {
            float t = Mathf.Clamp01((Time.unscaledTime - inicioAnimacionRuta) / 1.25f);
            // El vehículo recorre la calzada ilustrada y se detiene antes de Terra.
            vehiculoRuta.anchoredPosition = new Vector2(Mathf.SmoothStep(0, 176, t), 0);
            vehiculoRuta.localScale = Vector3.one * (0.88f + Mathf.Sin(t * Mathf.PI) * .16f);
            if (t >= 1f) vehiculoRuta = null;
        }
        for (int i = 0; i < materialesCinta.Length; i++)
        {
            if (materialesCinta[i] == null) continue;
            float x = .085f + (i * .052f + Time.unscaledTime * .027f) % .205f;
            materialesCinta[i].anchorMin = materialesCinta[i].anchorMax = new Vector2(x, .453f);
            if (etiquetasCinta[i] != null) etiquetasCinta[i].anchorMin = etiquetasCinta[i].anchorMax = new Vector2(x, .399f);
        }
        if (maquinaVisual != null && maquinaActiva)
            maquinaVisual.localRotation = Quaternion.Euler(0, 0, Mathf.Sin(Time.unscaledTime * 35f) * 3f);
    }

    private int MundoDesdeUrl(string url)
    {
        if (string.IsNullOrEmpty(url)) return -1;
        string marker = "world=";
        int start = url.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (start < 0) return -1;
        start += marker.Length;
        int end = url.IndexOfAny(new[] { '&', '#', '?' }, start);
        string world = (end < 0 ? url.Substring(start) : url.Substring(start, end - start)).ToLowerInvariant();
        string[] ids = { "energia", "industria", "transporte", "bosques", "agricultura" };
        return Array.IndexOf(ids, world);
    }

    private void CrearCanvas()
    {
        var go = new GameObject("Interfaz 2D · Tierra", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        go.transform.SetParent(transform, false);
        canvas = go.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        var scaler = go.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        scaler.matchWidthOrHeight = .5f;
        root = go.GetComponent<RectTransform>();
        if (FindAnyObjectByType<EventSystem>() == null)
        {
            var events = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
            events.transform.SetParent(transform, false);
        }
    }

    private void Render()
    {
        if (root == null) return;
        for (int i = root.childCount - 1; i >= 0; i--) Destroy(root.GetChild(i).gameObject);
        mascota = null; vehiculoRuta = null;
        maquinaVisual = null;
        Array.Clear(materialesCinta, 0, materialesCinta.Length);
        Array.Clear(etiquetasCinta, 0, etiquetasCinta.Length);
        if (pantalla == 0) RenderInicio();
        else if (pantalla == 1) RenderMision();
        else if (pantalla == 2) RenderPartida();
        else RenderResultado();
        if (ajustes) RenderAjustes();
    }

    private void RenderInicio()
    {
        Imagen(root, TierraArt.Fondo(0), new Rect(.5f, .5f, 1280, 720), Color.white, "Paisaje de bienvenida");
        Caja(root, new Rect(.25f, .49f, 570, 570), new Color(1f, .99f, .94f, .81f), "Presentación");
        Cabecera("AVENTURA 2D · CAMBIO CLIMÁTICO", false);
        Texto(root, "¡Hola! Soy Terra", 36, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.235f, .76f, 480, 56));
        Texto(root, "¿Me ayudas a cuidar el lugar donde vivimos?", 21, Tinta, FontStyle.Normal, TextAnchor.MiddleLeft, new Rect(.235f, .69f, 480, 38));
        MascotaEn(new Rect(.28f, .40f, 290, 290));
        Texto(root, "5 mundos · decisiones · sonidos originales", 16, Suave, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.25f, .15f, 440, 32));

        Caja(root, new Rect(.745f, .49f, 590, 570), Papel, "Mapa de aventuras");
        Texto(root, "Elige tu aventura", 28, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.745f, .84f, 520, 46));
        Texto(root, "Cada reto es una escena 2D con una misión diferente.", 16, Suave, FontStyle.Normal, TextAnchor.MiddleLeft, new Rect(.745f, .79f, 520, 32));
        for (int i = 0; i < Escenas.Length; i++)
        {
            int index = i;
            float y = .70f - i * .122f;
            Caja(root, new Rect(.745f, y, 536, 72), Tarjeta, "Reto " + (i + 1));
            Imagen(root, TierraArt.Icono(i), new Rect(.555f, y, 58, 58), Color.white, "Ilustración " + Temas[i]);
            Texto(root, Titulos[i], 18, Tinta, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.73f, y + .012f, 300, 28));
            Texto(root, Temas[i] + " · " + Anios[i], 12, Suave, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.73f, y - .024f, 280, 24));
            Boton(root, "JUGAR  >", Verde, new Rect(.91f, y, 112, 48), () => AbrirMision(index), 14);
        }
        Boton(root, "SONIDO Y ACCESIBILIDAD", new Color32(239, 232, 211, 255), new Rect(.745f, .095f, 520, 45), () => { ajustes = true; Render(); }, 15, Verde);
        Texto(root, "Las partidas son simulaciones educativas; no son mediciones de emisiones.", 12, Verde, FontStyle.Normal, TextAnchor.MiddleCenter, new Rect(.5f, .035f, 1180, 25));
    }

    private void RenderMision()
    {
        FondoJuego();
        Cabecera(Temas[sector] + "     ·     " + Anios[sector], true);
        PanelPaisaje();
        Caja(root, new Rect(.75f, .52f, 590, 500), Tarjeta, "Brief de misión");
        Imagen(root, TierraArt.Icono(sector), new Rect(.56f, .80f, 58, 58), Color.white, "Emblema " + Temas[sector]);
        Texto(root, Titulos[sector], 30, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.765f, .82f, 450, 48));
        Texto(root, Descripciones[sector], 20, Tinta, FontStyle.Normal, TextAnchor.UpperLeft, new Rect(.75f, .68f, 490, 88));
        Texto(root, "OBJETIVO DE CAMPO", 14, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .55f, 490, 30));
        Texto(root, Instruccion(sector), 17, Tinta, FontStyle.Normal, TextAnchor.UpperLeft, new Rect(.75f, .46f, 490, 76));
        Texto(root, "MOUSE / TOQUE   ·   SONIDOS ORIGINALES   ·   2D", 13, Suave, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .385f, 490, 31));
        Caja(root, new Rect(.75f, .305f, 490, 54), new Color32(237, 244, 232, 255), "Dato del reto");
        Texto(root, "Los indicadores son valores del escenario, no datos reales.", 14, Verde, FontStyle.Normal, TextAnchor.MiddleCenter, new Rect(.75f, .305f, 450, 44));
        Boton(root, "EMPEZAR MISIÓN  >", Coral, new Rect(.75f, .205f, 400, 40), Empezar, 17);
    }

    private void RenderPartida()
    {
        FondoJuego();
        Cabecera(Temas[sector] + "    /    " + Titulos[sector], true);
        PanelPaisaje();
        Caja(root, new Rect(.75f, .52f, 590, 500), Tarjeta, "Zona de misión");
        Texto(root, IndicadorProgreso(), 13, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .84f, 500, 28));
        Texto(root, TituloRonda(), 25, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .775f, 500, 52));
        if (string.IsNullOrEmpty(mensaje))
            Texto(root, MensajeRonda(), 15, Suave, FontStyle.Normal, TextAnchor.UpperLeft, new Rect(.75f, .70f, 500, 70));
        else
        {
            bool aviso = EsAviso(mensaje);
            Color fondo = aviso ? new Color32(250, 232, 219, 255) : new Color32(237, 244, 232, 255);
            Color acento = aviso ? new Color32(166, 83, 55, 255) : VerdeClaro;
            Caja(root, new Rect(.75f, .68f, 510, 62), fondo, "Respuesta a la decisión");
            Texto(root, "RESPUESTA", 10, acento, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.60f, .704f, 125, 16));
            Texto(root, mensaje, 13, Tinta, FontStyle.Normal, TextAnchor.MiddleLeft, new Rect(.75f, .674f, 476, 37));
        }

        if (sector == 0) RenderEnergia();
        else if (sector == 1) RenderIndustria();
        else if (sector == 2) RenderMovilidad();
        else if (sector == 3) RenderBosque();
        else RenderAgricultura();

        Caja(root, new Rect(.5f, .075f, 1210, 82), new Color32(250, 247, 237, 240), "Panel de indicadores");
        Texto(root, "IMPACTO DEL RETO", 13, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.16f, .092f, 215, 24));
        Barra(root, impacto / 36f, Coral, new Rect(.34f, .095f, 300, 20));
        Texto(root, "CUIDADO Y BIENESTAR", 13, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.57f, .092f, 230, 24));
        Barra(root, bienestar / 28f, VerdeClaro, new Rect(.78f, .095f, 275, 20));
        Texto(root, "Valores de juego, no mediciones de emisiones", 11, Suave, FontStyle.Normal, TextAnchor.MiddleCenter, new Rect(.5f, .035f, 800, 22));
    }

    private void RenderEnergia()
    {
        int demanda = Demanda();
        int energia = 0, huella = 0;
        bool[] enRed = FuentesConectadas();
        for (int i = 0; i < Fuentes.Length; i++) if (enRed[i]) { energia += Fuentes[i].energia; huella += Fuentes[i].huella; }
        Texto(root, "RED ELÉCTRICA", 13, Suave, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.61f, .615f, 170, 25));
        Texto(root, "Demanda " + demanda + "   ·   Energía " + energia + "   ·   Huella " + huella, 14, Tinta, FontStyle.Bold, TextAnchor.MiddleRight, new Rect(.80f, .615f, 385, 25));
        Barra(root, Mathf.Clamp01(energia / (float)demanda), energia >= demanda ? VerdeClaro : Oro, new Rect(.75f, .575f, 510, 18));
        for (int i = 0; i < Fuentes.Length; i++)
        {
            int source = i;
            float x = .63f + (i % 3) * .13f, y = .49f - (i / 3) * .105f;
            Color color = fuentesElegidas[i] ? new Color32(217, 239, 210, 255) : Tarjeta;
            var option = Boton(root, "", color, new Rect(x, y, 145, 60), () =>
            {
                ciudadEncendida = false;
                if (fuentesElegidas[source])
                {
                    fuenteActiva = source;
                    mensaje = "Fuente " + Fuentes[source].nombre + " lista: toca Hogares, Escuela o Clínica para conectarla.";
                }
                else if (CantidadFuentes() < 3)
                {
                    fuentesElegidas[source] = true; fuenteActiva = source;
                    mensaje = "Fuente " + Fuentes[source].nombre + " seleccionada: ahora conéctala con un sector.";
                }
                else mensaje = "La red admite hasta tres fuentes. Conecta una antes de elegir otra.";
                Render();
            }, 13, fuentesElegidas[i] ? Verde : Tinta);
            Imagen(option.transform, TierraArt.IconoFuente(i), new Rect(.20f, .5f, 35, 39), Color.white, "Símbolo " + Fuentes[i].nombre);
            Texto(option.transform, Fuentes[i].clave, 11, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.69f, .67f, 86, 24));
            Texto(option.transform, Fuentes[i].energia + " EN · " + Fuentes[i].huella + " CO₂", 10, Tinta, FontStyle.Normal, TextAnchor.MiddleLeft, new Rect(.69f, .34f, 90, 23));
        }
        string[] sectores = { "HOGARES", "ESCUELA", "CLÍNICA" };
        for (int i = 0; i < sectores.Length; i++)
        {
            int district = i, fuente = conexionesEnergia[i];
            string label = fuente < 0 ? "CONECTAR · " + sectores[i] : sectores[i] + " · " + Fuentes[fuente].clave;
            Color color = fuente < 0 ? new Color32(244, 241, 226, 255) : new Color32(218, 239, 210, 255);
            Boton(root, label, color, new Rect(.63f + i * .13f, .29f, 116, 31), () => ConectarSectorEnergia(district), 9, Verde);
        }
        Boton(root, planAhorro ? "AHORRO ACTIVADO · DEMANDA -1" : "ACTIVAR AHORRO · DEMANDA -1",
            planAhorro ? new Color32(217, 239, 210, 255) : new Color32(239, 232, 211, 255),
            new Rect(.75f, .235f, 390, 31), () => { planAhorro = !planAhorro; mensaje = planAhorro ? "Ahorro activo: los sectores necesitan una unidad menos." : "Ahorro desactivado."; Render(); }, 11, Verde);
        Boton(root, "ENCENDER LA CIUDAD", Coral, new Rect(.75f, .175f, 300, 38), ResolverEnergia, 14);
    }

    private bool[] FuentesConectadas()
    {
        bool[] connected = new bool[Fuentes.Length];
        for (int district = 0; district < conexionesEnergia.Length; district++)
            if (conexionesEnergia[district] >= 0 && conexionesEnergia[district] < connected.Length)
                connected[conexionesEnergia[district]] = true;
        return connected;
    }

    private int SectoresConectados()
    {
        int count = 0;
        for (int i = 0; i < conexionesEnergia.Length; i++) if (conexionesEnergia[i] >= 0) count++;
        return count;
    }

    private void ConectarSectorEnergia(int district)
    {
        if (fuenteActiva < 0 || !fuentesElegidas[fuenteActiva])
        {
            mensaje = "Primero elige una fuente; después toca Hogares, Escuela o Clínica para trazar el cable.";
            audioManager.Aviso(); Render(); return;
        }
        conexionesEnergia[district] = fuenteActiva;
        mensaje = Fuentes[fuenteActiva].nombre + " conecta con " + new[] { "Hogares", "Escuela", "Clínica" }[district] + ". Una fuente puede repartir energía por la red.";
        fuenteActiva = -1; ciudadEncendida = false; audioManager.Chispa(); Render();
    }

    private void RenderIndustria()
    {
        Texto(root, "OBRA " + (ronda + 1) + " DE 3  ·  CINTA DE MATERIALES", 13, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .615f, 510, 25));
        string[] materiales = { "ACERO", "CEMENTO", "VIDRIO", "ALUMINIO" };
        string[] modos = { "REUTILIZAR", "EFICIENCIA", "ELECTRIFICAR", "NUEVO" };
        for (int i = 0; i < 4; i++)
        {
            int material = i; float x = .67f + (i % 2) * .17f, y = .51f - (i / 2) * .10f;
            bool elegida = materialActual == material;
            string asignacion = procesos[i] < 0 ? "ELIGE UNA RUTA" : "OK · " + modos[procesos[i]];
            Color color = elegida ? new Color32(217, 239, 210, 255) : procesos[i] >= 0 ? new Color32(237, 243, 231, 255) : Tarjeta;
            var tile = Boton(root, "", color, new Rect(x, y, 190, 60), () => { materialActual = material; Render(); }, 13, elegida ? Verde : Tinta);
            Imagen(tile.transform, TierraArt.IconoMaterial(material, procesos[i]), new Rect(.20f, .5f, 50, 44), Color.white, "Icono de " + materiales[i]);
            Texto(tile.transform, materiales[i], 12, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.68f, .69f, 115, 22));
            Texto(tile.transform, asignacion, 9, Suave, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.68f, .32f, 116, 22));
        }
        Texto(root, materialActual < 0 ? "Selecciona una pieza; puedes cambiar su ruta antes de producir." : "¿Cómo fabricar " + materiales[materialActual] + "?",
            13, Tinta, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.75f, .345f, 510, 24));
        for (int i = 0; i < 4; i++)
        {
            int mode = i;
            var processButton = Boton(root, "", i == 3 ? new Color32(238, 215, 201, 255) : new Color32(222, 239, 220, 255),
                new Rect(.62f + i * .087f, .29f, 108, 38), () =>
                {
                    if (materialActual < 0) { mensaje = "Primero toca una pieza de la cinta."; audioManager.Aviso(); Render(); return; }
                    int pieza = materialActual;
                    procesos[pieza] = mode; materialActual = -1;
                    mensaje = mode == 2 ? "¡Chispa! La pieza ya funciona con electricidad; revisa el proceso antes de producir."
                        : mode == 3 ? "Material nuevo: coste " + CostoMaterial(pieza, mode) + " unidades y más impacto; puedes cambiar la ruta antes de producir."
                        : "Ruta guardada para " + materiales[pieza].ToLowerInvariant() + ": coste " + CostoMaterial(pieza, mode) + " unidades.";
                    if (mode == 2) audioManager.Chispa(); else if (mode == 0) audioManager.Reciclar(); else if (mode == 1) audioManager.Eficiencia(); else audioManager.Aviso();
                    Render();
                }, 10, Tinta);
            Imagen(processButton.transform, TierraArt.IconoMaterial(i, i), new Rect(.5f, .78f, 31, 25), Color.white, "Símbolo de " + modos[i]);
            Texto(processButton.transform, modos[i], 8, Verde, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.5f, .22f, 100, 16));
        }
        Boton(root, ronda < 2 ? "PRODUCIR Y PASAR A LA SIGUIENTE OBRA" : "TERMINAR PRODUCCIÓN",
            Coral, new Rect(.75f, .205f, 360, 38), ResolverIndustria, 13);
    }

    private void RenderMovilidad()
    {
        string[] modos = { "BUS", "BICI", "A PIE", "COMPARTIR" };
        Color[] colores = { Azul, VerdeClaro, new Color32(211, 233, 202, 255), Oro };
        int pasajero = Mathf.Clamp(viaje, 0, Viajeros.Length - 1);
        Texto(root, "RUTAS DE LA CIUDAD  ·  " + (viaje + 1) + " DE " + Viajeros.Length,
            13, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .61f, 510, 28));
        Texto(root, Viajeros[pasajero], 20, Tinta, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.78f, .53f, 440, 45));
        Texto(root, ContextosViaje[pasajero], 14, Suave, FontStyle.Normal, TextAnchor.MiddleCenter, new Rect(.78f, .47f, 440, 28));
        var persona = Caja(root, new Rect(.15f, .665f, 144, 46), new Color32(250, 247, 237, 238), "Persona en ruta");
        int modoVisible = viaje > 0 && eleccionesRuta[Mathf.Clamp(viaje - 1, 0, eleccionesRuta.Length - 1)] >= 0
            ? eleccionesRuta[Mathf.Clamp(viaje - 1, 0, eleccionesRuta.Length - 1)] : 2;
        Imagen(persona.transform, TierraArt.IconoViaje(modoVisible), new Rect(.24f, .5f, 41, 32), Color.white, "Transporte del trayecto");
        string personaNombre = Viajeros[pasajero].Split('·')[0].Trim();
        Texto(persona.transform, personaNombre, 11, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.70f, .5f, 82, 30));
        if (pasajeroVisual >= 0 && modoViajeVisual >= 0)
        {
            vehiculoRuta = Imagen(root, TierraArt.IconoViaje(modoViajeVisual), new Rect(.15f, .405f, 84, 50), Color.white, "Viaje en movimiento").rectTransform;
            inicioAnimacionRuta = Time.unscaledTime;
            Texto(root, Viajeros[pasajeroVisual].Split('·')[0].Trim() + " · " + modos[modoViajeVisual].ToLowerInvariant(), 11, Verde, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.205f, .48f, 205, 22));
            Imagen(root, TierraArt.EfectoRuta(modoViajeVisual), new Rect(.21f, .405f, 185, 30), Color.white, "Trayecto animado");
        }
        for (int i = 0; i < modos.Length; i++)
        {
            int mode = i;
            float x = .63f + i * .087f;
            Caja(root, new Rect(x, .37f, 104, 92), new Color32(248, 246, 235, 255), "Opción " + modos[i]);
            Imagen(root, TierraArt.IconoViaje(i), new Rect(x, .39f, 66, 48), Color.white, "Ilustración " + modos[i]);
            Boton(root, modos[i], colores[i], new Rect(x, .30f, 104, 34), () => ResolverViaje(mode), 11, Verde);
        }
        Texto(root, "RUTAS COMPLETADAS", 11, Suave, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.77f, .235f, 430, 20));
        for (int i = 0; i < Viajeros.Length; i++)
        {
            float x = .64f + i * .043f;
            Imagen(root, TierraArt.IconoViaje(i % 4), new Rect(x, .195f, 31, 25), i < viaje ? VerdeClaro : new Color32(194, 208, 193, 255), "Ruta " + (i + 1));
        }
        Texto(root, "Elige pensando en distancia, seguridad, accesibilidad y cuántas personas viajan.",
            11, Suave, FontStyle.Normal, TextAnchor.MiddleCenter, new Rect(.77f, .15f, 510, 21));
    }

    private void RenderBosque()
    {
        Texto(root, "ESTACIÓN " + (ronda + 1) + " DE 3  ·  SEMILLAS " + semillas + "  ·  AGUA " + aguaBosque,
            13, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .615f, 510, 25));
        for (int i = 0; i < parcelasBosque.Length; i++)
        {
            int cell = i; float x = .63f + (i % 4) * .087f, y = .51f - (i / 4) * .088f;
            string label = parcelasBosque[i] == 0 ? "CLARO" : parcelasBosque[i] == 1 ? "ÁRBOL" : parcelasBosque[i] == 2 ? "NIDO" : parcelasBosque[i] == 3 ? "SEMILLA" : parcelasBosque[i] == 4 ? "BROTE" : "ARBOLITO";
            if (parcelasBosque[i] >= 3 && riegoBosque[i]) label += " · AGUA";
            Color color = parcelasBosque[i] == 0 ? new Color32(225, 196, 143, 255) : parcelasBosque[i] == 1 ? new Color32(113, 171, 104, 255) : parcelasBosque[i] == 2 ? new Color32(243, 212, 139, 255) : new Color32(188, 221, 167, 255);
            var tile = Boton(root, "", color, new Rect(x, y, 96, 62), () =>
                {
                    if (modoBosque == 0 && parcelasBosque[cell] == 0 && semillas > 0)
                    {
                        parcelasBosque[cell] = 3; bosquePlantado[cell] = true; semillas--; plantadosEstaTemporada++; totalPlantados++;
                        mensaje = "¡Plantaste una especie nativa! Elige otro claro o riega este brote."; audioManager.Plantar();
                    }
                    else if (modoBosque == 1 && (parcelasBosque[cell] == 3 || parcelasBosque[cell] == 4) && !riegoBosque[cell] && aguaBosque > 0)
                    {
                        riegoBosque[cell] = true; aguaBosque--; totalRegados++;
                        mensaje = parcelasBosque[cell] == 3 ? "La semilla recibió agua y ya asoma un brote." : "El brote recibió agua; tendrá una mejor oportunidad durante la estación seca."; audioManager.Regar();
                    }
                    else if (parcelasBosque[cell] == 2) { mensaje = "El nido es refugio de fauna: conserva este espacio intacto."; audioManager.Aviso(); }
                    else if (modoBosque == 0 && parcelasBosque[cell] == 0) { mensaje = "Ya no te quedan semillas en esta estación."; audioManager.Aviso(); }
                    else if (modoBosque == 1 && aguaBosque == 0) { mensaje = "Usaste el agua de esta estación; elige qué brotes priorizar."; audioManager.Aviso(); }
                    else { mensaje = "Elige un claro para plantar o un brote para regar."; }
                    Render();
                }, 11, Verde);
            var art = Imagen(root, TierraArt.IconoBosque(parcelasBosque[i], riegoBosque[i]), new Rect(x, y + .012f, 43, 36), Color.white, "Estado del terreno: " + label);
            Texto(root, label, 9, Verde, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(x, y - .023f, 92, 19));
            if (parcelasBosque[cell] >= 3 || bosquePlantado[cell]) StartCoroutine(PopIn(art.rectTransform, .25f, (i % 4) * .025f));
            tile.interactable = true;
        }
        Boton(root, modoBosque == 0 ? "PLANTAR" : "PLANTAR · SELECCIONADO",
            modoBosque == 0 ? new Color32(217, 239, 210, 255) : Tarjeta, new Rect(.66f, .245f, 172, 34), () => { modoBosque = 0; Render(); }, 12, Verde);
        Boton(root, modoBosque == 1 ? "REGAR · SELECCIONADO" : "REGAR BROTE",
            modoBosque == 1 ? new Color32(217, 239, 210, 255) : new Color32(216, 235, 239, 255), new Rect(.84f, .245f, 172, 34), () => { modoBosque = 1; Render(); }, 12, Verde);
        Boton(root, ronda < 2 ? "AVANZAR ESTACIÓN · VER CRECIMIENTO" : "TERMINAR RESTAURACIÓN",
            Coral, new Rect(.75f, .205f, 342, 36), ResolverBosque, 11);
    }

    private void RenderAgricultura()
    {
        string[] tipos = { "GRANO", "LEGUMINOSA", "COBERTURA" };
        Color[] colores = { new Color32(237, 202, 119, 255), new Color32(121, 178, 118, 255), new Color32(85, 157, 111, 255) };
        Texto(root, "ESTACIÓN " + (ronda + 1) + " DE 3  ·  COMPOST " + compost + "  ·  AGUA " + aguaCultivo,
            13, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.75f, .615f, 510, 26));
        for (int i = 0; i < parcelasCultivo.Length; i++)
        {
            int cell = i; float x = .67f + (i % 3) * .125f, y = .49f - (i / 3) * .105f;
            Color tonoParcela = parcelaSeleccionada == i ? new Color32(223, 239, 208, 255) : colores[parcelasCultivo[i]];
            var tile = Boton(root, "", tonoParcela, new Rect(x, y, 122, 64), () =>
            {
                parcelaSeleccionada = cell;
                parcelasCultivo[cell] = (parcelasCultivo[cell] + 1) % 3;
                mensaje = cultivoAnterior[cell] < 0 || cultivoAnterior[cell] != parcelasCultivo[cell]
                    ? "Parcela " + (cell + 1) + ": elegiste " + tipos[parcelasCultivo[cell]] + ". La rotación protege el suelo entre estaciones."
                    : "Este cultivo ya ocupaba la parcela la estación pasada; prueba rotarlo.";
                audioManager.Plantar(); Render();
            }, 10, Verde);
            Imagen(tile.transform, TierraArt.IconoCultivo(parcelasCultivo[i], ronda + 1, compostado[i], riegoCultivo[i]), new Rect(.5f, .60f, 44, 42), Color.white, "Cultivo de parcela " + (cell + 1));
            Texto(tile.transform, "PARCELA " + (cell + 1) + " · " + tipos[parcelasCultivo[i]], 8, Verde, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.5f, .14f, 118, 18));
        }
        Boton(root, HayMarca(compostado) ? "COMPOST APLICADO" : "APLICAR COMPOST",
            HayMarca(compostado) ? new Color32(217, 239, 210, 255) : Tarjeta,
            new Rect(.66f, .285f, 176, 34), AplicarCompost, 11, Verde);
        Boton(root, HayMarca(riegoCultivo) ? "RIEGO APLICADO" : "REGAR PARCELA",
            HayMarca(riegoCultivo) ? new Color32(217, 239, 210, 255) : new Color32(216, 235, 239, 255),
            new Rect(.84f, .285f, 176, 34), AplicarRiegoCultivo, 11, Verde);
        Boton(root, ronda < 2 ? "AVANZAR ESTACIÓN · REVISAR SUELO" : "COSECHAR Y TERMINAR",
            Coral, new Rect(.75f, .205f, 340, 36), ResolverAgricultura, 11);
    }

    private void RenderResultado()
    {
        Imagen(root, FondoEscena(), new Rect(.5f, .5f, 1280, 720), Color.white, "Paisaje final");
        Cabecera("MISIÓN COMPLETADA", true);
        if (sector == 0) Imagen(root, TierraArt.RedEnergia(conexionesEnergia, ciudadEncendida), new Rect(.275f, .54f, 575, 310), Color.white, "Red y sectores conectados en el resultado");
        EscenaResultado();
        int nivel = NivelResultado();
        Color acento = ColorNivel(nivel);
        Caja(root, new Rect(.62f, .5f, 840, 515), new Color32(250, 247, 237, 249), "Bitácora final de la misión");
        Caja(root, new Rect(.62f, .82f, 760, 4), acento, "Banda de resultado");
        Caja(root, new Rect(.12f, .165f, 116, 16), new Color(24f / 255f, 67f / 255f, 56f / 255f, .18f), "Sombra de Terra en el suelo");
        var terra = Imagen(root, TierraArt.Mascota, new Rect(.12f, .31f, 150, 150), Color.white, "Terra acompaña el cierre").rectTransform;
        StartCoroutine(RespirarTerra(terra));
        Texto(root, nivel == 2 ? "¡Lo construimos juntos!" : nivel == 1 ? "¡Buen ensayo, equipo!" : "Cada intento enseña algo", 12, Papel, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.13f, .195f, 205, 32));
        if (nivel == 2) CrearConfetiResultado();

        Texto(root, "RETO · " + Titulos[sector].ToUpperInvariant(), 12, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.62f, .825f, 730, 25));
        Texto(root, TituloResultado(nivel), 29, Verde, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.62f, .765f, 730, 48));
        Texto(root, EtiquetaResultado(nivel), 13, acento, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.62f, .713f, 730, 24));
        int medidaResultado = sector == 0 ? turnosEnergiaLimpios : puntos;
        int maximoResultado = sector == 0 ? 3 : 5;
        string nombreMedida = sector == 0 ? "TURNOS CON BAJA HUELLA" : "DESEMPEÑO DEL RETO";
        Texto(root, nombreMedida + " · " + medidaResultado + " DE " + maximoResultado, 12, Suave, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.37f, .658f, 265, 22));
        Barra(root, Mathf.Clamp01((float)medidaResultado / maximoResultado), acento, new Rect(.68f, .658f, 575, 16));
        Texto(root, "Impacto " + impacto + "   ·   Cuidado y bienestar " + bienestar, 15, Tinta, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.62f, .61f, 730, 28));

        Caja(root, new Rect(.62f, .51f, 750, 76), new Color32(239, 244, 232, 255), "Lo que cambió en el mundo");
        Texto(root, ResumenResultado(), 14, Tinta, FontStyle.Normal, TextAnchor.MiddleLeft, new Rect(.62f, .51f, 710, 64));
        Texto(root, Reflexion(), 12, Suave, FontStyle.Normal, TextAnchor.UpperLeft, new Rect(.62f, .405f, 730, 88));
        Texto(root, "PARA EL PRÓXIMO INTENTO", 10, VerdeClaro, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.62f, .316f, 730, 18));
        Texto(root, ConsejoResultado(nivel), 13, Tinta, FontStyle.Normal, TextAnchor.MiddleLeft, new Rect(.62f, .278f, 730, 37));
        Boton(root, "PROBAR OTRA VEZ", new Color32(232, 241, 225, 255), new Rect(.43f, .19f, 220, 43), Reiniciar, 13, Verde);
        Boton(root, sector < 4 ? "SIGUIENTE MUNDO  →" : "VOLVER AL ATLAS  →", Coral, new Rect(.77f, .19f, 250, 43), Siguiente, 13);
        Texto(root, "Simulación educativa; los indicadores no son mediciones reales.", 10, Verde, FontStyle.Normal, TextAnchor.MiddleLeft, new Rect(.62f, .145f, 730, 16));
    }

    private int NivelResultado()
    {
        // Energy scores advance in two-point steps, so grade by clean turns
        // to keep all three feedback levels tied to an observable result.
        if (sector == 0) return turnosEnergiaLimpios >= 3 ? 2 : turnosEnergiaLimpios >= 2 ? 1 : 0;
        return puntos >= 4 ? 2 : puntos >= 3 ? 1 : 0;
    }
    private Color ColorNivel(int nivel) { return nivel == 2 ? VerdeClaro : nivel == 1 ? new Color32(174, 126, 49, 255) : new Color32(177, 80, 53, 255); }
    private string EtiquetaResultado(int nivel) { return nivel == 2 ? "DESTACADO · ESTRATEGIA SÓLIDA" : nivel == 1 ? "INTERMEDIO · HAY AVANCES Y UNA OPORTUNIDAD" : "POR MEJORAR · CAMBIA UNA DECISIÓN Y PRUEBA"; }

    private string TituloResultado(int nivel)
    {
        string[][] titulos =
        {
            new[] { "La red necesita otra mezcla", "La ciudad aún puede ahorrar energía", "¡La noche quedó bien iluminada!" },
            new[] { "Varios materiales se desperdiciaron", "La obra avanzó; revisa algunos procesos", "¡La fábrica aprovechó sus materiales!" },
            new[] { "Algunas rutas no cuidaron el trayecto", "La red conecta, pero puede ser más justa", "¡Seis viajes que cuidan a la comunidad!" },
            new[] { "La ladera necesita más cuidados", "El bosque creció, con brotes por cuidar", "¡Un bosque vuelve a crecer!" },
            new[] { "El suelo necesita otra estrategia", "La finca cosechó; falta cuidar la rotación", "¡La finca llegó a una cosecha resiliente!" },
        };
        return titulos[Mathf.Clamp(sector, 0, titulos.Length - 1)][Mathf.Clamp(nivel, 0, 2)];
    }

    private string ResumenResultado()
    {
        if (sector == 0) return "La ciudad recibió energía en " + turnosEnergiaCubiertos + " de 3 turnos; " + turnosEnergiaLimpios + " turnos combinaron servicio con baja huella.";
        if (sector == 1)
        {
            int circular = usosProcesos[0] + usosProcesos[1] + usosProcesos[2];
            return "La fábrica completó tres obras: " + circular + " de 12 piezas siguieron una ruta circular o electrificada; " + usosProcesos[3] + " fueron material nuevo.";
        }
        if (sector == 2) return "Resolvieron seis viajes; " + rutasAdecuadas + " elecciones respondieron bien a la distancia, seguridad o accesibilidad de la persona.";
        if (sector == 3)
        {
            int trees = 0;
            for (int i = 0; i < parcelasBosque.Length; i++) if (parcelasBosque[i] == 1) trees++;
            return "Plantaste " + totalPlantados + " semillas, regaste " + totalRegados + " brotes y el paisaje termina con " + trees + " árboles desarrollados.";
        }
        return "La finca pasó por tres estaciones: rotaste " + rotacionesTotales + " parcelas, aplicaste compost " + compostTotal + " veces y usaste " + riegoTotal + " riegos.";
    }

    private string ConsejoResultado(int nivel)
    {
        if (sector == 0) return turnosEnergiaLimpios < 3 ? "Combina fuentes solares, eólicas o de agua con ahorro antes de recurrir al respaldo de mayor huella." : "Prueba una combinación distinta cuando suba la demanda; evita generar mucho más de lo que el barrio necesita.";
        if (sector == 1) return usosProcesos[3] > 0 ? "Antes de usar material nuevo, revisa si cada pieza puede reutilizarse o si el proceso puede ser más eficiente." : "Compara el costo de cada material: cemento y acero no responden igual a todas las rutas.";
        if (sector == 2) return rutasAdecuadas < 5 ? "Mira la necesidad de la persona antes de elegir: distancia, carga, horario nocturno y acceso sin escalones cambian la ruta." : "Mantén las rutas seguras y accesibles, y prueba otra mezcla de bus, bicicleta, caminata y viaje compartido.";
        if (sector == 3) return totalRegados < totalPlantados ? "Prioriza el agua para los brotes nuevos antes de cerrar la estación; el crecimiento depende de ese cuidado." : "Conserva los nidos y reparte la plantación en claros adecuados para que el bosque pueda conectarse.";
        return rotacionesTotales < 6 ? "Rota más parcelas entre estaciones y reserva compost para el suelo que más lo necesita." : "Equilibra cultivos, compost y riego para mantener el suelo productivo sin agotar el agua.";
    }

    private IEnumerator RespirarTerra(RectTransform rect)
    {
        if (rect == null) yield break;
        Vector3 baseScale = Vector3.one;
        while (rect != null && pantalla == 3)
        {
            float pulse = 1f + Mathf.Sin(Time.unscaledTime * 2.5f) * .025f;
            rect.localScale = baseScale * pulse;
            yield return null;
        }
    }

    private void CrearConfetiResultado()
    {
        for (int i = 0; i < 12; i++)
        {
            float x = .055f + (i % 4) * .055f;
            float y = .40f + (i / 4) * .07f;
            var confeti = Imagen(root, TierraArt.Estrella, new Rect(x, y, 18 + i % 3 * 4, 18 + i % 3 * 4), i % 2 == 0 ? Oro : VerdeClaro, "Destello de celebración");
            StartCoroutine(PopIn(confeti.rectTransform, .34f, i * .025f));
        }
    }

    private void EscenaResultado()
    {
        if (sector == 1)
        {
            for (int pieza = 0; pieza < procesosObras[2].Length; pieza++)
            {
                int proceso = procesosObras[2][pieza];
                if (proceso < 0) continue;
                var producto = Imagen(root, TierraArt.IconoMaterial(pieza, proceso), new Rect(.065f + pieza * .052f, .56f, 48, 42), Color.white, "Pieza transformada en la última obra");
                StartCoroutine(PopIn(producto.rectTransform, .26f, pieza * .06f));
            }
            var salida = Caja(root, new Rect(.165f, .50f, 164, 24), new Color32(239, 244, 232, 238), "Salida de producto circular");
            Texto(salida.transform, "PRODUCTOS RECUPERADOS", 8, Verde, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.5f, .5f, 150, 20));
        }
        else if (sector == 3)
        {
            int visual = 0;
            for (int cell = 0; cell < bosquePlantado.Length; cell++)
            {
                if (!bosquePlantado[cell]) continue;
                var arbol = Imagen(root, TierraArt.IconoBosque(parcelasBosque[cell] >= 3 ? parcelasBosque[cell] : 1, false),
                    new Rect(.042f + visual * .043f, .55f, 52, 62), Color.white, "Árbol que creció en el bosque restaurado");
                StartCoroutine(PopIn(arbol.rectTransform, .42f, visual * .055f)); visual++;
            }
        }
        else if (sector == 4)
        {
            for (int cell = 0; cell < parcelasCultivo.Length; cell++)
            {
                int column = cell % 3, row = cell / 3;
                var cultivo = Imagen(root, TierraArt.IconoCultivo(parcelasCultivo[cell], 3, compostado[cell], riegoCultivo[cell]),
                    new Rect(.065f + column * .085f, .54f - row * .075f, 58, 56), Color.white, "Cultivo cosechado en la parcela " + (cell + 1));
                StartCoroutine(PopIn(cultivo.rectTransform, .3f, cell * .035f));
            }
        }
    }

    private void FondoJuego() { }

    private void PanelPaisaje() { }

    private Sprite FondoEscena()
    {
        return sector == 0 ? TierraArt.FondoEnergia(ronda, ciudadEncendida) : TierraArt.Fondo(sector);
    }

    private void Cabecera(string titulo, bool mostrarMapa)
    {
        Caja(root, new Rect(.5f, .95f, 1280, 72), Verde, "Cabecera");
        Texto(root, "TERMÓMETRO DE LA TIERRA", 20, Papel, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.21f, .95f, 510, 52));
        Texto(root, titulo, 14, new Color32(200, 223, 201, 255), FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.60f, .95f, 330, 38));
        if (mostrarMapa) Boton(root, "← MAPA", new Color32(232, 239, 222, 255), new Rect(.88f, .95f, 105, 42), VolverInicio, 12, Verde);
        Boton(root, "AUDIO", new Color32(232, 239, 222, 255), new Rect(.965f, .95f, 72, 42), () => { ajustes = true; Render(); }, 11, Verde);
    }

    private void RenderAjustes()
    {
        Caja(root, new Rect(.5f, .5f, 1280, 720), new Color(0, 0, 0, .46f), "Fondo de ajustes");
        Caja(root, new Rect(.5f, .5f, 570, 465), Papel, "Opciones de sonido");
        Texto(root, "SONIDO Y ACCESIBILIDAD", 22, Verde, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.5f, .765f, 500, 42));
        Texto(root, "Música original", 16, Tinta, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.5f, .64f, 400, 28));
        Deslizador("Música", audioManager.VolumenMusica, .5f, .585f, audioManager.AjustarMusica);
        Texto(root, "Efectos de interacción", 16, Tinta, FontStyle.Bold, TextAnchor.MiddleLeft, new Rect(.5f, .475f, 400, 28));
        Deslizador("Efectos", audioManager.VolumenEfectos, .5f, .42f, audioManager.AjustarEfectos);
        Texto(root, "El juego también se entiende sin audio.", 14, Suave, FontStyle.Normal, TextAnchor.MiddleCenter, new Rect(.5f, .31f, 470, 28));
        Boton(root, "CERRAR", Coral, new Rect(.5f, .22f, 170, 48), () => { ajustes = false; Render(); }, 16);
    }

    private void Deslizador(string nombre, float valor, float x, float y, UnityEngine.Events.UnityAction<float> alCambiar)
    {
        const float width = 390;
        var go = new GameObject("Control " + nombre, typeof(RectTransform), typeof(Slider), typeof(Image));
        go.transform.SetParent(root, false); Poner(go.GetComponent<RectTransform>(), new Rect(x, y, width, 30));
        var hitArea = go.GetComponent<Image>(); hitArea.color = new Color(1, 1, 1, 0); hitArea.raycastTarget = true;
        var track = Imagen(go.transform, null, new Rect(.5f, .5f, width - 24, 10), new Color32(218, 225, 212, 255), "Riel");
        track.rectTransform.anchorMin = new Vector2(0, .5f); track.rectTransform.anchorMax = new Vector2(1, .5f);
        track.rectTransform.sizeDelta = new Vector2(-24, 10); track.rectTransform.anchoredPosition = Vector2.zero; track.raycastTarget = true;
        var fillArea = new GameObject("Área de progreso", typeof(RectTransform)); fillArea.transform.SetParent(go.transform, false);
        var area = fillArea.GetComponent<RectTransform>(); area.anchorMin = new Vector2(0, .5f); area.anchorMax = new Vector2(1, .5f);
        area.sizeDelta = new Vector2(-24, 10); area.anchoredPosition = Vector2.zero;
        var fill = Imagen(fillArea.transform, null, new Rect(0, .5f, 0, 10), VerdeClaro, "Progreso");
        fill.rectTransform.anchorMin = Vector2.zero; fill.rectTransform.anchorMax = Vector2.one;
        fill.rectTransform.offsetMin = Vector2.zero; fill.rectTransform.offsetMax = Vector2.zero;
        var handle = Imagen(go.transform, null, new Rect(.5f, .5f, 24, 28), Coral, "Control deslizante");
        handle.raycastTarget = true;
        var slider = go.GetComponent<Slider>(); slider.minValue = 0; slider.maxValue = 1;
        slider.targetGraphic = handle; slider.fillRect = fill.rectTransform; slider.handleRect = handle.rectTransform;
        slider.direction = Slider.Direction.LeftToRight;
        slider.value = 0f; // Actualiza las anclas una vez que el riel y el control ya están conectados.
        slider.onValueChanged.AddListener(alCambiar);
        slider.value = Mathf.Clamp01(valor);
    }

    private void Barra(Transform parent, float valor, Color color, Rect lugar)
    {
        var baseBar = Caja(parent, lugar, new Color32(222, 227, 214, 255), "Medidor");
        var fill = Imagen(baseBar.transform, null, new Rect(0, .5f, 0, 14), color, "Nivel");
        var rect = fill.rectTransform;
        rect.anchorMin = new Vector2(0, 0); rect.anchorMax = new Vector2(Mathf.Clamp01(valor), 1);
        rect.offsetMin = new Vector2(0, 0); rect.offsetMax = new Vector2(0, 0);
    }

    private void Estrellas(Transform parent, int count, Rect lugar)
    {
        for (int i = 0; i < 5; i++)
        {
            Imagen(parent, TierraArt.Estrella, new Rect(lugar.x + (i - 2) * .06f, lugar.y, 40, lugar.height),
                i < count ? Oro : new Color32(203, 209, 197, 255), "Estrella " + (i + 1) + (i < count ? " obtenida" : " pendiente"));
        }
    }

    private GameObject Caja(Transform parent, Rect box, Color color, string nombre)
    {
        var go = new GameObject(nombre, typeof(RectTransform), typeof(Image), typeof(Shadow));
        go.transform.SetParent(parent, false); Poner(go.GetComponent<RectTransform>(), box);
        var img = go.GetComponent<Image>(); img.sprite = TierraArt.PanelRedondeado; img.type = Image.Type.Sliced; img.color = color;
        var shadow = go.GetComponent<Shadow>(); shadow.effectColor = new Color(0, 0, 0, .12f); shadow.effectDistance = new Vector2(0, -3);
        return go;
    }

    private Image Imagen(Transform parent, Sprite sprite, Rect box, Color color, string nombre)
    {
        var go = new GameObject(nombre, typeof(RectTransform), typeof(Image)); go.transform.SetParent(parent, false);
        Poner(go.GetComponent<RectTransform>(), box);
        var img = go.GetComponent<Image>(); img.sprite = sprite; img.color = color; img.preserveAspect = sprite != null;
        img.raycastTarget = false;
        return img;
    }

    private Text Texto(Transform parent, string value, int size, Color color, FontStyle style, TextAnchor alignment, Rect box)
    {
        var go = new GameObject("Texto", typeof(RectTransform), typeof(Text)); go.transform.SetParent(parent, false);
        Poner(go.GetComponent<RectTransform>(), box);
        var text = go.GetComponent<Text>(); text.text = value; text.font = fuente; text.fontSize = size; text.color = color;
        text.fontStyle = style; text.alignment = alignment; text.horizontalOverflow = HorizontalWrapMode.Wrap;
        text.verticalOverflow = VerticalWrapMode.Overflow; text.supportRichText = false; text.raycastTarget = false;
        return text;
    }

    private Button Boton(Transform parent, string label, Color color, Rect box, Action accion, int size, Color? textoColor = null)
    {
        var go = new GameObject("Acción · " + label.Replace('\n', ' '), typeof(RectTransform), typeof(Image), typeof(Button), typeof(Shadow));
        go.transform.SetParent(parent, false); Poner(go.GetComponent<RectTransform>(), box);
        var img = go.GetComponent<Image>(); img.sprite = TierraArt.PanelRedondeado; img.type = Image.Type.Sliced; img.color = color;
        var shadow = go.GetComponent<Shadow>(); shadow.effectColor = new Color(0, 0, 0, .10f); shadow.effectDistance = new Vector2(0, -2);
        var button = go.GetComponent<Button>(); button.targetGraphic = img;
        var states = button.colors; states.normalColor = Color.white; states.highlightedColor = new Color32(237, 245, 225, 255);
        states.pressedColor = new Color32(225, 238, 212, 255); states.selectedColor = states.highlightedColor; button.colors = states;
        button.onClick.AddListener(() => { audioManager.Click(); accion(); });
        Color ink = textoColor ?? (Luminancia(color) < .43f ? Color.white : Verde);
        Texto(go.transform, label, size, ink, FontStyle.Bold, TextAnchor.MiddleCenter, new Rect(.5f, .5f, box.width - 14, box.height - 8));
        return button;
    }

    private static float Luminancia(Color c) { return .2126f * c.r + .7152f * c.g + .0722f * c.b; }

    private IEnumerator PopIn(RectTransform rect, float duration, float delay)
    {
        if (delay > 0f) yield return new WaitForSecondsRealtime(delay);
        if (rect == null) yield break;
        rect.localScale = Vector3.one * .45f;
        float elapsed = 0f;
        while (elapsed < duration && rect != null)
        {
            elapsed += Time.unscaledDeltaTime;
            float t = Mathf.Clamp01(elapsed / duration);
            float eased = 1f - Mathf.Pow(1f - t, 3f);
            rect.localScale = Vector3.one * Mathf.Lerp(.45f, 1f, eased);
            yield return null;
        }
        if (rect != null) rect.localScale = Vector3.one;
    }

    private void MascotaEn(Rect lugar)
    {
        mascota = Imagen(root, TierraArt.Mascota, lugar, Color.white, "Terra · personaje original").rectTransform;
        mascotaBase = mascota.anchoredPosition;
    }

    private static void Poner(RectTransform rect, Rect box)
    {
        rect.anchorMin = new Vector2(box.x, box.y); rect.anchorMax = new Vector2(box.x, box.y);
        rect.pivot = new Vector2(.5f, .5f); rect.anchoredPosition = Vector2.zero;
        rect.sizeDelta = new Vector2(box.width, box.height);
    }

    private void AbrirMision(int index)
    {
        SceneManager.LoadScene(Escenas[index]);
    }
    private void Empezar()
    {
        PrepararPartida(true);
        Render();
    }

    private void PrepararPartida(bool celebrarInicio)
    {
        pantalla = 2; ronda = 0; puntos = 0; impacto = 0; bienestar = 0; mensaje = "";
        planAhorro = false;
        ciudadEncendida = false; mezclaVisualEnergia = 0;
        pasajeroVisual = -1; modoViajeVisual = -1;
        rutasAdecuadas = 0; maquinaActiva = false; industriaEnProceso = false;
        Array.Clear(fuentesElegidas, 0, fuentesElegidas.Length);
        for (int sectorRed = 0; sectorRed < conexionesEnergia.Length; sectorRed++) conexionesEnergia[sectorRed] = -1;
        fuenteActiva = -1;
        for (int i = 0; i < procesos.Length; i++) procesos[i] = -1;
        for (int obra = 0; obra < procesosObras.Length; obra++) for (int pieza = 0; pieza < procesosObras[obra].Length; pieza++) procesosObras[obra][pieza] = -1;
        for (int i = 0; i < eleccionesRuta.Length; i++) eleccionesRuta[i] = -1;
        viaje = 0; materialActual = -1; parcelaSeleccionada = -1;
        semillas = 2; aguaBosque = 2; modoBosque = 0; plantadosEstaTemporada = 0; totalPlantados = 0; totalRegados = 0;
        for (int i = 0; i < parcelasBosque.Length; i++) parcelasBosque[i] = i == 2 || i == 7 ? 2 : i == 4 || i == 10 ? 1 : 0;
        Array.Clear(bosquePlantado, 0, bosquePlantado.Length);
        Array.Clear(riegoBosque, 0, riegoBosque.Length);
        Array.Clear(parcelasCultivo, 0, parcelasCultivo.Length);
        for (int i = 0; i < cultivoAnterior.Length; i++) cultivoAnterior[i] = -1;
        Array.Clear(compostado, 0, compostado.Length); Array.Clear(riegoCultivo, 0, riegoCultivo.Length);
        compost = 2; aguaCultivo = 2;
        Array.Clear(usosFuentes, 0, usosFuentes.Length);
        Array.Clear(usosProcesos, 0, usosProcesos.Length);
        Array.Clear(usosViajes, 0, usosViajes.Length);
        Array.Clear(usosCultivos, 0, usosCultivos.Length);
        turnosEnergiaCubiertos = 0; turnosEnergiaLimpios = 0; ahorrosEnergia = 0;
        rotacionesTotales = 0; compostTotal = 0; riegoTotal = 0;
        if (audioManager != null) audioManager.IniciarPartida();
        if (celebrarInicio && audioManager != null) audioManager.Acierto();
    }
    private void VolverInicio()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        VolverAlAtlasWeb();
#else
            SceneManager.LoadScene("Menu");
#endif
    }
    private void Reiniciar() { PrepararPartida(false); Render(); }
    private void Siguiente()
    {
        audioManager.Acierto();
        if (sector < Escenas.Length - 1) SceneManager.LoadScene(Escenas[sector + 1]);
        else VolverInicio();
    }

    private void ResolverEnergia()
    {
        if (SectoresConectados() < 3)
        {
            ciudadEncendida = false;
            mensaje = "Faltan sectores por conectar. Traza una ruta para Hogares, Escuela y Clínica.";
            audioManager.Aviso(); Render(); return;
        }
        int power = 0, carbon = 0;
        bool[] enRed = FuentesConectadas();
        for (int i = 0; i < Fuentes.Length; i++) if (enRed[i]) { power += Fuentes[i].energia; carbon += Fuentes[i].huella; }
        if (power < Demanda()) { ciudadEncendida = false; mensaje = "La red no alcanza la demanda: las ventanas siguen a oscuras. Prueba otra mezcla."; audioManager.Aviso(); Render(); return; }
        ciudadEncendida = true; mezclaVisualEnergia = 0;
        for (int i = 0; i < enRed.Length; i++) if (enRed[i]) mezclaVisualEnergia += 1 << i;
        for (int i = 0; i < Fuentes.Length; i++) if (enRed[i]) usosFuentes[i]++;
        turnosEnergiaCubiertos++;
        if (planAhorro) { carbon = Mathf.Max(0, carbon - 2); ahorrosEnergia++; }
        bool limpio = carbon <= 7;
        if (limpio) turnosEnergiaLimpios++;
        impacto += carbon; bienestar += Mathf.Min(5, power) + (planAhorro ? 2 : 0); if (limpio) puntos = Mathf.Min(5, puntos + 2);
        mensaje = limpio ? "¡La red sostuvo el servicio con una mezcla cuidadosa!" : "La demanda quedó cubierta; revisa cómo reducir la huella en el siguiente turno.";
        if (ronda == 2) audioManager.CierreResultado(NivelResultado()); else audioManager.Acierto();
        ronda++;
        if (ronda >= 3) pantalla = 3;
        planAhorro = false;
        if (ronda < 3)
        {
            Array.Clear(fuentesElegidas, 0, fuentesElegidas.Length);
            for (int i = 0; i < conexionesEnergia.Length; i++) conexionesEnergia[i] = -1;
            fuenteActiva = -1;
        }
        Render();
    }

    private void ResolverIndustria()
    {
        if (industriaEnProceso) return;
        int completed = 0, total = 0;
        for (int i = 0; i < procesos.Length; i++)
        {
            if (procesos[i] >= 0) completed++;
            if (procesos[i] >= 0) total += CostoMaterial(i, procesos[i]);
        }
        if (completed < procesos.Length) { mensaje = "Clasifica las cuatro piezas antes de iniciar la cinta."; audioManager.Aviso(); Render(); return; }
        industriaEnProceso = true;
        if (Application.isPlaying) StartCoroutine(AnimarLoteIndustria());
        else CompletarIndustria();
    }

    private IEnumerator AnimarLoteIndustria()
    {
        maquinaActiva = true;
        audioManager.Reciclar();
        Render();
        float hasta = Time.unscaledTime + .72f;
        while (Time.unscaledTime < hasta) yield return null;
        maquinaActiva = false;
        CompletarIndustria();
    }

    private void CompletarIndustria()
    {
        int total = 0;
        Array.Copy(procesos, procesosObras[Mathf.Clamp(ronda, 0, procesosObras.Length - 1)], procesos.Length);
        for (int i = 0; i < procesos.Length; i++) total += CostoMaterial(i, procesos[i]);
        for (int i = 0; i < procesos.Length; i++) usosProcesos[procesos[i]]++;
        impacto += total;
        bienestar += Mathf.Max(1, 20 - total);
        ronda++;
        if (ronda >= 3)
        {
            puntos = Mathf.Clamp(6 - impacto / 9, 1, 5);
            pantalla = 3; mensaje = "La ciudad tiene materiales para tres obras; compara el impacto acumulado.";
            industriaEnProceso = false;
            audioManager.CierreResultado(NivelResultado()); Render(); return;
        }
        for (int i = 0; i < procesos.Length; i++) procesos[i] = -1;
        materialActual = -1;
        mensaje = "Obra completada. La siguiente necesita otros materiales: vuelve a elegir cada proceso.";
        industriaEnProceso = false;
        audioManager.Acierto(); Render();
    }

    private void ResolverViaje(int modo)
    {
        pasajeroVisual = viaje; modoViajeVisual = modo;
        eleccionesRuta[viaje] = modo;
        usosViajes[modo]++;
        int huella = HuellaViaje[viaje, modo];
        int calidad = CalidadViaje[viaje, modo];
        if (calidad == 2) rutasAdecuadas++;
        impacto += huella;
        bienestar += (modo == 0 || modo == 3 ? 2 : 1) + calidad;
        puntos += huella <= 1 ? 1 : 0;
        viaje++;
        if (viaje >= Viajeros.Length)
        {
            int huellaScore = 6 - impacto / 5;
            int penalty = Mathf.CeilToInt((Viajeros.Length - rutasAdecuadas) / 2f);
            puntos = Mathf.Clamp(huellaScore - penalty, 1, 5);
            pantalla = 3; mensaje = "Seis viajes resueltos: revisa la huella y qué tan bien respondió cada ruta a la persona."; audioManager.CierreResultado(NivelResultado());
        }
        else mensaje = calidad == 2
            ? "Buena ruta para esta necesidad: la persona puede llegar con comodidad y seguridad."
            : calidad == 1
                ? "La ruta funciona, aunque otra opción podría responder mejor al trayecto."
                : "Esta ruta no encaja bien con la distancia o el acceso de esta persona; prueba otra estrategia en la siguiente partida.";
        Render();
    }

    private void ResolverBosque()
    {
        if (plantadosEstaTemporada < 2)
        {
            mensaje = "Completa dos plantaciones esta estación para que la ladera pueda recuperarse.";
            audioManager.Aviso(); Render(); return;
        }
        for (int i = 0; i < parcelasBosque.Length; i++)
        {
            if (parcelasBosque[i] == 3) parcelasBosque[i] = riegoBosque[i] ? 5 : 4;
            else if (parcelasBosque[i] == 4 && riegoBosque[i]) parcelasBosque[i] = 5;
            else if (parcelasBosque[i] == 5) parcelasBosque[i] = 1;
            riegoBosque[i] = false;
        }
        ronda++;
        if (ronda < 3)
        {
            semillas = 2; aguaBosque = 2; plantadosEstaTemporada = 0; modoBosque = 0;
            mensaje = "Los brotes ya echaron raíz. Comienza la siguiente estación con nuevos recursos.";
            audioManager.Acierto(); Render(); return;
        }
        int trees = 0, nests = 0;
        for (int i = 0; i < parcelasBosque.Length; i++)
        {
            if (parcelasBosque[i] == 1) trees++;
            if (parcelasBosque[i] == 2) nests++;
        }
        puntos = Mathf.Clamp(2 + totalRegados / 2, 1, 5);
        bienestar += trees * 2 + nests * 2;
        impacto = Mathf.Max(0, 24 - totalPlantados * 2 - totalRegados);
        pantalla = 3; mensaje = "Tres estaciones de restauración: los árboles, nidos y claros conviven."; audioManager.CierreResultado(NivelResultado()); Render();
    }

    private void ResolverAgricultura()
    {
        int unique = 0, legumes = 0, covers = 0, rotations = 0, compostUsed = 0, waterUsed = 0;
        bool[] cropPresent = new bool[3];
        for (int i = 0; i < parcelasCultivo.Length; i++)
        {
            cropPresent[parcelasCultivo[i]] = true;
            if (cultivoAnterior[i] >= 0 && cultivoAnterior[i] != parcelasCultivo[i]) rotations++;
            if (parcelasCultivo[i] == 1) legumes++;
            if (parcelasCultivo[i] == 2) covers++;
            if (compostado[i]) compostUsed++;
            if (riegoCultivo[i]) waterUsed++;
        }
        for (int i = 0; i < cropPresent.Length; i++) if (cropPresent[i]) unique++;
        for (int i = 0; i < parcelasCultivo.Length; i++) usosCultivos[parcelasCultivo[i]]++;
        rotacionesTotales += rotations; compostTotal += compostUsed; riegoTotal += waterUsed;
        impacto += Mathf.Max(2, 13 - unique * 2 - legumes - covers - compostUsed - waterUsed);
        bienestar += unique * 2 + rotations + compostUsed;
        Array.Copy(parcelasCultivo, cultivoAnterior, parcelasCultivo.Length);
        ronda++;
        if (ronda >= 3)
        {
            puntos = Mathf.Clamp(6 - impacto / 5, 1, 5);
            pantalla = 3;
            mensaje = "Cosecha de tres estaciones: suelo cubierto, cultivos variados y nutrientes en rotación.";
            audioManager.CierreResultado(NivelResultado()); Render(); return;
        }
        compost = Mathf.Min(3, compost + 1); aguaCultivo = Mathf.Min(3, aguaCultivo + 1);
        Array.Clear(compostado, 0, compostado.Length); Array.Clear(riegoCultivo, 0, riegoCultivo.Length);
        parcelaSeleccionada = -1;
        mensaje = "Estación cerrada. El cultivo queda como referencia: rota cada parcela para conservar nutrientes.";
        audioManager.Acierto(); Render();
    }

    private void AplicarCompost()
    {
        if (parcelaSeleccionada < 0) { mensaje = "Primero toca una parcela para seleccionarla."; audioManager.Aviso(); Render(); return; }
        if (compost <= 0) { mensaje = "Se acabó el compost de esta estación; guárdalo para otro surco."; audioManager.Aviso(); Render(); return; }
        if (compostado[parcelaSeleccionada]) { mensaje = "Esta parcela ya recibió compost esta estación."; audioManager.Aviso(); Render(); return; }
        compost--; compostado[parcelaSeleccionada] = true; mensaje = "Compost aplicado: devuelves nutrientes al suelo."; audioManager.Plantar(); Render();
    }

    private void AplicarRiegoCultivo()
    {
        if (parcelaSeleccionada < 0) { mensaje = "Primero toca una parcela para seleccionarla."; audioManager.Aviso(); Render(); return; }
        if (aguaCultivo <= 0) { mensaje = "Se acabó el agua de esta estación; elige qué cultivo priorizar."; audioManager.Aviso(); Render(); return; }
        if (riegoCultivo[parcelaSeleccionada]) { mensaje = "Esta parcela ya recibió agua esta estación."; audioManager.Aviso(); Render(); return; }
        aguaCultivo--; riegoCultivo[parcelaSeleccionada] = true; mensaje = "Agua asignada a la parcela " + (parcelaSeleccionada + 1) + "."; audioManager.Regar(); Render();
    }

    private int Demanda() { return 5 + ronda - (planAhorro ? 1 : 0); }
    private int CantidadFuentes() { int n = 0; for (int i = 0; i < fuentesElegidas.Length; i++) if (fuentesElegidas[i]) n++; return n; }
    private bool HayMarca(bool[] marcas) { for (int i = 0; i < marcas.Length; i++) if (marcas[i]) return true; return false; }
    private int CostoMaterial(int material, int proceso)
    {
        int[,] costes = { { 1, 2, 2, 5 }, { 3, 2, 4, 7 }, { 1, 2, 1, 4 }, { 1, 2, 2, 5 } };
        return costes[material, proceso];
    }
    private string IndicadorProgreso()
    {
        if (sector == 0) return "DIARIO DE ENERGÍA  ·  TURNO " + (ronda + 1) + " / 3";
        if (sector == 1) return "TALLER CIRCULAR  ·  OBRA " + (ronda + 1) + " / 3";
        if (sector == 2) return "CUADERNO DE VIAJE  ·  RUTA " + (viaje + 1) + " / " + Viajeros.Length;
        if (sector == 3) return "BITÁCORA DEL BOSQUE  ·  ESTACIÓN " + (ronda + 1) + " / 3";
        return "DIARIO DE SIEMBRA  ·  ESTACIÓN " + (ronda + 1) + " / 3";
    }
    private string Instruccion(int s)
    {
        string[] instrucciones =
        {
            "Conecta hasta tres fuentes. Al caer la noche, la mezcla que elijas decide si se encienden las ventanas del barrio.",
            "Los materiales cruzan la cinta en tres obras. Dales otra vida, ahorra energía, electrifica la fábrica o estrena material.",
            "Seis personas, seis trayectos. Elige bus, bici, caminata o viaje compartido según la distancia y quién viaja.",
            "La ladera necesita raíces. Planta dos especies nativas por estación, protege los nidos y reparte el agua.",
            "Cuida seis parcelas durante tres estaciones. Alterna cultivos, riega con criterio y devuelve nutrientes con compost."
        };
        return instrucciones[s];
    }
    private string TituloRonda()
    {
        if (sector == 0) return new[] { "La mañana despierta al barrio", "Cae la noche: enciende las ventanas", "La última noche pide una red limpia" }[Mathf.Clamp(ronda, 0, 2)];
        if (sector == 1) return new[] { "Construye con menos acero nuevo", "Renueva el puente sin desperdiciar", "Abastece la fábrica del barrio" }[Mathf.Clamp(ronda, 0, 2)];
        if (sector == 2) return "¿Qué ruta le sirve a esta persona?";
        if (sector == 3) return new[] { "Prepara la ladera para la lluvia", "Cuida brotes durante la sequía", "Conecta el bosque recuperado" }[Mathf.Clamp(ronda, 0, 2)];
        return new[] { "Prepara el suelo para la siembra", "Cuida el campo con menos lluvia", "Cierra la rotación y cosecha" }[Mathf.Clamp(ronda, 0, 2)];
    }
    private string MensajeRonda()
    {
        if (sector == 0) return ronda == 0
            ? "Selecciona fuentes, conecta Hogares, Escuela y Clínica, y cubre la demanda sin disparar la huella."
            : "Ya es de noche. Conecta los tres sectores; si falta energía, las ventanas seguirán a oscuras.";
        if (sector == 1) return ronda == 0 ? "Toca cada pieza, asigna un proceso y revisa el coste antes de fabricar." : "Esta obra usa de nuevo los cuatro materiales: evita dar por hecho que la misma solución siempre conviene.";
        if (sector == 2) return ContextosViaje[Mathf.Clamp(viaje, 0, Viajeros.Length - 1)];
        if (sector == 3)
        {
            if (ronda == 0) return "Selecciona PLANTAR y toca dos claros. Luego cambia a REGAR para priorizar los brotes.";
            if (ronda == 1) return "La estación es seca: riega los brotes nuevos que quieras priorizar y planta dos más.";
            return "Última estación: planta dos especies nuevas. Protege siempre los nidos y los árboles maduros.";
        }
        if (ronda == 0) return "Toca las parcelas para rotar su cultivo. Luego elige un surco y aplica agua o compost.";
        if (ronda == 1) return "Hay menos lluvia: rota cultivos y reparte el agua entre las parcelas más vulnerables.";
        return "Última estación: cambia cultivos para conservar nutrientes y cerrar la cosecha con cuidado.";
    }
    private string Reflexion()
    {
        if (sector == 0)
        {
            string mezcla = ResumenConteos(usosFuentes, new[] { "sol", "viento", "agua", "batería", "gas", "carbón" });
            return "Cubrieron la demanda en " + turnosEnergiaCubiertos + "/3 turnos; " + mezcla + ". Ahorro: " + ahorrosEnergia + " turnos; mezcla de baja huella: " + turnosEnergiaLimpios + "/3.";
        }
        if (sector == 1)
        {
            string rutas = ResumenConteos(usosProcesos, new[] { "reutilización", "eficiencia", "electrificación", "material nuevo" });
            return "En 12 decisiones de material elegiste " + rutas + ". Coste acumulado del escenario: " + impacto + " unidades; reutilizar o mejorar procesos ofrece una oportunidad para reducirlo.";
        }
        if (sector == 2)
        {
            return ResumenViajes();
        }
        if (sector == 3)
        {
            int arboles = 0, nidos = 0;
            for (int i = 0; i < parcelasBosque.Length; i++) { if (parcelasBosque[i] == 1) arboles++; if (parcelasBosque[i] == 2) nidos++; }
            return "Plantaste " + totalPlantados + " semillas y regaste " + totalRegados + " brotes. El terreno termina con " + arboles + " árboles desarrollados y " + nidos + " nidos conservados.";
        }
        string cultivos = ResumenConteos(usosCultivos, new[] { "grano", "leguminosa", "cobertura" });
        return "Rotaste " + rotacionesTotales + " parcelas; aplicaste compost " + compostTotal + " veces y riego " + riegoTotal + ". En tus elecciones predominaron " + cultivos + ".";
    }

    private string ResumenViajes()
    {
        string[] nombresModo = { "bus", "bicicleta", "a pie", "viaje compartido" };
        var resultados = new List<string>();
        for (int i = 0; i < Viajeros.Length; i++)
        {
            int modo = eleccionesRuta[i];
            if (modo < 0) continue;
            string nombre = Viajeros[i].Split('·')[0].Trim();
            string lectura = CalidadViaje[i, modo] == 2 ? "encaja con su necesidad" : CalidadViaje[i, modo] == 1 ? "funciona con una concesión" : "no responde bien al contexto";
            resultados.Add(nombre + ": " + nombresModo[modo] + " · " + lectura + " · huella " + HuellaViaje[i, modo]);
        }
        return "Tus seis trayectos: " + string.Join("; ", resultados.ToArray()) + ". La categoría también considera cuántas rutas cuidaron la necesidad de cada persona.";
    }

    private bool EsAviso(string text)
    {
        string[] comienzos = { "La ciudad aún", "La red no alcanza", "Faltan sectores", "Conecta hasta", "Clasifica las", "Primero toca", "Ya no te", "Usaste el agua", "Elige un claro", "Completa dos", "El nido es refugio", "Se acabó el", "Esta parcela ya", "Este cultivo ya", "Esta ruta no" };
        for (int i = 0; i < comienzos.Length; i++) if (text.StartsWith(comienzos[i], StringComparison.Ordinal)) return true;
        return false;
    }

    private static string ResumenConteos(int[] counts, string[] labels)
    {
        var entries = new List<string>();
        for (int i = 0; i < counts.Length; i++) if (counts[i] > 0) entries.Add(labels[i] + " " + counts[i]);
        return entries.Count == 0 ? "no registraste opciones" : string.Join(", ", entries.ToArray());
    }

    private static Color C(byte r, byte g, byte b) { return new Color32(r, g, b, 255); }
}
