using System.Text.RegularExpressions;

namespace KoalaWiki.CodeMap;

public class JavaParser : ILanguageParser
{
    public List<string> ExtractImports(string fileContent)
    {
        var imports = new List<string>();
            
        // 匹配import语句
        var importRegex = new Regex(@"import\s+([^;]+);", RegexOptions.Compiled);
        var matches = importRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            imports.Add(match.Groups[1].Value.Trim());
        }
            
        return imports;
    }

    public List<Function> ExtractFunctions(string fileContent)
    {
        var functions = new List<Function>();
            
        // 匹配方法定义
        var methodRegex = new Regex(@"(?:public|private|protected|static|\s) +(?:[a-zA-Z0-9_\.<>\[\]]+) +([a-zA-Z0-9_]+) *\([@a-zA-Z0-9_<>\[\]\(\)\""=,\s.]*\) *(?:throws [^{]*)?\{([^{}]*(?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}[^{}]*)*\}[^{}]*)*\}[^{}]*)*)\}", RegexOptions.Compiled);
        var matches = methodRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Value;
            if (!new[] { "if", "for", "while", "switch", "catch" }.Contains(name))
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
            
        // 匹配方法调用
        var callRegex = new Regex(@"(?:\b[a-zA-Z0-9_]+\.)?\b([a-zA-Z0-9_]+)\s*\(", RegexOptions.Compiled);
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
        var parts = import.Split('.');
        var className = parts[parts.Length - 1];
            
        // 处理wildcard导入
        if (className.Equals("*"))
        {
            className = "";
        }
            
        // 在项目中搜索类文件
        var possibleFiles = Directory.GetFiles(basePath, "*.java", SearchOption.AllDirectories);
            
        foreach (var file in possibleFiles)
        {
            if (string.IsNullOrEmpty(className))
            {
                // 检查包声明是否匹配
                var content = File.ReadAllText(file);
                var packageRegex = new Regex($@"package\s+{string.Join("\\.", parts.Take(parts.Length - 1))};");
                if (packageRegex.IsMatch(content))
                {
                    return file;
                }
            }
            else if (Path.GetFileNameWithoutExtension(file).Equals(className, StringComparison.OrdinalIgnoreCase))
            {
                // 检查包声明是否匹配
                var content = File.ReadAllText(file);
                var packageRegex = new Regex($@"package\s+{string.Join("\\.", parts.Take(parts.Length - 1))};");
                if (packageRegex.IsMatch(content))
                {
                    return file;
                }
            }
        }
            
        return null;
    }

    public int GetFunctionLineNumber(string fileContent, string functionName)
    {
        var lines = fileContent.Split('\n');
        var methodRegex = new Regex($@"(?:public|private|protected|static|\s) +(?:[a-zA-Z0-9_\.<>\[\]]+) +{functionName} *\(");
            
        for (int i = 0; i < lines.Length; i++)
        {
            if (methodRegex.IsMatch(lines[i]))
            {
                return i + 1;
            }
        }
            
        return 0;
    }
}