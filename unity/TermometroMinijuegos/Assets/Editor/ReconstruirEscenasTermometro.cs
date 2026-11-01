using System.IO;
using UnityEditor;
using UnityEditor.Events;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using System.Text;

/// <summary>
/// Authors the six editable scenes, sprites, and prefabs in the Unity project.
/// All scene geometry and gameplay props are saved assets; runtime scripts only respond to them.
/// </summary>
public static class ReconstruirEscenasTermometro
{
    private const string CustomArt = "Assets/Art/WorldSprites";
    private const string BackgroundArt = "Assets/Art/Backgrounds/Termometro";
    private const string SceneFolder = "Assets/Scenes";
    private const string PrefabFolder = "Assets/Prefabs";
    private static readonly string[] SceneNames =
    {
        "Menu", "EnergiaViva", "FabricaCircular", "RutasQueRespiran", "BosqueGuardian", "FincaDelFuturo"
    };
    private static readonly string[] WorldNames = { "Energia", "Fabrica", "Transporte", "Bosque", "Agricultura" };
    private static Font uiFont;
    private static Sprite worldTreePrefabSprite;
    private static Sprite factoryMaterialPrefabSprite;
    private static Sprite factoryContainerPrefabSprite;

    [MenuItem("Termómetro/Rehacer escenas construidas")]
    public static void RebuildAllScenes()
    {
        EnsureFolders();
        EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        RenameExistingScenes();
        BakeOriginalSprites();
        AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
        ConfigureArtImporters();
        AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
        LoadAuthoringAssets();
        CreateReusablePrefabs();
        CreateMenuScene();
        CreateEnergyScene();
        CreateFactoryScene();
        CreateTransportScene();
        CreateForestScene();
        CreateFarmScene();
        ConfigureBuildScenes();
        WriteArtCredits();
        AssetDatabase.SaveAssets();
        EditorSceneManager.OpenScene(SceneFolder + "/Menu.unity", OpenSceneMode.Single);
        Debug.Log("Termómetro de la Tierra: menú y cinco escenas interactivas guardadas con sus objetos en Hierarchy.");
    }

    [MenuItem("Termómetro/Validar escenas y componentes")]
    public static void ValidateAuthoredScenes()
    {
        var report = new StringBuilder();
        foreach (string name in SceneNames)
        {
            Scene scene = EditorSceneManager.OpenScene(SceneFolder + "/" + name + ".unity", OpenSceneMode.Single);
            GameObject[] roots = scene.GetRootGameObjects();
            int objects = 0, sprites = 0, colliders = 0, sources = 0, clipsAssigned = 0, missing = 0;
            bool hasCamera = false, hasAudioManager = false, hasGameplay = false;
            foreach (var root in roots)
            {
                Transform[] transforms = root.GetComponentsInChildren<Transform>(true);
                objects += transforms.Length;
                sprites += root.GetComponentsInChildren<SpriteRenderer>(true).Length;
                colliders += root.GetComponentsInChildren<Collider2D>(true).Length;
                var audioSources = root.GetComponentsInChildren<AudioSource>(true);
                sources += audioSources.Length;
                foreach (var audioSource in audioSources) if (audioSource.clip != null) clipsAssigned++;
                if (root.GetComponentInChildren<Camera>(true) != null) hasCamera = true;
                if (root.name == "AudioManager" && root.GetComponent<TierraAudio>() != null) hasAudioManager = true;
                if (root.GetComponentInChildren<TermometroMinijuegos>(true) != null ||
                    root.GetComponentInChildren<FabricaCircularController>(true) != null) hasGameplay = true;
                foreach (var behaviour in root.GetComponentsInChildren<MonoBehaviour>(true)) if (behaviour == null) missing++;
            }

            bool isMenu = name == "Menu";
            int minimumSprites = isMenu ? 3 : 10;
            if (!hasCamera || !hasAudioManager || !hasGameplay || sprites < minimumSprites || missing > 0 || (!isMenu && colliders == 0))
                throw new System.Exception("Validación fallida en " + name + ": cámara=" + hasCamera + ", audio=" + hasAudioManager +
                    ", gameplay=" + hasGameplay + ", sprites=" + sprites + ", colliders=" + colliders + ", scripts ausentes=" + missing);
            if (name == "FabricaCircular")
            {
                var factory = Object.FindAnyObjectByType<FabricaCircularController>();
                if (factory == null || factory.materiales.Length != 4 || factory.contenedores.Length != 4 ||
                    factory.instrucciones == null || factory.indicadorRecursos == null || factory.objetivo == null ||
                    factory.maquina == null || factory.productoRecuperado == null)
                    throw new System.Exception("La escena FabricaCircular tiene referencias incompletas en el Inspector.");
            }
            report.AppendLine(name + ": " + objects + " objetos · " + sprites + " SpriteRenderer · " + colliders +
                " Collider2D · " + sources + " AudioSource (" + clipsAssigned + " con clip) · Hierarchy: " +
                string.Join(", ", System.Array.ConvertAll(roots, item => item.name)));
        }
        Debug.Log("Validación de escenas completada.\n" + report);
    }

    private static void EnsureFolders()
    {
        string[] folders =
        {
            CustomArt, BackgroundArt, "Assets/Art/Sprites", "Assets/Prefabs/Environment", "Assets/Prefabs/Fabrica",
            "Assets/Audio/Music", "Assets/Audio/Ambience", "Assets/Scripts/Core", "Assets/Scripts/Fabrica",
            "Assets/Scripts/Energia", "Assets/Scripts/Transporte", "Assets/Scripts/Bosques", "Assets/Scripts/Agricultura",
            SceneFolder
        };
        foreach (string folder in folders) Directory.CreateDirectory(folder);
        Directory.CreateDirectory(Path.Combine(Application.dataPath, "Art/ThirdParty"));
        AssetDatabase.Refresh();
    }

    private static void RenameExistingScenes()
    {
        string[] previous = { "Inicio", "Energia", "Industria", "Movilidad", "Bosques", "Agricultura" };
        for (int i = 0; i < previous.Length; i++)
        {
            string oldPath = SceneFolder + "/" + previous[i] + ".unity";
            string newPath = SceneFolder + "/" + SceneNames[i] + ".unity";
            if (File.Exists(oldPath) && !File.Exists(newPath))
            {
                string error = AssetDatabase.MoveAsset(oldPath, newPath);
                if (!string.IsNullOrEmpty(error)) Debug.LogWarning("No se pudo renombrar " + oldPath + ": " + error);
            }
        }
    }

