using System.Collections.Generic;
using UnityEngine;

/// <summary>Pequeño paquete de ilustraciones 2D originales, dibujadas en código.</summary>
public static class TierraArt
{
    private static readonly Dictionary<string, Sprite> Cache = new Dictionary<string, Sprite>();
    private const int W = 640;
    private const int H = 360;

    public static Sprite Mascota { get { return Get("mascota", CrearMascota); } }
    public static Sprite Estrella { get { return Get("estrella", CrearEstrella); } }
    public static Sprite PanelRedondeado { get { return Get("panel-redondeado", CrearPanelRedondeado); } }
    public static Sprite Fondo(int tema) { return Get("fondo" + tema, () => CrearFondo(tema)); }
    public static Sprite FondoEnergia(int ronda, bool encendida) { return Get("fondo-energia-" + ronda + "-" + encendida, () => CrearFondoEnergia(ronda, encendida)); }
    public static Sprite Icono(int tema) { return Get("icono" + tema, () => CrearIcono(tema)); }
    public static Sprite IconoViaje(int modo) { return Get("viaje" + modo, () => CrearIconoViaje(modo)); }
    public static Sprite IconoBosque(int estado, bool regado) { return Get("terreno" + estado + (regado ? "-agua" : ""), () => CrearIconoBosque(estado, regado)); }
    public static Sprite IconoFuente(int fuente) { return Get("fuente" + fuente, () => CrearIconoFuente(fuente)); }
    public static Sprite IconoMaterial(int material, int proceso = -1) { return Get("material" + material + "-" + proceso, () => CrearIconoMaterial(material, proceso)); }
    public static Sprite IconoCultivo(int tipo, int etapa, bool compostado, bool regado) { return Get("cultivo" + tipo + "-" + etapa + (compostado ? "c" : "") + (regado ? "a" : ""), () => CrearIconoCultivo(tipo, etapa, compostado, regado)); }
    public static Sprite CapaEnergia(bool encendida, int mezcla) { return Get("energia-ciudad-" + encendida + "-" + mezcla, () => CrearCapaEnergia(encendida, mezcla)); }
    public static Sprite RedEnergia(int[] sectores, bool encendida)
    {
        string key = "red-energia-" + encendida;
        for (int i = 0; i < sectores.Length; i++) key += "-" + sectores[i];
        return Get(key, () => CrearRedEnergia(sectores, encendida));
    }
    public static Sprite EfectoRuta(int modo) { return Get("efecto-ruta" + modo, () => CrearEfectoRuta(modo)); }
    public static Sprite Chispas { get { return Get("chispas-industria", CrearChispas); } }
    public static Sprite CintaIndustria(int seleccionado) { return Get("cinta-industria-" + seleccionado, () => CrearCintaIndustria(seleccionado)); }
    public static Sprite MaquinaIndustria(bool activa) { return Get("maquina-industria-" + activa, () => CrearMaquinaIndustria(activa)); }

    private static Sprite Get(string key, System.Func<Sprite> make)
    {
        Sprite sprite;
        if (!Cache.TryGetValue(key, out sprite))
        {
            sprite = make();
            Cache[key] = sprite;
        }
        return sprite;
    }

    private static Sprite CrearMascota()
    {
        int size = 256;
        var d = new Dibujo(size, size);
        d.Circulo(128, 120, 92, new Color32(71, 167, 180, 255));
        d.Circulo(128, 120, 84, new Color32(58, 147, 165, 255));
        d.Elipse(88, 148, 36, 25, new Color32(109, 183, 100, 255));
        d.Elipse(151, 111, 31, 41, new Color32(109, 183, 100, 255));
        d.Elipse(102, 92, 18, 13, new Color32(109, 183, 100, 255));
        d.Linea(74, 73, 38, 39, 17, new Color32(32, 92, 81, 255));
        d.Linea(182, 72, 219, 38, 17, new Color32(32, 92, 81, 255));
        d.Circulo(87, 181, 20, Color.white); d.Circulo(169, 181, 20, Color.white);
        d.Circulo(92, 179, 8, new Color32(24, 49, 59, 255)); d.Circulo(165, 179, 8, new Color32(24, 49, 59, 255));
        d.Circulo(61, 137, 13, new Color32(245, 138, 123, 215));
        d.Circulo(195, 137, 13, new Color32(245, 138, 123, 215));
        d.Linea(101, 134, 117, 124, 5, new Color32(28, 69, 61, 255));
        d.Linea(117, 124, 135, 124, 5, new Color32(28, 69, 61, 255));
        d.Linea(135, 124, 153, 134, 5, new Color32(28, 69, 61, 255));
        d.Elipse(190, 229, 14, 30, new Color32(101, 176, 86, 255), -25);
        d.Linea(184, 211, 199, 247, 3, new Color32(38, 113, 63, 255));
        return d.Sprite("Tierra compañera");
    }

    private static Sprite CrearEstrella()
    {
        const int size = 128;
        var d = new Dibujo(size, size);
        int[] xs = new int[10], ys = new int[10];
        for (int i = 0; i < 10; i++)
        {
            float angle = (-90f + i * 36f) * Mathf.Deg2Rad;
            float radius = i % 2 == 0 ? 54f : 25f;
            xs[i] = 64 + Mathf.RoundToInt(Mathf.Cos(angle) * radius);
            ys[i] = 64 + Mathf.RoundToInt(Mathf.Sin(angle) * radius);
        }
        var gold = new Color32(245, 185, 70, 255);
        for (int i = 0; i < 10; i++) d.Triangulo(64, 64, xs[i], ys[i], xs[(i + 1) % 10], ys[(i + 1) % 10], gold);
        return d.Sprite("Estrella de logro");
    }

