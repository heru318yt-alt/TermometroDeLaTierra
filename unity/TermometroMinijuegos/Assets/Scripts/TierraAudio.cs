using System.Collections.Generic;
using UnityEngine;

/// <summary>Música y efectos de interacción del juego; incluye grabaciones CC0 para los resultados.</summary>
public sealed class TierraAudio : MonoBehaviour
{
    private static TierraAudio instance;
    private AudioSource musica;
    private AudioSource efectos;
    private readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();
    private bool musicaDesbloqueada;
    private bool cierreReproducido;

    public static TierraAudio Instancia
    {
        get
        {
            if (instance == null)
            {
                var go = new GameObject("Audio · Termómetro de la Tierra");
                instance = go.AddComponent<TierraAudio>();
            }
            return instance;
        }
    }

    private void Awake()
    {
        if (instance != null && instance != this) { Destroy(gameObject); return; }
        instance = this;
        DontDestroyOnLoad(gameObject);
        if (FindAnyObjectByType<AudioListener>() == null) gameObject.AddComponent<AudioListener>();
        musica = gameObject.AddComponent<AudioSource>();
        efectos = gameObject.AddComponent<AudioSource>();
        musica.loop = true; musica.playOnAwake = false; musica.spatialBlend = 0;
        efectos.playOnAwake = false; efectos.spatialBlend = 0;
        musica.clip = CrearMusica();
        musica.volume = PlayerPrefs.GetFloat("TierraMusica", .14f);
        efectos.volume = PlayerPrefs.GetFloat("TierraEfectos", .7f);
        CrearEfectos();
    }

    private AudioClip CrearMusica()
    {
        const int rate = 22050, seconds = 8;
        int count = rate * seconds;
        var data = new float[count];
        float[] notes = { 130.81f, 164.81f, 196f, 220f, 196f, 164.81f, 146.83f, 174.61f };
        for (int i = 0; i < count; i++)
        {
            float t = i / (float)rate;
            int step = Mathf.FloorToInt(t);
            float envelope = .5f + .5f * Mathf.Sin(t * Mathf.PI / seconds);
            float note = notes[step % notes.Length];
            float pulse = .62f + .38f * Mathf.Sin(t * Mathf.PI * 2f / 2f);
            float tone = Mathf.Sin(2f * Mathf.PI * note * t) * .46f
                       + Mathf.Sin(2f * Mathf.PI * note * 1.5f * t) * .13f
                       + Mathf.Sin(2f * Mathf.PI * note * 2f * t) * .08f;
            data[i] = tone * envelope * pulse * .12f;
        }
        var clip = AudioClip.Create("Brisa y tierra · música original", count, 1, rate, false);
        clip.SetData(data, 0);
        return clip;
    }

    private void CrearEfectos()
    {
        clips["tap"] = Tono("Toque", 520, 730, .075f, .18f);
        clips["plant"] = Tono("Semilla", 340, 820, .23f, .34f);
        clips["good"] = Tono("Logro", 560, 920, .45f, .3f);
        clips["bad"] = Tono("Aviso", 240, 185, .25f, .26f);
        clips["harvest"] = Tono("Cosecha", 390, 1040, .38f, .3f);
        clips["wind"] = Tono("Viento", 200, 440, .3f, .12f);
        clips["water"] = GotasDeAgua();
        clips["spark"] = ChispaOriginal();
        clips["recycle"] = Tono("Ciclo de reutilización", 460, 760, .28f, .22f);
        clips["efficient"] = Tono("Proceso eficiente", 620, 880, .20f, .18f);
        clips["applause"] = Aplausos();
        clips["boos"] = Abucheos();
        clips["applause"] = Resources.Load<AudioClip>("Audio/aplausos-publico") ?? clips["applause"];
        clips["boos"] = Resources.Load<AudioClip>("Audio/abucheo-publico") ?? clips["boos"];
        clips["neutral"] = Tono("Cierre tranquilo", 480, 560, .24f, .10f);
    }

    private AudioClip Aplausos()
    {
        const int rate = 22050;
        const float duration = 1.55f;
        int count = Mathf.CeilToInt(rate * duration);
        var data = new float[count];
        for (int i = 0; i < count; i++)
        {
            float t = i / (float)rate;
            float crowd = .36f + .24f * Mathf.Sin(t * 2.2f);
            float pulse = Mathf.Pow(Mathf.Max(0f, Mathf.Sin(t * 34f + Mathf.Sin(t * 5f))), 7f);
            float ripple = Mathf.Sin(i * 12.9898f) * Mathf.Sin(i * .0171f);
            float clap = Mathf.Sin(2f * Mathf.PI * (1250f + 500f * Mathf.Sin(t * 17f)) * t);
            float envelope = Mathf.Min(1f, t * 10f) * Mathf.Min(1f, (duration - t) * 3f);
            data[i] = (ripple * .64f + clap * .36f) * pulse * crowd * envelope * .38f;
        }
        var clip = AudioClip.Create("Aplausos del barrio · final positivo", count, 1, rate, false);
        clip.SetData(data, 0);
        return clip;
    }

