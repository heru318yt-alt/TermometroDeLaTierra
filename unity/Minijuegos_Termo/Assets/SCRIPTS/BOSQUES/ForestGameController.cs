using UnityEngine;
using TMPro;

namespace TermometroTierra.Bosques
{
    public sealed class ForestGameController : TierraWorldController
    {
        public ForestPlot[] plots;
        public TextMeshProUGUI resourceText;
        public TextMeshProUGUI selectedText;
        private readonly int[] initial = { 0, 0, 2, 0, 1, 0, 0, 2, 0, 0, 1, 0 };
        private int season = 1;
        private int seeds = 2;
        private int water = 2;
        private int plantedThisSeason;
        private int protectedNests = 2;
        private int caredFor;
        private int seedsPlanted;
        private int waterUsed;
        private int selectedPlot = -1;
        private bool wateringMode;
        private int growthPoints;

        private void Start()
        {
            if (resultPanel != null) resultPanel.SetActive(false);
            if (plots != null) for (int i = 0; i < plots.Length && i < initial.Length; i++) plots[i].ApplyState(initial[i]);
            Refresh();
            SetStatus("Planta solo en claros. Los nidos son hábitat: déjalos intactos. Selecciona una parcela y planta; luego riega brotes.");
        }

        public override void HandleAction(string action, int value)
        {
            if (finished) return;
            if (action == "forest-plant") PlantSelected();
            else if (action == "forest-water") { wateringMode = !wateringMode; if (selectedPlot >= 0 && wateringMode) WaterSelected(); else Refresh(); }
            else if (action == "forest-next") NextSeason();
        }

        public override void HandleWorldClick(string action, int index, GameObject clicked)
        {
            if (finished || action != "forest-plot" || plots == null || index < 0 || index >= plots.Length) return;
            if (selectedPlot >= 0 && selectedPlot < plots.Length) plots[selectedPlot].SetSelected(false);
            selectedPlot = index;
            plots[selectedPlot].SetSelected(true);
            if (wateringMode) WaterSelected();
            else
            {
                Refresh();
                SetStatus(PlotStatus(plots[selectedPlot]));
            }
        }

        private void PlantSelected()
        {
            if (selectedPlot < 0 || plots == null || selectedPlot >= plots.Length) { SetStatus("Selecciona primero un claro."); return; }
            ForestPlot plot = plots[selectedPlot];
            if (plot.state != 0) { SetStatus(plot.state == 2 ? "Este nido protege fauna local. Elige otro claro." : "Esta parcela ya tiene un árbol o un brote."); return; }
            if (seeds <= 0) { SetStatus("Se agotaron las semillas de esta estación."); return; }
            seeds--; plantedThisSeason++; seedsPlanted++;
            plot.ApplyState(3);
            wateringMode = false;
            if (audioManager != null) audioManager.Play("nature");
            SetStatus("Semilla nativa plantada. Un riego ayudará al brote a resistir la estación.");
            Refresh();
        }

        private void WaterSelected()
        {
            if (selectedPlot < 0 || plots == null || selectedPlot >= plots.Length) { SetStatus("Selecciona primero una parcela con un brote."); return; }
            ForestPlot plot = plots[selectedPlot];
            if (plot.state != 3 && plot.state != 4) { SetStatus("El agua se reserva para semillas y brotes jóvenes."); return; }
            if (water <= 0) { SetStatus("Se agotó el agua disponible esta estación."); return; }
            water--;
            waterUsed++;
            plot.ApplyState(5);
            caredFor++;
            wateringMode = false;
            if (audioManager != null) audioManager.Play("nature");
            SetStatus("Brote regado: queda más fuerte para la siguiente estación.");
            Refresh();
        }

