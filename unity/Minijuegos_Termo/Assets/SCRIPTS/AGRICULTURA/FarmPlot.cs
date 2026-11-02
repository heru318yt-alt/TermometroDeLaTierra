using UnityEngine;
using UnityEngine.EventSystems;

namespace TermometroTierra.Agricultura
{
    public sealed class FarmPlot : TierraWorldObject
    {
        public int plotIndex;
        public int cropIndex = -1;
        public int previousCrop = -1;
        public bool watered;
        public bool composted;
        public SpriteRenderer cropRenderer;
        public Sprite[] cropSprites;
        public CropData[] cropData;
        public Color soilColor = new Color(0.52f, 0.33f, 0.18f);

        public void SetCrop(int crop)
        {
            cropIndex = crop;
            if (cropRenderer != null)
            {
                cropRenderer.enabled = cropIndex >= 0;
                if (cropIndex >= 0 && cropData != null && cropIndex < cropData.Length && cropData[cropIndex] != null && cropData[cropIndex].sprite != null)
                {
                    cropRenderer.sprite = cropData[cropIndex].sprite;
                    cropRenderer.color = watered ? new Color(0.8f, 1f, 0.76f) : Color.white;
                }
                else if (cropIndex >= 0 && cropSprites != null && cropIndex < cropSprites.Length)
                {
                    cropRenderer.sprite = cropSprites[cropIndex];
                    cropRenderer.color = watered ? new Color(0.8f, 1f, 0.76f) : Color.white;
                }
            }
        }

        public override void OnPointerClick(PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick("farm-plot", plotIndex, gameObject);
        }
    }
}
