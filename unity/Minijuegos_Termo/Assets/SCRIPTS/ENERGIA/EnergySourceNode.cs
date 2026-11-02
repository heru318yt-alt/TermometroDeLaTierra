using UnityEngine;

namespace TermometroTierra.Energia
{
    public sealed class EnergySourceNode : TierraWorldObject
    {
        public int sourceIndex;
        public int output;
        public int carbon;
        public bool selected;
        public EnergySourceData data;
        public SpriteRenderer visual;
        public SpriteRenderer indicator;

        private void Awake()
        {
            if (data == null) return;
            output = data.output;
            carbon = data.carbon;
            if (visual != null && data.sprite != null) visual.sprite = data.sprite;
        }

        public void SetSelected(bool value)
        {
            selected = value;
            if (indicator != null) indicator.color = selected ? new Color(1f, 0.78f, 0.32f) : Color.white;
        }

        public override void OnPointerClick(UnityEngine.EventSystems.PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick("energy-source", sourceIndex, gameObject);
        }
    }
}