    private static Sprite CrearPanelRedondeado()
    {
        var d = new Dibujo(96, 96);
        d.RectanguloRedondeado(1, 1, 95, 95, 17, Color.white);
        return d.Sprite("Panel de esquinas suaves", new Vector4(18, 18, 18, 18));
    }

    private static Sprite CrearIconoFuente(int fuente)
    {
        var d = new Dibujo(96, 96);
        Color32 verde = new Color32(38, 101, 83, 255), azul = new Color32(67, 147, 166, 255), oro = new Color32(245, 190, 73, 255);
        if (fuente == 0)
        {
            d.Circulo(48, 68, 17, oro); d.Linea(48, 43, 48, 32, 4, oro); d.Linea(22, 68, 32, 68, 4, oro); d.Linea(64, 68, 74, 68, 4, oro);
            d.Rect(15, 17, 81, 26, new Color32(55, 117, 145, 255)); d.Linea(15, 22, 81, 22, 2, Color.white); d.Linea(37, 17, 37, 26, 2, Color.white); d.Linea(59, 17, 59, 26, 2, Color.white);
        }
        else if (fuente == 1)
        {
            d.Linea(48, 13, 48, 82, 5, verde); d.Circulo(48, 49, 7, oro); d.Linea(48, 49, 18, 27, 5, Color.white); d.Linea(48, 49, 80, 38, 5, Color.white); d.Linea(48, 49, 46, 83, 5, Color.white);
        }
        else if (fuente == 2)
        {
            d.Circulo(48, 57, 27, new Color32(197, 232, 237, 255)); d.Elipse(48, 61, 13, 22, azul, 0); d.Linea(13, 25, 83, 25, 4, verde); d.Linea(23, 17, 72, 17, 3, azul);
        }
        else if (fuente == 3)
        {
            d.RectanguloRedondeado(23, 15, 73, 82, 10, new Color32(111, 162, 116, 255)); d.Rect(32, 22, 64, 75, new Color32(229, 239, 211, 255)); d.Linea(36, 48, 60, 48, 4, verde); d.Linea(48, 40, 48, 57, 4, verde); d.Linea(36, 67, 60, 67, 3, azul);
        }
        else if (fuente == 4)
        {
            d.Elipse(48, 49, 23, 33, new Color32(226, 116, 76, 255)); d.Elipse(48, 40, 11, 21, oro); d.Linea(19, 80, 77, 80, 5, verde);
        }
        else
        {
            d.Circulo(33, 48, 17, new Color32(83, 91, 86, 255)); d.Circulo(55, 36, 18, new Color32(99, 104, 95, 255)); d.Circulo(64, 60, 19, new Color32(70, 78, 74, 255)); d.Circulo(34, 61, 15, new Color32(108, 108, 96, 255));
        }
        return d.Sprite("Fuente de energía " + fuente);
    }

    private static Sprite CrearIconoMaterial(int material, int proceso)
    {
        var d = new Dibujo(112, 96);
        Color32 metal = new Color32(118, 137, 131, 255), sombra = new Color32(68, 94, 86, 255), vidrio = new Color32(129, 198, 199, 255);
        if (material == 0) // acero: perfil I
        {
            d.Rect(28, 19, 84, 31, metal); d.Rect(47, 27, 65, 74, metal); d.Rect(28, 70, 84, 82, metal); d.Linea(32, 21, 78, 21, 2, Color.white);
        }
        else if (material == 1) // saco de cemento
        {
            d.Triangulo(30, 20, 82, 20, 73, 78, new Color32(212, 197, 158, 255)); d.Triangulo(30, 20, 39, 78, 73, 78, new Color32(230, 216, 178, 255)); d.Linea(34, 29, 78, 29, 4, sombra); d.Rect(44, 43, 69, 58, new Color32(144, 125, 89, 255));
        }
        else if (material == 2) // vidrio
        {
            d.RectanguloRedondeado(31, 17, 81, 81, 9, vidrio); d.Rect(38, 26, 45, 72, new Color32(224, 249, 238, 240)); d.Linea(32, 18, 80, 18, 3, new Color32(75, 143, 151, 255));
        }
        else // aluminio en forma de lámina enrollada
        {
            d.Rect(25, 26, 82, 72, new Color32(169, 180, 173, 255)); d.Circulo(35, 49, 22, new Color32(93, 112, 106, 255)); d.Circulo(35, 49, 14, new Color32(233, 237, 224, 255)); d.Circulo(35, 49, 7, new Color32(93, 112, 106, 255)); d.Linea(53, 27, 78, 27, 3, Color.white);
        }
        if (proceso == 2) // chispa: electrificación
        {
            d.Linea(91, 70, 83, 57, 4, new Color32(247, 185, 52, 255)); d.Linea(83, 57, 94, 53, 4, new Color32(247, 185, 52, 255)); d.Linea(94, 53, 87, 40, 4, new Color32(247, 185, 52, 255));
            d.Circulo(91, 75, 3, new Color32(255, 226, 111, 255)); d.Circulo(80, 43, 3, new Color32(255, 226, 111, 255));
        }
        else if (proceso == 0) // reutilizar: flechas que cierran el ciclo
        {
            d.Linea(17, 53, 25, 38, 4, new Color32(67, 150, 92, 255)); d.Triangulo(25, 38, 20, 41, 30, 42, new Color32(67, 150, 92, 255));
            d.Linea(21, 62, 36, 70, 4, new Color32(67, 150, 92, 255)); d.Triangulo(36, 70, 31, 64, 30, 75, new Color32(67, 150, 92, 255));
        }
        else if (proceso == 1) // eficiencia: destello
        {
            d.Circulo(93, 28, 8, new Color32(248, 193, 75, 255)); d.Linea(93, 15, 93, 8, 2, new Color32(248, 193, 75, 255)); d.Linea(81, 28, 75, 28, 2, new Color32(248, 193, 75, 255)); d.Linea(105, 28, 111, 28, 2, new Color32(248, 193, 75, 255));
        }
        else if (proceso == 3) // material nuevo: señal de incorporar una pieza
        {
            d.Circulo(94, 28, 11, new Color32(226, 119, 89, 255)); d.Linea(94, 20, 94, 36, 3, Color.white); d.Linea(86, 28, 102, 28, 3, Color.white);
        }
        return d.Sprite("Material circular " + material + " · proceso " + proceso);
    }

