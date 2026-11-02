using UnityEngine;
using UnityEngine.EventSystems;
using TermometroTierra;

namespace TermometroTierra.Fabrica
{
    public sealed class FactoryMaterialNode : TierraWorldObject, IBeginDragHandler, IDragHandler, IEndDragHandler
    {
        public int sequenceIndex;
        public int materialIndex;
        public MaterialData data;
        public SpriteRenderer spriteRenderer;
        private Vector3 homePosition;

        private void Awake()
        {
            if (data != null)
            {
                materialIndex = data.materialIndex;
                if (spriteRenderer != null && data.sprite != null) spriteRenderer.sprite = data.sprite;
            }
        }

        private void Start() { homePosition = transform.position; }

        public override void OnPointerClick(PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick("factory-material", sequenceIndex, gameObject);
        }

        public void OnBeginDrag(PointerEventData eventData)
        {
            if (controller is FactoryGameController game) game.SelectMaterial(this);
        }

        public void OnDrag(PointerEventData eventData)
        {
            Camera camera = Camera.main;
            if (camera == null) return;
            Vector3 point = camera.ScreenToWorldPoint(eventData.position);
            point.z = transform.position.z;
            transform.position = point;
        }

        public void OnEndDrag(PointerEventData eventData)
        {
            if (controller is FactoryGameController game && !game.TryDropMaterial(this, eventData.position))
                transform.position = homePosition;
        }

        public void ReturnToBelt() { transform.position = homePosition; }
    }
}
