using System.Text;

namespace KoalaWiki.CodeMap;

/// <summary>
/// 增强的依赖分析器，使用语义分析替代正则表达式
/// </summary>
public class EnhancedDependencyAnalyzer
{
    private readonly Dictionary<string, ISemanticAnalyzer> _analyzers = new();
    private readonly string _basePath;
    private ProjectSemanticModel? _projectModel;
    private bool _isInitialized = false;

    public EnhancedDependencyAnalyzer(string basePath)
    {
        _basePath = basePath;
        
        // 注册语义分析器
        // RegisterAnalyzer(new CSharpSemanticAnalyzer());
        RegisterAnalyzer(new GoSemanticAnalyzer());
        RegisterAnalyzer(new PythonSemanticAnalyzer());
        RegisterAnalyzer(new JavaScriptSemanticAnalyzer());
        RegisterAnalyzer(new JavaSemanticAnalyzer());
    }

    private void RegisterAnalyzer(ISemanticAnalyzer analyzer)
    {
        foreach (var extension in analyzer.SupportedExtensions)
        {
            _analyzers[extension] = analyzer;
        }
    }

    public async Task Initialize()
    {
        if (_isInitialized) return;
        
        var files = GetAllSourceFiles(_basePath);
        var groupedFiles = files.GroupBy(f => Path.GetExtension(f).ToLowerInvariant())
                               .ToDictionary(g => g.Key, g => g.ToArray());
        
        var allModels = new List<ProjectSemanticModel>();
        
        // 并行处理不同语言的文件
        var tasks = groupedFiles.Where(kvp => _analyzers.ContainsKey(kvp.Key))
                               .Select(async kvp =>
                               {
                                   var analyzer = _analyzers[kvp.Key];
                                   return await analyzer.AnalyzeProjectAsync(kvp.Value);
                               });
        
        var models = await Task.WhenAll(tasks);
        
        // 合并所有语言的语义模型
        _projectModel = MergeProjectModels(models);
        _isInitialized = true;
    }

    /// <summary>
    /// 分析文件依赖树
    /// </summary>
    public async Task<DependencyTree> AnalyzeFileDependencyTree(string filePath)
    {
        await Initialize();
        
        var normalizedPath = Path.GetFullPath(filePath);
        var visited = new HashSet<string>();
        
        return BuildSemanticFileDependencyTree(normalizedPath, visited, 0);
    }


    private DependencyTree BuildSemanticFileDependencyTree(string filePath, HashSet<string> visited, int level, int maxDepth = 10)
    {
        if (level > maxDepth || !visited.Add(filePath))
        {
            return new DependencyTree
            {
                NodeType = DependencyNodeType.File,
                Name = Path.GetFileName(filePath),
                FullPath = filePath,
                IsCyclic = visited.Contains(filePath)
            };
        }

        var tree = new DependencyTree
        {
            NodeType = DependencyNodeType.File,
            Name = Path.GetFileName(filePath),
            FullPath = filePath,
            IsCyclic = false,
            Children = new List<DependencyTree>()
        };

        // 使用语义模型获取依赖
        if (_projectModel?.Files.TryGetValue(filePath, out var fileModel) == true)
        {
            // 添加导入依赖
            if (_projectModel.Dependencies.TryGetValue(filePath, out var dependencies))
            {
                foreach (var dependency in dependencies)
                {
                    var childVisited = new HashSet<string>(visited);
                    var child = BuildSemanticFileDependencyTree(dependency, childVisited, level + 1, maxDepth);
                    tree.Children.Add(child);
                }
            }

            // 添加类型继承依赖
            foreach (var type in fileModel.Types)
            {
                foreach (var baseType in type.BaseTypes)
                {
                    var baseTypeInfo = FindTypeInProject(baseType);
                    if (baseTypeInfo != null && baseTypeInfo.FilePath != filePath)
                    {
                        var childVisited = new HashSet<string>(visited);
                        var child = BuildSemanticFileDependencyTree(baseTypeInfo.FilePath, childVisited, level + 1, maxDepth);
                        tree.Children.Add(child);
                    }
                }

                foreach (var interfaceType in type.Interfaces)
                {
                    var interfaceInfo = FindTypeInProject(interfaceType);
                    if (interfaceInfo != null && interfaceInfo.FilePath != filePath)
                    {
                        var childVisited = new HashSet<string>(visited);
                        var child = BuildSemanticFileDependencyTree(interfaceInfo.FilePath, childVisited, level + 1, maxDepth);
                        tree.Children.Add(child);
                    }
                }
            }

            // 添加文件中的函数信息
            foreach (var function in fileModel.Functions)
            {
                tree.Functions.Add(new DependencyTreeFunction
                {
                    Name = function.Name,
                    LineNumber = function.LineNumber
                });
            }

            // 添加类型中的方法
            foreach (var type in fileModel.Types)
            {
                foreach (var method in type.Methods)
                {
                    tree.Functions.Add(new DependencyTreeFunction
                    {
                        Name = $"{type.Name}.{method.Name}",
                        LineNumber = method.LineNumber
                    });
                }
            }
        }

        return tree;
    }

