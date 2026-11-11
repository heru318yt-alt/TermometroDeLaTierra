using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
#if UNITY_WEBGL && !UNITY_EDITOR
using System.Runtime.InteropServices;
#endif

namespace TermometroTierra
{
    /// <summary>
    /// Small runtime overlay shared by every Unity scene: a fullscreen toggle,
    /// a short scene fade and no other navigation, so the scene keeps its own
    /// "volver al atlas" control. It is created at runtime so existing scenes
    /// and prefabs do not need to be rebuilt or re-authored.
    /// </summary>
    public sealed class TierraExperienceUI : MonoBehaviour
    {
        private const float FadeDuration = 0.42f;
        private Text fullscreenLabel;
        private Image fade;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void Bootstrap()
        {
            if (Object.FindFirstObjectByType<TierraExperienceUI>() != null)
                return;

            var host = new GameObject("TierraExperienceUI");
            Object.DontDestroyOnLoad(host);
            host.AddComponent<TierraExperienceUI>();
        }

        private void Awake()
        {
            if (Object.FindFirstObjectByType<EventSystem>() == null)
                return;

            BuildOverlay();
        }

        private void OnEnable()
        {
            SceneManager.sceneLoaded += HandleSceneLoaded;
        }

        private void OnDisable()
        {
            SceneManager.sceneLoaded -= HandleSceneLoaded;
        }

        private void HandleSceneLoaded(Scene scene, LoadSceneMode mode)
        {
            if (fade == null)
                return;

            fade.gameObject.SetActive(true);
            Color color = fade.color;
            color.a = 1f;
            fade.color = color;
        }

        private void Update()
        {
            if (fade != null && fade.color.a > 0f)
            {
                Color color = fade.color;
                color.a = Mathf.MoveTowards(color.a, 0f, Time.unscaledDeltaTime / FadeDuration);
                fade.color = color;
                if (color.a <= 0f)
                    fade.gameObject.SetActive(false);
            }

#if !UNITY_WEBGL || UNITY_EDITOR
            if (fullscreenLabel != null)
                fullscreenLabel.text = Screen.fullScreen ? "SALIR DE PANTALLA COMPLETA" : "PANTALLA COMPLETA";
#endif
        }

        private void BuildOverlay()
        {
            var canvasObject = new GameObject(
                "TierraExperienceCanvas",
                typeof(RectTransform),
                typeof(Canvas),
                typeof(CanvasScaler),
                typeof(GraphicRaycaster));
            canvasObject.transform.SetParent(transform, false);

            var canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 900;

            var scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280f, 720f);
            scaler.matchWidthOrHeight = 0.5f;

            BuildFade(canvasObject.transform);
            BuildFullscreenButton(canvasObject.transform);
        }

        private void BuildFade(Transform parent)
        {
            var fadeObject = new GameObject("SceneFade", typeof(RectTransform), typeof(Image));
            fadeObject.transform.SetParent(parent, false);
            fadeObject.transform.SetAsFirstSibling();

            var rect = fadeObject.GetComponent<RectTransform>();
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;

            fade = fadeObject.GetComponent<Image>();
            fade.color = new Color(0.043f, 0.129f, 0.11f, 1f);
            fade.raycastTarget = false;
        }

        private void BuildFullscreenButton(Transform parent)
        {
            var buttonObject = new GameObject("FullscreenButton", typeof(RectTransform), typeof(Image), typeof(Button));
            buttonObject.transform.SetParent(parent, false);

            var rect = buttonObject.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(1f, 0f);
            rect.anchorMax = new Vector2(1f, 0f);
            rect.pivot = new Vector2(1f, 0f);
            rect.anchoredPosition = new Vector2(-24f, 24f);
            rect.sizeDelta = new Vector2(160f, 36f);

            var image = buttonObject.GetComponent<Image>();
            image.color = new Color(0.09f, 0.247f, 0.22f, 0.94f);

            var button = buttonObject.GetComponent<Button>();
            button.targetGraphic = image;
            ColorBlock colors = button.colors;
            colors.normalColor = Color.white;
            colors.highlightedColor = new Color(0.92f, 0.95f, 0.89f, 1f);
            colors.pressedColor = new Color(0.78f, 0.84f, 0.75f, 1f);
            button.colors = colors;
            button.onClick.AddListener(ToggleFullscreen);

            var labelObject = new GameObject("Label", typeof(RectTransform), typeof(Text));
            labelObject.transform.SetParent(buttonObject.transform, false);
            var labelRect = labelObject.GetComponent<RectTransform>();
            labelRect.anchorMin = Vector2.zero;
            labelRect.anchorMax = Vector2.one;
            labelRect.offsetMin = new Vector2(10f, 0f);
            labelRect.offsetMax = new Vector2(-10f, 0f);

            fullscreenLabel = labelObject.GetComponent<Text>();
            fullscreenLabel.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            fullscreenLabel.fontSize = 11;
            fullscreenLabel.fontStyle = FontStyle.Bold;
            fullscreenLabel.alignment = TextAnchor.MiddleCenter;
            fullscreenLabel.color = new Color(0.965f, 0.937f, 0.855f, 1f);
            fullscreenLabel.raycastTarget = false;
            fullscreenLabel.text = "PANTALLA COMPLETA";
        }

        private static void ToggleFullscreen()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            ToggleSiteFullscreen();
#else
            Screen.fullScreen = !Screen.fullScreen;
#endif
        }

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern void ToggleSiteFullscreen();
#endif
    }
}
