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

        private void Start()
        {
            if (resultPanel != null) resultPanel.SetActive(false);
            for (int i = 0; i < connected.Length; i++)
            {
                connected[i] = true;
                if (districts != null && i < districts.Length && districts[i] != null)
                    districts[i].SetSupplied(true);
            }
            Refresh();
            SetStatus("Elige hasta tres fuentes. Conecta los tres sectores y cubre la demanda sin disparar las emisiones.");
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
            int demand = 4 + round - (saving ? 1 : 0);
            bool served = AllDistrictsConnected() && Output() >= demand;
            bool clean = served && Carbon() <= 7;
            if (served) servedRounds++;
            if (clean) cleanRounds++;
            string response = served ? "Los tres sectores reciben energía." : "La red dejó sectores sin conexión o produjo menos de lo que la ciudad necesita.";
            response += clean ? " La mezcla se mantiene en un impacto moderado." : " Revisa la demanda, el ahorro y las fuentes de respaldo.";
            SetStatus(response);
            if (audioManager != null) audioManager.Play(served ? "success" : "error");
            if (round >= 3)
            {
                if (cleanRounds >= 2 && servedRounds == 3)
                    ShowResult("¡La ciudad pasó la noche iluminada!", "Combinaste fuentes, cubriste la demanda y redujiste la huella en " + cleanRounds + " de 3 rondas.", true);
                else if (servedRounds >= 2)
                    ShowResult("La red funcionó; aún puede respirar mejor", "La ciudad recibió electricidad en " + servedRounds + " rondas. Reduce emisiones con ahorro y una mezcla más limpia.", false);
                else
                    ShowResult("La ciudad necesita otra mezcla", "Solo " + servedRounds + " rondas cubrieron los sectores. Ajusta la generación y vuelve a conectar hogares, escuela y clínica.", false, false);
                return;
            }
            round++;
            ResetRound();
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
            int demand = 4 + round - (saving ? 1 : 0);
            SetRound("RONDA " + round + " / 3");
            if (demandText != null) demandText.text = "DEMANDA / GENERACIÓN\n" + demand + " / " + Output() + " kW";
            if (carbonText != null) carbonText.text = "HUELLA CO2\n" + Carbon() + " kg";
            if (saveText != null) saveText.text = saving ? "AHORRO\nACTIVADO" : "AHORRO\nINACTIVO";
            if (evaluateButton != null)
                evaluateButton.interactable = SelectedCount() > 0 && AllDistrictsConnected();

            string supply = Output() >= demand ? "generación suficiente" : "falta generación";
            SetStatus("FUENTES " + SelectedCount() + "/3 · SECTORES " + ConnectedCount() + "/3 · " + supply +
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
