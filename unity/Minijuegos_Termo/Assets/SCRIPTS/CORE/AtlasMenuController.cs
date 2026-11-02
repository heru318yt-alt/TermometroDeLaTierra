using UnityEngine;
using UnityEngine.SceneManagement;
using System;

namespace TermometroTierra
{
    public sealed class AtlasMenuController : MonoBehaviour
    {
        private void Start()
        {
            string world = ReadWorldParameter(Application.absoluteURL);
            string scene = SceneFor(world);
            if (!string.IsNullOrEmpty(scene) && Application.CanStreamedLevelBeLoaded(scene))
                SceneManager.LoadScene(scene);
        }

        private static string ReadWorldParameter(string url)
        {
            Uri uri;
            if (string.IsNullOrEmpty(url) || !Uri.TryCreate(url, UriKind.Absolute, out uri)) return "";
            string query = uri.Query.TrimStart('?');
            string[] pairs = query.Split('&');
            for (int i = 0; i < pairs.Length; i++)
            {
                string[] parts = pairs[i].Split(new[] { '=' }, 2);
                if (parts.Length == 2 && Uri.UnescapeDataString(parts[0]) == "world")
                    return Uri.UnescapeDataString(parts[1]).ToLowerInvariant();
            }
            return "";
        }

        private static string SceneFor(string world)
        {
            if (world == "energia" || world == "energy") return "EnergiaViva";
            if (world == "industria" || world == "fabrica" || world == "fábrica") return "FabricaCircular";
            if (world == "transporte" || world == "movilidad") return "RutasQueRespiran";
            if (world == "bosques" || world == "bosque") return "BosqueGuardian";
            if (world == "agricultura" || world == "finca") return "FincaDelFuturo";
            return "";
        }
    }
}
