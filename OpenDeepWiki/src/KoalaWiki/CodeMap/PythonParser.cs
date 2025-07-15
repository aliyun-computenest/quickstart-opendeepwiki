using System.Text.RegularExpressions;

namespace KoalaWiki.CodeMap;

public class PythonParser : ILanguageParser
{
    public List<string> ExtractImports(string fileContent)
    {
        var imports = new List<string>();
            
        // 匹配import语句
        var importRegex = new Regex(@"import\s+([^\s,;]+)(?:\s*,\s*([^\s,;]+))*", RegexOptions.Compiled);
        var matches = importRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            for (int i = 1; i < match.Groups.Count; i++)
            {
                if (match.Groups[i].Success && !string.IsNullOrWhiteSpace(match.Groups[i].Value))
                {
                    imports.Add(match.Groups[i].Value);
                }
            }
        }
            
        // 匹配from...import语句
        var fromImportRegex = new Regex(@"from\s+([^\s]+)\s+import\s+(?:([^\s,;]+)(?:\s*,\s*([^\s,;]+))*|\*)", RegexOptions.Compiled);
        matches = fromImportRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            imports.Add(match.Groups[1].Value);
        }
            
        return imports;
    }

    public List<Function> ExtractFunctions(string fileContent)
    {
        var functions = new List<Function>();
            
        // 匹配函数定义
        var funcRegex = new Regex(@"def\s+(\w+)\s*\([^)]*\)\s*(?:->\s*[^:]+)?\s*:(.*?)(?=\n(?:def|class)|\Z)", RegexOptions.Compiled | RegexOptions.Singleline);
        var matches = funcRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            functions.Add(new Function
            {
                Name = match.Groups[1].Value,
                Body = match.Groups[2].Value
            });
        }
            
        return functions;
    }

    public List<string> ExtractFunctionCalls(string functionBody)
    {
        var functionCalls = new List<string>();
            
        // 匹配函数调用
        var callRegex = new Regex(@"(\w+)\s*\(", RegexOptions.Compiled);
        var matches = callRegex.Matches(functionBody);
            
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Value;
            // 过滤一些常见的Python内置函数和关键字
            if (!new[] { "print", "len", "int", "str", "list", "dict", "set", "tuple", "if", "while", "for" }.Contains(name))
            {
                functionCalls.Add(name);
            }
        }
            
        // 匹配方法调用
        var methodCallRegex = new Regex(@"(\w+)\.(\w+)\s*\(", RegexOptions.Compiled);
        matches = methodCallRegex.Matches(functionBody);
            
        foreach (Match match in matches)
        {
            functionCalls.Add(match.Groups[2].Value);
        }
            
        return functionCalls;
    }

    public string ResolveImportPath(string import, string currentFilePath, string basePath)
    {
        var currentDir = Path.GetDirectoryName(currentFilePath);
            
        // 处理相对导入（以.开头）
        if (import.StartsWith("."))
        {
            var parts = import.Split('.');
            var dir = currentDir;
                
            // 处理上级目录导入
            for (int i = 0; i < parts.Length; i++)
            {
                if (string.IsNullOrEmpty(parts[i]))
                {
                    dir = Path.GetDirectoryName(dir);
                }
                else
                {
                    var modulePath = Path.Combine(dir, parts[i] + ".py");
                    if (File.Exists(modulePath))
                    {
                        return modulePath;
                    }
                        
                    // 检查是否为包（目录）
                    var packagePath = Path.Combine(dir, parts[i]);
                    var initPath = Path.Combine(packagePath, "__init__.py");
                    if (Directory.Exists(packagePath) && File.Exists(initPath))
                    {
                        return initPath;
                    }
                }
            }
        }
        // 处理绝对导入
        else
        {
            // 搜索整个项目中的模块
            var moduleName = import.Split('.')[0];
            var possibleFiles = Directory.GetFiles(basePath, moduleName + ".py", SearchOption.AllDirectories);
                
            if (possibleFiles.Length > 0)
            {
                return possibleFiles[0];
            }
                
            // 搜索包
            var possibleDirs = Directory.GetDirectories(basePath, moduleName, SearchOption.AllDirectories);
            foreach (var dir in possibleDirs)
            {
                var initPath = Path.Combine(dir, "__init__.py");
                if (File.Exists(initPath))
                {
                    return initPath;
                }
            }
        }
            
        return null;
    }

    public int GetFunctionLineNumber(string fileContent, string functionName)
    {
        var lines = fileContent.Split('\n');
        var funcRegex = new Regex($@"def\s+{functionName}\s*\(");
            
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