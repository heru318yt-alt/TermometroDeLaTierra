using UnityEngine;

[CreateAssetMenu(menuName = "Termómetro de la Tierra/Crop Data", fileName = "Crop")]
public sealed class CropData : ScriptableObject
{
    [Min(0)] public int cropIndex;
    public string displayName;
    [Min(0)] public int baseYield = 1;
    public Sprite sprite;
    [TextArea(2, 5)] public string soilBenefit;
}
