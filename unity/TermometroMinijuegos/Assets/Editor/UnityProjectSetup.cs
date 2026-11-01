using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class UnityProjectSetup
{
    private const string ScenesFolder = "Assets/Scenes";
    private const string WebGlRelativePath = "../../public/unity-minijuegos";
    private static readonly string[] SceneNames = { "Inicio", "Energia", "Industria", "Movilidad", "Bosques", "Agricultura" };

    private static string WebGlPath
    {
        get { return Path.GetFullPath(Path.Combine(Directory.GetParent(Application.dataPath).FullName, WebGlRelativePath)); }
    }

    [MenuItem("Termómetro/Crear todas las escenas 2D")]
    public static void CreateAllScenes()
    {
        Directory.CreateDirectory(ScenesFolder);
        var buildScenes = new EditorBuildSettingsScene[SceneNames.Length];
        for (int i = 0; i < SceneNames.Length; i++)
        {
            string path = ScenePath(i);
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var host = new GameObject(i == 0 ? "Aventura Termómetro" : "Misión " + SceneNames[i]);
            var game = host.AddComponent<TermometroMinijuegos>();
            game.sector = i - 1;
            var cameraObject = new GameObject("Cámara 2D", typeof(Camera), typeof(AudioListener));
            var sceneCamera = cameraObject.GetComponent<Camera>();
            sceneCamera.orthographic = true;
            sceneCamera.orthographicSize = 5f;
            sceneCamera.clearFlags = CameraClearFlags.SolidColor;
            sceneCamera.backgroundColor = new Color32(244, 240, 228, 255);
            EditorSceneManager.SaveScene(scene, path);
            buildScenes[i] = new EditorBuildSettingsScene(path, true);
        }
        EditorBuildSettings.scenes = buildScenes;
        AssetDatabase.SaveAssets();
        EditorSceneManager.OpenScene(ScenePath(0), OpenSceneMode.Single);
        Debug.Log("Escenas 2D creadas: menú y cinco misiones temáticas.");
    }

    [MenuItem("Termómetro/Compilar WebGL para la web")]
    public static void BuildWebGl()
    {
        EnsureScenes();
        PlayerSettings.companyName = "Termómetro de la Tierra";
        PlayerSettings.productName = "Termómetro de la Tierra";
        PlayerSettings.defaultScreenWidth = 1280;
        PlayerSettings.defaultScreenHeight = 720;
        PlayerSettings.WebGL.template = "PROJECT:Tierra";
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        Directory.CreateDirectory(WebGlPath);

        var scenes = new string[SceneNames.Length];
        for (int i = 0; i < scenes.Length; i++) scenes[i] = ScenePath(i);
        var options = new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = WebGlPath,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };
        var report = BuildPipeline.BuildPlayer(options);
        if (report.summary.result != BuildResult.Succeeded)
            throw new BuildFailedException("Falló WebGL: " + report.summary.result + ", errores: " + report.summary.totalErrors);
        Debug.Log("WebGL de seis escenas generado en " + WebGlPath + " (" + report.summary.totalSize + " bytes)");
    }

    private static void EnsureScenes()
    {
        bool missing = false;
        for (int i = 0; i < SceneNames.Length; i++) if (!File.Exists(ScenePath(i))) missing = true;
        if (missing) CreateAllScenes();
        else
        {
            var buildScenes = new EditorBuildSettingsScene[SceneNames.Length];
            for (int i = 0; i < SceneNames.Length; i++) buildScenes[i] = new EditorBuildSettingsScene(ScenePath(i), true);
            EditorBuildSettings.scenes = buildScenes;
        }
    }

    private static string ScenePath(int index) { return ScenesFolder + "/" + SceneNames[index] + ".unity"; }
}
