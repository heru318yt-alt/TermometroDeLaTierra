using UnityEngine;

[CreateAssetMenu(menuName = "Termómetro de la Tierra/Vehicle Data", fileName = "Vehicle")]
public sealed class VehicleData : ScriptableObject
{
    [Min(0)] public int modeIndex;
    public string displayName;
    public Sprite sprite;
    [Min(0)] public int exampleFootprint;
    public bool stepFreeAccess;
}
