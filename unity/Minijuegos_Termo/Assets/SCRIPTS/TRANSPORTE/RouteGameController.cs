using System.Collections;
using UnityEngine;
using TMPro;

namespace TermometroTierra.Transporte
{
    public sealed class RouteGameController : TierraWorldController
    {
        public TextMeshProUGUI travelerText;
        public TextMeshProUGUI routeScoreText;
        public Transform movingToken;
        public SpriteRenderer tokenRenderer;
        public Sprite[] modeSprites;
        public VehicleData[] vehicleData;
        public Transform startPoint;
        public Transform destinationPoint;
        private readonly string[] names = { "Lina · escuela · 1 km", "Mateo · campus · 8 km", "Sara · mercado con bolsas", "Nico · turno nocturno", "Grupo del barrio · parque", "Eva · centro de salud" };
        private readonly string[] details = { "Trayecto corto y con aceras seguras.", "El camino es largo; caminar no alcanza hoy.", "Llevan compras pesadas: piensen en espacio y compañía.", "Es tarde y el grupo prioriza una ruta segura.", "Varias personas salen del mismo punto.", "El destino tiene acceso sin escalones y poco espacio para estacionar." };
        private readonly int[,] footprint = { { 1, 0, 0, 2 }, { 1, 1, 4, 2 }, { 1, 2, 2, 1 }, { 1, 2, 2, 1 }, { 1, 2, 3, 0 }, { 1, 2, 2, 1 } };
        private readonly int[,] quality = { { 1, 2, 2, 0 }, { 2, 1, 0, 1 }, { 1, 0, 0, 2 }, { 2, 0, 0, 2 }, { 1, 1, 1, 2 }, { 2, 0, 0, 2 } };
        private int traveler;
        private int totalQuality;
        private int totalFootprint;
        private bool animating;

        private void Start()
        {
            if (resultPanel != null) resultPanel.SetActive(false);
            Refresh();
            SetStatus("Lee las necesidades del viaje y elige una forma de moverse. Observa el trayecto y la respuesta.");
        }

        public override void HandleAction(string action, int value)
        {
            if (finished || animating) return;
            if (action == "route-mode") ChooseMode(value);
            if (audioManager != null) audioManager.Play("click");
        }

        public override void HandleWorldClick(string action, int index, GameObject clicked)
        {
            if (action == "route-traveler" && traveler < 6)
            {
                RouteTraveler character = clicked != null ? clicked.GetComponent<RouteTraveler>() : null;
                string name = character != null && !string.IsNullOrEmpty(character.travelerName) ? character.travelerName : names[traveler];
                string needs = character != null && character.data != null && !string.IsNullOrEmpty(character.data.travelNeeds)
                    ? character.data.travelNeeds : details[traveler];
                SetStatus(name + " — " + needs);
            }
        }

        private void ChooseMode(int mode)
        {
            if (mode < 0 || mode > 3 || traveler >= 6) return;
            int rating = quality[traveler, mode];
            totalQuality += rating;
            totalFootprint += footprint[traveler, mode];
            Sprite vehicleSprite = null;
            if (vehicleData != null && mode < vehicleData.Length && vehicleData[mode] != null)
                vehicleSprite = vehicleData[mode].sprite;
            else if (modeSprites != null && mode < modeSprites.Length)
                vehicleSprite = modeSprites[mode];
            if (tokenRenderer != null && vehicleSprite != null) tokenRenderer.sprite = vehicleSprite;
            if (audioManager != null) audioManager.Play("vehicle");
            animating = true;
            string response = rating == 2 ? "Buena combinación: atiende las necesidades del viaje." : rating == 1 ? "La ruta funciona, aunque hay un compromiso de comodidad o impacto." : "La opción no responde bien a este trayecto.";
            SetStatus(response + " Huella del viaje: " + footprint[traveler, mode] + ".");
            StartCoroutine(AnimateRoute());
        }

        private IEnumerator AnimateRoute()
        {
            if (movingToken != null && startPoint != null && destinationPoint != null)
            {
                Vector3 from = startPoint.position;
                Vector3 to = destinationPoint.position;
                movingToken.position = from;
                float time = 0f;
                while (time < 1f)
                {
                    time += Time.deltaTime * 0.65f;
                    float smooth = time * time * (3f - 2f * time);
                    movingToken.position = Vector3.Lerp(from, to, smooth);
                    yield return null;
                }
            }
            traveler++;
            animating = false;
            if (traveler >= 6) FinishRoutes();
            else Refresh();
        }

        private void Refresh()
        {
            if (traveler >= 6) return;
            SetRound("VIAJE " + (traveler + 1) + " / 6");
            if (travelerText != null) travelerText.text = names[traveler].ToUpperInvariant() + "\n" + details[traveler];
            if (routeScoreText != null) routeScoreText.text = "ACCESO " + totalQuality + "   ·   HUELLA " + totalFootprint;
            if (movingToken != null && startPoint != null) movingToken.position = startPoint.position;
        }

        private void FinishRoutes()
        {
            if (routeScoreText != null) routeScoreText.text = "ACCESO " + totalQuality + " / 12   ·   HUELLA " + totalFootprint;
            if (totalQuality >= 9 && totalFootprint <= 8)
                ShowResult("¡Seis viajes que cuidan a la comunidad!", "Elegiste rutas con buen acceso en la mayoría de los casos y mantuviste una huella baja. Seguridad, distancia y necesidades importan junto al medio de transporte.", true);
            else if (totalQuality >= 6)
                ShowResult("La red conecta; puede ser más justa", "Los viajes sumaron " + totalQuality + " puntos de acceso y " + totalFootprint + " de huella. Revisa la distancia, la seguridad nocturna y el acceso sin escalones.", false);
            else
                ShowResult("Algunas rutas no cuidaron el trayecto", "Las elecciones sumaron " + totalQuality + " puntos de acceso. Elige cada medio pensando en quién viaja, cuánto carga y cómo es el camino.", false, false);
        }
    }
}
