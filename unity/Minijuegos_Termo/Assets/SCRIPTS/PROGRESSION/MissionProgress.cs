using UnityEngine;

public enum MissionState
{
    Locked,
    Available,
    Completed
}

public static class MissionProgress
{
    private static readonly string[] SceneOrder =
    {
        "EnergiaViva",
        "FabricaCircular",
        "RutasQueRespiran",
        "BosqueGuardian",
        "FincaDelFuturo"
    };

    private const string KeyPrefix = "TermometroTierra.MissionCompleted.";

    public static MissionState GetState(string sceneName)
    {
        int index = IndexOf(sceneName);
        if (index < 0)
            return MissionState.Locked;

        if (PlayerPrefs.GetInt(KeyPrefix + SceneOrder[index], 0) == 1)
            return MissionState.Completed;

        return index == 0 || PlayerPrefs.GetInt(KeyPrefix + SceneOrder[index - 1], 0) == 1
            ? MissionState.Available
            : MissionState.Locked;
    }

    public static bool IsUnlocked(string sceneName)
    {
        return GetState(sceneName) != MissionState.Locked;
    }

    public static bool RecordCompletion(string sceneName)
    {
        int index = IndexOf(sceneName);
        if (index < 0)
            return false;

        PlayerPrefs.SetInt(KeyPrefix + SceneOrder[index], 1);
        PlayerPrefs.Save();
        return true;
    }

    private static int IndexOf(string sceneName)
    {
        if (string.IsNullOrWhiteSpace(sceneName))
            return -1;

        for (int i = 0; i < SceneOrder.Length; i++)
        {
            if (string.Equals(SceneOrder[i], sceneName, System.StringComparison.OrdinalIgnoreCase))
                return i;
        }

        return -1;
    }
}
