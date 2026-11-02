using UnityEngine;

[RequireComponent(typeof(Camera))]
public sealed class MapCameraFraming : MonoBehaviour
{
    [SerializeField] private Vector2 mapSize = new Vector2(19.2f, 10.8f);

    private Camera mapCamera;
    private int lastWidth;
    private int lastHeight;

    private void Awake()
    {
        mapCamera = GetComponent<Camera>();
        FitMap();
    }

    private void LateUpdate()
    {
        if (Screen.width == lastWidth && Screen.height == lastHeight)
            return;

        FitMap();
    }

    private void FitMap()
    {
        if (mapCamera == null)
            mapCamera = GetComponent<Camera>();

        lastWidth = Mathf.Max(Screen.width, 1);
        lastHeight = Mathf.Max(Screen.height, 1);
        float aspect = (float)lastWidth / lastHeight;
        mapCamera.orthographicSize = Mathf.Max(mapSize.y * 0.5f, mapSize.x / (2f * aspect));
    }
}
