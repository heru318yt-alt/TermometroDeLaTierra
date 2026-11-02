#if UNITY_EDITOR
using System;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using TermometroTierra.Agricultura;
using TermometroTierra.Bosques;
using TermometroTierra.Energia;
using TermometroTierra.Fabrica;
using TermometroTierra.Transporte;

public static class TermometroDataSetup
{
    private const string Root = "Assets/DATA";

    [MenuItem("Termómetro de la Tierra/Crear y asignar datos editables")]
    public static void CreateAndAssign()
    {
        Scene original = SceneManager.GetActiveScene();
        if (original.IsValid() && original.isDirty) EditorSceneManager.SaveScene(original);

        EnsureFolder("PLANTS");
        EnsureFolder("MATERIALS");
        EnsureFolder("CHARACTERS");
        EnsureFolder("VEHICLES");
        EnsureFolder("ENERGY");
        EnsureFolder("CROPS");

        AssignEnergy();
        AssignFactory();
        AssignRoutes();
        AssignForest();
        AssignFarm();

        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        if (original.IsValid() && !string.IsNullOrEmpty(original.path))
            EditorSceneManager.OpenScene(original.path, OpenSceneMode.Single);
        Debug.Log("[Termómetro] Datos modulares creados y asignados a las escenas de energía, fábrica, rutas, bosque y finca.");
    }

    private static void AssignEnergy()
    {
        Scene scene = Open("EnergiaViva");
        EnergySourceNode[] nodes = Find<EnergySourceNode>().OrderBy(n => n.sourceIndex).ToArray();
        string[] names = { "Solar", "Eólica", "Hidráulica", "Batería", "Gas", "Carbón" };
        for (int i = 0; i < nodes.Length; i++)
        {
            EnergySourceNode node = nodes[i];
            int index = Mathf.Clamp(node.sourceIndex, 0, names.Length - 1);
            SpriteRenderer visual = FindVisual(node.gameObject, node.indicator);
            EnergySourceData data = GetOrCreate<EnergySourceData>("ENERGY/Energy" + names[index] + ".asset");
            data.sourceIndex = node.sourceIndex;
            data.displayName = names[index];
            data.output = node.output;
            data.carbon = node.carbon;
            data.renewable = index <= 2;
            data.sprite = visual != null ? visual.sprite : null;
            node.data = data;
            node.visual = visual;
            MarkDirty(node);
            EditorUtility.SetDirty(data);
        }
        Save(scene);
    }

    private static void AssignFactory()
    {
        Scene scene = Open("FabricaCircular");
        FactoryMaterialNode[] items = Find<FactoryMaterialNode>();
        string[] names = { "Plástico", "Papel", "Vidrio", "Metal", "Cartón" };
        string[] files = { "Plastic", "Paper", "Glass", "Metal", "Cardboard" };
        MaterialData[] dataByIndex = new MaterialData[names.Length];
        for (int material = 0; material < names.Length; material++)
        {
            FactoryMaterialNode source = items.FirstOrDefault(n => n.materialIndex == material);
            MaterialData data = GetOrCreate<MaterialData>("MATERIALS/Material" + files[material] + ".asset");
            data.materialIndex = material;
            data.displayName = names[material];
            data.sprite = source != null && source.spriteRenderer != null ? source.spriteRenderer.sprite : null;
            data.recoveryHint = RecoveryHint(material);
            dataByIndex[material] = data;
            EditorUtility.SetDirty(data);
        }
        foreach (FactoryMaterialNode item in items)
        {
            int index = Mathf.Clamp(item.materialIndex, 0, dataByIndex.Length - 1);
            item.data = dataByIndex[index];
            MarkDirty(item);
        }
        foreach (FactoryBinNode bin in Find<FactoryBinNode>())
        {
            int index = Mathf.Clamp(bin.materialIndex, 0, dataByIndex.Length - 1);
            bin.data = dataByIndex[index];
            MarkDirty(bin);
        }
        Save(scene);
    }

    private static void AssignRoutes()
    {
        Scene scene = Open("RutasQueRespiran");
        RouteGameController[] controllers = Find<RouteGameController>();
        RouteTraveler[] travelers = Find<RouteTraveler>().OrderBy(t => t.travelerIndex).ToArray();
        string[] names = { "Lina", "Mateo", "Sara", "Nico", "Grupo del barrio", "Eva" };
        string[] needs =
        {
            "Trayecto corto y con aceras seguras.",
            "El camino es largo; caminar no alcanza hoy.",
            "Llevan compras pesadas: piensen en espacio y compañía.",
            "Es tarde y el grupo prioriza una ruta segura.",
            "Varias personas salen del mismo punto.",
            "El destino tiene acceso sin escalones y poco espacio para estacionar."
        };
        foreach (RouteTraveler traveler in travelers)
        {
            int index = Mathf.Clamp(traveler.travelerIndex, 0, names.Length - 1);
            SpriteRenderer visual = FindVisual(traveler.gameObject, null);
            CharacterData data = GetOrCreate<CharacterData>("CHARACTERS/Traveler" + (index + 1) + ".asset");
            data.displayName = names[index];
            data.travelNeeds = needs[index];
            data.portrait = visual != null ? visual.sprite : null;
            traveler.data = data;
            traveler.visual = visual;
            traveler.travelerName = data.displayName;
            MarkDirty(traveler);
            EditorUtility.SetDirty(data);
        }

        string[] vehicleNames = { "Bus", "Bicicleta", "A pie", "Auto compartido" };
        for (int i = 0; i < controllers.Length; i++)
        {
            RouteGameController controller = controllers[i];
            VehicleData[] data = new VehicleData[vehicleNames.Length];
            for (int mode = 0; mode < vehicleNames.Length; mode++)
            {
                data[mode] = GetOrCreate<VehicleData>("VEHICLES/Vehicle" + (mode + 1) + ".asset");
                data[mode].modeIndex = mode;
                data[mode].displayName = vehicleNames[mode];
                data[mode].sprite = controller.modeSprites != null && mode < controller.modeSprites.Length ? controller.modeSprites[mode] : null;
                data[mode].exampleFootprint = mode == 2 ? 0 : mode == 3 ? 2 : 1;
                data[mode].stepFreeAccess = mode == 0;
                EditorUtility.SetDirty(data[mode]);
            }
            controller.vehicleData = data;
            MarkDirty(controller);
        }
        Save(scene);
    }

