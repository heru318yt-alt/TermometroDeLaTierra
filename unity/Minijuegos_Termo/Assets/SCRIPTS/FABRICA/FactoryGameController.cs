using UnityEngine;
using UnityEngine.UI;
using TMPro;

namespace TermometroTierra.Fabrica
{
    public sealed class FactoryGameController : TierraWorldController
    {
        public FactoryMaterialNode[] materials;
        public FactoryBinNode[] bins;
        public TextMeshProUGUI pieceText;
        public TextMeshProUGUI contaminationText;
        public TextMeshProUGUI batchText;
        // Plastic, paper, glass, metal and cardboard appear in every lot.
        private readonly int[] sequence = { 0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1 };
        private int current;
        private int contamination;
        private int recycled;
        private int circularProcesses;
        private int processCost;
        private int batchProcessCount;

        private void Start()
        {
            if (resultPanel != null) resultPanel.SetActive(false);
            SelectCurrent();
            SetStatus("Toca una pieza y su contenedor, o arrástrala hasta el contenedor correcto. Después elige un proceso para el lote.");
            Refresh();
        }

        public override void HandleAction(string action, int value)
        {
            if (finished) return;
            if (action == "factory-bin") SortTo(value);
            else if (action == "factory-process") ProcessBatch(value);
            if (audioManager != null) audioManager.Play("click");
        }

        public override void HandleWorldClick(string action, int index, GameObject clicked)
        {
            if (finished) return;
            if (action == "factory-material") SelectMaterial(index);
            else if (action == "factory-bin") SortTo(index);
        }

        public void SelectMaterial(FactoryMaterialNode node)
        {
            if (node == null || node.sequenceIndex != current || finished) return;
            SelectMaterial(node.sequenceIndex);
        }

        private void SelectMaterial(int index)
        {
            if (index != current || index < 0 || index >= sequence.Length) return;
            SetStatus("Pieza activa: " + MaterialName(sequence[current]) + ". Llévala a su contenedor.");
        }

        public bool TryDropMaterial(FactoryMaterialNode item, Vector2 screenPosition)
        {
            Camera camera = Camera.main;
            if (camera == null || item == null || item.sequenceIndex != current) return false;
            Vector3 world = camera.ScreenToWorldPoint(screenPosition);
            Collider2D hit = Physics2D.OverlapPoint(new Vector2(world.x, world.y));
            FactoryBinNode bin = hit != null ? hit.GetComponent<FactoryBinNode>() : null;
            item.ReturnToBelt();
            if (bin == null) return false;
            SortTo(bin.materialIndex);
            return true;
        }

        private void SortTo(int bin)
        {
            if (current >= sequence.Length || bin < 0 || bin > 4) return;
            FactoryMaterialNode item = materials != null && current < materials.Length ? materials[current] : null;
            if (item != null) item.gameObject.SetActive(false);
            if (bin == sequence[current])
            {
                recycled++;
                SetStatus(MaterialName(sequence[current]) + " recuperado y enviado a la zona de transformación.");
                if (audioManager != null) audioManager.Play("success");
            }
            else
            {
                contamination++;
                SetStatus("El lote se contaminó: " + MaterialName(sequence[current]) + " llegó al contenedor de " + MaterialName(bin) + ".");
                if (audioManager != null) audioManager.Play("error");
            }
            current++;
            if (current < sequence.Length && current % 4 == 0)
            {
                SetStatus("Lote clasificado. Ahora elige cómo transformarlo: reutiliza, mejora eficiencia, electrifica o usa material nuevo.");
                if (batchText != null) batchText.text = "LOTE " + (current / 4) + " · PROCESO PENDIENTE";
                if (pieceText != null) pieceText.text = "ELIGE UN PROCESO";
            }
            else if (current >= sequence.Length)
            {
                SetStatus("Tres lotes clasificados. Elige el proceso del último lote para cerrar la fábrica.");
                if (pieceText != null) pieceText.text = "ELIGE UN PROCESO";
            }
            else SelectCurrent();
            Refresh();
        }

        private void ProcessBatch(int mode)
        {
            if (mode < 0 || mode > 3 || current == 0 || current % 4 != 0 || batchProcessCount >= 3) return;
            int batch = batchProcessCount;
            processCost += ProcessCost(batch, mode);
            if (mode == 0 || mode == 1) circularProcesses++;
            batchProcessCount++;
            if (audioManager != null) audioManager.Play("machine");
            if (batchProcessCount >= 3)
            {
                int score = recycled + circularProcesses * 2 - contamination * 3 - processCost / 3;
                if (contamination == 0 && circularProcesses >= 2 && score >= 15)
                    ShowResult("¡La fábrica convirtió residuos en recursos!", "Recuperaste " + recycled + " de 12 piezas y elegiste " + circularProcesses + " procesos circulares. Así los materiales vuelven a la obra con menos desperdicio.", true);
                else if (recycled >= 8)
                    ShowResult("La fábrica avanzó; revisa algunos lotes", "Recuperaste " + recycled + " piezas, pero hubo " + contamination + " errores de clasificación. Separar bien ayuda a que el material conserve su valor.", false);
                else
                    ShowResult("Varios materiales se perdieron", "Solo " + recycled + " de 12 piezas llegaron al contenedor adecuado. Clasifica antes de procesar para reducir contaminación y desperdicio.", false, false);
                return;
            }
            if (current < sequence.Length) SelectCurrent();
            else { SetStatus("Proceso aplicado. Completa la partida."); if (pieceText != null) pieceText.text = "LOTE TRANSFORMADO"; }
            Refresh();
        }

        private static int ProcessCost(int batch, int mode)
        {
            int[,] matrix = { { 1, 2, 2, 5 }, { 2, 1, 3, 6 }, { 1, 2, 1, 4 } };
            return matrix[batch, mode];
        }

        private void SelectCurrent()
        {
            if (current >= sequence.Length) return;
            if (materials != null && current < materials.Length)
            {
                materials[current].gameObject.SetActive(true);
                materials[current].ReturnToBelt();
            }
            if (pieceText != null) pieceText.text = "PIEZA " + (current + 1) + "/12  ·  " + MaterialName(sequence[current]).ToUpperInvariant();
            if (batchText != null) batchText.text = "LOTE " + (current / 4 + 1) + " / 3";
        }

        private void Refresh()
        {
            if (contaminationText != null) contaminationText.text = "RECUPERADOS " + recycled + "/12   ·   CONTAMINACIÓN " + contamination + "   ·   COSTE " + processCost;
            if (current < sequence.Length) SetRound("LOTE " + (current / 4 + 1) + " / 3");
        }

        private string MaterialName(int value)
        {
            if (materials != null)
            {
                for (int i = 0; i < materials.Length; i++)
                    if (materials[i] != null && materials[i].materialIndex == value && materials[i].data != null && !string.IsNullOrEmpty(materials[i].data.displayName))
                        return materials[i].data.displayName;
            }
            switch (value)
            {
                case 0: return "Plástico";
                case 1: return "Papel";
                case 2: return "Vidrio";
                case 3: return "Metal";
                case 4: return "Cartón";
                default: return "Material";
            }
        }
    }
}
