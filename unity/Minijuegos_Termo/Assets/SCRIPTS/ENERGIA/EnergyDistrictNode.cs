using UnityEngine;

namespace TermometroTierra.Energia
{
    public sealed class EnergyDistrictNode : TierraWorldObject
    {
        public int districtIndex;
        public bool supplied;
        public SpriteRenderer indicator;
        public Sprite unpoweredSprite;
        public Sprite poweredSprite;
        public LineRenderer connectionLine;
        public void SetSupplied(bool value)
        {
            supplied = value;
            if (indicator != null)
            {
                Sprite stateSprite = supplied ? poweredSprite : unpoweredSprite;
                if (stateSprite != null) indicator.sprite = stateSprite;
                indicator.color = Color.white;
            }
            if (connectionLine != null) connectionLine.enabled = supplied;
        }
        public override void OnPointerClick(UnityEngine.EventSystems.PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick("energy-district", districtIndex, gameObject);
        }
    }
}