    private static void BakeOriginalSprites()
    {
        string[] backgroundNames = { "Energia", "Fabrica", "Transporte", "Bosque", "Agricultura" };
        for (int i = 0; i < backgroundNames.Length; i++)
            SaveRuntimeSprite(TierraArt.Fondo(i), BackgroundArt + "/" + backgroundNames[i] + ".png");
        SaveRuntimeSprite(TierraArt.Mascota, CustomArt + "/Terra.png");
        for (int i = 0; i < 6; i++) SaveRuntimeSprite(TierraArt.IconoFuente(i), CustomArt + "/Fuente_" + i + ".png");
        for (int i = 0; i < 4; i++)
        {
            SaveRuntimeSprite(TierraArt.IconoViaje(i), CustomArt + "/Viaje_" + i + ".png");
            SaveRuntimeSprite(TierraArt.IconoResiduo(i), CustomArt + "/Residuo_" + i + ".png");
        }
        for (int i = 0; i <= 5; i++) SaveRuntimeSprite(TierraArt.IconoBosque(i, false), CustomArt + "/Bosque_" + i + ".png");
        for (int tipo = 0; tipo < 3; tipo++)
            for (int etapa = 1; etapa <= 3; etapa++)
                SaveRuntimeSprite(TierraArt.IconoCultivo(tipo, etapa, false, false), CustomArt + "/Cultivo_" + tipo + "_" + etapa + ".png");
        for (int i = 0; i < 5; i++) SaveRuntimeSprite(TierraArt.Icono(i), CustomArt + "/Insignia_" + i + ".png");
    }

