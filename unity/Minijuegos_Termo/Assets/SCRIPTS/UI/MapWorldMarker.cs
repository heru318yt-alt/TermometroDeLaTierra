using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;
using TMPro;

[RequireComponent(typeof(Button))]
public sealed class MapWorldMarker : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
{
    [Header("World")]
    public MapWorldData world;

    [Header("Visuals")]
    public RectTransform scaleTarget;
    public Image halo;
    public Image icon;
    public Sprite lockedIcon;
    public Image numberBadge;
    public TextMeshProUGUI numberLabel;
    public TextMeshProUGUI titleLabel;

    [Header("Navigation")]
    public MapSceneController controller;

    private Button button;
    private bool isHovered;
    private bool isSelected;

    private void Awake()
    {
        button = GetComponent<Button>();
        button.onClick.AddListener(SelectWorld);
        RefreshVisuals();
    }

    private void OnDestroy()
    {
        if (button != null)
            button.onClick.RemoveListener(SelectWorld);
    }

    public void Bind(MapWorldData data, MapSceneController mapController)
    {
        world = data;
        controller = mapController;
        RefreshVisuals();
    }

    private void RefreshVisuals()
    {
        if (world == null)
            return;

        MissionState state = MissionProgress.GetState(world.sceneName);
        bool unlocked = state != MissionState.Locked;

        if (icon != null)
        {
            icon.sprite = unlocked || lockedIcon == null ? world.icon : lockedIcon;
            icon.color = unlocked ? Color.white : new Color(0.48f, 0.54f, 0.48f, 0.72f);
        }
        if (numberBadge != null)
            numberBadge.color = unlocked ? world.accentColor : new Color(0.43f, 0.49f, 0.44f, 0.82f);
        if (numberLabel != null)
            numberLabel.text = state == MissionState.Completed ? "OK" : (unlocked ? world.number.ToString("00") : "X");
        if (titleLabel != null)
        {
            titleLabel.text = world.worldName;
            titleLabel.color = unlocked ? Color.white : new Color(0.62f, 0.67f, 0.62f, 0.9f);
        }

        if (button != null)
            button.interactable = unlocked;
    }

    public void SelectWorld()
    {
        if (controller != null && world != null && MissionProgress.IsUnlocked(world.sceneName))
            controller.SelectWorld(this);
    }

    public void SetSelected(bool selected)
    {
        isSelected = selected;
        RefreshState();
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        isHovered = true;
        RefreshState();
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        isHovered = false;
        RefreshState();
    }

    private void RefreshState()
    {
        if (halo != null)
            halo.enabled = isSelected || isHovered;

        if (scaleTarget != null)
            scaleTarget.localScale = isSelected ? Vector3.one * 1.08f : (isHovered ? Vector3.one * 1.04f : Vector3.one);
    }
}
