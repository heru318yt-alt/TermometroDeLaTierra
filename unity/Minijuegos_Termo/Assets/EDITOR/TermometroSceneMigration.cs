using System;
using System.IO;
using System.Linq;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using TermometroTierra;
using TermometroTierra.Agricultura;
using TermometroTierra.Bosques;
using TermometroTierra.Energia;
using TermometroTierra.Fabrica;
using TermometroTierra.Transporte;

/// <summary>
/// One-time editor migration for the imported educational scenes. It deliberately
/// operates in edit mode so every TMP object remains serialized in the hierarchy.
/// </summary>
public static class TermometroSceneMigration
{
    private static readonly string[] ScenePaths =
    {
        "Assets/GAME/SCENES/Mapa.unity",
        "Assets/GAME/SCENES/EnergiaViva.unity",
        "Assets/GAME/SCENES/FabricaCircular.unity",
        "Assets/GAME/SCENES/RutasQueRespiran.unity",
        "Assets/GAME/SCENES/BosqueGuardian.unity",
        "Assets/GAME/SCENES/FincaDelFuturo.unity"
    };

    [MenuItem("Termómetro de la Tierra/Migrar UI a TextMeshPro")]
    public static void MigrateAllScenes()
    {
        AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
        EnsureTmpEssentials();
        string[] fontGuids = AssetDatabase.FindAssets("LiberationSans SDF t:TMP_FontAsset");
        TMP_FontAsset font = fontGuids.Length > 0
            ? AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(AssetDatabase.GUIDToAssetPath(fontGuids[0]))
            : null;
        if (font == null)
            throw new InvalidOperationException("No se encontró la fuente TMP por defecto después de importar los recursos esenciales.");

        foreach (string path in ScenePaths)
        {
            Scene scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            int converted = ConvertLegacyText(font);
            WireControllerReferences(scene.name);
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
            Debug.Log($"[Termómetro] {scene.name}: {converted} textos migrados a TextMeshProUGUI.");
        }

        EditorBuildSettings.scenes = ScenePaths.Select(path => new EditorBuildSettingsScene(path, true)).ToArray();
        AssetDatabase.SaveAssets();
        AssetDatabase.Refresh();
        VerifyScenes();
    }

    [MenuItem("Termómetro de la Tierra/Validar escenas y TMP")]
    public static void VerifyScenes()
    {
        foreach (string path in ScenePaths)
        {
            Scene scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
            int legacy = UnityEngine.Object.FindObjectsByType<Text>(FindObjectsInactive.Include, FindObjectsSortMode.None).Length;
            int tmp = UnityEngine.Object.FindObjectsByType<TextMeshProUGUI>(FindObjectsInactive.Include, FindObjectsSortMode.None).Length;
            if (legacy != 0 || tmp == 0)
                throw new InvalidOperationException($"La escena {scene.name} no pasó validación TMP. Legacy={legacy}, TMP={tmp}.");

            ValidateWorldReferences(scene.name);
            Debug.Log($"[Termómetro] {scene.name}: validado ({tmp} TextMeshProUGUI serializados).");
        }
    }

    private static void EnsureTmpEssentials()
    {
        if (!File.Exists("Assets/TextMesh Pro/Resources/TMP Settings.asset"))
        {
            TMP_PackageResourceImporter.ImportResources(true, false, false);
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
        }
    }

    private static int ConvertLegacyText(TMP_FontAsset font)
    {
        Text[] legacyTexts = UnityEngine.Object.FindObjectsByType<Text>(FindObjectsInactive.Include, FindObjectsSortMode.None);
        foreach (Text legacy in legacyTexts)
        {
            GameObject gameObject = legacy.gameObject;
            string text = legacy.text;
            int fontSize = legacy.fontSize;
            FontStyles fontStyle = ToFontStyle(legacy.fontStyle);
            Color color = legacy.color;
            TextAlignmentOptions alignment = ToAlignment(legacy.alignment);
            bool wordWrapping = legacy.horizontalOverflow == HorizontalWrapMode.Wrap;
            bool raycastTarget = legacy.raycastTarget;
            bool richText = legacy.supportRichText;
            bool autoSizing = legacy.resizeTextForBestFit;
            int minFontSize = legacy.resizeTextMinSize;
            int maxFontSize = legacy.resizeTextMaxSize;
            TextOverflowModes overflowMode = legacy.verticalOverflow == VerticalWrapMode.Truncate
                ? TextOverflowModes.Truncate
                : TextOverflowModes.Overflow;

            // uGUI permits only one Graphic component per GameObject, so remove
            // the legacy Text before adding TMP to the same RectTransform.
            UnityEngine.Object.DestroyImmediate(legacy);
            TextMeshProUGUI tmp = gameObject.AddComponent<TextMeshProUGUI>();
            tmp.font = font;
            tmp.text = text;
            tmp.fontSize = fontSize;
            tmp.fontStyle = fontStyle;
            tmp.color = color;
            tmp.alignment = alignment;
            tmp.textWrappingMode = wordWrapping ? TextWrappingModes.Normal : TextWrappingModes.NoWrap;
            tmp.overflowMode = overflowMode;
            tmp.raycastTarget = raycastTarget;
            tmp.richText = richText;
            tmp.enableAutoSizing = autoSizing;
            tmp.fontSizeMin = minFontSize;
            tmp.fontSizeMax = maxFontSize;
            tmp.margin = Vector4.zero;
            tmp.SetAllDirty();
        }
        return legacyTexts.Length;
    }

