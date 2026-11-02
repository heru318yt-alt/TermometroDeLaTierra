using UnityEngine;

[CreateAssetMenu(menuName = "Termómetro de la Tierra/Material Data", fileName = "Material")]
public sealed class MaterialData : ScriptableObject
{
    [Min(0)] public int materialIndex;
    public string displayName;
    public Sprite sprite;
    [TextArea(2, 5)] public string recoveryHint;
}
