using System.Text.RegularExpressions;

namespace KoalaWiki.CodeMap;

public class GoParser : ILanguageParser
{
    public List<string> ExtractImports(string fileContent)
    {
        var imports = new List<string>();
        
        // 匹配单行import语句
        var singleImportRegex = new Regex(@"import\s+""([^""]+)""", RegexOptions.Compiled);
        var matches = singleImportRegex.Matches(fileContent);
        
        foreach (Match match in matches)
        {
            imports.Add(match.Groups[1].Value);
        }
        
        // 匹配多行import语句块
        var multiImportRegex = new Regex(@"import\s*\(\s*((?:[^)]*\n?)*)\s*\)", RegexOptions.Compiled | RegexOptions.Singleline);
        matches = multiImportRegex.Matches(fileContent);
        
        foreach (Match match in matches)
        {
            var importBlock = match.Groups[1].Value;
            var importLineRegex = new Regex(@"""([^""]+)""", RegexOptions.Compiled);
            var importMatches = importLineRegex.Matches(importBlock);
            
            foreach (Match importMatch in importMatches)
            {
                imports.Add(importMatch.Groups[1].Value);
            }
        }
        
        return imports;
    }

    public List<Function> ExtractFunctions(string fileContent)
    {
        var functions = new List<Function>();
        
        // 匹配函数定义
        var funcRegex = new Regex(@"func\s+(?:\([^)]*\)\s+)?(\w+)\s*\([^)]*\)(?:\s*[^{]*)?{([^{}]*(?:{[^{}]*(?:{[^{}]*}[^{}]*)*}[^{}]*)*)}", RegexOptions.Compiled | RegexOptions.Singleline);
        var matches = funcRegex.Matches(fileContent);
        
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Value;
            // 过滤掉一些关键字
            if (!new[] { "if", "for", "switch", "select", "range" }.Contains(name))
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
        var callRegex = new Regex(@"(\w+)\s*\(", RegexOptions.Compiled);
        var matches = callRegex.Matches(functionBody);
        
        foreach (Match match in matches)
        {
            var name = match.Groups[1].Value;
            // 过滤一些常见的Go关键字和内置函数
            if (!new[] { "if", "for", "switch", "select", "range", "make", "new", "len", "cap", "append", "copy", "delete", "panic", "recover" }.Contains(name))
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
        
        // 匹配包函数调用
        var packageCallRegex = new Regex(@"(\w+)\.(\w+)\s*\(", RegexOptions.Compiled);
        matches = packageCallRegex.Matches(functionBody);
        
        foreach (Match match in matches)
        {
            var packageName = match.Groups[1].Value;
            var functionName = match.Groups[2].Value;
            // 如果是包调用，添加完整的调用名称
            if (!functionCalls.Contains(functionName))
            {
                functionCalls.Add(functionName);
            }
        }
        
        return functionCalls;
    }

    public string ResolveImportPath(string import, string currentFilePath, string basePath)
    {
        var currentDir = Path.GetDirectoryName(currentFilePath);
        
        // 处理相对路径导入（以./或../开头）
        if (import.StartsWith("./") || import.StartsWith("../"))
        {
            var resolvedPath = Path.GetFullPath(Path.Combine(currentDir, import));
            
            // 检查是否为目录（Go包）
            if (Directory.Exists(resolvedPath))
            {
                // 查找目录中的.go文件
                var goFiles = Directory.GetFiles(resolvedPath, "*.go");
                if (goFiles.Length > 0)
                {
                    return goFiles[0]; // 返回第一个Go文件
                }
            }
            
            // 检查是否为具体的.go文件
            if (!Path.HasExtension(resolvedPath))
            {
                resolvedPath += ".go";
            }
            
            if (File.Exists(resolvedPath))
            {
                return resolvedPath;
            }
        }
        // 处理标准库和第三方包导入
        else
        {
            // 对于标准库，我们不尝试解析实际路径
            if (IsStandardLibrary(import))
            {
                return null;
            }
            
            // 尝试在项目中查找匹配的包
            var packageName = import.Split('/').Last();
            var possibleDirs = Directory.GetDirectories(basePath, packageName, SearchOption.AllDirectories);
            
            foreach (var dir in possibleDirs)
            {
                var goFiles = Directory.GetFiles(dir, "*.go");
                if (goFiles.Length > 0)
                {
                    return goFiles[0];
                }
            }
            
            // 检查go.mod文件中的模块路径
            var goModPath = FindGoModFile(currentDir);
            if (!string.IsNullOrEmpty(goModPath))
            {
                var moduleRoot = Path.GetDirectoryName(goModPath);
                var relativePath = import.Replace("/", Path.DirectorySeparatorChar.ToString());
                var fullPath = Path.Combine(moduleRoot, relativePath);
                
                if (Directory.Exists(fullPath))
                {
                    var goFiles = Directory.GetFiles(fullPath, "*.go");
                    if (goFiles.Length > 0)
                    {
                        return goFiles[0];
                    }
                }
            }
        }
        
        return null;
    }

    public int GetFunctionLineNumber(string fileContent, string functionName)
    {
        var lines = fileContent.Split('\n');
        var funcRegex = new Regex($@"func\s+(?:\([^)]*\)\s+)?{functionName}\s*\(");
        
        for (int i = 0; i < lines.Length; i++)
        {
            if (funcRegex.IsMatch(lines[i]))
            {
                return i + 1;
            }
        }
        
        return 0;
    }

    private bool IsStandardLibrary(string import)
    {
        // Go标准库包列表（部分常用的）
        var standardLibraries = new[]
        {
            "fmt", "os", "io", "net", "http", "json", "time", "strings", "strconv",
            "context", "sync", "log", "errors", "sort", "math", "crypto", "encoding",
            "database", "html", "image", "mime", "path", "regexp", "runtime", "testing",
            "unsafe", "archive", "bufio", "bytes", "compress", "container", "debug",
            "go", "hash", "index", "plugin", "reflect", "text", "unicode"
        };
        
        var firstPart = import.Split('/')[0];
        return standardLibraries.Contains(firstPart) || !import.Contains(".");
    }

    private string FindGoModFile(string startDir)
    {
        var currentDir = startDir;
        while (!string.IsNullOrEmpty(currentDir))
        {
            var goModPath = Path.Combine(currentDir, "go.mod");
            if (File.Exists(goModPath))
            {
                return goModPath;
            }
            
            currentDir = Path.GetDirectoryName(currentDir);
        }
        
        return null;
    }
} 