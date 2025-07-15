using System.ComponentModel;
using System.Text.Json;
using Microsoft.SemanticKernel;

namespace KoalaWiki.Functions;

public class CodeAnalyzeFunction(string gitPath)
{
    /// <summary>
    /// Analyzes the dependency tree of a specified function within a file.
    /// </summary>
    /// <param name="filePath">The path to the file containing the function to analyze.</param>
    /// <param name="functionName">The name of the function to analyze for dependency relationships.</param>
    /// <returns>A JSON string representing the dependency tree of the specified function.</returns>
    [KernelFunction, Description("Analyze the dependency relationship of the specified method")]
    [return: Description("Return the dependency tree of the specified function")]
    public async Task<string> AnalyzeFunctionDependencyTree(
        [Description("File Path")] string filePath,
        [Description("Analyze the dependency relationship of the specified method")]
        string functionName)
    {
        try
        {
            Log.Logger.Information($"ReadCodeFileAsync: {filePath} {functionName}");

            var newPath = Path.Combine(gitPath, filePath.TrimStart('/'));

            var code = new DependencyAnalyzer(gitPath);

            var result = await code.AnalyzeFunctionDependencyTree(newPath, functionName);

            return JsonSerializer.Serialize(result, JsonSerializerOptions.Web);
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }

    /// <summary>
    /// 分析指定文件的依赖关系
    /// </summary>
    /// <returns></returns>
    [KernelFunction, Description("Analyze the dependency relationship of the specified file")]
    [return: Description("Return the dependency tree of the specified file")]
    public async Task<string> AnalyzeFileDependencyTree(
        [Description("File Path")] string filePath)
    {
        try
        {
            Log.Logger.Information($"ReadCodeFileAsync: {filePath}");

            var newPath = Path.Combine(gitPath, filePath.TrimStart('/'));

            var code = new DependencyAnalyzer(gitPath);

            var result = await code.AnalyzeFileDependencyTree(newPath);

            return JsonSerializer.Serialize(result, JsonSerializerOptions.Web);
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }
}