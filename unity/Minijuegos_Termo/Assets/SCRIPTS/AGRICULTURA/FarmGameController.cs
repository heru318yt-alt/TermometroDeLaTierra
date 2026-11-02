using UnityEngine;
using TMPro;

namespace TermometroTierra.Agricultura
{
    public sealed class FarmGameController : TierraWorldController
    {
        public FarmPlot[] plots;
        public TextMeshProUGUI farmResourceText;
        public TextMeshProUGUI farmSelectionText;
        private int season = 1;
        private int water = 2;
        private int compost = 2;
        private int selectedPlot = -1;
        private int harvestScore;
        private int rotationCount;
        private int soilDiversity;
        private int waterUsed;
        private int compostUsed;
        private bool wateringMode;
        private bool compostMode;

        private void Start()
        {
            if (resultPanel != null) resultPanel.SetActive(false);
            Refresh();
            SetStatus("Elige cultivos distintos, cambia de parcela entre estaciones y usa el agua y compost con cuidado.");
        }

        public override void HandleAction(string action, int value)
        {
            if (finished) return;
            if (action == "farm-water") { wateringMode = true; compostMode = false; ApplyResource(); }
            else if (action == "farm-compost") { compostMode = true; wateringMode = false; ApplyResource(); }
            else if (action == "farm-next") FinishSeason();
        }

        public override void HandleWorldClick(string action, int index, GameObject clicked)
        {
            if (finished || action != "farm-plot" || plots == null || index < 0 || index >= plots.Length) return;
            selectedPlot = index;
            if (wateringMode || compostMode) ApplyResource();
            else
            {
                FarmPlot plot = plots[index];
                plot.SetCrop((plot.cropIndex + 1) % 3);
                SetStatus(CropName(plot.cropIndex) + " elegido para la parcela " + (index + 1) + ".");
                if (audioManager != null) audioManager.Play("nature");
                Refresh();
            }
        }

        private void ApplyResource()
        {
            if (selectedPlot < 0 || plots == null || selectedPlot >= plots.Length) { SetStatus("Selecciona una parcela primero."); return; }
            FarmPlot plot = plots[selectedPlot];
            if (plot.cropIndex < 0) { SetStatus("Elige un cultivo para esta parcela antes de asignar recursos."); return; }
            if (wateringMode)
            {
                if (water <= 0) { SetStatus("No queda agua esta estación. Espera a la siguiente temporada."); return; }
                if (!plot.watered) { water--; plot.watered = true; waterUsed++; }
                SetStatus("Riego asignado a la parcela " + (selectedPlot + 1) + ".");
            }
            else if (compostMode)
            {
                if (compost <= 0) { SetStatus("No queda compost esta estación. Espera a la siguiente temporada."); return; }
                if (!plot.composted) { compost--; plot.composted = true; compostUsed++; }
                SetStatus("Compost aplicado a la parcela " + (selectedPlot + 1) + ".");
            }
            wateringMode = compostMode = false;
            if (audioManager != null) audioManager.Play("nature");
            Refresh();
        }

        private void FinishSeason()
        {
            if (plots == null) return;
            int[] seen = new int[3];
            int planted = 0;
            for (int i = 0; i < plots.Length; i++)
            {
                FarmPlot plot = plots[i];
                if (plot.cropIndex < 0) continue;
                planted++;
                seen[plot.cropIndex]++;
                bool rotated = plot.previousCrop >= 0 && plot.previousCrop != plot.cropIndex;
                if (rotated) rotationCount++;
                int yield = plot.cropData != null && plot.cropIndex < plot.cropData.Length && plot.cropData[plot.cropIndex] != null
                    ? plot.cropData[plot.cropIndex].baseYield
                    : plot.cropIndex == 1 || plot.cropIndex == 2 ? 2 : 1;
                yield += plot.watered ? 1 : 0;
                yield += plot.composted ? 1 : 0;
                if (plot.previousCrop == plot.cropIndex && plot.previousCrop >= 0) yield = Mathf.Max(0, yield - 1);
                harvestScore += yield;
                plot.previousCrop = plot.cropIndex;
                plot.watered = false;
                plot.composted = false;
            }
            for (int i = 0; i < seen.Length; i++) if (seen[i] > 0) soilDiversity++;
            if (planted < 4) SetStatus("Quedaron parcelas vacías: distribuir cultivos entre las seis mejora la cosecha y el suelo.");
            else SetStatus("Cosecha de estación registrada. Las leguminosas y coberturas ayudan a renovar el suelo.");
            if (season >= 3)
            {
                string report = BuildFarmReport();
                if (soilDiversity >= 7 && rotationCount >= 6 && harvestScore >= 30)
                    ShowResult("¡La finca cosechó con un suelo resiliente!", report + "La rotación y la diversidad sostienen las siguientes cosechas.", true);
                else if (harvestScore >= 20)
                    ShowResult("La finca cosechó; falta cuidar la rotación", report + "Cambiar cultivos y mantener cobertura habría protegido mejor el suelo.", false);
                else
                    ShowResult("El suelo necesita otra estrategia", report + "Diversifica, rota leguminosas o coberturas y distribuye el agua donde más ayude.", false, false);
                return;
            }
            season++;
            water = Mathf.Min(3, water + 1);
            compost = Mathf.Min(3, compost + 1);
            Refresh();
        }

        private string BuildFarmReport()
        {
            return "COSECHA " + harvestScore + " PUNTOS   ·   DIVERSIDAD " + soilDiversity + "/9   ·   ROTACIÓN " + rotationCount + " CAMBIOS\n" +
                   "RIEGOS " + waterUsed + "   ·   COMPOST " + compostUsed + " APLICACIONES\n\n";
        }

        private void Refresh()
        {
            SetRound("COSECHA " + season + " / 3");
            if (farmResourceText != null) farmResourceText.text = "AGUA " + water + "   ·   COMPOST " + compost + "   ·   COSECHA " + harvestScore;
            if (farmSelectionText != null) farmSelectionText.text = selectedPlot < 0 ? "SELECCIONA PARCELA Y CAMBIA CULTIVO" : "PARCELA " + (selectedPlot + 1) + " · " + (plots[selectedPlot].cropIndex < 0 ? "SIN CULTIVO" : CropName(plots[selectedPlot].cropIndex));
        }

        private string CropName(int index)
        {
            if (selectedPlot >= 0 && plots != null && selectedPlot < plots.Length)
            {
                CropData[] cropData = plots[selectedPlot].cropData;
                if (cropData != null && index >= 0 && index < cropData.Length && cropData[index] != null && !string.IsNullOrEmpty(cropData[index].displayName))
                    return cropData[index].displayName;
            }
            return index == 0 ? "Grano" : index == 1 ? "Leguminosa" : "Cobertura";
        }
    }
}
