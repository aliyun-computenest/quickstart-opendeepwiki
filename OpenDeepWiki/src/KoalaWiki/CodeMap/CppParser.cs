using System.Text.RegularExpressions;

namespace KoalaWiki.CodeMap;

public class CppParser : ILanguageParser
{
    public List<string> ExtractImports(string fileContent)
    {
        var imports = new List<string>();
            
        // 匹配#include语句
        var includeRegex = new Regex(@"#include\s+[<""]([^>""]+)[>""]", RegexOptions.Compiled);
        var matches = includeRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            imports.Add(match.Groups[1].Value);
        }
            
        return imports;
    }

    public List<Function> ExtractFunctions(string fileContent)
    {
        var functions = new List<Function>();
            
        // 匹配函数定义（简化版，不处理所有C++语法复杂情况）
        var funcRegex = new Regex(@"(?:(?:[a-zA-Z0-9_\*&\s:<>,]+)\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:const)?\s*(?:noexcept)?\s*(?:override)?\s*(?:final)?\s*(?:=\s*default)?\s*(?:=\s*delete)?\s*(?:=\s*0)?\s*\{([^{}]*(?:{[^{}]*(?:{[^{}]*}[^{}]*)*}[^{}]*)*)\}", RegexOptions.Compiled);
        var matches = funcRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Value;
            // 过滤掉构造函数、析构函数和关键字
            if (!name.StartsWith("~") && !new[] { "if", "for", "while", "switch", "catch" }.Contains(name))
            {
                functions.Add(new Function
                {
                    Name = name,
                    Body = match.Groups[2].Value
                });
            }
        }
            
        return functions;
    }

    public List<string> ExtractFunctionCalls(string functionBody)
    {
        var functionCalls = new List<string>();
            
        // 匹配函数调用
        var callRegex = new Regex(@"(?:(?:[a-zA-Z0-9_]+)::)?([a-zA-Z0-9_]+)\s*\(", RegexOptions.Compiled);
        var matches = callRegex.Matches(functionBody);
            
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Value;
            // 过滤一些常见的关键字
            if (!new[] { "if", "for", "while", "switch", "catch" }.Contains(name))
            {
                functionCalls.Add(name);
            }
        }
            
        return functionCalls;
    }

    public string ResolveImportPath(string import, string currentFilePath, string basePath)
    {
        var currentDir = Path.GetDirectoryName(currentFilePath);
            
        // 对于系统头文件，不尝试解析实际路径
        if (import.Contains('/') || import.Contains('\\'))
        {
            // 尝试在项目中查找头文件
            var possibleFiles = Directory.GetFiles(basePath, Path.GetFileName(import), SearchOption.AllDirectories);
            if (possibleFiles.Length > 0)
            {
                return possibleFiles[0];
            }
        }
        else
        {
            // 查找当前目录和项目中的头文件
            var localPath = Path.Combine(currentDir, import);
            if (File.Exists(localPath))
            {
                return localPath;
            }
                
            var possibleFiles = Directory.GetFiles(basePath, import, SearchOption.AllDirectories);
            if (possibleFiles.Length > 0)
            {
                return possibleFiles[0];
            }
        }
            
        return null;
    }

    public int GetFunctionLineNumber(string fileContent, string functionName)
    {
        var lines = fileContent.Split('\n');
        var funcRegex = new Regex($@"(?:(?:[a-zA-Z0-9_\*&\s:<>,]+)\s+)?{functionName}\s*\(");
            
        for (int i = 0; i < lines.Length; i++)
        {
            if (funcRegex.IsMatch(lines[i]))
            {
                return i + 1;
            }
        }
            
        return 0;
    }
}