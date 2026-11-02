using UnityEngine;

namespace TermometroTierra.Fabrica
{
    public sealed class FactoryBinNode : TierraWorldObject
    {
        public int materialIndex;
        public MaterialData data;

        private void Awake()
        {
            if (data != null) materialIndex = data.materialIndex;
        }

        public override void OnPointerClick(UnityEngine.EventSystems.PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick("factory-bin", materialIndex, gameObject);
        }
    }
}
