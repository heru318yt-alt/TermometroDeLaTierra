using UnityEngine;
using UnityEngine.UI;

/// <summary>Lógica de clasificación y transformación para los objetos colocados en FabricaCircular.unity.</summary>
public sealed class FabricaCircularController : MonoBehaviour
{
    [Header("UI colocada en la escena")]
    public Text instrucciones;
    public Text indicadorRecursos;
    public Text objetivo;
    public Text estado;
    [Header("Elementos colocados en la escena")]
    public FabricaElemento[] materiales;
    public FabricaElemento[] contenedores;
    public FabricaElemento maquina;
    public GameObject productoRecuperado;
    public SpriteRenderer indicadorMaquina;
    [Header("Audio asignado en el Inspector")]
    public AudioSource efectos;
    public AudioClip seleccionClip;
    public AudioClip aciertoClip;
    public AudioClip avisoClip;

    private FabricaElemento seleccionado;
    private int recuperados;
    private bool productoFabricado;

    private void Start()
    {
        if (instrucciones != null)
            instrucciones.text = "Selecciona un material en la banda y toca el contenedor del mismo tipo. Luego activa la prensa para recuperar el lote.";
        if (indicadorRecursos != null) indicadorRecursos.text = "RECURSOS · 0 / 4 materiales recuperados";
        if (objetivo != null) objetivo.text = "OBJETIVO · Clasificar plástico, papel, vidrio y metal.";
        if (estado != null) estado.text = "Toca una pieza de la banda para comenzar.";
        if (productoRecuperado != null) productoRecuperado.SetActive(false);
    }

    public void Interactuar(FabricaElemento elemento)
    {
        if (elemento == null) return;
        if (elemento.tipo == FabricaElementoTipo.Material)
        {
            if (elemento.clasificado)
            {
                Mostrar("Ese material ya se recuperó. Elige otra pieza de la banda.", false);
                return;
            }
            seleccionado = elemento;
            Mostrar("Seleccionaste " + elemento.nombreVisible + ". Ahora toca su contenedor.", false, true);
            return;
        }

        if (elemento.tipo == FabricaElementoTipo.Contenedor)
        {
            if (seleccionado == null)
            {
                Mostrar("Primero selecciona una pieza en la banda transportadora.", false);
                return;
            }
            if (seleccionado.tipoMaterial != elemento.tipoMaterial)
            {
                Mostrar("No corresponde. Comprueba el símbolo y el material antes de clasificarlo.", false);
                return;
            }

            seleccionado.clasificado = true;
            seleccionado.transform.position = new Vector3(-4.55f + recuperados * .55f, -1.02f, -0.2f);
            seleccionado.transform.localScale *= .55f;
            var collider = seleccionado.GetComponent<Collider2D>();
            if (collider != null) collider.enabled = false;
            recuperados++;
            seleccionado = null;
            if (indicadorRecursos != null) indicadorRecursos.text = "RECURSOS · " + recuperados + " / 4 materiales recuperados";
            Mostrar("¡Bien! El material quedó separado y listo para volver al ciclo.", true);
            if (recuperados == 4 && objetivo != null)
                objetivo.text = "OBJETIVO · Lote completo. Activa la máquina para fabricar un producto recuperado.";
            return;
        }

        if (elemento.tipo == FabricaElementoTipo.Maquina)
        {
            if (recuperados < 4)
            {
                Mostrar("La prensa espera el lote completo: clasifica primero los cuatro materiales.", false);
                return;
            }
            if (!productoFabricado)
            {
                productoFabricado = true;
                if (productoRecuperado != null) productoRecuperado.SetActive(true);
                if (indicadorMaquina != null) indicadorMaquina.color = new Color32(136, 207, 127, 255);
                if (objetivo != null) objetivo.text = "OBJETIVO CUMPLIDO · Lote transformado y reincorporado a la fábrica.";
                Mostrar("La prensa convirtió el lote en piezas reutilizables.", true);
            }
            else Mostrar("El lote ya está transformado. Revisa las piezas en la zona de productos.", true);
        }
    }

    private void Mostrar(string texto, bool correcto, bool seleccion = false)
    {
        if (estado != null) estado.text = texto;
        if (efectos != null)
        {
            AudioClip clip = correcto ? aciertoClip : seleccion ? seleccionClip : avisoClip;
            if (clip != null) efectos.PlayOneShot(clip, correcto ? .72f : .48f);
        }
    }
}
