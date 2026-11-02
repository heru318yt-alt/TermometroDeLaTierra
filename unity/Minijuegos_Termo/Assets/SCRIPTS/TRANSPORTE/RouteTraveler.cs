using UnityEngine;

namespace TermometroTierra.Transporte
{
    public sealed class RouteTraveler : TierraWorldObject
    {
        public int travelerIndex;
        public string travelerName;
        public CharacterData data;
        public SpriteRenderer visual;

        private void Awake()
        {
            if (data == null) return;
            if (!string.IsNullOrEmpty(data.displayName)) travelerName = data.displayName;
            if (visual != null && data.portrait != null) visual.sprite = data.portrait;
        }

        public override void OnPointerClick(UnityEngine.EventSystems.PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick("route-traveler", travelerIndex, gameObject);
        }
    }
}