    private static void SaveRuntimeSprite(Sprite sprite, string assetPath)
    {
        if (sprite == null || sprite.texture == null) return;
        byte[] png = sprite.texture.EncodeToPNG();
        string fullPath = Path.GetFullPath(assetPath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath));
        File.WriteAllBytes(fullPath, png);
        AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceSynchronousImport);
    }

    private static void ConfigureArtImporters()
    {
        string[] guids = AssetDatabase.FindAssets("t:Texture2D", new[] { "Assets/Art" });
        foreach (string guid in guids)
        {
            string path = AssetDatabase.GUIDToAssetPath(guid);
            var importer = AssetImporter.GetAtPath(path) as TextureImporter;
            if (importer == null) continue;
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.alphaIsTransparency = true;
            importer.mipmapEnabled = false;
            importer.filterMode = FilterMode.Point;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.spritePixelsPerUnit = path.StartsWith(BackgroundArt) ? 100 : 64;
            importer.SaveAndReimport();
        }
    }

    private static void LoadAuthoringAssets()
    {
        uiFont = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        worldTreePrefabSprite = SpriteAt("Assets/Art/Objects/KenneyFoliage/foliagePack_005.png");
        factoryMaterialPrefabSprite = SpriteAt(CustomArt + "/Residuo_0.png");
        factoryContainerPrefabSprite = SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_blue.png");
    }

    private static void CreateReusablePrefabs()
    {
        CreatePrefab("Assets/Prefabs/Environment/ArbolInteractivo.prefab", "ArbolInteractivo", worldTreePrefabSprite,
            typeof(ObjetoMundoInteractivo), new Vector2(.6f, .95f));
        CreatePrefab("Assets/Prefabs/Fabrica/MaterialReciclable.prefab", "MaterialReciclable", factoryMaterialPrefabSprite,
            typeof(FabricaElemento), new Vector2(.78f, .92f));
        CreatePrefab("Assets/Prefabs/Fabrica/ContenedorCircular.prefab", "ContenedorCircular", factoryContainerPrefabSprite,
            typeof(FabricaElemento), new Vector2(1.2f, 1.0f));
    }

    private static void CreatePrefab(string path, string name, Sprite sprite, System.Type extraComponent, Vector2 colliderSize)
    {
        var template = new GameObject(name);
        var renderer = template.AddComponent<SpriteRenderer>();
        renderer.sprite = sprite;
        template.AddComponent<BoxCollider2D>().size = colliderSize;
        template.AddComponent(extraComponent);
        PrefabUtility.SaveAsPrefabAsset(template, path);
        Object.DestroyImmediate(template);
    }

    private static void CreateMenuScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var camera = CreateCamera();
        AddBackdrop("Paisaje de bienvenida", SpriteAt(BackgroundArt + "/Energia.png"));
        AddSprite(null, "Terra · guía del atlas", new Vector2(-4.5f, -.15f), new Vector2(2.15f, 2.15f), SpriteAt(CustomArt + "/Terra.png"), 2);
        AddSprite(null, "Mapa de energía · escena del menú", new Vector2(-1.8f, -2.8f), new Vector2(2.3f, 1.25f), SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/terrain_grass_horizontal_middle.png"), 3);
        var audio = CreateAudioManager();
        var host = new GameObject("GameManager");
        host.AddComponent<TermometroMinijuegos>().sector = -1;
        AddEventSystem();
        SaveScene(scene, SceneNames[0]);
    }

    private static void CreateEnergyScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        CreateCamera();
        AddBackdrop("FondoEnergia", SpriteAt(BackgroundArt + "/Energia.png"));
        CreateOutdoorGround("Terreno");
        var controller = CreateWorldManager(0, "Toca una fuente para explorarla; conecta sectores desde el panel del reto.");
        var districts = NewGroup("Edificios");
        string[] districtNames = { "Hogares", "Escuela", "Clínica" };
        Sprite[] districtSprites =
        {
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_yellow.png"),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_blue.png"),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_green.png")
        };
        for (int i = 0; i < districtNames.Length; i++)
        {
            var building = AddInteractiveSprite(districts.transform, "Edificio · " + districtNames[i],
                new Vector2(-6.25f + i * 2.0f, 1.55f), new Vector2(1.1f, 1.1f), districtSprites[i], controller,
                new[] { districtNames[i] + " · necesita energía", districtNames[i] + " · conectado a la red" },
                new[] { districtSprites[i], districtSprites[i] }, 4);
            AddWorldLabel(building.transform, districtNames[i].ToUpperInvariant(), new Vector3(0, -.7f, 0));
        }

        var sources = NewGroup("FuentesEnergeticas");
        Sprite[] sourceIcons = new Sprite[6];
        for (int i = 0; i < sourceIcons.Length; i++) sourceIcons[i] = SpriteAt(CustomArt + "/Fuente_" + i + ".png");
        string[] sourceLabels = { "Panel solar", "Aerogenerador", "Central hidráulica", "Batería", "Planta de gas", "Central de carbón" };
        string[] sourceGroups = { "PanelesSolares", "Aerogeneradores", "Hidraulica", "Baterias" };
        for (int i = 0; i < 4; i++)
        {
            var sourceGroup = NewGroup(sourceGroups[i], sources.transform);
            string label = sourceLabels[i];
            var prop = AddInteractiveSprite(sourceGroup.transform, label, new Vector2(-6.2f + i * 1.75f, -.95f),
                new Vector2(1.15f, 1.15f), sourceIcons[i], controller, new[] { label + " · listo", label + " · en la red" },
                new[] { sourceIcons[i], sourceIcons[i] }, 5);
            AddWorldLabel(prop.transform, label.ToUpperInvariant(), new Vector3(0, -.84f, 0));
        }
        var links = NewGroup("ConexionesElectricas");
        for (int i = 0; i < 3; i++)
            AddSprite(links.transform, "Cable de distribución " + (i + 1), new Vector2(-5.1f + i * 2.0f, .28f),
                new Vector2(1.45f, .06f), SpriteAt(CustomArt + "/Fuente_" + (i + 1) + ".png"), 3, new Color(.5f, .82f, .65f, .75f));
        var audio = CreateAudioManager();
        CreateWorldStatus("Interfaz", "Ciudad: fuentes renovables, red y demanda", controller, audio);
        AddEventSystem();
        SaveScene(scene, SceneNames[1]);
    }

    private static void CreateFactoryScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        CreateCamera();
        var root = new GameObject("FabricaCircular");
        var scenario = NewGroup("Escenario", root.transform);
        AddBackdrop("FondoFabrica", SpriteAt(BackgroundArt + "/Fabrica.png"), scenario.transform);

        var floor = NewGroup("Suelo", scenario.transform);
        Sprite floorTile = SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_051.png");
        for (int i = 0; i < 16; i++)
            AddSprite(floor.transform, "Loseta metálica " + (i + 1).ToString("00"), new Vector2(-7.5f + i, -4.12f),
                new Vector2(1.02f, .65f), floorTile, -4);
        var floorCollider = floor.AddComponent<BoxCollider2D>();
        floorCollider.offset = new Vector2(0, -.05f);
        floorCollider.size = new Vector2(16, .35f);

        var structure = NewGroup("EstructuraIndustrial", scenario.transform);
        Sprite wallPanel = SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_045.png");
        for (int i = 0; i < 5; i++)
            AddSprite(structure.transform, "Panel industrial " + (i + 1), new Vector2(-7.1f + i * 1.45f, 3.08f),
                new Vector2(1.12f, 1.12f), wallPanel, -20, new Color32(106, 128, 125, 255));
        Sprite warning = SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_081.png");
        AddSprite(structure.transform, "Señal de seguridad", new Vector2(-6.8f, 2.08f), new Vector2(.72f, .72f), warning, 1);
        AddSprite(structure.transform, "Ventana de control", new Vector2(-5.35f, 2.08f), new Vector2(.88f, .72f), wallPanel, 1);

        var belt = NewGroup("BandaTransportadora", scenario.transform);
        Sprite conveyorTile = SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/conveyor.png");
        for (int i = 0; i < 10; i++)
            AddSprite(belt.transform, "Tramo de banda " + (i + 1).ToString("00"), new Vector2(-5.3f + i * 1.03f, .64f),
                new Vector2(1.08f, .72f), conveyorTile, 3);
        AddSprite(belt.transform, "Soporte de banda", new Vector2(-.65f, .13f), new Vector2(9.45f, .18f),
            SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_049.png"), 2);

        var machineGroup = NewGroup("Maquinas", scenario.transform);
        var machineHousing = AddSprite(machineGroup.transform, "Carcasa de la prensa", new Vector2(5.75f, .73f),
            new Vector2(1.82f, 1.82f), SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_045.png"), 4);
        var machine = AddSprite(machineGroup.transform, "Prensa circular", new Vector2(5.75f, .83f), new Vector2(1.27f, 1.27f),
            SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_067.png"), 5, Color.white, true);
        AddWorldLabel(machine.transform, "PRENSA", new Vector3(0, -.95f, 0));
        var beacon = AddSprite(machineGroup.transform, "Indicador de máquina", new Vector2(5.75f, 1.95f), new Vector2(.38f, .38f),
            SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_053.png"), 6);

        var managerObject = new GameObject("GameManager");
        managerObject.transform.SetParent(root.transform, false);
        var controller = managerObject.AddComponent<FabricaCircularController>();
        var pressElement = machine.AddComponent<FabricaElemento>();
        pressElement.Configurar(controller, FabricaElementoTipo.Maquina, 0, "Prensa circular");

        var materialsGroup = NewGroup("Materiales", scenario.transform);
        string[] materialNames = { "Plástico", "Papel", "Vidrio", "Metal" };
        string[] materialLabels = { "PLÁSTICO", "PAPEL", "VIDRIO", "METAL" };
        Sprite[] waste = new Sprite[4];
        var materialInstances = new FabricaElemento[4];
        for (int i = 0; i < 4; i++)
        {
            waste[i] = SpriteAt(CustomArt + "/Residuo_" + i + ".png");
            GameObject piece = InstantiatePrefab("Assets/Prefabs/Fabrica/MaterialReciclable.prefab", materialsGroup.transform,
                materialNames[i], new Vector2(-5.0f + i * 2.13f, 1.38f), new Vector2(.78f, .93f));
            piece.GetComponent<SpriteRenderer>().sprite = waste[i];
            AddWorldLabel(piece.transform, materialLabels[i], new Vector3(0, -.82f, 0));
            var item = piece.GetComponent<FabricaElemento>();
            item.Configurar(controller, FabricaElementoTipo.Material, i, materialNames[i]);
            materialInstances[i] = item;
        }

        var binsGroup = NewGroup("Contenedores", scenario.transform);
        Sprite[] binSprites =
        {
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_blue.png"),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_yellow.png"),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_green.png"),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_red.png")
        };
        Color[] binColors = { new Color32(133, 202, 213, 255), new Color32(242, 205, 112, 255),
            new Color32(130, 190, 131, 255), new Color32(176, 187, 183, 255) };
        var binInstances = new FabricaElemento[4];
        for (int i = 0; i < 4; i++)
        {
            GameObject bin = InstantiatePrefab("Assets/Prefabs/Fabrica/ContenedorCircular.prefab", binsGroup.transform,
                "Contenedor · " + materialNames[i], new Vector2(-5.3f + i * 3.4f, -2.15f), new Vector2(1.32f, 1.15f));
            var binRenderer = bin.GetComponent<SpriteRenderer>();
            binRenderer.sprite = binSprites[i];
            binRenderer.color = binColors[i];
            var item = bin.GetComponent<FabricaElemento>();
            item.Configurar(controller, FabricaElementoTipo.Contenedor, i, materialNames[i]);
            AddWorldLabel(bin.transform, materialLabels[i], new Vector3(0, -.78f, 0));
            binInstances[i] = item;
        }

        var productsGroup = NewGroup("ProductosRecuperados", scenario.transform);
        var recovered = AddSprite(productsGroup.transform, "Lote transformado", new Vector2(5.7f, -1.72f), new Vector2(1.25f, 1.08f),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_green.png"), 5);
        recovered.GetComponent<SpriteRenderer>().color = new Color32(133, 202, 137, 255);
        AddSprite(recovered.transform, "Pieza reutilizada", Vector2.zero, new Vector2(.58f, .58f), waste[3], 1);
        AddWorldLabel(recovered.transform, "PIEZAS NUEVAS", new Vector3(0, -.7f, 0));
        var recoveredElement = recovered.AddComponent<FabricaElemento>();
        recoveredElement.Configurar(controller, FabricaElementoTipo.Producto, 0, "Piezas reutilizadas");

        CreateFactoryInterface(root.transform, controller);
        var audio = CreateAudioManager();
        controller.efectos = audio.effects;
        controller.seleccionClip = audio.select;
        controller.aciertoClip = audio.good;
        controller.avisoClip = audio.warning;
        controller.materiales = materialInstances;
        controller.contenedores = binInstances;
        controller.maquina = pressElement;
        controller.productoRecuperado = recovered.gameObject;
        controller.indicadorMaquina = beacon.GetComponent<SpriteRenderer>();
        AddEventSystem();
        SaveScene(scene, SceneNames[2]);
    }

    private static void CreateFactoryInterface(Transform root, FabricaCircularController controller)
    {
        var canvasObject = new GameObject("Interfaz", typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        canvasObject.transform.SetParent(root, false);
        var canvas = canvasObject.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 20;
        var scaler = canvasObject.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        scaler.matchWidthOrHeight = .5f;

        UiPanel(canvasObject.transform, "PanelTítulo", new Vector2(.5f, .965f), new Vector2(1000, 55), new Color32(24, 67, 56, 242));
        UiText(canvasObject.transform, "NombreMundo", "FÁBRICA CIRCULAR  ·  CENTRO DE RECUPERACIÓN", 22, Color.white,
            TextAnchor.MiddleCenter, new Vector2(.46f, .965f), new Vector2(760, 44), FontStyle.Bold);

        UiPanel(canvasObject.transform, "PanelInstrucciones", new Vector2(.40f, .86f), new Vector2(860, 62), new Color32(250, 247, 237, 242));
        controller.instrucciones = UiText(canvasObject.transform, "TextoInstrucciones", "", 15,
            new Color32(32, 67, 57, 255), TextAnchor.MiddleCenter, new Vector2(.40f, .86f), new Vector2(820, 54), FontStyle.Normal);

        UiPanel(canvasObject.transform, "PanelIndicadorRecursos", new Vector2(.82f, .79f), new Vector2(365, 44), new Color32(249, 238, 202, 245));
        controller.indicadorRecursos = UiText(canvasObject.transform, "IndicadorRecursos", "", 14,
            new Color32(55, 75, 52, 255), TextAnchor.MiddleCenter, new Vector2(.82f, .79f), new Vector2(345, 36), FontStyle.Bold);

        UiPanel(canvasObject.transform, "PanelObjetivo", new Vector2(.5f, .075f), new Vector2(820, 40), new Color32(24, 67, 56, 236));
        controller.objetivo = UiText(canvasObject.transform, "Objetivo", "", 13, Color.white,
            TextAnchor.MiddleCenter, new Vector2(.5f, .075f), new Vector2(790, 34), FontStyle.Bold);

        controller.estado = UiText(canvasObject.transform, "Estado", "", 15, new Color32(29, 71, 55, 255),
            TextAnchor.MiddleLeft, new Vector2(.22f, .76f), new Vector2(560, 42), FontStyle.Bold);

        var back = new GameObject("BotonVolverAlMapa", typeof(RectTransform), typeof(Image), typeof(Button));
        back.transform.SetParent(canvasObject.transform, false);
        PlaceUi(back.GetComponent<RectTransform>(), new Vector2(.90f, .965f), new Vector2(165, 42));
        var backImage = back.GetComponent<Image>();
        backImage.color = new Color32(238, 231, 207, 255);
        var button = back.GetComponent<Button>();
        button.targetGraphic = backImage;
        var returner = back.AddComponent<VolverAlMapa>();
        UnityEventTools.AddPersistentListener(button.onClick, returner.Regresar);
        UiText(back.transform, "TextoBoton", "←  MAPA", 13, new Color32(24, 67, 56, 255),
            TextAnchor.MiddleCenter, new Vector2(.5f, .5f), new Vector2(155, 38), FontStyle.Bold);
    }

    private static void CreateTransportScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        CreateCamera();
        AddBackdrop("FondoUrbano", SpriteAt(BackgroundArt + "/Transporte.png"));
        var streets = NewGroup("Calles");
        AddSprite(streets.transform, "Calzada y cruces", new Vector2(-4.4f, -2.65f), new Vector2(7.0f, .18f),
            SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_049.png"), 1);
        AddSprite(streets.transform, "Ciclorruta", new Vector2(-4.4f, -3.18f), new Vector2(7.0f, .12f),
            SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_010.png"), 1, new Color32(69, 160, 106, 255));
        CreateOutdoorGround("Aceras");

        var destinations = NewGroup("Destinos");
        string[] destinationNames = { "Escuela", "Mercado", "Salud" };
        for (int i = 0; i < destinationNames.Length; i++)
            AddSprite(destinations.transform, "Destino · " + destinationNames[i], new Vector2(-6.5f + i * 2.2f, 1.85f),
                new Vector2(.9f, .9f), SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/sign_exit.png"), 4);

        var stops = NewGroup("ParadasDeAutobus");
        AddSprite(stops.transform, "Parada del barrio", new Vector2(-6.4f, .2f), new Vector2(.75f, 1.0f),
            SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_039.png"), 4);
        var vehicles = NewGroup("Vehiculos");
        var controller = CreateWorldManager(2, "Elige un vehículo; los seis viajes y sus criterios siguen en el panel del reto.");
        Sprite[] travel = new Sprite[4];
        for (int i = 0; i < travel.Length; i++) travel[i] = SpriteAt(CustomArt + "/Viaje_" + i + ".png");
        string[] travelNames = { "Autobús", "Bicicleta", "A pie", "Viaje compartido" };
        for (int i = 0; i < travelNames.Length; i++)
        {
            var vehicle = AddInteractiveSprite(vehicles.transform, travelNames[i], new Vector2(-6.25f + i * 1.72f, -.85f),
                new Vector2(1.18f, .9f), travel[i], controller,
                new[] { travelNames[i] + " · disponible", travelNames[i] + " · elegido para la ruta" },
                new[] { travel[i], travel[(i + 1) % travel.Length] }, 5);
            AddWorldLabel(vehicle.transform, travelNames[i].ToUpperInvariant(), new Vector3(0, -.75f, 0));
        }
        var passengers = NewGroup("Personajes");
        AddSprite(passengers.transform, "Viajera · Lina", new Vector2(-6.3f, -1.95f), new Vector2(.65f, .85f),
            SpriteAt("Assets/Art/Characters/KenneyPlatformer/character_green_idle.png"), 6);
        AddSprite(passengers.transform, "Viajero · Mateo", new Vector2(-5.35f, -1.98f), new Vector2(.65f, .85f),
            SpriteAt("Assets/Art/Characters/KenneyPlatformer/character_beige_idle.png"), 6);
        var audio = CreateAudioManager();
        CreateWorldStatus("Interfaz", "Rutas urbanas: distancia, accesibilidad y transporte", controller, audio);
        AddEventSystem();
        SaveScene(scene, SceneNames[3]);
    }

    private static void CreateForestScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        CreateCamera();
        AddBackdrop("FondoBosque", SpriteAt(BackgroundArt + "/Bosque.png"));
        CreateOutdoorGround("Suelo");
        var forest = NewGroup("Vegetacion") ;
        string[] treeAssets = { "foliagePack_005.png", "foliagePack_008.png", "foliagePack_030.png", "foliagePack_036.png" };
        var controller = CreateWorldManager(3, "Toca una parcela para sembrar; la estación y el agua se administran en el panel del reto.");
        for (int i = 0; i < treeAssets.Length; i++)
        {
            Sprite treeSprite = SpriteAt("Assets/Art/Objects/KenneyFoliage/" + treeAssets[i]);
            GameObject tree = InstantiatePrefab("Assets/Prefabs/Environment/ArbolInteractivo.prefab", forest.transform,
                "Árbol nativo " + (i + 1), new Vector2(-7.35f + i * 1.72f, .75f + (i % 2) * .22f), new Vector2(1.25f, 1.72f));
            tree.GetComponent<SpriteRenderer>().sprite = treeSprite;
            var clickable = tree.GetComponent<ObjetoMundoInteractivo>();
            clickable.Configurar(controller, "Árbol del bosque", new[] { "conservado", "protegido como refugio" },
                new[] { treeSprite, treeSprite }, tree.GetComponent<SpriteRenderer>());
        }

        var plots = NewGroup("ParcelasDePlantacion");
        Sprite[] states =
        {
            SpriteAt(CustomArt + "/Bosque_0.png"), SpriteAt(CustomArt + "/Bosque_3.png"),
            SpriteAt(CustomArt + "/Bosque_4.png"), SpriteAt(CustomArt + "/Bosque_1.png")
        };
        for (int i = 0; i < 8; i++)
        {
            var plot = AddInteractiveSprite(plots.transform, "Parcela " + (i + 1).ToString("00"),
                new Vector2(-6.85f + (i % 4) * 1.62f, -2.28f - (i / 4) * .72f), new Vector2(.92f, .78f), states[0], controller,
                new[] { "claro disponible", "semilla plantada", "brote regado", "árbol joven" }, states, 8);
            AddWorldLabel(plot.transform, "CLARO " + (i + 1), new Vector3(0, -.58f, 0));
        }
        var groundCover = NewGroup("FloraDelSuelo");
        for (int i = 0; i < 5; i++)
            AddSprite(groundCover.transform, "Flor y hierba " + (i + 1), new Vector2(-6.6f + i * 1.48f, -1.45f),
                new Vector2(.52f, .62f), SpriteAt("Assets/Art/Objects/KenneyFoliage/foliagePack_001.png"), 7);
        var audio = CreateAudioManager();
        CreateWorldStatus("Interfaz", "Bosque por estaciones: claros, semillas, brotes y refugios", controller, audio);
        AddEventSystem();
        SaveScene(scene, SceneNames[4]);
    }

    private static void CreateFarmScene()
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        CreateCamera();
        AddBackdrop("FondoFinca", SpriteAt(BackgroundArt + "/Agricultura.png"));
        CreateOutdoorGround("Terreno");
        var buildings = NewGroup("ConstruccionesRurales");
        AddSprite(buildings.transform, "Bodega de herramientas", new Vector2(-6.2f, 1.2f), new Vector2(1.25f, 1.1f),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/block_red.png"), 4);
        AddWorldLabel(buildings.transform.GetChild(0), "BODEGA", new Vector3(0, -.72f, 0));

        var cropFields = NewGroup("ParcelasAgricolas");
        var controller = CreateWorldManager(4, "Toca una parcela para recorrer sus cultivos; gestiona compost y riego en el panel.");
        for (int i = 0; i < 6; i++)
        {
            int tipo = i % 3;
            Sprite[] cropStates =
            {
                SpriteAt(CustomArt + "/Cultivo_" + tipo + "_1.png"),
                SpriteAt(CustomArt + "/Cultivo_" + tipo + "_2.png"),
                SpriteAt(CustomArt + "/Cultivo_" + tipo + "_3.png")
            };
            var crop = AddInteractiveSprite(cropFields.transform, "Parcela " + (i + 1),
                new Vector2(-6.55f + (i % 3) * 1.82f, -.7f - (i / 3) * 1.55f), new Vector2(1.0f, .93f), cropStates[0], controller,
                new[] { "cultivo recién plantado", "cultivo en crecimiento", "cosecha lista" }, cropStates, 7);
            AddWorldLabel(crop.transform, "SURCO " + (i + 1), new Vector3(0, -.72f, 0));
        }
        var resources = NewGroup("RecursosDeAgua");
        var water = AddInteractiveSprite(resources.transform, "Canal de riego", new Vector2(-7.15f, -.35f), new Vector2(.78f, 1.2f),
            SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/water_top.png"), controller,
            new[] { "canal disponible", "agua distribuida" },
            new[] { SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/water_top.png"), SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/water.png") }, 6);
        AddWorldLabel(water.transform, "AGUA", new Vector3(.45f, -.58f, 0));
        var irrigation = NewGroup("SistemaDeRiego");
        AddSprite(irrigation.transform, "Tubería principal", new Vector2(-4.85f, -2.45f), new Vector2(4.8f, .16f),
            SpriteAt("Assets/Art/Objects/KenneyIndustrial/platformIndustrial_049.png"), 5, new Color32(87, 167, 195, 255));
        var trees = NewGroup("ArbolesFrutales");
        AddSprite(trees.transform, "Árbol de borde · verde", new Vector2(-1.2f, .6f), new Vector2(1.1f, 1.55f),
            SpriteAt("Assets/Art/Objects/KenneyFoliage/foliagePack_005.png"), 5);
        AddSprite(trees.transform, "Árbol de borde · otoño", new Vector2(-.25f, .55f), new Vector2(1.1f, 1.55f),
            SpriteAt("Assets/Art/Objects/KenneyFoliage/foliagePack_036.png"), 5);
        var audio = CreateAudioManager();
        CreateWorldStatus("Interfaz", "Finca: rotación de cultivos, suelo, agua y cosecha", controller, audio);
        AddEventSystem();
        SaveScene(scene, SceneNames[5]);
    }

    private static TierraSceneController CreateWorldManager(int sector, string initialText)
    {
        var host = new GameObject("GameManager");
        host.AddComponent<TermometroMinijuegos>().sector = sector;
        return host.AddComponent<TierraSceneController>();
    }

    private static void CreateWorldStatus(string canvasName, string label, TierraSceneController controller, AudioSetup audio)
    {
        var canvasObject = new GameObject(canvasName, typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
        var canvas = canvasObject.GetComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 10;
        var scaler = canvasObject.GetComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        var panel = UiPanel(canvasObject.transform, "PanelEstadoDeEscena", new Vector2(.25f, .84f), new Vector2(480, 40), new Color32(250, 247, 237, 224));
        panel.raycastTarget = false;
        Text status = UiText(canvasObject.transform, "EstadoDeEscena", label, 14, new Color32(24, 67, 56, 255),
            TextAnchor.MiddleCenter, new Vector2(.25f, .84f), new Vector2(460, 34), FontStyle.Bold);
        controller.Configurar(status, audio != null ? audio.effects : null, audio != null ? audio.select : null);
    }

    private static AudioSetup CreateAudioManager()
    {
        var go = new GameObject("AudioManager");
        var music = go.AddComponent<AudioSource>();
        music.playOnAwake = false;
        music.loop = true;
        music.spatialBlend = 0;
        var effects = go.AddComponent<AudioSource>();
        effects.playOnAwake = false;
        effects.spatialBlend = 0;
        effects.clip = AudioAt("Assets/Audio/SFX/Kenney/sfx_select.ogg");
        var audio = go.AddComponent<TierraAudio>();
        var serialized = new SerializedObject(audio);
        SetObject(serialized, "musica", music);
        SetObject(serialized, "efectos", effects);
        SetObject(serialized, "toqueClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_select.ogg"));
        SetObject(serialized, "plantarClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_magic.ogg"));
        SetObject(serialized, "regarClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_coin.ogg"));
        SetObject(serialized, "chispaClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_gem.ogg"));
        SetObject(serialized, "reciclarClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_disappear.ogg"));
        SetObject(serialized, "eficienciaClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_bump.ogg"));
        SetObject(serialized, "aciertoClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_gem.ogg"));
        SetObject(serialized, "avisoClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_hurt.ogg"));
        SetObject(serialized, "cosechaClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_coin.ogg"));
        SetObject(serialized, "aplausosClip", AudioAt("Assets/Resources/Audio/aplausos-publico.mp3"));
        SetObject(serialized, "abucheosClip", AudioAt("Assets/Resources/Audio/abucheo-publico.mp3"));
        SetObject(serialized, "neutralClip", AudioAt("Assets/Audio/SFX/Kenney/sfx_select.ogg"));
        serialized.ApplyModifiedPropertiesWithoutUndo();
        return new AudioSetup { effects = effects, select = AudioAt("Assets/Audio/SFX/Kenney/sfx_select.ogg"),
            good = AudioAt("Assets/Audio/SFX/Kenney/sfx_gem.ogg"), warning = AudioAt("Assets/Audio/SFX/Kenney/sfx_hurt.ogg") };
    }

    private sealed class AudioSetup
    {
        public AudioSource effects;
        public AudioClip select, good, warning;
    }

    private static GameObject CreateCamera()
    {
        var cameraObject = new GameObject("Main Camera", typeof(Camera), typeof(AudioListener));
        cameraObject.tag = "MainCamera";
        cameraObject.transform.position = new Vector3(0, 0, -10);
        var camera = cameraObject.GetComponent<Camera>();
        camera.orthographic = true;
        camera.orthographicSize = 4.5f;
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color32(178, 220, 222, 255);
        return cameraObject;
    }

    private static void AddEventSystem()
    {
        if (Object.FindAnyObjectByType<EventSystem>() != null) return;
        new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
    }

    private static void AddBackdrop(string name, Sprite sprite, Transform parent = null)
    {
        AddSprite(parent, name, Vector2.zero, new Vector2(16f, 9f), sprite, -100);
    }

    private static void CreateOutdoorGround(string name)
    {
        var ground = NewGroup(name);
        Sprite grass = SpriteAt("Assets/Art/Tilesets/KenneyPlatformer/terrain_grass_horizontal_middle.png");
        for (int i = 0; i < 16; i++)
            AddSprite(ground.transform, "Terrón de césped " + (i + 1).ToString("00"), new Vector2(-7.5f + i, -4.2f),
                new Vector2(1.03f, .47f), grass, -2);
    }

    private static GameObject NewGroup(string name, Transform parent = null)
    {
        var group = new GameObject(name);
        if (parent != null) group.transform.SetParent(parent, false);
        return group;
    }

    private static GameObject AddSprite(Transform parent, string name, Vector2 position, Vector2 size, Sprite sprite,
        int order, Color? color = null, bool collider = false)
    {
        var go = new GameObject(name, typeof(SpriteRenderer));
        if (parent != null) go.transform.SetParent(parent, false);
        go.transform.localPosition = position;
        var renderer = go.GetComponent<SpriteRenderer>();
        renderer.sprite = sprite;
        renderer.sortingOrder = order;
        if (color.HasValue) renderer.color = color.Value;
        FitSprite(go.transform, sprite, size);
        if (collider)
        {
            var box = go.AddComponent<BoxCollider2D>();
            box.size = new Vector2(.92f, .92f);
        }
        return go;
    }

    private static GameObject AddInteractiveSprite(Transform parent, string name, Vector2 position, Vector2 size, Sprite sprite,
        TierraSceneController controller, string[] messages, Sprite[] states, int order)
    {
        GameObject go = AddSprite(parent, name, position, size, sprite, order, null, true);
        var interactive = go.AddComponent<ObjetoMundoInteractivo>();
        interactive.Configurar(controller, name, messages, states, go.GetComponent<SpriteRenderer>());
        return go;
    }

    private static GameObject InstantiatePrefab(string path, Transform parent, string name, Vector2 position, Vector2 size)
    {
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
        var instance = PrefabUtility.InstantiatePrefab(prefab) as GameObject;
        instance.name = name;
        instance.transform.SetParent(parent, false);
        instance.transform.localPosition = position;
        var renderer = instance.GetComponent<SpriteRenderer>();
        FitSprite(instance.transform, renderer.sprite, size);
        return instance;
    }

    private static void FitSprite(Transform transform, Sprite sprite, Vector2 targetSize)
    {
        if (sprite == null) return;
        Vector2 original = sprite.bounds.size;
        if (original.x <= 0 || original.y <= 0) return;
        transform.localScale = new Vector3(targetSize.x / original.x, targetSize.y / original.y, 1f);
    }

    private static void AddWorldLabel(Transform parent, string label, Vector3 offset)
    {
        var labelObject = new GameObject("Etiqueta · " + label, typeof(TextMesh));
        labelObject.transform.SetParent(parent, false);
        labelObject.transform.localPosition = offset;
        var text = labelObject.GetComponent<TextMesh>();
        text.text = label;
        text.font = uiFont;
        text.fontSize = 42;
        text.characterSize = .055f;
        text.anchor = TextAnchor.MiddleCenter;
        text.alignment = TextAlignment.Center;
        text.color = new Color32(24, 67, 56, 255);
        var mesh = labelObject.GetComponent<MeshRenderer>();
        mesh.sortingOrder = 15;
    }

    private static Image UiPanel(Transform parent, string name, Vector2 anchor, Vector2 size, Color color)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Image));
        go.transform.SetParent(parent, false);
        PlaceUi(go.GetComponent<RectTransform>(), anchor, size);
        var image = go.GetComponent<Image>();
        image.color = color;
        image.raycastTarget = false;
        return image;
    }

    private static Text UiText(Transform parent, string name, string value, int fontSize, Color color,
        TextAnchor anchor, Vector2 position, Vector2 size, FontStyle style)
    {
        var go = new GameObject(name, typeof(RectTransform), typeof(Text));
        go.transform.SetParent(parent, false);
        PlaceUi(go.GetComponent<RectTransform>(), position, size);
        var text = go.GetComponent<Text>();
        text.text = value;
        text.font = uiFont;
        text.fontSize = fontSize;
        text.fontStyle = style;
        text.color = color;
        text.alignment = anchor;
        text.horizontalOverflow = HorizontalWrapMode.Wrap;
        text.verticalOverflow = VerticalWrapMode.Truncate;
        text.raycastTarget = false;
        return text;
    }

    private static void PlaceUi(RectTransform rect, Vector2 normalizedCenter, Vector2 size)
    {
        rect.anchorMin = rect.anchorMax = normalizedCenter;
        rect.pivot = new Vector2(.5f, .5f);
        rect.anchoredPosition = Vector2.zero;
        rect.sizeDelta = size;
    }

    private static void SaveScene(Scene scene, string name)
    {
        string path = SceneFolder + "/" + name + ".unity";
        EditorSceneManager.MarkSceneDirty(scene);
        EditorSceneManager.SaveScene(scene, path);
    }

    private static void ConfigureBuildScenes()
    {
        var scenes = new EditorBuildSettingsScene[SceneNames.Length];
        for (int i = 0; i < SceneNames.Length; i++) scenes[i] = new EditorBuildSettingsScene(SceneFolder + "/" + SceneNames[i] + ".unity", true);
        EditorBuildSettings.scenes = scenes;
    }

    private static void WriteArtCredits()
    {
        const string text = @"# Recursos gráficos y audio

**Kenney · New Platformer Pack (1.0)** — CC0 1.0. Usado en personajes, tiles de terreno y cinta transportadora.
Página del autor: https://kenney.nl/assets/new-platformer-pack
Licencia incluida junto a `Assets/Art/Characters/KenneyPlatformer`.

**Kenney · Platformer Pack Industrial** — CC0 1.0. Usado en losetas metálicas, señales, balizas y detalles de la fábrica.
Página del autor: https://kenney.nl/assets/platformer-pack-industrial
Licencia incluida junto a `Assets/Art/Objects/KenneyIndustrial`.

**Kenney · Foliage Pack** — CC0 1.0. Usado en el bosque y los bordes de la finca.
Página del autor: https://kenney.nl/assets/foliage-pack
Licencia incluida junto a `Assets/Art/Objects/KenneyFoliage`.

**Kenney · sonidos de New Platformer Pack** — CC0 1.0. Los clips OGG se asignan desde AudioManager en cada escena.

Las ilustraciones del mundo y los sprites de residuos fueron generados como assets PNG del proyecto por `TierraArt` y quedan guardados en `Assets/Art`; ya no se crean para dibujar los escenarios al iniciar una partida.
";
        File.WriteAllText("Assets/Art/RECURSOS-Y-LICENCIAS.md", text);
        AssetDatabase.ImportAsset("Assets/Art/RECURSOS-Y-LICENCIAS.md");
    }

    private static Sprite SpriteAt(string path) { return AssetDatabase.LoadAssetAtPath<Sprite>(path); }
    private static AudioClip AudioAt(string path) { return AssetDatabase.LoadAssetAtPath<AudioClip>(path); }
    private static void SetObject(SerializedObject target, string propertyName, Object value)
    {
        var property = target.FindProperty(propertyName);
        if (property != null) property.objectReferenceValue = value;
    }
}

