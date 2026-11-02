using UnityEngine;
using UnityEngine.EventSystems;

namespace TermometroTierra
{
    [RequireComponent(typeof(Collider2D))]
    public class TierraWorldObject : MonoBehaviour, IPointerClickHandler
    {
        public TierraWorldController controller;
        public string interaction;
        public int index;

        public virtual void OnPointerClick(PointerEventData eventData)
        {
            if (controller != null) controller.HandleWorldClick(interaction, index, gameObject);
        }
    }
}
