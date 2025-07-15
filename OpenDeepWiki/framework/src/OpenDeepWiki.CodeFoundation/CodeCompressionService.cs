using OpenDeepWiki.CodeFoundation.Compressors;
using OpenDeepWiki.CodeFoundation.Utils;

namespace OpenDeepWiki.CodeFoundation;

/// <summary>
/// 代码压缩服务
/// 提供对不同编程语言的代码压缩功能，保留注释、方法名等关键信息
/// </summary>
public class CodeCompressionService
{
    private static readonly Dictionary<string, ICodeCompressor> Compressors = new();
    private static readonly GenericCompressor GenericCompressor = new();

    static CodeCompressionService()
    {
        Compressors["csharp"] = new CSharpCompressor();
        Compressors["javascript"] = new JavaScriptCompressor();
        Compressors["typescript"] = new JavaScriptCompressor();
        Compressors["python"] = new PythonCompressor();
        Compressors["java"] = new JavaCompressor();
        Compressors["kotlin"] = new JavaCompressor();
        Compressors["scala"] = new JavaCompressor();
        Compressors["c"] = new CppCompressor();
        Compressors["cpp"] = new CppCompressor();
        Compressors["go"] = new GoCompressor();
        Compressors["rust"] = new RustCompressor();
        Compressors["php"] = new PhpCompressor();
        Compressors["ruby"] = new RubyCompressor();
        Compressors["swift"] = new SwiftCompressor();
        Compressors["bash"] = new ShellCompressor();
        Compressors["zsh"] = new ShellCompressor();
        Compressors["fish"] = new ShellCompressor();
        Compressors["powershell"] = new ShellCompressor();
        Compressors["sql"] = new SqlCompressor();
        Compressors["html"] = new HtmlCompressor();
        Compressors["css"] = new CssCompressor();
        Compressors["scss"] = new CssCompressor();
        Compressors["sass"] = new CssCompressor();
        Compressors["less"] = new CssCompressor();
        Compressors["json"] = new JsonCompressor();
        Compressors["xml"] = new XmlCompressor();
        Compressors["yaml"] = new YamlCompressor();
        Compressors["yml"] = new YamlCompressor();
        Compressors["markdown"] = new MarkdownCompressor();
    }

    /// <summary>
    /// 压缩代码内容
    /// </summary>
    /// <param name="content">原始代码内容</param>
    /// <param name="filePath">文件路径（用于确定语言类型）</param>
    /// <returns>压缩后的代码内容</returns>
    public string CompressCode(string content, string filePath)
    {
        if (string.IsNullOrEmpty(content))
            return content;

        var languageType = CodeFileDetector.GetLanguageType(filePath);
        if (languageType == null)
            return content; // 不是代码文件，不进行压缩

        if (Compressors.TryGetValue(languageType, out var compressor))
        {
            return compressor.Compress(content);
        }

        return GenericCompressor.Compress(content);
    }
}