[InitializeOnLoad]
public static class TierraPlayModeSmoke
{
    private const string RunningKey = "Tierra.PlaySmoke.Running";
    private const string IndexKey = "Tierra.PlaySmoke.Index";
    private const string StartKey = "Tierra.PlaySmoke.Start";
    private const string ErrorKey = "Tierra.PlaySmoke.Error";
    private static bool subscribed;
    private static readonly string[] Names =
        { "Menu", "EnergiaViva", "FabricaCircular", "RutasQueRespiran", "BosqueGuardian", "FincaDelFuturo" };

    static TierraPlayModeSmoke()
    {
        if (SessionState.GetBool(RunningKey, false)) Subscribe();
    }

    [MenuItem("Termómetro/Prueba Play Mode cinco mundos")]
    public static void RunAll()
    {
        SessionState.SetBool(RunningKey, true);
        SessionState.SetInt(IndexKey, -1);
        SessionState.SetBool(ErrorKey, false);
        Subscribe();
        BeginNextScene();
    }

    private static void Subscribe()
    {
        if (subscribed) return;
        subscribed = true;
        EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
        EditorApplication.update += OnEditorUpdate;
        Application.logMessageReceived += OnLog;
    }

    private static void OnLog(string condition, string stackTrace, LogType type)
    {
        if (stackTrace != null && stackTrace.Contains("UnityEditor.Search.SearchDatabase")) return;
        if (EditorApplication.isPlaying && SessionState.GetBool(RunningKey, false) &&
            (type == LogType.Exception || type == LogType.Error))
            SessionState.SetBool(ErrorKey, true);
    }

