using UnityEngine;
using UnityEngine.UI;

namespace TermometroTierra
{
    [RequireComponent(typeof(Button))]
    public sealed class TierraActionButton : MonoBehaviour
    {
        public TierraWorldController controller;
        public string action;
        public int value;

        private void Awake()
        {
            GetComponent<Button>().onClick.AddListener(InvokeAction);
        }

        private void InvokeAction()
        {
            if (controller == null) return;
            if (action == "world-return") controller.ReturnToAtlas();
            else if (action == "world-restart") controller.RestartWorld();
            else if (action == "world-mute" && controller.audioManager != null) controller.audioManager.ToggleMuted();
            else controller.HandleAction(action, value);
        }
    }
}
