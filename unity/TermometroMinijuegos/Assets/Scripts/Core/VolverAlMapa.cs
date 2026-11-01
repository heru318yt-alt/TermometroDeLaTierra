using System.Runtime.InteropServices;
using UnityEngine;
using UnityEngine.SceneManagement;

public sealed class VolverAlMapa : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern void VolverAlAtlasWeb();
#endif

    public void Regresar()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        VolverAlAtlasWeb();
#else
        SceneManager.LoadScene("Menu");
#endif
    }
}
