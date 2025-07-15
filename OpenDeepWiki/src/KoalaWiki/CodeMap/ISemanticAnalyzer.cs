namespace KoalaWiki.CodeMap;

/// <summary>
/// 语义分析器接口，用于深入分析代码的语义结构
/// </summary>
public interface ISemanticAnalyzer
{
    /// <summary>
    /// 获取支持的文件扩展名
    /// </summary>
    string[] SupportedExtensions { get; }
    
    /// <summary>
    /// 解析文件的语义结构
    /// </summary>
    Task<SemanticModel> AnalyzeFileAsync(string filePath, string content);
    
    /// <summary>
    /// 解析项目的语义结构（用于跨文件依赖分析）
    /// </summary>
    Task<ProjectSemanticModel> AnalyzeProjectAsync(string[] filePaths);
}

/// <summary>
/// 文件的语义模型
/// </summary>
public class SemanticModel
{
    public string FilePath { get; set; } = "";
    public string Namespace { get; set; } = "";
    public List<TypeInfo> Types { get; set; } = new();
    public List<FunctionInfo> Functions { get; set; } = new();
    public List<ImportInfo> Imports { get; set; } = new();
    public List<VariableInfo> Variables { get; set; } = new();
}

/// <summary>
/// 项目的语义模型
/// </summary>
public class ProjectSemanticModel
{
    public Dictionary<string, SemanticModel> Files { get; set; } = new();
    public Dictionary<string, List<string>> Dependencies { get; set; } = new();
    public Dictionary<string, TypeInfo> AllTypes { get; set; } = new();
    public Dictionary<string, FunctionInfo> AllFunctions { get; set; } = new();
}

/// <summary>
/// 类型信息
/// </summary>
public class TypeInfo
{
    public string Name { get; set; } = "";
    public string FullName { get; set; } = "";
    public TypeKind Kind { get; set; }
    public string FilePath { get; set; } = "";
    public int LineNumber { get; set; }
    public int EndLineNumber { get; set; }
    public List<string> BaseTypes { get; set; } = new(); // 继承的类型
    public List<string> Interfaces { get; set; } = new(); // 实现的接口
    public List<FunctionInfo> Methods { get; set; } = new();
    public List<VariableInfo> Fields { get; set; } = new();
    public List<string> GenericParameters { get; set; } = new();
    public AccessModifier AccessModifier { get; set; }
    public bool IsAbstract { get; set; }
    public bool IsSealed { get; set; }
    public bool IsStatic { get; set; }
}

/// <summary>
/// 函数信息
/// </summary>
public class FunctionInfo
{
    public string Name { get; set; } = "";
    public string FullName { get; set; } = "";
    public string FilePath { get; set; } = "";
    public int LineNumber { get; set; }
    public int EndLineNumber { get; set; }
    public string ReturnType { get; set; } = "";
    public List<ParameterInfo> Parameters { get; set; } = new();
    public List<string> GenericParameters { get; set; } = new();
    public List<FunctionCallInfo> Calls { get; set; } = new();
    public AccessModifier AccessModifier { get; set; }
    public bool IsStatic { get; set; }
    public bool IsAsync { get; set; }
    public bool IsAbstract { get; set; }
    public bool IsVirtual { get; set; }
    public bool IsOverride { get; set; }
    public string ParentType { get; set; } = ""; // 所属类型
}

/// <summary>
/// 函数调用信息
/// </summary>
public class FunctionCallInfo
{
    public string Name { get; set; } = "";
    public string FullName { get; set; } = "";
    public int LineNumber { get; set; }
    public string TargetType { get; set; } = ""; // 调用的目标类型
    public bool IsStatic { get; set; }
}

/// <summary>
/// 导入信息
/// </summary>
public class ImportInfo
{
    public string Name { get; set; } = "";
    public string Alias { get; set; } = "";
    public string FilePath { get; set; } = "";
    public bool IsWildcard { get; set; }
    public List<string> ImportedMembers { get; set; } = new();
}

/// <summary>
/// 变量信息
/// </summary>
public class VariableInfo
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public int LineNumber { get; set; }
    public AccessModifier AccessModifier { get; set; }
    public bool IsStatic { get; set; }
    public bool IsReadonly { get; set; }
    public bool IsConst { get; set; }
}

/// <summary>
/// 参数信息
/// </summary>
public class ParameterInfo
{
    public string Name { get; set; } = "";
    public string Type { get; set; } = "";
    public bool IsOptional { get; set; }
    public string DefaultValue { get; set; } = "";
}

/// <summary>
/// 类型种类
/// </summary>
public enum TypeKind
{
    Class,
    Interface,
    Struct,
    Enum,
    Delegate,
    Record
}

/// <summary>
/// 访问修饰符
/// </summary>
public enum AccessModifier
{
    Public,
    Private,
    Protected,
    Internal,
    ProtectedInternal,
    PrivateProtected
} 