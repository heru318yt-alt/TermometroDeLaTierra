using System;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TMPro;
using TermometroTierra;
using TermometroTierra.Agricultura;
using TermometroTierra.Bosques;
using TermometroTierra.Energia;
using TermometroTierra.Fabrica;
using TermometroTierra.Transporte;

/// <summary>
/// Serializes the individually-authored MINIminiJuegos sprites into the gameplay
/// scenes, retaining each imported PNG and its original Unity metadata.
/// </summary>
public static class TermometroOriginalSpriteSetup
{
    private const string OriginalRoot = "Assets/ART/OBJECTS/Originals/";
    private const string FactoryBinPrefabPath = "Assets/GAME/PREFABS/INTERACTABLES/FactoryBin.prefab";
    private const string FactoryScene = "Assets/GAME/SCENES/FabricaCircular.unity";
    private const string EnergyScene = "Assets/GAME/SCENES/EnergiaViva.unity";
    private const string RouteScene = "Assets/GAME/SCENES/RutasQueRespiran.unity";
    private const string ForestScene = "Assets/GAME/SCENES/BosqueGuardian.unity";
    private const string FarmScene = "Assets/GAME/SCENES/FincaDelFuturo.unity";

    private static readonly string[] MaterialNames = { "Plastico", "Papel", "Vidrio", "Metal", "Carton" };
    private static readonly int[] MaterialSequence = { 0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1 };
    private static readonly string[] EnergySourceNames = { "Solar", "Eolica", "Hidraulica", "Bateria", "Gas", "Carbon" };
    private static readonly string[] DistrictNames = { "Casa", "Escuela", "Clinica" };

    [MenuItem("Termómetro de la Tierra/Asignar sprites originales MINIminiJuegos")]
    public static void AssignOriginalSprites()
    {
        AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
        AssignEnergySprites();
        AssignFactorySpritesAndCardboardBin();
        AssignRouteSprites();
        AssignForestNestSprite();
        WireAndSave(FarmScene);
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        Debug.Log("[Termómetro] Sprites originales asignados y serializados en EnergiaViva, FabricaCircular, RutasQueRespiran, BosqueGuardian y FincaDelFuturo.");
    }

