using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public static class UnityProjectSetup
{
    private const string ScenePath = "Assets/Scenes/Minijuegos.unity";
    private const string WebGlRelativePath = "../../public/unity-minijuegos";

    private static string WebGlPath => Path.GetFullPath(Path.Combine(Directory.GetParent(Application.dataPath).FullName, WebGlRelativePath));

    [MenuItem("Termómetro/Crear escena de minijuegos")]
    public static void CreateScene()
    {
        Directory.CreateDirectory("Assets/Scenes");
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var host = new GameObject("TermometroMinijuegos");
        host.AddComponent<TermometroMinijuegos>();
        EditorSceneManager.SaveScene(scene, ScenePath);
        EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };
        Debug.Log("Escena creada: " + ScenePath);
    }

    [MenuItem("Termómetro/Compilar WebGL para la web")]
    public static void BuildWebGl()
    {
        if (!File.Exists(ScenePath)) CreateScene();
        PlayerSettings.companyName = "Termómetro de la Tierra";
        PlayerSettings.productName = "Termómetro de la Tierra";
        Directory.CreateDirectory(WebGlPath);
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        var options = new BuildPlayerOptions
        {
            scenes = new[] { ScenePath },
            locationPathName = WebGlPath,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };
        var report = BuildPipeline.BuildPlayer(options);
        if (report.summary.result != BuildResult.Succeeded)
            throw new BuildFailedException("WebGL build failed: " + report.summary.result + ", errors: " + report.summary.totalErrors);
        Debug.Log("WebGL compilado en " + WebGlPath + " (" + report.summary.totalSize + " bytes)");
    }
}
