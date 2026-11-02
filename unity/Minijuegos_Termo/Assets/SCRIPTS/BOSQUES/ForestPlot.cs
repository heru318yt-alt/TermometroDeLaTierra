using UnityEngine;
using UnityEngine.EventSystems;

namespace TermometroTierra.Bosques
{
    public sealed class ForestPlot : TierraWorldObject
    {
        public int plotIndex;
        public int state;
        public PlantData plantData;
        public SpriteRenderer groundRenderer;
        public SpriteRenderer plantRenderer;
        public Sprite treeSprite;
        public Sprite seedSprite;
        public Sprite sproutSprite;
        public Sprite youngTreeSprite;
        public Sprite nestSprite;

        private static readonly Color SelectedGround = new Color(1f, 0.88f, 0.43f, 1f);

        public void SetSelected(bool selected)
        {
            if (groundRenderer != null)
                groundRenderer.color = selected ? SelectedGround : Color.white;
        }

        public void ApplyState(int value)
        {
            state = value;
            if (plantRenderer == null) return;
            plantRenderer.enabled = state != 0;
            switch (state)
            {
                case 1: plantRenderer.sprite = plantData != null && plantData.matureTreeSprite != null ? plantData.matureTreeSprite : treeSprite; break;
                case 2: plantRenderer.sprite = nestSprite; break;
                case 3: plantRenderer.sprite = plantData != null && plantData.seedSprite != null ? plantData.seedSprite : seedSprite; break;
                case 4: plantRenderer.sprite = plantData != null && plantData.sproutSprite != null ? plantData.sproutSprite : sproutSprite; break;
                case 5: plantRenderer.sprite = plantData != null && plantData.youngTreeSprite != null ? plantData.youngTreeSprite : youngTreeSprite; break;
                default: plantRenderer.sprite = null; break;
            }
            plantRenderer.color = Color.white;
        }

        public override void OnPointerClick(PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick("forest-plot", plotIndex, gameObject);
        }
    }
}
