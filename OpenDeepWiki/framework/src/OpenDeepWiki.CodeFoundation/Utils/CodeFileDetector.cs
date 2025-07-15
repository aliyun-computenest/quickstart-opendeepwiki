namespace OpenDeepWiki.CodeFoundation.Utils;

/// <summary>
/// 代码文件类型检测器
/// 用于识别文件是否为代码文件，以及确定编程语言类型
/// </summary>
public static class CodeFileDetector
{
    /// <summary>
    /// 支持的代码文件扩展名及其对应的语言类型
    /// </summary>
    private static readonly Dictionary<string, string> CodeExtensions = new()
    {
        // C# 相关
        { ".cs", "csharp" },
        { ".csx", "csharp" },
        
        // JavaScript/TypeScript 相关
        { ".js", "javascript" },
        { ".jsx", "javascript" },
        { ".ts", "typescript" },
        { ".tsx", "typescript" },
        { ".mjs", "javascript" },
        { ".cjs", "javascript" },
        
        // Python 相关
        { ".py", "python" },
        { ".pyw", "python" },
        { ".pyi", "python" },
        
        // Java 相关
        { ".java", "java" },
        { ".kt", "kotlin" },
        { ".kts", "kotlin" },
        { ".scala", "scala" },
        
        // C/C++ 相关
        { ".c", "c" },
        { ".cpp", "cpp" },
        { ".cxx", "cpp" },
        { ".cc", "cpp" },
        { ".c++", "cpp" },
        { ".h", "c" },
        { ".hpp", "cpp" },
        { ".hxx", "cpp" },
        { ".hh", "cpp" },
        { ".h++", "cpp" },
        
        // Go 相关
        { ".go", "go" },
        
        // Rust 相关
        { ".rs", "rust" },
        
        // PHP 相关
        { ".php", "php" },
        { ".php3", "php" },
        { ".php4", "php" },
        { ".php5", "php" },
        { ".phtml", "php" },
        
        // Ruby 相关
        { ".rb", "ruby" },
        { ".rbw", "ruby" },
        
        // Swift 相关
        { ".swift", "swift" },
        
        // Shell 脚本相关
        { ".sh", "bash" },
        { ".bash", "bash" },
        { ".zsh", "zsh" },
        { ".fish", "fish" },
        { ".ps1", "powershell" },
        { ".psm1", "powershell" },
        { ".psd1", "powershell" },
        
        // 数据库相关
        { ".sql", "sql" },
        
        // Web 相关
        { ".html", "html" },
        { ".htm", "html" },
        { ".xhtml", "html" },
        { ".css", "css" },
        { ".scss", "scss" },
        { ".sass", "sass" },
        { ".less", "less" },
        { ".vue", "vue" },
        { ".svelte", "svelte" },
        
        // 配置文件相关
        { ".json", "json" },
        { ".xml", "xml" },
        { ".yaml", "yaml" },
        { ".yml", "yaml" },
        { ".toml", "toml" },
        { ".ini", "ini" },
        { ".cfg", "ini" },
        { ".conf", "ini" },
        
        // 其他语言
        { ".r", "r" },
        { ".R", "r" },
        { ".m", "matlab" },
        { ".tex", "latex" },
        { ".dart", "dart" },
        { ".lua", "lua" },
        { ".perl", "perl" },
        { ".pl", "perl" },
        { ".pm", "perl" },
        { ".vim", "vim" },
        
        // 构建和配置文件
        { ".dockerfile", "dockerfile" },
        { ".makefile", "makefile" },
        { ".cmake", "cmake" },
        { ".gradle", "gradle" },
        { ".groovy", "groovy" },
        
        // 文档相关
        { ".md", "markdown" },
        { ".markdown", "markdown" },
        { ".rst", "rst" },
        { ".adoc", "asciidoc" },
        { ".asciidoc", "asciidoc" }
    };

    /// <summary>
    /// 检查文件是否为代码文件
    /// </summary>
    /// <param name="filePath">文件路径</param>
    /// <returns>如果是代码文件返回 true，否则返回 false</returns>
    public static bool IsCodeFile(string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
            return false;

        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        
        // 检查是否在支持的扩展名列表中
        if (CodeExtensions.ContainsKey(extension))
            return true;

        // 检查特殊文件名（无扩展名的配置文件等）
        var fileName = Path.GetFileName(filePath).ToLowerInvariant();
        var specialFiles = new[]
        {
            "dockerfile", "makefile", "rakefile", "gemfile", "podfile",
            "vagrantfile", "gulpfile", "gruntfile", "webpack.config",
            "rollup.config", "vite.config", "jest.config", "babel.config",
            "eslint.config", "prettier.config", "tsconfig", "jsconfig"
        };

        return specialFiles.Any(special => fileName.Contains(special));
    }

    /// <summary>
    /// 获取文件的编程语言类型
    /// </summary>
    /// <param name="filePath">文件路径</param>
    /// <returns>编程语言类型，如果不是代码文件返回 null</returns>
    public static string? GetLanguageType(string filePath)
    {
        if (string.IsNullOrEmpty(filePath))
            return null;

        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        
        if (CodeExtensions.TryGetValue(extension, out var language))
            return language;

        // 检查特殊文件名
        var fileName = Path.GetFileName(filePath).ToLowerInvariant();
        
        if (fileName.Contains("dockerfile"))
            return "dockerfile";
        if (fileName.Contains("makefile"))
            return "makefile";
        if (fileName.Contains("rakefile"))
            return "ruby";
        if (fileName.Contains("gemfile"))
            return "ruby";
        if (fileName.Contains("podfile"))
            return "ruby";
        if (fileName.Contains("vagrantfile"))
            return "ruby";
        if (fileName.Contains("gulpfile") || fileName.Contains("gruntfile"))
            return "javascript";
        if (fileName.Contains("webpack.config") || fileName.Contains("rollup.config") || 
            fileName.Contains("vite.config") || fileName.Contains("jest.config") ||
            fileName.Contains("babel.config") || fileName.Contains("eslint.config") ||
            fileName.Contains("prettier.config"))
            return "javascript";
        if (fileName.Contains("tsconfig") || fileName.Contains("jsconfig"))
            return "json";

        return null;
    }

    /// <summary>
    /// 获取所有支持的代码文件扩展名
    /// </summary>
    /// <returns>支持的扩展名列表</returns>
    public static IEnumerable<string> GetSupportedExtensions()
    {
        return CodeExtensions.Keys;
    }

    /// <summary>
    /// 获取所有支持的编程语言类型
    /// </summary>
    /// <returns>支持的语言类型列表</returns>
    public static IEnumerable<string> GetSupportedLanguages()
    {
        return CodeExtensions.Values.Distinct();
    }

    /// <summary>
    /// 检查是否为需要特殊处理的代码文件类型
    /// 这些文件类型在压缩时需要特别小心保留结构
    /// </summary>
    /// <param name="filePath">文件路径</param>
    /// <returns>如果需要特殊处理返回 true</returns>
    public static bool RequiresSpecialHandling(string filePath)
    {
        var language = GetLanguageType(filePath);
        
        // 这些语言对缩进和格式敏感，需要特殊处理
        var sensitiveLanguages = new[] { "python", "yaml", "yml", "makefile", "dockerfile" };
        
        return language != null && sensitiveLanguages.Contains(language);
    }
}