    private static void AssignEnergySprites()
    {
        Scene scene = EditorSceneManager.OpenScene(EnergyScene, OpenSceneMode.Single);
        EnergyGameController controller = FindFirst<EnergyGameController>();
        if (controller == null) throw new InvalidOperationException("EnergiaViva no tiene EnergyGameController.");

        Sprite[] sourceSprites = LoadSprites("PanelSolar", "Aerogenerador", "Hidraulica", "Bateria", "PlantaGas", "PlantaCarbon");
        EnergySourceNode[] sources = FindAll<EnergySourceNode>().OrderBy(node => node.sourceIndex).ToArray();
        if (sources.Length != sourceSprites.Length) throw new InvalidOperationException("EnergiaViva debe tener seis fuentes.");
        for (int i = 0; i < sources.Length; i++)
        {
            EnergySourceNode source = sources[i];
            source.sourceIndex = i;
            source.controller = controller;
            source.gameObject.name = "Fuente " + EnergySourceNames[i];
            if (source.indicator == null) source.indicator = source.GetComponentInChildren<SpriteRenderer>(true);
            if (source.indicator == null) throw new InvalidOperationException("Falta SpriteRenderer en " + source.name + ".");
            source.indicator.sprite = sourceSprites[i];
            source.indicator.color = Color.white;
            source.SetSelected(false);
            Record(source, source.indicator, source.transform, source.gameObject);
        }

        Sprite[] baseSprites = LoadSprites("CasaBase", "EscuelaBase", "ClinicaBase");
        Sprite[] litSprites = LoadSprites("CasaLuces", "EscuelaLuces", "ClinicaLuces");
        EnergyDistrictNode[] districts = FindAll<EnergyDistrictNode>().OrderBy(node => node.districtIndex).ToArray();
        if (districts.Length != baseSprites.Length) throw new InvalidOperationException("EnergiaViva debe tener tres sectores.");
        for (int i = 0; i < districts.Length; i++)
        {
            EnergyDistrictNode district = districts[i];
            district.districtIndex = i;
            district.controller = controller;
            district.gameObject.name = "Sector " + DistrictNames[i];
            if (district.indicator == null) district.indicator = district.GetComponentInChildren<SpriteRenderer>(true);
            if (district.indicator == null) throw new InvalidOperationException("Falta SpriteRenderer en " + district.name + ".");
            district.unpoweredSprite = baseSprites[i];
            district.poweredSprite = litSprites[i];
            district.SetSupplied(true);
            Record(district, district.indicator, district.connectionLine, district.transform, district.gameObject);
        }

        controller.sources = sources;
        controller.districts = districts;
        Record(controller);
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);
    }

    private static void AssignFactorySpritesAndCardboardBin()
    {
        Scene scene = EditorSceneManager.OpenScene(FactoryScene, OpenSceneMode.Single);
        FactoryGameController controller = FindFirst<FactoryGameController>();
        if (controller == null) throw new InvalidOperationException("FabricaCircular no tiene FactoryGameController.");

        Sprite[] materialSprites = LoadSprites("BotellaPlastico", "HojasPapel", "BotellaVidrio", "LataMetal", "CajaCarton");
        FactoryMaterialNode[] materials = FindAll<FactoryMaterialNode>()
            .OrderBy(node => SequenceFromName(node.gameObject.name, node.sequenceIndex)).ToArray();
        if (materials.Length != MaterialSequence.Length) throw new InvalidOperationException("FabricaCircular debe tener doce piezas en la banda.");
        for (int i = 0; i < materials.Length; i++)
        {
            FactoryMaterialNode material = materials[i];
            int type = MaterialSequence[i];
            material.sequenceIndex = i;
            material.materialIndex = type;
            material.controller = controller;
            if (material.spriteRenderer == null) material.spriteRenderer = material.GetComponent<SpriteRenderer>();
            if (material.spriteRenderer == null) throw new InvalidOperationException("Falta SpriteRenderer en " + material.name + ".");
            material.spriteRenderer.sprite = materialSprites[type];
            material.spriteRenderer.color = Color.white;
            material.gameObject.name = "Pieza_" + (i + 1).ToString("00") + "_" + MaterialNames[type];
            material.transform.localScale = Vector3.one * 1.8f;
            Record(material, material.spriteRenderer, material.transform, material.gameObject);
        }

        FactoryBinNode[] bins = FindAll<FactoryBinNode>().OrderBy(node => node.materialIndex).ToArray();
        if (bins.Length > 5) throw new InvalidOperationException("FabricaCircular tiene más de cinco contenedores.");
        if (!bins.Any(node => node.materialIndex == 4))
        {
            GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(FactoryBinPrefabPath);
            if (prefab == null) throw new InvalidOperationException("No se encontró el prefab FactoryBin.");
            GameObject instance = PrefabUtility.InstantiatePrefab(prefab, scene) as GameObject;
            if (instance == null) throw new InvalidOperationException("No se pudo crear el contenedor de cartón en la escena.");
            instance.name = "ContenedorCarton";
            FactoryBinNode cardboard = instance.GetComponent<FactoryBinNode>();
            cardboard.materialIndex = 4;
            cardboard.controller = controller;
            bins = bins.Concat(new[] { cardboard }).OrderBy(node => node.materialIndex).ToArray();
        }

        Sprite[] binSprites = LoadSprites("ContenedorPlastico", "ContenedorPapel", "ContenedorVidrio", "ContenedorMetal", "CajaCarton");
        for (int i = 0; i < bins.Length; i++)
        {
            FactoryBinNode bin = bins[i];
            bin.materialIndex = i;
            bin.controller = controller;
            bin.gameObject.name = i == 4 ? "ContenedorCarton" : "Contenedor" + MaterialNames[i];
            SpriteRenderer renderer = bin.GetComponent<SpriteRenderer>();
            if (renderer == null) throw new InvalidOperationException("Falta SpriteRenderer en " + bin.name + ".");
            renderer.sprite = binSprites[i];
            renderer.color = Color.white;
            bin.transform.position = new Vector3((i - 2) * 5.8f, -2.6f, bin.transform.position.z);
            bin.transform.localScale = Vector3.one * 1.8f;
            Record(bin, renderer, bin.transform, bin.gameObject);
        }

        AddCardboardSortingButton(controller);
        PlaceFactoryButtons("factory-bin", new[] { 110f, 300f, 490f, 680f, 870f }, 180f);
        PlaceFactoryButtons("factory-process", new[] { 1100f, 1320f, 1540f, 1760f }, 200f);
        AddCardboardWorldLabel(11.6f, -4.35f);
        TextMeshProUGUI instructions = FindAll<TextMeshProUGUI>().FirstOrDefault(text => text.gameObject.name == "WorldInstructions");
        if (instructions != null) instructions.text = "Selecciona y arrastra piezas · separa cinco materiales · elige un proceso por lote";

        controller.materials = materials;
        controller.bins = bins;
        Record(controller);
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);
    }

    private static void AddCardboardSortingButton(FactoryGameController controller)
    {
        TierraActionButton[] sortButtons = FindAll<TierraActionButton>().Where(button => button.action == "factory-bin").ToArray();
        if (sortButtons.Length != 4 && sortButtons.Length != 5)
            throw new InvalidOperationException("FabricaCircular debe tener cuatro botones de clasificación antes de añadir cartón.");
        if (sortButtons.Any(button => button.value == 4)) return;

        TierraActionButton template = sortButtons.OrderBy(button => button.value).Last();
        GameObject clone = UnityEngine.Object.Instantiate(template.gameObject, template.transform.parent, false);
        clone.name = "Button_CARTON";
        TierraActionButton action = clone.GetComponent<TierraActionButton>();
        action.controller = controller;
        action.action = "factory-bin";
        action.value = 4;
        TextMeshProUGUI label = clone.GetComponentsInChildren<TextMeshProUGUI>(true).FirstOrDefault();
        if (label == null) throw new InvalidOperationException("El botón de contenedor no tiene etiqueta TextMeshProUGUI.");
        label.text = "CARTÓN";
        Record(action, label, clone.transform, clone);
    }

    private static void PlaceFactoryButtons(string actionName, float[] centerPositions, float width)
    {
        TierraActionButton[] buttons = FindAll<TierraActionButton>()
            .Where(button => button.action == actionName)
            .OrderBy(button => button.value).ToArray();
        if (buttons.Length != centerPositions.Length)
            throw new InvalidOperationException(actionName + " no tiene el número esperado de botones.");

        for (int i = 0; i < buttons.Length; i++)
        {
            RectTransform rect = buttons[i].transform as RectTransform;
            if (rect == null) throw new InvalidOperationException("El botón " + buttons[i].name + " no tiene RectTransform.");
            rect.anchoredPosition = new Vector2(centerPositions[i], 28f);
            rect.sizeDelta = new Vector2(width, 58f);
            TextMeshProUGUI label = buttons[i].GetComponentInChildren<TextMeshProUGUI>(true);
            if (label != null)
            {
                label.rectTransform.anchoredPosition = Vector2.zero;
                label.rectTransform.sizeDelta = new Vector2(width - 18f, 50f);
                Record(label, label.rectTransform);
            }
            Record(buttons[i], rect);
        }
    }

    private static void AddCardboardWorldLabel(float x, float y)
    {
        GameObject anchor = GameObject.Find("CartonBinLabelAnchor");
        if (anchor == null) anchor = new GameObject("CartonBinLabelAnchor");
        anchor.transform.position = new Vector3(x, y, -0.1f);

        GameObject labelObject = GameObject.Find("CartonBinLabel");
        TextMeshPro label;
        if (labelObject == null)
        {
            labelObject = new GameObject("CartonBinLabel");
            label = labelObject.AddComponent<TextMeshPro>();
        }
        else
        {
            label = labelObject.GetComponent<TextMeshPro>();
            if (label == null) label = labelObject.AddComponent<TextMeshPro>();
        }

        labelObject.transform.SetParent(anchor.transform, false);
        label.rectTransform.anchoredPosition3D = Vector3.zero;
        label.rectTransform.localPosition = Vector3.zero;

        string[] fontGuids = AssetDatabase.FindAssets("LiberationSans SDF t:TMP_FontAsset");
        TMP_FontAsset font = fontGuids.Length > 0
            ? AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(AssetDatabase.GUIDToAssetPath(fontGuids[0]))
            : null;
        if (font == null) throw new InvalidOperationException("Falta LiberationSans SDF para la etiqueta del cartón.");
        label.font = font;
        label.text = "CARTÓN";
        label.fontSize = 5.5f;
        label.fontStyle = FontStyles.Bold;
        label.alignment = TextAlignmentOptions.Center;
        label.textWrappingMode = TextWrappingModes.NoWrap;
        label.color = new Color32(48, 111, 104, 255);
        label.rectTransform.sizeDelta = new Vector2(3.2f, 0.8f);
        label.transform.localScale = Vector3.one;
        label.GetComponent<MeshRenderer>().sortingOrder = 10;
        label.SetAllDirty();
        Record(anchor.transform, anchor);
        Record(label, label.rectTransform, label.GetComponent<MeshRenderer>(), label.gameObject);
    }

    private static void AssignRouteSprites()
    {
        Scene scene = EditorSceneManager.OpenScene(RouteScene, OpenSceneMode.Single);
        RouteGameController controller = FindFirst<RouteGameController>();
        if (controller == null) throw new InvalidOperationException("RutasQueRespiran no tiene RouteGameController.");

        Sprite bus = LoadSprite("BusTopDown");
        Sprite bicycle = LoadSprite("BicicletaTopDown");
        Sprite walker = LoadSprite("PersonGreen");
        Sprite sharedCar = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/EXTERNAL_ASSETS/TermometroDeLaTierra/Art/Backgrounds/KenneyTinyCity/Tiles/tile_0122.png");
        if (sharedCar == null) throw new InvalidOperationException("No se encontró el sprite de vehículo compartido de Tiny City.");
        controller.modeSprites = new[] { bus, bicycle, walker, sharedCar };
        if (controller.tokenRenderer == null && controller.movingToken != null)
            controller.tokenRenderer = controller.movingToken.GetComponent<SpriteRenderer>();
        if (controller.tokenRenderer != null)
        {
            controller.tokenRenderer.sprite = walker;
            controller.tokenRenderer.color = Color.white;
            Record(controller.tokenRenderer, controller.movingToken);
        }
        RouteTraveler[] travelers = FindAll<RouteTraveler>();
        foreach (RouteTraveler traveler in travelers)
        {
            traveler.controller = controller;
            Record(traveler);
        }
        Record(controller);
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);
    }

    private static void AssignForestNestSprite()
    {
        Scene scene = EditorSceneManager.OpenScene(ForestScene, OpenSceneMode.Single);
        Sprite nest = AssetDatabase.LoadAssetAtPath<Sprite>("Assets/ART/SPRITES/FOREST/Nido.png");
        if (nest == null) throw new InvalidOperationException("No se encontró Nido.png de MINIminiJuegos.");
        TierraWorldController controller = FindFirst<TierraWorldController>();
        foreach (ForestPlot plot in FindAll<ForestPlot>())
        {
            plot.controller = controller;
            plot.nestSprite = nest;
            Record(plot);
        }
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);
    }

    private static void WireAndSave(string scenePath)
    {
        Scene scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
        TierraWorldController controller = FindFirst<TierraWorldController>();
        if (controller != null)
            foreach (TierraWorldObject target in FindAll<TierraWorldObject>())
            {
                target.controller = controller;
                Record(target);
            }

        if (string.Equals(scenePath, FarmScene, StringComparison.Ordinal))
        {
            foreach (FarmPlot plot in FindAll<FarmPlot>())
            {
                if (plot.cropRenderer == null) continue;
                plot.cropRenderer.transform.localScale = new Vector3(0.55f, 0.55f, 1f);
                Record(plot.cropRenderer.transform, plot.cropRenderer);
            }
        }

        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);
    }

    private static Sprite[] LoadSprites(params string[] names)
    {
        return names.Select(LoadSprite).ToArray();
    }

    private static Sprite LoadSprite(string name)
    {
        string path = OriginalRoot + name + ".png";
        Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path);
        if (sprite == null) throw new InvalidOperationException("El PNG no se importó como sprite: " + path);
        return sprite;
    }

    private static T FindFirst<T>() where T : UnityEngine.Object
    {
        return UnityEngine.Object.FindFirstObjectByType<T>(FindObjectsInactive.Include);
    }

    private static T[] FindAll<T>() where T : UnityEngine.Object
    {
        return UnityEngine.Object.FindObjectsByType<T>(FindObjectsInactive.Include, FindObjectsSortMode.None);
    }

    private static int SequenceFromName(string objectName, int fallback)
    {
        const string prefix = "Pieza_";
        if (!objectName.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) return fallback;
        int underscore = objectName.IndexOf('_', prefix.Length);
        string number = underscore < 0 ? objectName.Substring(prefix.Length) : objectName.Substring(prefix.Length, underscore - prefix.Length);
        return int.TryParse(number, out int oneBased) ? oneBased - 1 : fallback;
    }

    private static void Record(params UnityEngine.Object[] targets)
    {
        foreach (UnityEngine.Object target in targets)
        {
            if (target == null) continue;
            EditorUtility.SetDirty(target);
            if (PrefabUtility.IsPartOfPrefabInstance(target))
                PrefabUtility.RecordPrefabInstancePropertyModifications(target);
        }
    }
}
