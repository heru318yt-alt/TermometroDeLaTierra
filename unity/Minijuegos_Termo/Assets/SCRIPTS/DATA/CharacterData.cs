using UnityEngine;

[CreateAssetMenu(menuName = "Termómetro de la Tierra/Character Data", fileName = "Character")]
public sealed class CharacterData : ScriptableObject
{
    public string displayName;
    [TextArea(2, 5)] public string travelNeeds;
    public Sprite portrait;
    public Sprite[] animationFrames;
}
