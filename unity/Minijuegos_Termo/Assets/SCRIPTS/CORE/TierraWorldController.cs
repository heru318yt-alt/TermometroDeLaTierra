using UnityEngine;
using UnityEngine.SceneManagement;
using TMPro;
#if UNITY_WEBGL && !UNITY_EDITOR
using System.Runtime.InteropServices;
#endif

namespace TermometroTierra
{
    public abstract class TierraWorldController : MonoBehaviour
    {
        public TextMeshProUGUI statusText;
        public TextMeshProUGUI roundText;
        public TextMeshProUGUI resultTitle;
        public TextMeshProUGUI resultBody;
        public GameObject resultPanel;
        public TierraAudioManager audioManager;
        protected bool finished;

        public virtual void HandleAction(string action, int value)
        {
            if (action == "world-return") ReturnToAtlas();
            else if (action == "world-restart") RestartWorld();
            else if (action == "world-mute" && audioManager != null) audioManager.ToggleMuted();
        }
        public virtual void HandleWorldClick(string action, int index, GameObject clicked) { }

        protected void SetStatus(string message)
        {
            if (statusText != null) statusText.text = message;
        }

        protected void SetRound(string message)
        {
            if (roundText != null) roundText.text = message;
        }

        protected void ShowResult(string title, string explanation, bool celebrated, bool missionCompleted = true)
        {
            finished = true;
            if (missionCompleted)
                MissionProgress.RecordCompletion(SceneManager.GetActiveScene().name);
            if (resultPanel != null) resultPanel.SetActive(true);
            if (resultTitle != null) resultTitle.text = title;
            if (resultBody != null) resultBody.text = explanation;
            if (audioManager != null) audioManager.Play(celebrated ? "success" : "error");
        }

        public void RestartWorld()
        {
            SceneManager.LoadScene(SceneManager.GetActiveScene().buildIndex);
        }

        public void ReturnToAtlas()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            AtlasReturnToSite();
#else
            SceneManager.LoadScene("Mapa");
#endif
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern void AtlasReturnToSite();
#endif
    }
}
