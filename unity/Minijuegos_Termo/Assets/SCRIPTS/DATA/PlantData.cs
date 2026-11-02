using UnityEngine;

[CreateAssetMenu(menuName = "Termómetro de la Tierra/Plant Data", fileName = "Plant")]
public sealed class PlantData : ScriptableObject
{
    public string displayName;
    public Sprite seedSprite;
    public Sprite sproutSprite;
    public Sprite youngTreeSprite;
    public Sprite matureTreeSprite;
    [TextArea(2, 5)] public string ecologicalRole;
}
