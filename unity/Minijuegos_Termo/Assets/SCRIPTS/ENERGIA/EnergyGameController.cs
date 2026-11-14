using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace TermometroTierra.Energia
{
    public sealed class EnergyGameController : TierraWorldController
    {
        public EnergySourceNode[] sources;
        public EnergyDistrictNode[] districts;
        public TextMeshProUGUI demandText;
        public TextMeshProUGUI carbonText;
        public TextMeshProUGUI saveText;
        public Button evaluateButton;
        private readonly bool[] connected = new bool[3];
        private int round = 1;
        private int cleanRounds;
        private int servedRounds;
        private bool saving;
        // Reserva de combustible fósil de la red. No se recupera: cada ronda
        // exige más energía y la quema crece, así que la partida siempre
        // termina cuando la reserva llega a cero.
        private int fuel = StartingFuel;

        private const int StartingFuel = 120;

        private void Start()
        {
            if (resultPanel != null) resultPanel.SetActive(false);
            fuel = StartingFuel;
            for (int i = 0; i < connected.Length; i++)
            {
                connected[i] = true;
                if (districts != null && i < districts.Length && districts[i] != null)
                    districts[i].SetSupplied(true);
            }
            Refresh();
            SetStatus("Elige hasta tres fuentes. Conecta los tres sectores y cubre la demanda: el combustible fósil se agota y cada ronda cuesta más.");
        }

        public override void HandleAction(string action, int value)
        {
            if (finished) return;
            if (action == "source") ToggleSource(value);
            else if (action == "saving") { saving = !saving; Refresh(); }
            else if (action == "evaluate") EvaluateRound();
            if (audioManager != null) audioManager.Play("click");
        }

        public override void HandleWorldClick(string action, int index, GameObject clicked)
        {
            if (finished) return;
            if (action == "energy-source") ToggleSource(index);
            else if (action == "energy-district" && index >= 0 && index < connected.Length)
            {
                connected[index] = !connected[index];
                if (districts != null && index < districts.Length) districts[index].SetSupplied(connected[index]);
                Refresh();
            }
        }

        private void ToggleSource(int index)
        {
            if (sources == null || index < 0 || index >= sources.Length) return;
            EnergySourceNode node = sources[index];
            if (!node.selected && SelectedCount() >= 3) { SetStatus("La red admite hasta tres fuentes en esta ronda. Desactiva una para cambiar la mezcla."); return; }
            node.SetSelected(!node.selected);
            Refresh();
        }

        private int SelectedCount()
        {
            int count = 0;
            if (sources != null) for (int i = 0; i < sources.Length; i++) if (sources[i].selected) count++;
            return count;
        }

        private int Output()
        {
            int total = 0;
            if (sources != null) for (int i = 0; i < sources.Length; i++) if (sources[i].selected) total += sources[i].output;
            return total;
        }

        private int Carbon()
        {
            int total = 0;
            if (sources != null) for (int i = 0; i < sources.Length; i++) if (sources[i].selected) total += sources[i].carbon;
            return Mathf.Max(0, total - (saving ? 2 : 0));
        }

        private bool AllDistrictsConnected()
        {
            for (int i = 0; i < connected.Length; i++) if (!connected[i]) return false;
            return true;
        }

        private void EvaluateRound()
        {
            int demand = Demand();
            bool served = AllDistrictsConnected() && Output() >= demand;
            bool clean = served && Carbon() <= 7;
            if (served) servedRounds++;
            if (clean) cleanRounds++;
            string response = served ? "Los tres sectores reciben energía." : "La red dejó sectores sin conexión o produjo menos de lo que la ciudad necesita.";
            response += clean ? " La mezcla se mantiene en un impacto moderado." : " Revisa la demanda, el ahorro y las fuentes de respaldo.";
            int burn = FuelBurn();
            fuel = Mathf.Max(0, fuel - burn);
            SetStatus(response + " Combustible consumido: " + burn + " unidades.");
            if (audioManager != null) audioManager.Play(served ? "success" : "error");
            if (fuel <= 0)
            {
                ShowResult("La red se quedó sin combustible",
                    "La ciudad estuvo iluminada " + servedRounds + " rondas. Cada ronda exigió más energía y la reserva fósil cayó más rápido hasta agotarse: sin combustible no hay respaldo para seguir cubriendo la demanda." +
                    (cleanRounds > 0 ? " Las rondas con menor huella retrasaron el final." : ""),
                    false);
                return;
            }
            round++;
            ResetRound();
        }

        /** La demanda crece aunque el ahorro la contenga un poco. */
        private int Demand() => 4 + round - (saving ? 1 : 0);

        /**
         * Cada ronda quema más combustible: primero la demanda sube y luego la
         * propia reserva escasea. Una red más fósil acelera la caída; ahorrar
         * la retrasa, pero no la evita.
         */
        private int FuelBurn()
        {
            int baseBurn = 8 + (round - 1) * 4;
            int fossilPenalty = Carbon() / 3;
            int savingBonus = saving ? 2 : 0;
            return Mathf.Max(1, baseBurn + fossilPenalty - savingBonus);
        }

        private void ResetRound()
        {
            saving = false;
            for (int i = 0; i < connected.Length; i++)
            {
                connected[i] = true;
                if (districts != null && i < districts.Length) districts[i].SetSupplied(true);
            }
            if (sources != null) for (int i = 0; i < sources.Length; i++) sources[i].SetSelected(false);
            Refresh();
        }

        private void Refresh()
        {
            int demand = Demand();
            SetRound("RONDA " + round + " · COMBUSTIBLE " + fuel);
            if (demandText != null) demandText.text = "DEMANDA / GENERACIÓN\n" + demand + " / " + Output() + " kW";
            if (carbonText != null) carbonText.text = "HUELLA CO2\n" + Carbon() + " kg";
            if (saveText != null) saveText.text = saving ? "AHORRO\nACTIVADO" : "AHORRO\nINACTIVO";
            if (evaluateButton != null)
                evaluateButton.interactable = SelectedCount() > 0 && AllDistrictsConnected();

            string supply = Output() >= demand ? "generación suficiente" : "falta generación";
            string warning = fuel <= 30 ? " · QUEDA POCO COMBUSTIBLE" : "";
            SetStatus("FUENTES " + SelectedCount() + "/3 · SECTORES " + ConnectedCount() + "/3 · " + supply + warning +
                      "\n" + SelectedSourceSummary());
        }

        private string SelectedSourceSummary()
        {
            if (sources == null || SelectedCount() == 0)
                return "PASO 1/4 · Selecciona hasta tres fuentes de energía.";

            System.Text.StringBuilder summary = new System.Text.StringBuilder("SELECCIONADAS · ");
            bool first = true;
            for (int i = 0; i < sources.Length; i++)
            {
                if (!sources[i].selected) continue;
                if (!first) summary.Append(" · ");
                string sourceName = sources[i].data != null && !string.IsNullOrEmpty(sources[i].data.displayName)
                    ? sources[i].data.displayName : sources[i].gameObject.name;
                summary.Append(sourceName);
                summary.Append(" ").Append(sources[i].output).Append(" kW");
                first = false;
            }
            return summary.ToString();
        }

        private int ConnectedCount()
        {
            int n = 0;
            for (int i = 0; i < connected.Length; i++) if (connected[i]) n++;
            return n;
        }
    }
}