    private static Sprite CrearIconoCultivo(int tipo, int etapa, bool compostado, bool regado)
    {
        var d = new Dibujo(100, 96);
        Color32 suelo = new Color32(143, 102, 63, 255), hoja = tipo == 0 ? new Color32(190, 157, 65, 255) : tipo == 1 ? new Color32(75, 150, 87, 255) : new Color32(52, 124, 78, 255);
        d.RectanguloRedondeado(8, 8, 92, 24, 6, suelo); d.Linea(13, 24, 87, 24, 3, new Color32(108, 76, 48, 255));
        if (etapa > 0)
        {
            int h = etapa == 1 ? 30 : etapa == 2 ? 43 : 54;
            d.Linea(50, 23, 50, 23 + h, 5, new Color32(66, 129, 73, 255));
            d.Elipse(40, 31 + h / 2, 11, 6, hoja, -25); d.Elipse(61, 38 + h / 2, 11, 6, hoja, 25);
            if (tipo == 0) d.Circulo(50, 23 + h, etapa > 1 ? 8 : 5, new Color32(244, 193, 71, 255));
            else if (tipo == 1) { d.Circulo(46, 23 + h, 5, new Color32(101, 172, 95, 255)); d.Circulo(55, 23 + h, 5, new Color32(101, 172, 95, 255)); }
        }
        if (compostado) { d.Circulo(18, 77, 8, new Color32(91, 69, 47, 255)); d.Circulo(21, 79, 3, new Color32(199, 151, 79, 255)); }
        if (regado) { d.Elipse(82, 74, 5, 9, new Color32(72, 167, 202, 255), 18); d.Circulo(80, 81, 3, Color.white); }
        return d.Sprite("Cultivo " + tipo + " · etapa " + etapa);
    }

    private static Sprite CrearCapaEnergia(bool encendida, int mezcla)
    {
        var d = new Dibujo(W, H);
        if (!encendida) return d.Sprite("Ciudad sin luces");
        int[] widths = { 48, 35, 56, 42, 51, 38 };
        for (int i = 0; i < widths.Length; i++)
        {
            int w = widths[i], h = 42 + (i * 23 % 55), left = 45 + i * 55, lit = 0;
            for (int wx = left + 9; wx < left + w - 6; wx += 15)
                for (int wy = 82 + 9; wy < 82 + h - 5; wy += 17)
                {
                    int alpha = 185 + ((i + lit + mezcla) % 3) * 20;
                    d.Rect(wx - 2, wy - 2, wx + 8, wy + 10, new Color32(255, 213, 104, (byte)(alpha / 3)));
                    d.Rect(wx, wy, wx + 6, wy + 8, new Color32(255, 225, 132, (byte)alpha));
                    lit++;
                }
        }
        d.Circulo(520, 286, 48, new Color32(255, 221, 137, 26));
        return d.Sprite("Ventanas de la ciudad encendidas");
    }

    private static Sprite CrearRedEnergia(int[] sectores, bool encendida)
    {
        var d = new Dibujo(W, H);
        int[] fuenteX = { 422, 292, 505, 350, 106, 185 };
        int[] fuenteY = { 96, 130, 104, 91, 126, 108 };
        int[] destinoX = { 153, 322, 490 };
        int[] destinoY = { 142, 158, 139 };
        Color32[] tonos =
        {
            new Color32(255, 205, 82, 255), new Color32(114, 225, 207, 255),
            new Color32(124, 197, 255, 255), new Color32(178, 224, 129, 255),
            new Color32(255, 165, 111, 255), new Color32(207, 207, 178, 255)
        };
        for (int district = 0; district < Mathf.Min(3, sectores.Length); district++)
        {
            int source = sectores[district];
            if (source < 0 || source >= fuenteX.Length) continue;
            Color32 color = tonos[source];
            d.Linea(fuenteX[source], fuenteY[source], destinoX[district], destinoY[district], encendida ? 7 : 4,
                new Color32(color.r, color.g, color.b, (byte)(encendida ? 225 : 145)));
            d.Circulo(fuenteX[source], fuenteY[source], 8, new Color32(color.r, color.g, color.b, (byte)(encendida ? 245 : 185)));
            d.Circulo(destinoX[district], destinoY[district], encendida ? 11 : 8,
                new Color32(color.r, color.g, color.b, (byte)(encendida ? 255 : 180)));
        }
        return d.Sprite(encendida ? "Red eléctrica con corriente" : "Conexiones de la red eléctrica");
    }

    private static Sprite CrearFondoEnergia(int ronda, bool encendida)
    {
        if (ronda <= 0) return CrearFondo(0);
        var d = new Dibujo(W, H);
        d.Degradado(new Color32(22, 40, 67, 255), new Color32(75, 105, 119, 255));
        for (int i = 0; i < 30; i++)
        {
            int x = 19 + (i * 97 % 600), y = 177 + (i * 53 % 165);
            d.Circulo(x, y, i % 5 == 0 ? 2 : 1, new Color32(244, 232, 185, 220));
        }
        d.Circulo(516, 285, 36, new Color32(235, 226, 193, 255));
        d.Circulo(530, 298, 35, new Color32(22, 40, 67, 255)); // media luna
        d.Colina(0, 0, 230, 74, new Color32(53, 91, 83, 255));
        d.Colina(0, 0, 320, 48, new Color32(36, 71, 67, 255));
        d.Rect(0, 0, W, 83, new Color32(34, 74, 63, 255));
        d.CiudadNocturna(encendida);
        d.PanelSolar(380, 82); d.PanelSolar(448, 82); d.Molino(292, 85);
        d.Linea(0, 74, W, 74, 4, new Color32(161, 177, 133, 255));
        return d.Sprite("Ciudad de noche · luces " + (encendida ? "encendidas" : "apagadas"));
    }

