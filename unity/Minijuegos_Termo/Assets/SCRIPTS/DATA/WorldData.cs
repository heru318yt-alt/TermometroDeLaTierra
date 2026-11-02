using UnityEngine;

[CreateAssetMenu(menuName = "Termómetro de la Tierra/World Data", fileName = "World")]
public class WorldData : ScriptableObject
{
    [Min(1)] public int number = 1;
    public string worldName;
    public string subtitle;
    [TextArea(3, 6)] public string description;
    public string sceneName;
    public Sprite icon;
    public Color accentColor = Color.white;
}
