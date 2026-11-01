using UnityEngine;
using UnityEngine.UI;

/// <summary>Responde a las acciones sobre objetos que ya están colocados en las escenas.</summary>
public sealed class TierraSceneController : MonoBehaviour
{
    [SerializeField] private Text estadoEscena;
    [SerializeField] private AudioSource efectos;
    [SerializeField] private AudioClip sonidoInteraccion;

    public void Activar(ObjetoMundoInteractivo objeto)
    {
        if (objeto == null) return;
        int etapa = objeto.AvanzarEstado();
        if (estadoEscena != null)
            estadoEscena.text = objeto.TextoEstado(etapa);
        if (efectos != null && sonidoInteraccion != null)
            efectos.PlayOneShot(sonidoInteraccion, .55f);
    }
}