    private static void AssignForest()
    {
        Scene scene = Open("BosqueGuardian");
        ForestPlot[] plots = Find<ForestPlot>();
        PlantData data = GetOrCreate<PlantData>("PLANTS/NativeForestTree.asset");
        data.displayName = "Árbol nativo";
        data.seedSprite = plots.Select(p => p.seedSprite).FirstOrDefault(s => s != null);
        data.sproutSprite = LoadSprite("Assets/EXTERNAL_ASSETS/TermometroDeLaTierra/Art/Objects/KenneyTinyFarm/Tiles/tile_0004.png")
            ?? plots.Select(p => p.sproutSprite).FirstOrDefault(s => s != null);
        data.youngTreeSprite = LoadSprite("Assets/EXTERNAL_ASSETS/TermometroDeLaTierra/Art/Objects/KenneyTinyFarm/Tiles/tile_0029.png")
            ?? plots.Select(p => p.youngTreeSprite).FirstOrDefault(s => s != null);
        data.matureTreeSprite = plots.Select(p => p.treeSprite).FirstOrDefault(s => s != null);
        data.ecologicalRole = "Aporta cobertura, conecta hábitats y ayuda a proteger el suelo de la ladera.";
        EditorUtility.SetDirty(data);
        foreach (ForestPlot plot in plots)
        {
            plot.plantData = data;
            MarkDirty(plot);
        }
        Save(scene);
    }

    private static void AssignFarm()
    {
        Scene scene = Open("FincaDelFuturo");
        FarmPlot[] plots = Find<FarmPlot>();
        Sprite[] sprites = plots.Select(p => p.cropSprites).FirstOrDefault(array => array != null && array.Length >= 3);
        string[] names = { "Grano", "Leguminosa", "Cobertura" };
        string[] files = { "Grain", "Legume", "CoverCrop" };
        string[] benefits =
        {
            "Aporta alimento y ayuda a planificar la cosecha.",
            "Diversifica el cultivo y favorece la rotación del suelo.",
            "Mantiene cobertura vegetal entre cosechas."
        };
        CropData[] data = new CropData[names.Length];
        for (int crop = 0; crop < names.Length; crop++)
        {
            data[crop] = GetOrCreate<CropData>("CROPS/Crop" + files[crop] + ".asset");
            data[crop].cropIndex = crop;
            data[crop].displayName = names[crop];
            data[crop].baseYield = crop == 0 ? 1 : 2;
            data[crop].sprite = sprites != null ? sprites[crop] : null;
            data[crop].soilBenefit = benefits[crop];
            EditorUtility.SetDirty(data[crop]);
        }
        foreach (FarmPlot plot in plots)
        {
            plot.cropData = data;
            MarkDirty(plot);
        }
        Save(scene);
    }

    private static string RecoveryHint(int material)
    {
        switch (material)
        {
            case 0: return "Mantener limpio el plástico permite incorporarlo de nuevo a productos útiles.";
            case 1: return "El papel seco conserva su fibra para fabricar nuevos productos.";
            case 2: return "El vidrio separado puede fundirse y utilizarse nuevamente.";
            case 3: return "Separar el metal facilita recuperar y transformar sus componentes.";
            default: return "El cartón limpio y seco vuelve como materia prima para nuevos empaques.";
        }
    }

    private static SpriteRenderer FindVisual(GameObject target, SpriteRenderer preferred)
    {
        SpriteRenderer[] renderers = target.GetComponentsInChildren<SpriteRenderer>(true);
        return renderers.FirstOrDefault(r => r != preferred && r.sprite != null)
            ?? renderers.FirstOrDefault(r => r.sprite != null);
    }

    private static Sprite LoadSprite(string assetPath)
    {
        return AssetDatabase.LoadAllAssetsAtPath(assetPath).OfType<Sprite>().FirstOrDefault();
    }

    private static T[] Find<T>() where T : Component
    {
        return UnityEngine.Object.FindObjectsByType<T>(FindObjectsInactive.Include, FindObjectsSortMode.None);
    }

    private static Scene Open(string sceneName)
    {
        return EditorSceneManager.OpenScene("Assets/GAME/SCENES/" + sceneName + ".unity", OpenSceneMode.Single);
    }

    private static void Save(Scene scene)
    {
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene);
    }

    private static void MarkDirty(UnityEngine.Object target)
    {
        EditorUtility.SetDirty(target);
        if (target is Component component && PrefabUtility.IsPartOfPrefabInstance(component))
            PrefabUtility.RecordPrefabInstancePropertyModifications(component);
    }

    private static T GetOrCreate<T>(string relativePath) where T : ScriptableObject
    {
        string path = Root + "/" + relativePath;
        T asset = AssetDatabase.LoadAssetAtPath<T>(path);
        if (asset != null) return asset;
        asset = ScriptableObject.CreateInstance<T>();
        AssetDatabase.CreateAsset(asset, path);
        return asset;
    }

    private static void EnsureFolder(string name)
    {
        string path = Root + "/" + name;
        if (!AssetDatabase.IsValidFolder(path)) AssetDatabase.CreateFolder(Root, name);
    }
}
#endif