        private void NextSeason()
        {
            if (plantedThisSeason < 2)
            {
                SetStatus("Antes de cambiar de estación, planta al menos dos claros para restaurar la ladera.");
                return;
            }
            if (plots != null)
            {
                for (int i = 0; i < plots.Length; i++)
                {
                    ForestPlot plot = plots[i];
                    if (plot.state == 5) { plot.ApplyState(1); growthPoints += 2; }
                    else if (plot.state == 3) { plot.ApplyState(4); growthPoints++; }
                    else if (plot.state == 4) { plot.ApplyState(5); growthPoints++; }
                }
            }
            if (season >= 3)
            {
                int trees = CountTrees();
                string report = BuildForestReport(trees);
                if (trees >= 8 && protectedNests == 2 && caredFor >= 3)
                    ShowResult("¡Un bosque vuelve a crecer!", "La ladera terminó con " + trees + " árboles y sus dos nidos protegidos. Regar los brotes ayudó a que sobrevivieran.\n\n" + report, true);
                else if (trees >= 5 && protectedNests == 2)
                    ShowResult("El bosque creció, con brotes por cuidar", "Hay " + trees + " árboles y ambos nidos siguen protegidos. Más riego habría fortalecido los brotes jóvenes.\n\n" + report, false);
                else
                    ShowResult("La ladera necesita más cuidados", "Quedaron " + trees + " árboles. Planta en claros, riega a tiempo y conserva los nidos como hábitat.\n\n" + report, false, false);
                return;
            }
            season++;
            seeds = 2; water = Mathf.Min(3, water + 2); plantedThisSeason = 0; wateringMode = false;
            Refresh();
            SetStatus("Nueva estación. El bosque muestra el crecimiento; planta dos claros y cuida los brotes que quedan.");
        }

        private int CountTrees()
        {
            int count = 0;
            if (plots != null) for (int i = 0; i < plots.Length; i++) if (plots[i].state == 1) count++;
            return count;
        }

        private int CountYoungPlants()
        {
            int count = 0;
            if (plots != null) for (int i = 0; i < plots.Length; i++) if (plots[i].state == 3 || plots[i].state == 4 || plots[i].state == 5) count++;
            return count;
        }

        private string BuildForestReport(int trees)
        {
            return "RESULTADOS   ·   " + trees + " ÁRBOLES DESARROLLADOS   ·   " + CountYoungPlants() + " BROTES EN CRECIMIENTO\n" +
                   "" + caredFor + " BROTES REGADOS   ·   " + protectedNests + "/2 NIDOS PROTEGIDOS   ·   " + seedsPlanted + " SEMILLAS PLANTADAS   ·   " + waterUsed + " RIEGOS USADOS";
        }

        private static string PlotStatus(ForestPlot plot)
        {
            if (plot.state == 0) return "CLARO LIBRE · puedes plantar una semilla nativa.";
            if (plot.state == 1) return "ÁRBOL DESARROLLADO · protege este hábitat.";
            if (plot.state == 2) return "NIDO ACTIVO · hábitat protegido, no plantar.";
            if (plot.state == 3) return "SEMILLA RECIÉN PLANTADA · riégala para ayudarla.";
            if (plot.state == 4) return "BROTE JOVEN · necesita otra estación para desarrollarse.";
            return "PLANTA JOVEN REGADA · va camino a convertirse en árbol.";
        }

        private void Refresh()
        {
            SetRound("ESTACIÓN " + season + " / 3");
            if (resourceText != null) resourceText.text = "SEMILLAS " + seeds + "   ·   AGUA " + water + "   ·   NIDOS " + protectedNests + "/2";
            if (selectedText != null) selectedText.text = selectedPlot < 0 ? "SELECCIONA UN CLARO" : "PARCELA " + (selectedPlot + 1) + " · " + (wateringMode ? "RIEGO" : StateName(plots[selectedPlot].state));
        }

        private static string StateName(int state)
        {
            switch (state)
            {
                case 0: return "CLARO LIBRE";
                case 1: return "ÁRBOL";
                case 2: return "NIDO PROTEGIDO";
                case 3: return "SEMILLA";
                case 4: return "BROTE";
                default: return "PLANTA JOVEN";
            }
        }
    }
}