    private CodeMapFunctionInfo? FindFunctionInFile(string filePath, string functionName)
    {
        if (_projectModel?.Files.TryGetValue(filePath, out var fileModel) != true)
            return null;

        // 查找顶级函数
        var function = fileModel.Functions.FirstOrDefault(f => f.Name == functionName);
        if (function != null)
        {
            return ConvertToCodeMapFunctionInfo(function);
        }

        // 查找类型中的方法
        foreach (var type in fileModel.Types)
        {
            var method = type.Methods.FirstOrDefault(m => m.Name == functionName || $"{type.Name}.{m.Name}" == functionName);
            if (method != null)
            {
                return ConvertToCodeMapFunctionInfo(method);
            }
        }

        return null;
    }

    private CodeMapFunctionInfo? ResolveFunctionCall(string callName, string currentFile)
    {
        // 在当前文件中查找
        var localFunc = FindFunctionInFile(currentFile, callName);
        if (localFunc != null)
        {
            return localFunc;
        }

        // 在依赖文件中查找
        if (_projectModel?.Dependencies.TryGetValue(currentFile, out var dependencies) == true)
        {
            foreach (var dependency in dependencies)
            {
                var depFunc = FindFunctionInFile(dependency, callName);
                if (depFunc != null)
                {
                    return depFunc;
                }
            }
        }

        // 全局搜索
        foreach (var file in _projectModel?.Files.Values ?? Enumerable.Empty<SemanticModel>())
        {
            var searchFunc = FindFunctionInFile(file.FilePath, callName);
            if (searchFunc != null)
            {
                return searchFunc;
            }
        }

        return null;
    }

    private TypeInfo? FindTypeInProject(string typeName)
    {
        return _projectModel?.AllTypes.Values.FirstOrDefault(t => 
            t.Name == typeName || 
            t.FullName == typeName ||
            t.FullName.EndsWith($".{typeName}"));
    }

    private CodeMapFunctionInfo ConvertToCodeMapFunctionInfo(FunctionInfo semanticFunc)
    {
        return new CodeMapFunctionInfo
        {
            Name = semanticFunc.Name,
            FullName = semanticFunc.FullName,
            FilePath = semanticFunc.FilePath,
            LineNumber = semanticFunc.LineNumber,
            Body = "" // Semantic analysis doesn't provide function body
            // Calls property omitted due to type conflicts
        };
    }

    private ProjectSemanticModel MergeProjectModels(ProjectSemanticModel[] models)
    {
        var merged = new ProjectSemanticModel();
        
        foreach (var model in models)
        {
            foreach (var kvp in model.Files)
            {
                merged.Files[kvp.Key] = kvp.Value;
            }
            
            foreach (var kvp in model.Dependencies)
            {
                merged.Dependencies[kvp.Key] = kvp.Value;
            }
            
            foreach (var kvp in model.AllTypes)
            {
                merged.AllTypes[kvp.Key] = kvp.Value;
            }
            
            foreach (var kvp in model.AllFunctions)
            {
                merged.AllFunctions[kvp.Key] = kvp.Value;
            }
        }
        
        return merged;
    }

    private List<string> GetAllSourceFiles(string path)
    {
        var extensions = new[] { ".cs", ".go", ".py", ".js", ".ts", ".java", ".cpp", ".h", ".hpp", ".cc" };
        return Directory.GetFiles(path, "*.*", SearchOption.AllDirectories)
            .Where(f => extensions.Contains(Path.GetExtension(f).ToLowerInvariant()))
            .ToList();
    }