    private static void BeginNextScene()
    {
        int index = SessionState.GetInt(IndexKey, -1) + 1;
        if (index >= Names.Length)
        {
            bool failed = SessionState.GetBool(ErrorKey, false);
            SessionState.SetBool(RunningKey, false);
            Debug.Log(failed ? "Play Mode smoke finalizó con errores; revisa los mensajes de Unity." :
                "Play Mode smoke completado: las seis escenas entraron en Play Mode y la fábrica clasificó y transformó el lote.");
            EditorApplication.Exit(failed ? 1 : 0);
            return;
        }
        SessionState.SetInt(IndexKey, index);
        EditorSceneManager.OpenScene("Assets/Scenes/" + Names[index] + ".unity", OpenSceneMode.Single);
        Debug.Log("Play Mode smoke: iniciando " + Names[index]);
        EditorApplication.isPlaying = true;
    }

    private static void OnPlayModeStateChanged(PlayModeStateChange state)
    {
        if (!SessionState.GetBool(RunningKey, false)) return;
        if (state == PlayModeStateChange.EnteredPlayMode)
            SessionState.SetFloat(StartKey, (float)EditorApplication.timeSinceStartup);
        else if (state == PlayModeStateChange.EnteredEditMode)
            BeginNextScene();
    }

    private static void OnEditorUpdate()
    {
        if (!SessionState.GetBool(RunningKey, false) || !EditorApplication.isPlaying) return;
        if (EditorApplication.timeSinceStartup - SessionState.GetFloat(StartKey, (float)EditorApplication.timeSinceStartup) < 1.25f) return;
        int index = SessionState.GetInt(IndexKey, -1);
        if (index == 2) TestFactoryInteractions();
        else if (index > 0) TestWorldObjectInteraction();
        Debug.Log("Play Mode smoke: " + Names[index] + " activo, objetos y cámara inicializados.");
        EditorApplication.isPlaying = false;
    }