    private static Sprite CrearCintaIndustria(int seleccionado)
    {
        var d = new Dibujo(520, 100);
        d.RectanguloRedondeado(5, 22, 515, 78, 12, new Color32(61, 88, 79, 238));
        d.Rect(13, 63, 507, 69, new Color32(111, 133, 117, 255));
        for (int i = 0; i < 4; i++)
        {
            int left = 19 + i * 123;
            Color32 fill = i == seleccionado ? new Color32(239, 181, 92, 255) : new Color32(231, 228, 207, 255);
            d.RectanguloRedondeado(left, 7, left + 112, 91, 9, new Color32(38, 74, 66, 245));
            d.RectanguloRedondeado(left + 3, 10, left + 109, 88, 7, fill);
            d.Circulo(left + 25, 17, 6, new Color32(47, 66, 61, 255));
            d.Circulo(left + 87, 17, 6, new Color32(47, 66, 61, 255));
        }
        return d.Sprite("Cinta de materiales de la fábrica");
    }

    private static Sprite CrearMaquinaIndustria(bool activa)
    {
        var d = new Dibujo(144, 144);
        Color32 cuerpo = new Color32(61, 119, 101, 255), oscuro = new Color32(44, 82, 73, 255);
        Color32 brillo = activa ? new Color32(255, 201, 79, 255) : new Color32(207, 216, 192, 255);
        d.Rect(20, 22, 124, 91, cuerpo);
        d.Rect(30, 90, 48, 129, oscuro); d.Rect(33, 118, 45, 136, activa ? new Color32(245, 149, 82, 255) : new Color32(129, 146, 131, 255));
        d.Rect(50, 84, 62, 111, new Color32(111, 133, 117, 255));
        d.RectanguloRedondeado(55, 37, 113, 83, 9, oscuro);
        d.Circulo(84, 60, 18, brillo); d.Circulo(84, 60, 8, cuerpo);
        for (int i = 0; i < 8; i++)
        {
            float angle = i * Mathf.PI / 4f;
            int x = 84 + Mathf.RoundToInt(Mathf.Cos(angle) * 25), y = 60 + Mathf.RoundToInt(Mathf.Sin(angle) * 25);
            d.Circulo(x, y, 5, brillo);
        }
        d.Rect(17, 20, 127, 31, oscuro);
        for (int x = 29; x < 120; x += 22) d.Circulo(x, 25, 5, new Color32(231, 230, 206, 255));
        d.Rect(17, 10, 127, 18, new Color32(117, 137, 118, 255));
        d.Rect(7, 4, 137, 10, new Color32(56, 78, 69, 255));
        if (activa)
        {
            d.Linea(108, 113, 101, 102, 4, brillo); d.Linea(101, 102, 112, 98, 4, brillo); d.Linea(112, 98, 106, 87, 4, brillo);
            d.Circulo(107, 119, 3, Color.white);
        }
        return d.Sprite(activa ? "Máquina circular trabajando" : "Máquina circular" );
    }

    private static Sprite CrearEfectoRuta(int modo)
    {
        var d = new Dibujo(128, 64);
        if (modo == 0) // bus: movimiento compartido
        {
            d.Linea(7, 12, 122, 12, 3, new Color32(242, 187, 77, 210)); d.Triangulo(122, 12, 111, 19, 112, 5, new Color32(242, 187, 77, 230));
        }
        else if (modo == 1) // bici
        {
            d.Linea(8, 14, 120, 14, 2, new Color32(68, 148, 112, 180)); d.Triangulo(120, 14, 111, 19, 111, 9, new Color32(68, 148, 112, 230));
        }
        else if (modo == 2) // caminar
        {
            d.Circulo(59, 35, 12, new Color32(237, 190, 110, 255)); d.Linea(59, 23, 60, 46, 7, new Color32(70, 135, 109, 255)); d.Linea(59, 30, 46, 40, 5, new Color32(44, 95, 83, 255)); d.Linea(60, 46, 48, 60, 5, new Color32(44, 95, 83, 255)); d.Linea(60, 46, 72, 58, 5, new Color32(44, 95, 83, 255));
        }
        else
        {
            d.RectanguloRedondeado(25, 25, 101, 53, 9, new Color32(83, 161, 145, 255)); d.Circulo(40, 24, 8, new Color32(44, 75, 67, 255)); d.Circulo(85, 24, 8, new Color32(44, 75, 67, 255)); d.Circulo(53, 39, 5, new Color32(246, 189, 77, 255)); d.Circulo(71, 39, 5, new Color32(246, 128, 101, 255));
        }
        return d.Sprite("Viaje por la ciudad " + modo);
    }

    private static Sprite CrearChispas()
    {
        var d = new Dibujo(96, 96);
        Color32 oro = new Color32(255, 207, 78, 255), luz = new Color32(255, 238, 155, 255);
        d.Linea(47, 48, 39, 32, 4, oro); d.Linea(39, 32, 51, 35, 4, luz); d.Linea(51, 35, 47, 19, 4, oro);
        d.Linea(66, 63, 77, 54, 3, oro); d.Linea(77, 54, 69, 52, 3, luz); d.Linea(25, 61, 15, 53, 3, oro);
        d.Linea(56, 75, 59, 84, 3, luz); d.Linea(29, 39, 22, 31, 3, luz);
        return d.Sprite("Chispas de electrificación");
    }

