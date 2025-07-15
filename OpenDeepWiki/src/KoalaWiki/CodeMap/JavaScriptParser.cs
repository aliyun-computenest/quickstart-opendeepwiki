using System.Text.RegularExpressions;

namespace KoalaWiki.CodeMap;

public class JavaScriptParser : ILanguageParser
{
    public List<string> ExtractImports(string fileContent)
    {
        var imports = new List<string>();
            
        // 匹配ES6导入语句
        var importRegex = new Regex(@"import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['""]([^'""]+)['""];", RegexOptions.Compiled);
        var matches = importRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            imports.Add(match.Groups[1].Value);
        }
            
        // 匹配CommonJS导入
        var requireRegex = new Regex(@"(?:const|let|var)\s+(?:{\s*[^}]*\s*}|\w+)\s*=\s*require\(['""]([^'""]+)['""]", RegexOptions.Compiled);
        matches = requireRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            imports.Add(match.Groups[1].Value);
        }
            
        return imports;
    }

    public List<Function> ExtractFunctions(string fileContent)
    {
        var functions = new List<Function>();
            
        // 匹配函数声明
        var funcRegex = new Regex(@"(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*function|(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>)\s*{([^{}]*(?:{[^{}]*(?:{[^{}]*}[^{}]*)*}[^{}]*)*)}", RegexOptions.Compiled | RegexOptions.Singleline);
        var matches = funcRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Success ? match.Groups[1].Value : 
                match.Groups[2].Success ? match.Groups[2].Value :
                match.Groups[3].Value;
                
            functions.Add(new Function
            {
                Name = name,
                Body = match.Groups[4].Value
            });
        }
            
        // 匹配类方法
        var methodRegex = new Regex(@"(\w+)\s*\([^)]*\)\s*{([^{}]*(?:{[^{}]*(?:{[^{}]*}[^{}]*)*}[^{}]*)*)}", RegexOptions.Compiled | RegexOptions.Singleline);
        matches = methodRegex.Matches(fileContent);
            
        foreach (Match match in matches)
        {
            if (!match.Groups[1].Value.Equals("function", StringComparison.OrdinalIgnoreCase))
            {
                functions.Add(new Function
                {
                    Name = match.Groups[1].Value,
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
        var callRegex = new Regex(@"(\w+)\s*\(", RegexOptions.Compiled);
        var matches = callRegex.Matches(functionBody);
            
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Value;
            // 过滤一些常见的JS API和关键字
            if (!new[] { "if", "for", "while", "switch", "catch" }.Contains(name))
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
            
        // 处理相对路径导入
        if (import.StartsWith("./") || import.StartsWith("../"))
        {
            var resolvedPath = Path.GetFullPath(Path.Combine(currentDir, import));
                
            // 处理没有扩展名的情况
            if (!Path.HasExtension(resolvedPath))
            {
                if (File.Exists(resolvedPath + ".js")) return resolvedPath + ".js";
                if (File.Exists(resolvedPath + ".jsx")) return resolvedPath + ".jsx";
                if (File.Exists(resolvedPath + ".ts")) return resolvedPath + ".ts";
                if (File.Exists(resolvedPath + ".tsx")) return resolvedPath + ".tsx";
                    
                // 检查是否为目录中的index文件
                if (Directory.Exists(resolvedPath))
                {
                    if (File.Exists(Path.Combine(resolvedPath, "index.js"))) 
                        return Path.Combine(resolvedPath, "index.js");
                    if (File.Exists(Path.Combine(resolvedPath, "index.jsx"))) 
                        return Path.Combine(resolvedPath, "index.jsx");
                    if (File.Exists(Path.Combine(resolvedPath, "index.ts"))) 
                        return Path.Combine(resolvedPath, "index.ts");
                    if (File.Exists(Path.Combine(resolvedPath, "index.tsx"))) 
                        return Path.Combine(resolvedPath, "index.tsx");
                }
            }
            else if (File.Exists(resolvedPath))
            {
                return resolvedPath;
            }
        }
        // 处理包导入
        else if (!import.StartsWith("/"))
        {
            // 在node_modules中搜索
            var nodeModulesPath = FindNodeModulesPath(currentDir);
            if (!string.IsNullOrEmpty(nodeModulesPath))
            {
                var packagePath = Path.Combine(nodeModulesPath, import);
                    
                // 检查包入口点
                if (Directory.Exists(packagePath))
                {
                    // 读取package.json
                    var packageJson = Path.Combine(packagePath, "package.json");
                    if (File.Exists(packageJson))
                    {
                        try
                        {
                            var jsonContent = File.ReadAllText(packageJson);
                            var mainRegex = new Regex(@"""main"":\s*""([^""]+)""");
                            var match = mainRegex.Match(jsonContent);
                            if (match.Success)
                            {
                                var mainFile = Path.Combine(packagePath, match.Groups[1].Value);
                                if (File.Exists(mainFile)) return mainFile;
                            }
                        }
                        catch
                        {
                            // 忽略JSON解析错误
                        }
                    }
                        
                    // 默认检查index文件
                    if (File.Exists(Path.Combine(packagePath, "index.js")))
                        return Path.Combine(packagePath, "index.js");
                }
            }
                
            // 尝试在项目中搜索匹配的文件
            var possibleFiles = Directory.GetFiles(basePath, "*.js", SearchOption.AllDirectories);
            foreach (var file in possibleFiles)
            {
                if (Path.GetFileNameWithoutExtension(file) == import || 
                    Path.GetFileName(file) == import + ".js")
                {
                    return file;
                }
            }
        }
            
        return null;
    }
    private string FindNodeModulesPath(string startDir)
    {
        var currentDir = startDir;
        while (!string.IsNullOrEmpty(currentDir))
        {
            var nodeModulesPath = Path.Combine(currentDir, "node_modules");
            if (Directory.Exists(nodeModulesPath))
            {
                return nodeModulesPath;
            }
                
            currentDir = Path.GetDirectoryName(currentDir);
        }
            
        return null;
    }

    public int GetFunctionLineNumber(string fileContent, string functionName)
    {
        var lines = fileContent.Split('\n');
            
        // 检查函数声明
        var funcRegex = new Regex($@"function\s+{functionName}\s*\(|const\s+{functionName}\s*=\s*function|const\s+{functionName}\s*=\s*\(|let\s+{functionName}\s*=\s*function|let\s+{functionName}\s*=\s*\(|var\s+{functionName}\s*=\s*function|var\s+{functionName}\s*=\s*\(");
            
        for (int i = 0; i < lines.Length; i++)
        {
            if (funcRegex.IsMatch(lines[i]))
            {
                return i + 1;
            }
        }
            
        // 检查类方法
        var methodRegex = new Regex($@"\b{functionName}\s*\([^)]*\)\s*{{");
            
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