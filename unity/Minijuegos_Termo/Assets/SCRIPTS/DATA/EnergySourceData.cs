using UnityEngine;

[CreateAssetMenu(menuName = "Termómetro de la Tierra/Energy Source Data", fileName = "EnergySource")]
public sealed class EnergySourceData : ScriptableObject
{
    [Min(0)] public int sourceIndex;
    public string displayName;
    [Min(0)] public int output;
    [Min(0)] public int carbon;
    public bool renewable;
    public Sprite sprite;
}