    private static Sprite CrearIconoBosque(int estado, bool regado)
    {
        var d = new Dibujo(96, 96);
        var tierra = new Color32(131, 91, 57, 255);
        var tronco = new Color32(111, 74, 48, 255);
        var verde = new Color32(68, 145, 82, 255);
        var hoja = new Color32(92, 172, 98, 255);
        var agua = new Color32(76, 164, 205, 255);
        d.Rect(8, 10, 88, 24, new Color32(156, 115, 72, 255));
        d.Linea(10, 23, 86, 23, 3, tierra);
        if (estado == 0)
        {
            d.Elipse(47, 24, 14, 5, new Color32(204, 173, 122, 255));
            d.Circulo(47, 25, 2, new Color32(108, 80, 52, 255));
            d.Linea(17, 16, 31, 14, 2, new Color32(205, 180, 139, 255));
            d.Linea(64, 15, 79, 17, 2, new Color32(205, 180, 139, 255));
        }
        else if (estado == 1)
        {
            d.Rect(43, 20, 53, 56, tronco);
            d.Triangulo(48, 88, 18, 47, 78, 47, new Color32(48, 126, 72, 255));
            d.Triangulo(48, 75, 23, 38, 73, 38, verde);
            d.Triangulo(48, 63, 28, 31, 68, 31, hoja);
        }
        else if (estado == 2)
        {
            d.Rect(45, 23, 51, 66, tronco);
            d.Circulo(47, 66, 22, new Color32(79, 150, 84, 255));
            d.Circulo(34, 54, 15, verde); d.Circulo(61, 55, 16, hoja);
            d.Linea(28, 37, 66, 37, 5, new Color32(127, 82, 51, 255));
            d.Elipse(43, 43, 9, 6, new Color32(209, 157, 92, 255));
            d.Circulo(40, 47, 4, new Color32(249, 236, 206, 255));
            d.Circulo(51, 47, 4, new Color32(249, 236, 206, 255));
        }
        else if (estado == 3)
        {
            d.Elipse(48, 34, 8, 11, new Color32(137, 88, 50, 255), -22);
            d.Linea(48, 45, 48, 57, 3, new Color32(111, 155, 76, 255));
            if (regado) { d.Elipse(42, 61, 5, 8, hoja, -42); d.Elipse(54, 63, 5, 8, verde, 42); }
        }
        else
        {
            d.Linea(48, 23, 48, estado == 4 ? 64 : 73, estado == 4 ? 5 : 7, new Color32(83, 145, 78, 255));
            d.Elipse(38, estado == 4 ? 57 : 66, 10, 6, hoja, -28);
            d.Elipse(58, estado == 4 ? 61 : 70, 10, 6, verde, 28);
            if (estado == 5) { d.Elipse(48, 82, 8, 7, new Color32(109, 183, 97, 255)); d.Circulo(48, 78, 6, hoja); }
        }
        if (regado && estado >= 3)
        {
            d.Elipse(76, 72, 4, 7, agua, 15); d.Elipse(84, 60, 3, 5, agua, 15);
        }
        return d.Sprite("Estado visual del bosque " + estado);
    }

    private static Sprite CrearIcono(int tema)
    {
        var d = new Dibujo(160, 160);
        Color32 verde = new Color32(35, 103, 81, 255);
        Color32 acento = new Color32(239, 153, 73, 255);
        if (tema == 0)
        {
            d.Circulo(79, 96, 26, new Color32(246, 193, 75, 255));
            d.Linea(79, 55, 79, 42, 5, acento); d.Linea(79, 138, 79, 126, 5, acento);
            d.Linea(38, 96, 51, 96, 5, acento); d.Linea(107, 96, 120, 96, 5, acento);
            d.Rect(36, 35, 123, 49, new Color32(55, 116, 138, 255));
            d.Linea(41, 30, 118, 30, 4, verde); d.Linea(60, 26, 60, 55, 3, verde); d.Linea(99, 26, 99, 55, 3, verde);
        }
        else if (tema == 1)
        {
            d.Rect(26, 42, 134, 105, new Color32(75, 119, 105, 255));
            d.Rect(44, 100, 58, 137, new Color32(95, 112, 107, 255));
            d.Rect(95, 105, 108, 139, new Color32(95, 112, 107, 255));
            d.Circulo(51, 145, 12, new Color32(193, 196, 163, 190)); d.Circulo(65, 154, 15, new Color32(193, 196, 163, 150));
            d.Rect(40, 48, 60, 72, new Color32(246, 196, 90, 255));
            d.Rect(76, 48, 97, 72, new Color32(246, 196, 90, 255));
        }
        else if (tema == 2)
        {
            d.Rect(20, 47, 139, 101, new Color32(60, 141, 125, 255));
            d.Rect(37, 94, 121, 124, new Color32(76, 161, 151, 255));
            d.Rect(33, 65, 61, 89, new Color32(197, 233, 215, 255));
            d.Rect(67, 65, 95, 89, new Color32(197, 233, 215, 255));
            d.Rect(101, 65, 125, 89, new Color32(197, 233, 215, 255));
            d.Circulo(45, 43, 13, new Color32(36, 66, 63, 255)); d.Circulo(113, 43, 13, new Color32(36, 66, 63, 255));
        }
        else if (tema == 3)
        {
            d.Triangulo(79, 142, 25, 72, 132, 72, new Color32(63, 140, 85, 255));
            d.Triangulo(79, 120, 18, 54, 140, 54, new Color32(80, 161, 93, 255));
            d.Rect(71, 27, 88, 62, new Color32(117, 82, 53, 255));
            d.Circulo(129, 125, 8, acento); d.Circulo(31, 126, 7, new Color32(70, 154, 97, 255));
        }
        else
        {
            d.Rect(24, 37, 136, 60, new Color32(124, 91, 60, 255));
            d.Linea(35, 70, 124, 70, 4, new Color32(80, 146, 84, 255));
            d.Linea(35, 88, 124, 88, 4, new Color32(80, 146, 84, 255));
            d.Linea(35, 106, 124, 106, 4, new Color32(80, 146, 84, 255));
            d.Elipse(78, 118, 13, 25, new Color32(85, 169, 91, 255), -24);
            d.Elipse(105, 133, 11, 21, new Color32(108, 183, 97, 255), 24);
        }
        return d.Sprite("Icono tema " + tema);
    }

