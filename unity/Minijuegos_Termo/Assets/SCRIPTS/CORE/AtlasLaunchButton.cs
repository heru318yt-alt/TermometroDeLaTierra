using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

namespace TermometroTierra
{
    [RequireComponent(typeof(Button))]
    public sealed class AtlasLaunchButton : MonoBehaviour
    {
        public string targetScene;
        private void Awake()
        {
            GetComponent<Button>().onClick.AddListener(() =>
            {
                if (!string.IsNullOrEmpty(targetScene)) SceneManager.LoadScene(targetScene);
            });
        }
    }
}
