using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;
using System.IO;

public sealed class MapSceneController : MonoBehaviour
{
    [Header("Map markers")]
    public MapWorldMarker[] markers;

    [Header("Cards")]
    public GameObject introCard;
    public GameObject detailsCard;

    [Header("Selected world")]
    public Image worldIcon;
    public Image numberBadge;
    public TextMeshProUGUI numberLabel;
    public TextMeshProUGUI titleLabel;
    public TextMeshProUGUI subtitleLabel;
    public TextMeshProUGUI descriptionLabel;
    public TextMeshProUGUI availabilityLabel;
    public Button enterButton;
    public TextMeshProUGUI enterButtonLabel;

    private MapWorldData selectedWorld;

    private void Awake()
    {
        if (enterButton != null)
            enterButton.onClick.AddListener(EnterSelectedWorld);
    }

    private void OnDestroy()
    {
        if (enterButton != null)
            enterButton.onClick.RemoveListener(EnterSelectedWorld);
    }

    public void SelectWorld(MapWorldMarker marker)
    {
        if (marker == null || marker.world == null)
            return;

        selectedWorld = marker.world;

        if (markers != null)
        {
            foreach (MapWorldMarker item in markers)
            {
                if (item != null)
                    item.SetSelected(item == marker);
            }
        }

        if (introCard != null)
            introCard.SetActive(false);
        if (detailsCard != null)
            detailsCard.SetActive(true);

        worldIcon.sprite = selectedWorld.icon;
        numberBadge.color = selectedWorld.accentColor;
        numberLabel.text = "MUNDO " + selectedWorld.number.ToString("00");
        titleLabel.text = selectedWorld.worldName;
        subtitleLabel.text = selectedWorld.subtitle;
        descriptionLabel.text = selectedWorld.description;

        int buildIndex = FindBuildIndex(selectedWorld.sceneName);
        MissionState state = MissionProgress.GetState(selectedWorld.sceneName);
        bool available = state != MissionState.Locked && buildIndex >= 0;
        if (state == MissionState.Completed)
        {
            availabilityLabel.text = "MISIÓN COMPLETADA  ·  PUEDES REPETIRLA";
            availabilityLabel.color = new Color(0.20f, 0.49f, 0.31f);
        }
        else if (state == MissionState.Available && buildIndex >= 0)
        {
            availabilityLabel.text = "MISIÓN DISPONIBLE";
            availabilityLabel.color = new Color(0.20f, 0.49f, 0.31f);
        }
        else
        {
            availabilityLabel.text = "BLOQUEADA  ·  COMPLETA LA MISIÓN ANTERIOR";
            availabilityLabel.color = new Color(0.65f, 0.49f, 0.24f);
        }

        enterButton.interactable = available;
        enterButtonLabel.text = state == MissionState.Completed ? "Jugar de nuevo" : (available ? "Entrar al mundo" : "Bloqueada");
        enterButtonLabel.color = available ? Color.white : new Color(0.40f, 0.49f, 0.40f);
    }

    public void EnterSelectedWorld()
    {
        if (selectedWorld == null)
            return;

        int buildIndex = FindBuildIndex(selectedWorld.sceneName);
        if (buildIndex >= 0 && MissionProgress.IsUnlocked(selectedWorld.sceneName))
            SceneManager.LoadScene(buildIndex);
    }

    private static int FindBuildIndex(string targetSceneName)
    {
        if (string.IsNullOrWhiteSpace(targetSceneName))
            return -1;

        for (int i = 0; i < SceneManager.sceneCountInBuildSettings; i++)
        {
            string scenePath = SceneUtility.GetScenePathByBuildIndex(i);
            if (string.Equals(Path.GetFileNameWithoutExtension(scenePath), targetSceneName, System.StringComparison.OrdinalIgnoreCase))
                return i;
        }

        return -1;
    }
}