    private static void TestWorldObjectInteraction()
    {
        var controller = Object.FindAnyObjectByType<TierraSceneController>();
        var target = Object.FindAnyObjectByType<ObjetoMundoInteractivo>();
        if (controller == null || target == null)
        {
            SessionState.SetBool(ErrorKey, true);
            Debug.LogError("Falta el controlador u objeto interactivo de escena.");
            return;
        }
        controller.Activar(target);
    }

    private static void TestFactoryInteractions()
    {
        var factory = Object.FindAnyObjectByType<FabricaCircularController>();
        if (factory == null || factory.materiales == null || factory.contenedores == null)
        {
            SessionState.SetBool(ErrorKey, true);
            Debug.LogError("No se encontró el controlador de Fábrica circular en Play Mode.");
            return;
        }
        for (int i = 0; i < factory.materiales.Length; i++)
        {
            factory.Interactuar(factory.materiales[i]);
            factory.Interactuar(factory.contenedores[i]);
            if (!factory.materiales[i].clasificado) SessionState.SetBool(ErrorKey, true);
        }
        factory.Interactuar(factory.maquina);
        if (factory.productoRecuperado == null || !factory.productoRecuperado.activeSelf)
            SessionState.SetBool(ErrorKey, true);
    }
}

public static class TierraSceneControllerEditorExtensions
{
    public static void Configurar(this TierraSceneController controller, Text feedback, AudioSource effects, AudioClip click)
    {
        var serialized = new SerializedObject(controller);
        var feedbackProperty = serialized.FindProperty("estadoEscena");
        var effectsProperty = serialized.FindProperty("efectos");
        var clipProperty = serialized.FindProperty("sonidoInteraccion");
        if (feedbackProperty != null) feedbackProperty.objectReferenceValue = feedback;
        if (effectsProperty != null) effectsProperty.objectReferenceValue = effects;
        if (clipProperty != null) clipProperty.objectReferenceValue = click;
        serialized.ApplyModifiedPropertiesWithoutUndo();
    }
}