    private AudioClip Abucheos()
    {
        const int rate = 22050;
        const float duration = 1.3f;
        int count = Mathf.CeilToInt(rate * duration);
        var data = new float[count];
        for (int i = 0; i < count; i++)
        {
            float t = i / (float)rate;
            float vibrato = Mathf.Sin(2f * Mathf.PI * 5.2f * t) * 10f;
            float frequency = 190f - 37f * (t / duration) + vibrato;
            float envelope = Mathf.Min(1f, t * 8f) * Mathf.Min(1f, (duration - t) * 4f);
            float voice = Mathf.Sin(2f * Mathf.PI * frequency * t)
                        + .42f * Mathf.Sin(2f * Mathf.PI * frequency * 1.48f * t)
                        + .2f * Mathf.Sin(2f * Mathf.PI * frequency * 2f * t);
            float rough = .82f + .18f * Mathf.Sin(t * 63f);
            data[i] = voice * envelope * rough * .2f;
        }
        var clip = AudioClip.Create("Abucheos del barrio · final por mejorar", count, 1, rate, false);
        clip.SetData(data, 0);
        return clip;
    }

    private AudioClip ChispaOriginal()
    {
        const int rate = 22050;
        const float duration = .36f;
        int count = Mathf.CeilToInt(rate * duration);
        var data = new float[count];
        for (int i = 0; i < count; i++)
        {
            float t = i / (float)rate;
            float p = t / duration;
            float envelope = Mathf.Pow(1f - p, 1.7f) * (Mathf.Sin(p * Mathf.PI * 5f) > .2f ? 1f : .18f);
            float noise = Mathf.Sin(i * 12.9898f) * Mathf.Sin(i * 0.0171f);
            float tone = Mathf.Sin(2f * Mathf.PI * Mathf.Lerp(1600f, 340f, p) * t);
            data[i] = (noise * .55f + tone * .45f) * envelope * .25f;
        }
        var clip = AudioClip.Create("Chispa eléctrica · efecto original", count, 1, rate, false);
        clip.SetData(data, 0);
        return clip;
    }

    private AudioClip GotasDeAgua()
    {
        const int rate = 22050;
        const float duration = .42f;
        int count = Mathf.CeilToInt(rate * duration);
        var data = new float[count];
        for (int i = 0; i < count; i++)
        {
            float t = i / (float)rate;
            float envelope = Mathf.Max(0f, 1f - t / duration);
            float sweep = Mathf.Lerp(1050f, 360f, t / duration);
            float drop = Mathf.Sin(2f * Mathf.PI * sweep * t) * .42f
                       + Mathf.Sin(2f * Mathf.PI * sweep * 2.03f * t) * .18f
                       + Mathf.Sin(2f * Mathf.PI * 1900f * t) * .055f;
            data[i] = drop * envelope * .24f;
        }
        var clip = AudioClip.Create("Gotas sobre la tierra · sonido original", count, 1, rate, false);
        clip.SetData(data, 0);
        return clip;
    }

    private AudioClip Tono(string nombre, float inicio, float fin, float duracion, float volumen)
    {
        const int rate = 22050;
        int count = Mathf.CeilToInt(rate * duracion);
        var data = new float[count];
        for (int i = 0; i < count; i++)
        {
            float t = i / (float)rate;
            float p = t / duracion;
            float frequency = Mathf.Lerp(inicio, fin, p);
            float attack = Mathf.Min(1f, t * 28f);
            float release = Mathf.Min(1f, (duracion - t) * 8f);
            data[i] = Mathf.Sin(2f * Mathf.PI * frequency * t) * attack * release * volumen;
        }
        var clip = AudioClip.Create(nombre, count, 1, rate, false);
        clip.SetData(data, 0);
        return clip;
    }

    public void Click() { DesbloquearMusica(); Efecto("tap"); }
    public void Plantar() { DesbloquearMusica(); Efecto("plant"); }
    public void Regar() { DesbloquearMusica(); Efecto("water"); }
    public void Chispa() { DesbloquearMusica(); Efecto("spark"); }
    public void Reciclar() { DesbloquearMusica(); Efecto("recycle"); }
    public void Eficiencia() { DesbloquearMusica(); Efecto("efficient"); }
    public void Acierto() { DesbloquearMusica(); Efecto("good"); }
    public void Aviso() { DesbloquearMusica(); Efecto("bad"); }
    public void Cosechar() { DesbloquearMusica(); Efecto("harvest"); }
    public void IniciarPartida()
    {
        cierreReproducido = false;
        if (efectos != null) efectos.Stop();
    }

    public void CierreResultado(int nivel)
    {
        if (cierreReproducido) return;
        cierreReproducido = true;
        DesbloquearMusica();
        if (efectos == null) return;
        efectos.Stop();
        AudioClip clip;
        string nombre = nivel >= 2 ? "applause" : nivel <= 0 ? "boos" : "neutral";
        if (clips.TryGetValue(nombre, out clip)) efectos.PlayOneShot(clip, nivel <= 0 ? .28f : .62f);
    }

    private void DesbloquearMusica()
    {
        if (musicaDesbloqueada || musica == null) return;
        musicaDesbloqueada = true;
        if (!musica.isPlaying) musica.Play();
    }

    private void Efecto(string nombre)
    {
        AudioClip clip;
        if (efectos != null && clips.TryGetValue(nombre, out clip)) efectos.PlayOneShot(clip);
    }

    public float VolumenMusica { get { return musica ? musica.volume : .14f; } }
    public float VolumenEfectos { get { return efectos ? efectos.volume : .7f; } }
    public void AjustarMusica(float valor)
    {
        if (musica) musica.volume = Mathf.Clamp01(valor);
        PlayerPrefs.SetFloat("TierraMusica", Mathf.Clamp01(valor));
    }
    public void AjustarEfectos(float valor)
    {
        if (efectos) efectos.volume = Mathf.Clamp01(valor);
        PlayerPrefs.SetFloat("TierraEfectos", Mathf.Clamp01(valor));
    }
}