    private static Sprite CrearIconoViaje(int modo)
    {
        var d = new Dibujo(160, 120);
        Color32 tinta = new Color32(44, 95, 83, 255);
        if (modo == 0)
        {
            d.Rect(18, 31, 143, 79, new Color32(242, 177, 80, 255));
            d.Rect(29, 59, 58, 73, new Color32(207, 236, 223, 255));
            d.Rect(65, 59, 94, 73, new Color32(207, 236, 223, 255));
            d.Rect(101, 59, 131, 73, new Color32(207, 236, 223, 255));
            d.Circulo(45, 28, 13, tinta); d.Circulo(117, 28, 13, tinta);
        }
        else if (modo == 1)
        {
            d.Circulo(34, 31, 23, tinta); d.Circulo(126, 31, 23, tinta);
            d.Circulo(34, 31, 15, Color.white); d.Circulo(126, 31, 15, Color.white);
            d.Linea(34, 31, 69, 72, 6, new Color32(78, 155, 121, 255));
            d.Linea(69, 72, 92, 31, 6, new Color32(78, 155, 121, 255));
            d.Linea(92, 31, 34, 31, 6, new Color32(78, 155, 121, 255));
            d.Linea(69, 72, 123, 71, 6, new Color32(78, 155, 121, 255));
            d.Linea(123, 71, 92, 31, 6, new Color32(78, 155, 121, 255));
            d.Linea(69, 72, 79, 99, 5, tinta); d.Linea(79, 99, 98, 99, 4, tinta);
        }
        else if (modo == 2)
        {
            d.Circulo(79, 91, 14, new Color32(239, 182, 95, 255));
            d.Linea(78, 77, 78, 48, 9, new Color32(83, 161, 145, 255));
            d.Linea(78, 63, 56, 52, 7, tinta); d.Linea(78, 63, 100, 53, 7, tinta);
            d.Linea(78, 48, 61, 24, 8, tinta); d.Linea(78, 48, 99, 25, 8, tinta);
            d.Linea(79, 103, 56, 114, 4, new Color32(78, 155, 121, 255));
            d.Linea(79, 103, 101, 114, 4, new Color32(78, 155, 121, 255));
        }
        else
        {
            d.Rect(17, 39, 143, 76, new Color32(83, 161, 145, 255));
            d.Triangulo(38, 76, 57, 104, 113, 76, new Color32(83, 161, 145, 255));
            d.Circulo(45, 37, 14, tinta); d.Circulo(117, 37, 14, tinta);
            d.Rect(54, 57, 105, 67, new Color32(195, 225, 213, 255));
            d.Circulo(73, 92, 12, new Color32(239, 189, 83, 255));
            d.Circulo(96, 92, 12, new Color32(238, 125, 96, 255));
        }
        return d.Sprite("Modo de viaje " + modo);
    }

    private static Sprite CrearFondo(int tema)
    {
        var d = new Dibujo(W, H);
        Color32 cielo = tema == 3 ? new Color32(194, 223, 202, 255) : new Color32(177, 220, 225, 255);
        d.Degradado(cielo, new Color32(239, 235, 198, 255));
        d.Circulo(530, 292, 35, new Color32(248, 197, 86, 255));
        d.Nube(120, 285); d.Nube(330, 312);
        d.Colina(0, 0, 230, 74, new Color32(137, 186, 132, 255));
        d.Colina(0, 0, 320, 48, new Color32(99, 160, 118, 255));
        d.Rect(0, 0, W, 83, new Color32(72, 133, 93, 255));

        if (tema == 0)
        {
            d.Ciudad(45, 82, new Color32(95, 132, 132, 255));
            d.PanelSolar(380, 82); d.PanelSolar(448, 82); d.Molino(292, 85);
            d.Linea(0, 74, W, 74, 4, new Color32(244, 224, 148, 255));
        }
        else if (tema == 1)
        {
            d.Fabrica(145, 83); d.Fabrica(375, 83);
            d.Circulo(202, 207, 20, new Color32(218, 216, 190, 175));
            d.Circulo(228, 226, 26, new Color32(218, 216, 190, 145));
            d.Ciudad(5, 82, new Color32(117, 146, 137, 255));
        }
        else if (tema == 2)
        {
            d.Carretera(); d.Autobus(136, 89); d.Coche(416, 86);
            d.Ciudad(5, 82, new Color32(107, 150, 145, 255));
        }
        else if (tema == 3)
        {
            for (int i = 0; i < 9; i++) d.Arbol(35 + i * 72, 76 + (i % 3) * 9, i % 2 == 0);
            d.Rect(285, 77, 342, 91, new Color32(116, 82, 53, 255));
            d.Circulo(456, 101, 22, new Color32(246, 238, 218, 255));
        }
        else
        {
            d.Campo(); d.Granja(450, 83);
            // Surcos abiertos: los seis cultivos de la partida aparecen encima y ocupan este campo.
            for (int i = 0; i < 6; i++)
            {
                int x = 80 + (i % 3) * 100, y = 48 + (i / 3) * 34;
                d.RectanguloRedondeado(x, y, x + 68, y + 8, 4, new Color32(117, 83, 55, 255));
                d.Linea(x + 5, y + 4, x + 63, y + 4, 2, new Color32(171, 126, 74, 255));
            }
        }
        return d.Sprite("Paisaje tema " + tema);
    }