    private static void WireControllerReferences(string sceneName)
    {
        TierraWorldController world = UnityEngine.Object.FindFirstObjectByType<TierraWorldController>(FindObjectsInactive.Include);
        if (world != null)
        {
            world.statusText = FindText("WorldStatus");
            world.roundText = FindText("RoundCounter");
            world.resultTitle = FindText("ResultTitle");
            world.resultBody = FindText("ResultExplanation");
            EditorUtility.SetDirty(world);
        }

        switch (sceneName)
        {
            case "Mapa":
                WireMap();
                break;
            case "EnergiaViva":
                EnergyGameController energy = UnityEngine.Object.FindFirstObjectByType<EnergyGameController>(FindObjectsInactive.Include);
                if (energy != null)
                {
                    energy.demandText = FindText("Demand");
                    energy.carbonText = FindText("Carbon");
                    energy.saveText = FindText("Saving");
                    EditorUtility.SetDirty(energy);
                }
                break;
            case "FabricaCircular":
                FactoryGameController factory = UnityEngine.Object.FindFirstObjectByType<FactoryGameController>(FindObjectsInactive.Include);
                if (factory != null)
                {
                    factory.pieceText = FindText("ActivePiece");
                    factory.contaminationText = FindText("Circularity");
                    factory.batchText = FindText("FactoryBatch");
                    EditorUtility.SetDirty(factory);
                }
                break;
            case "RutasQueRespiran":
                RouteGameController routes = UnityEngine.Object.FindFirstObjectByType<RouteGameController>(FindObjectsInactive.Include);
                if (routes != null)
                {
                    routes.travelerText = FindText("TravelerCase");
                    routes.routeScoreText = FindText("RouteBalance");
                    EditorUtility.SetDirty(routes);
                }
                break;
            case "BosqueGuardian":
                ForestGameController forest = UnityEngine.Object.FindFirstObjectByType<ForestGameController>(FindObjectsInactive.Include);
                if (forest != null)
                {
                    forest.resourceText = FindText("ForestResources");
                    forest.selectedText = FindText("ForestSelected");
                    EditorUtility.SetDirty(forest);
                }
                break;
            case "FincaDelFuturo":
                FarmGameController farm = UnityEngine.Object.FindFirstObjectByType<FarmGameController>(FindObjectsInactive.Include);
                if (farm != null)
                {
                    farm.farmResourceText = FindText("FarmResources");
                    farm.farmSelectionText = FindText("FarmSelected");
                    EditorUtility.SetDirty(farm);
                }
                break;
        }
    }

    private static void WireMap()
    {
        MapSceneController map = UnityEngine.Object.FindFirstObjectByType<MapSceneController>(FindObjectsInactive.Include);
        if (map != null)
        {
            map.numberLabel = FindText("Selected World Number");
            map.titleLabel = FindText("Selected World Title");
            map.subtitleLabel = FindText("Selected World Subtitle");
            map.descriptionLabel = FindText("Selected World Description");
            map.availabilityLabel = FindText("Availability Text");
            map.enterButtonLabel = FindText("Enter World Label");
            EditorUtility.SetDirty(map);
        }

        foreach (MapWorldMarker marker in UnityEngine.Object.FindObjectsByType<MapWorldMarker>(FindObjectsInactive.Include, FindObjectsSortMode.None))
        {
            marker.numberLabel = FindChildText(marker.transform, "World Number");
            marker.titleLabel = FindChildText(marker.transform, "World Title");
            EditorUtility.SetDirty(marker);
        }
    }

    private static void ValidateWorldReferences(string sceneName)
    {
        if (sceneName == "Mapa")
        {
            MapSceneController map = UnityEngine.Object.FindFirstObjectByType<MapSceneController>(FindObjectsInactive.Include);
            if (map == null || map.numberLabel == null || map.titleLabel == null || map.enterButtonLabel == null)
                throw new InvalidOperationException("El atlas tiene referencias TMP sin asignar.");
            return;
        }

        TierraWorldController world = UnityEngine.Object.FindFirstObjectByType<TierraWorldController>(FindObjectsInactive.Include);
        if (world == null || world.statusText == null || world.roundText == null || world.resultTitle == null || world.resultBody == null)
            throw new InvalidOperationException($"{sceneName} tiene referencias TMP base sin asignar.");
    }

    private static TextMeshProUGUI FindText(string objectName)
    {
        return UnityEngine.Object.FindObjectsByType<TextMeshProUGUI>(FindObjectsInactive.Include, FindObjectsSortMode.None)
            .FirstOrDefault(text => text.gameObject.name == objectName);
    }

    private static TextMeshProUGUI FindChildText(Transform root, string objectName)
    {
        return root.GetComponentsInChildren<TextMeshProUGUI>(true)
            .FirstOrDefault(text => text.gameObject.name == objectName);
    }

    private static FontStyles ToFontStyle(FontStyle style)
    {
        return style == FontStyle.Bold ? FontStyles.Bold :
               style == FontStyle.Italic ? FontStyles.Italic :
               style == FontStyle.BoldAndItalic ? FontStyles.Bold | FontStyles.Italic : FontStyles.Normal;
    }

    private static TextAlignmentOptions ToAlignment(TextAnchor anchor)
    {
        switch (anchor)
        {
            case TextAnchor.UpperLeft: return TextAlignmentOptions.TopLeft;
            case TextAnchor.UpperCenter: return TextAlignmentOptions.Top;
            case TextAnchor.UpperRight: return TextAlignmentOptions.TopRight;
            case TextAnchor.MiddleLeft: return TextAlignmentOptions.MidlineLeft;
            case TextAnchor.MiddleCenter: return TextAlignmentOptions.Midline;
            case TextAnchor.MiddleRight: return TextAlignmentOptions.MidlineRight;
            case TextAnchor.LowerLeft: return TextAlignmentOptions.BottomLeft;
            case TextAnchor.LowerCenter: return TextAlignmentOptions.Bottom;
            default: return TextAlignmentOptions.BottomRight;
        }
    }
}