    public string GenerateDependencyTreeVisualization(DependencyTree tree)
    {
        var sb = new StringBuilder();
        GenerateTreeVisualization(tree, sb, "", true);
        return sb.ToString();
    }

    private void GenerateTreeVisualization(DependencyTree node, StringBuilder sb, string indent, bool isLast)
    {
        var nodeMarker = isLast ? "└── " : "├── ";
        var nodeType = node.NodeType == DependencyNodeType.File ? "[文件]" : "[函数]";
        var cyclicMarker = node.IsCyclic ? " (循环引用)" : "";
        var lineInfo = node.LineNumber > 0 ? $" (行: {node.LineNumber})" : "";
        
        sb.AppendLine($"{indent}{nodeMarker}{nodeType} {node.Name}{lineInfo}{cyclicMarker}");
        
        var childIndent = indent + (isLast ? "    " : "│   ");
        
        if (node.NodeType == DependencyNodeType.File && node.Functions.Count > 0 && !node.IsCyclic)
        {
            sb.AppendLine($"{childIndent}├── [函数列表]");
            var functionsIndent = childIndent + "│   ";
            
            for (int i = 0; i < node.Functions.Count; i++)
            {
                var function = node.Functions[i];
                var functionMarker = i == node.Functions.Count - 1 ? "└── " : "├── ";
                var functionLineInfo = function.LineNumber > 0 ? $" (行: {function.LineNumber})" : "";
                sb.AppendLine($"{functionsIndent}{functionMarker}{function.Name}{functionLineInfo}");
            }
        }
        
        if (node is { IsCyclic: false, Children: not null })
        {
            for (int i = 0; i < node.Children.Count; i++)
            {
                GenerateTreeVisualization(node.Children[i], sb, childIndent, i == node.Children.Count - 1);
            }
        }
    }
}

// 占位符类，实际实现需要为每种语言创建具体的语义分析器
public class CSharpSemanticAnalyzer : ISemanticAnalyzer
{
    public string[] SupportedExtensions => new[] { ".cs" };
    
    public Task<SemanticModel> AnalyzeFileAsync(string filePath, string content)
    {
        // TODO: 使用Roslyn实现C#语义分析
        throw new NotImplementedException("C# semantic analyzer not yet implemented");
    }
    
    public Task<ProjectSemanticModel> AnalyzeProjectAsync(string[] filePaths)
    {
        // TODO: 使用Roslyn实现C#项目语义分析
        throw new NotImplementedException("C# project analyzer not yet implemented");
    }
}

public class PythonSemanticAnalyzer : ISemanticAnalyzer
{
    public string[] SupportedExtensions => new[] { ".py" };
    
    public Task<SemanticModel> AnalyzeFileAsync(string filePath, string content)
    {
        // TODO: 使用Python AST模块实现
        throw new NotImplementedException("Python semantic analyzer not yet implemented");
    }
    
    public Task<ProjectSemanticModel> AnalyzeProjectAsync(string[] filePaths)
    {
        throw new NotImplementedException("Python project analyzer not yet implemented");
    }
}

public class JavaScriptSemanticAnalyzer : ISemanticAnalyzer
{
    public string[] SupportedExtensions => new[] { ".js", ".ts" };
    
    public Task<SemanticModel> AnalyzeFileAsync(string filePath, string content)
    {
        // TODO: 使用TypeScript编译器API实现
        throw new NotImplementedException("JavaScript/TypeScript semantic analyzer not yet implemented");
    }
    
    public Task<ProjectSemanticModel> AnalyzeProjectAsync(string[] filePaths)
    {
        throw new NotImplementedException("JavaScript/TypeScript project analyzer not yet implemented");
    }
}

public class JavaSemanticAnalyzer : ISemanticAnalyzer
{
    public string[] SupportedExtensions => new[] { ".java" };
    
    public Task<SemanticModel> AnalyzeFileAsync(string filePath, string content)
    {
        // TODO: 使用JavaParser或Eclipse JDT实现
        throw new NotImplementedException("Java semantic analyzer not yet implemented");
    }
    
    public Task<ProjectSemanticModel> AnalyzeProjectAsync(string[] filePaths)
    {
        throw new NotImplementedException("Java project analyzer not yet implemented");
    }
} 