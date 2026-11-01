using UnityEngine;

/// <summary>Interactable serialized on the scene object; it never creates or replaces the scene.</summary>
public sealed class ObjetoMundoInteractivo : MonoBehaviour
{
    [SerializeField] private TierraSceneController controlador;
    [SerializeField] private string nombreVisible = "Objeto del mundo";
    [SerializeField] private string[] etiquetasEstado;
    [SerializeField] private Sprite[] estadosVisuales;
    [SerializeField] private SpriteRenderer visual;
    private int estado;

    public void Configurar(TierraSceneController sceneController, string displayName, string[] stateLabels,
        Sprite[] visualStates, SpriteRenderer spriteRenderer)
    {
        controlador = sceneController;
        nombreVisible = displayName;
        etiquetasEstado = stateLabels;
        estadosVisuales = visualStates;
        visual = spriteRenderer;
        estado = 0;
    }

    public int AvanzarEstado()
    {
        int cantidad = Mathf.Max(etiquetasEstado != null ? etiquetasEstado.Length : 0,
            estadosVisuales != null ? estadosVisuales.Length : 0);
        if (cantidad > 0) estado = (estado + 1) % cantidad;
        if (visual != null && estadosVisuales != null && estadosVisuales.Length > 0)
        {
            Sprite next = estadosVisuales[Mathf.Clamp(estado, 0, estadosVisuales.Length - 1)];
            bool sameSprite = next == visual.sprite;
            visual.sprite = next;
            visual.color = sameSprite && estado > 0
                ? new Color32(165, 221, 148, 255)
                : Color.white;
        }
        return estado;
    }

    public string TextoEstado(int etapa)
    {
        string detalle = etiquetasEstado != null && etiquetasEstado.Length > 0
            ? etiquetasEstado[Mathf.Clamp(etapa, 0, etiquetasEstado.Length - 1)]
            : "listo para interactuar";
        return nombreVisible + " · " + detalle;
    }

    private void OnMouseDown()
    {
        if (controlador == null) controlador = FindAnyObjectByType<TierraSceneController>();
        if (controlador != null) controlador.Activar(this);
    }
}
