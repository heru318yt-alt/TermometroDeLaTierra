using UnityEngine;

public enum FabricaElementoTipo
{
    Material,
    Contenedor,
    Maquina,
    Producto
}

/// <summary>Componente de clic serializado en cada material, contenedor, máquina y producto.</summary>
public sealed class FabricaElemento : MonoBehaviour
{
    [SerializeField] private FabricaCircularController controlador;
    public FabricaElementoTipo tipo;
    [Range(0, 3)] public int tipoMaterial;
    public string nombreVisible;
    public bool clasificado;

    public void Configurar(FabricaCircularController game, FabricaElementoTipo elementoTipo, int material, string label)
    {
        controlador = game;
        tipo = elementoTipo;
        tipoMaterial = material;
        nombreVisible = label;
    }

    private void OnMouseDown()
    {
        if (controlador == null) controlador = FindAnyObjectByType<FabricaCircularController>();
        if (controlador != null) controlador.Interactuar(this);
    }
}