    private sealed class Dibujo
    {
        private readonly int ancho, alto;
        private readonly Color32[] pixeles;
        public Dibujo(int w, int h)
        {
            ancho = w; alto = h; pixeles = new Color32[w * h];
        }
        private void Set(int x, int y, Color32 c)
        {
            if (x >= 0 && x < ancho && y >= 0 && y < alto) pixeles[y * ancho + x] = c;
        }
        public void Rect(int x0, int y0, int x1, int y1, Color32 c)
        {
            for (int y = Mathf.Max(0, y0); y < Mathf.Min(alto, y1); y++)
                for (int x = Mathf.Max(0, x0); x < Mathf.Min(ancho, x1); x++) Set(x, y, c);
        }
        public void RectanguloRedondeado(int x0, int y0, int x1, int y1, int radio, Color32 c)
        {
            for (int y = Mathf.Max(0, y0); y < Mathf.Min(alto, y1); y++)
                for (int x = Mathf.Max(0, x0); x < Mathf.Min(ancho, x1); x++)
                {
                    int cx = x < x0 + radio ? x0 + radio : x >= x1 - radio ? x1 - radio - 1 : x;
                    int cy = y < y0 + radio ? y0 + radio : y >= y1 - radio ? y1 - radio - 1 : y;
                    int dx = x - cx, dy = y - cy;
                    if (dx * dx + dy * dy <= radio * radio) Set(x, y, c);
                }
        }
        public void Circulo(int cx, int cy, int r, Color32 c)
        {
            int r2 = r * r;
            for (int y = cy - r; y <= cy + r; y++) for (int x = cx - r; x <= cx + r; x++)
                if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r2) Set(x, y, c);
        }
        public void Elipse(int cx, int cy, int rx, int ry, Color32 c, float giro = 0)
        {
            float rad = giro * Mathf.Deg2Rad, cs = Mathf.Cos(rad), sn = Mathf.Sin(rad);
            int r = Mathf.Max(rx, ry);
            for (int y = cy - r; y <= cy + r; y++) for (int x = cx - r; x <= cx + r; x++)
            {
                float dx = x - cx, dy = y - cy;
                float px = dx * cs + dy * sn, py = -dx * sn + dy * cs;
                if (px * px / (rx * rx) + py * py / (ry * ry) <= 1) Set(x, y, c);
            }
        }
        public void Linea(int x0, int y0, int x1, int y1, int grosor, Color32 c)
        {
            int dx = Mathf.Abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
            int dy = -Mathf.Abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
            while (true)
            {
                Circulo(x0, y0, Mathf.Max(1, grosor / 2), c);
                if (x0 == x1 && y0 == y1) break;
                int e2 = 2 * err;
                if (e2 >= dy) { err += dy; x0 += sx; }
                if (e2 <= dx) { err += dx; y0 += sy; }
            }
        }
        public void Triangulo(int x1, int y1, int x2, int y2, int x3, int y3, Color32 c)
        {
            int minX = Mathf.Min(x1, Mathf.Min(x2, x3)), maxX = Mathf.Max(x1, Mathf.Max(x2, x3));
            int minY = Mathf.Min(y1, Mathf.Min(y2, y3)), maxY = Mathf.Max(y1, Mathf.Max(y2, y3));
            float denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
            if (Mathf.Abs(denom) < 0.001f) return;
            for (int y = minY; y <= maxY; y++) for (int x = minX; x <= maxX; x++)
            {
                float a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denom;
                float b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denom;
                if (a >= 0 && b >= 0 && a + b <= 1) Set(x, y, c);
            }
        }
        public void Degradado(Color32 arriba, Color32 abajo)
        {
            for (int y = 0; y < alto; y++)
            {
                Color c = Color.Lerp(abajo, arriba, y / (float)alto);
                for (int x = 0; x < ancho; x++) Set(x, y, c);
            }
        }
        public void Nube(int x, int y)
        {
            var cloud = new Color32(246, 250, 239, 205);
            Circulo(x, y, 19, cloud); Circulo(x + 23, y + 10, 25, cloud); Circulo(x + 48, y, 18, cloud);
            Rect(x - 2, y - 12, x + 48, y + 2, cloud);
        }
        public void Colina(int ox, int oy, int amp, int baseY, Color32 c)
        {
            for (int x = ox; x < ancho; x++)
            {
                int top = baseY + Mathf.RoundToInt(Mathf.Sin((x + amp) * 0.011f) * amp * 0.18f) + Mathf.RoundToInt(Mathf.Sin(x * 0.026f) * amp * 0.06f);
                for (int y = 0; y < top; y++) Set(x, y, c);
            }
        }
        public void Ciudad(int x, int y, Color32 c)
        {
            int[] widths = { 48, 35, 56, 42, 51, 38 };
            for (int i = 0; i < widths.Length; i++)
            {
                int w = widths[i], h = 42 + (i * 23 % 55), left = x + i * 55;
                Rect(left, y, left + w, y + h, c);
                for (int wx = left + 9; wx < left + w - 6; wx += 15)
                    for (int wy = y + 9; wy < y + h - 5; wy += 17) Rect(wx, wy, wx + 6, wy + 8, new Color32(241, 206, 129, 220));
            }
        }
        public void CiudadNocturna(bool encendida)
        {
            int[] widths = { 48, 35, 56, 42, 51, 38 };
            Color32 fachada = new Color32(48, 66, 78, 255);
            for (int i = 0; i < widths.Length; i++)
            {
                int w = widths[i], h = 42 + (i * 23 % 55), left = 45 + i * 55;
                Rect(left, 82, left + w, 82 + h, fachada);
                for (int wx = left + 9; wx < left + w - 6; wx += 15)
                    for (int wy = 91; wy < 82 + h - 5; wy += 17)
                    {
                        if (encendida)
                        {
                            Rect(wx - 3, wy - 3, wx + 9, wy + 11, new Color32(255, 202, 91, 65));
                            Rect(wx, wy, wx + 6, wy + 8, new Color32(255, 218, 123, 255));
                        }
                        else Rect(wx, wy, wx + 6, wy + 8, new Color32(76, 99, 107, 255));
                    }
            }
        }
        public void PanelSolar(int x, int y)
        {
            Rect(x, y, x + 54, y + 24, new Color32(53, 111, 143, 255));
            Linea(x + 18, y, x + 18, y + 24, 2, new Color32(191, 226, 219, 255));
            Linea(x + 36, y, x + 36, y + 24, 2, new Color32(191, 226, 219, 255));
            Linea(x, y + 12, x + 54, y + 12, 2, new Color32(191, 226, 219, 255));
            Linea(x + 27, y, x + 27, y - 16, 4, new Color32(80, 97, 91, 255));
        }
        public void Molino(int x, int y)
        {
            Linea(x, y, x, y + 112, 7, new Color32(239, 242, 226, 255));
            Circulo(x, y + 111, 8, new Color32(61, 96, 81, 255));
            Linea(x, y + 111, x - 41, y + 155, 5, Color.white);
            Linea(x, y + 111, x + 49, y + 140, 5, Color.white);
            Linea(x, y + 111, x + 3, y + 53, 5, Color.white);
        }
        public void Fabrica(int x, int y)
        {
            Rect(x, y, x + 180, y + 77, new Color32(74, 131, 112, 255));
            Triangulo(x + 4, y + 76, x + 68, y + 127, x + 112, y + 76, new Color32(74, 131, 112, 255));
            Rect(x + 114, y + 72, x + 143, y + 150, new Color32(142, 112, 83, 255));
            Rect(x + 145, y + 72, x + 160, y + 121, new Color32(94, 126, 111, 255));
            for (int i = 0; i < 4; i++) Rect(x + 17 + i * 40, y + 18, x + 39 + i * 40, y + 47, new Color32(239, 204, 124, 255));
        }
        public void Carretera()
        {
            Rect(0, 0, W, 100, new Color32(90, 103, 98, 255));
            for (int x = 22; x < W; x += 104) Rect(x, 46, x + 55, 52, new Color32(246, 231, 172, 255));
        }
        public void Autobus(int x, int y)
        {
            Rect(x, y, x + 166, y + 67, new Color32(238, 166, 76, 255));
            Rect(x + 10, y + 37, x + 150, y + 57, new Color32(183, 221, 208, 255));
            Circulo(x + 38, y + 2, 16, new Color32(47, 67, 67, 255)); Circulo(x + 132, y + 2, 16, new Color32(47, 67, 67, 255));
        }
        public void Coche(int x, int y)
        {
            Rect(x, y, x + 112, y + 42, new Color32(92, 157, 150, 255));
            Triangulo(x + 20, y + 42, x + 42, y + 67, x + 86, y + 42, new Color32(92, 157, 150, 255));
            Circulo(x + 25, y + 4, 13, new Color32(43, 66, 65, 255)); Circulo(x + 89, y + 4, 13, new Color32(43, 66, 65, 255));
        }
        public void Arbol(int x, int y, bool alto)
        {
            int h = alto ? 116 : 88;
            Rect(x - 8, y, x + 8, y + h / 2, new Color32(123, 84, 55, 255));
            Circulo(x, y + h / 2 + 20, alto ? 35 : 28, new Color32(68, 142, 80, 255));
            Circulo(x - 19, y + h / 2 + 3, alto ? 24 : 19, new Color32(83, 161, 88, 255));
            Circulo(x + 20, y + h / 2 + 4, alto ? 25 : 20, new Color32(98, 173, 94, 255));
        }
        public void Campo()
        {
            for (int i = 0; i < 8; i++) Linea(0, 28 + i * 7, W, 28 + i * 7, 2, new Color32(186, 153, 94, 255));
        }
        public void Planta(int x, int y)
        {
            Linea(x, y, x, y + 55, 4, new Color32(55, 121, 71, 255));
            Elipse(x - 8, y + 35, 8, 22, new Color32(104, 174, 86, 255), -31);
            Elipse(x + 9, y + 47, 8, 23, new Color32(124, 183, 91, 255), 31);
            Circulo(x, y + 57, 7, new Color32(241, 194, 80, 255));
        }
        public void Granja(int x, int y)
        {
            Rect(x, y, x + 108, y + 61, new Color32(221, 149, 105, 255));
            Triangulo(x - 8, y + 61, x + 52, y + 108, x + 116, y + 61, new Color32(124, 83, 72, 255));
            Rect(x + 40, y, x + 70, y + 39, new Color32(246, 211, 154, 255));
        }
        public Sprite Sprite(string nombre, Vector4 border = default(Vector4))
        {
            var texture = new Texture2D(ancho, alto, TextureFormat.RGBA32, false);
            texture.name = nombre; texture.filterMode = FilterMode.Bilinear; texture.wrapMode = TextureWrapMode.Clamp;
            texture.SetPixels32(pixeles); texture.Apply(false, true);
            return UnityEngine.Sprite.Create(texture, new Rect(0, 0, ancho, alto), new Vector2(.5f, .5f), 100f, 0, SpriteMeshType.FullRect, border);
        }
    }
}
