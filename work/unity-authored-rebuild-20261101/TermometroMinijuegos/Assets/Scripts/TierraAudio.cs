using System.Collections.Generic;
using UnityEngine;

/// <summary>Música y efectos de interacción del juego; incluye grabaciones CC0 para los resultados.</summary>
public sealed class TierraAudio : MonoBehaviour
{
    private static TierraAudio instance;
    [Header("Sources asignados en la escena")]
    [SerializeField] private AudioSource musica;
    [SerializeField] private AudioSource efectos;
    [Header("Clips importados")]
    [SerializeField] private AudioClip toqueClip;
    [SerializeField] private AudioClip plantarClip;
    [SerializeField] private AudioClip regarClip;
    [SerializeField] private AudioClip chispaClip;
    [SerializeField] private AudioClip reciclarClip;
    [SerializeField] private AudioClip eficienciaClip;
    [SerializeField] private AudioClip aciertoClip;
    [SerializeField] private AudioClip avisoClip;
    [SerializeField] private AudioClip cosechaClip;
    [SerializeField] private AudioClip aplausosClip;
    [SerializeField] private AudioClip abucheosClip;
    [SerializeField] private AudioClip neutralClip;
    private readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();
    private bool musicaDesbloqueada;
    private bool cierreReproducido;

    public static TierraAudio Instancia
    {
        get
        {
            if (instance == null)
            {
                instance = FindAnyObjectByType<TierraAudio>();
                if (instance == null)
                {
                    var go = new GameObject("AudioManager · fallback");
                    instance = go.AddComponent<TierraAudio>();
                }
            }
            return instance;
        }
    }

    private void Awake()
    {
        if (instance != null && instance != this) { Destroy(gameObject); return; }
        instance = this;
        var sources = GetComponents<AudioSource>();
        if (musica == null && sources.Length > 0) musica = sources[0];
        if (efectos == null && sources.Length > 1) efectos = sources[1];
        if (musica != null)
        {
            musica.loop = true;
            musica.playOnAwake = false;
            musica.spatialBlend = 0;
            musica.volume = PlayerPrefs.GetFloat("TierraMusica", .14f);
        }
        if (efectos != null)
        {
            efectos.playOnAwake = false;
            efectos.spatialBlend = 0;
            efectos.volume = PlayerPrefs.GetFloat("TierraEfectos", .7f);
        }
        CrearEfectos();
    }

    private void CrearEfectos()
    {
        clips["tap"] = toqueClip;
        clips["plant"] = plantarClip;
        clips["good"] = aciertoClip;
        clips["bad"] = avisoClip;
        clips["harvest"] = cosechaClip;
        clips["wind"] = toqueClip;
        clips["water"] = regarClip;
        clips["spark"] = chispaClip;
        clips["recycle"] = reciclarClip;
        clips["efficient"] = eficienciaClip;
        clips["applause"] = aplausosClip;
        clips["boos"] = abucheosClip;
        clips["neutral"] = neutralClip;
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
        string nombre = nivel >= 2 ? "applause" : nivel <= 0 ? "boos" : "neutral";
        AudioClip clip;
        if (efectos != null && clips.TryGetValue(nombre, out clip) && clip != null)
            efectos.PlayOneShot(clip, nivel <= 0 ? .28f : .62f);
    }

    private void DesbloquearMusica()
    {
        if (musicaDesbloqueada || musica == null || musica.clip == null) return;
        musicaDesbloqueada = true;
        if (!musica.isPlaying) musica.Play();
    }

    private void Efecto(string nombre)
    {
        AudioClip clip;
        if (efectos != null && clips.TryGetValue(nombre, out clip) && clip != null) efectos.PlayOneShot(clip);
    }

    public float VolumenMusica { get { return musica != null ? musica.volume : .14f; } }
    public float VolumenEfectos { get { return efectos != null ? efectos.volume : .7f; } }
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
