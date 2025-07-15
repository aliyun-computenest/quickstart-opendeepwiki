namespace KoalaWiki.CodeMap;

/// <summary>
/// 代码段数据模型
/// </summary>
public class CodeSegment
{
    public string Type { get; set; } = ""; // 代码段类型（类、方法、函数等）
    
    public string Name { get; set; } = ""; // 代码段名称
    
    public string Code { get; set; } = ""; // 代码内容
    
    public int StartLine { get; set; }     // 起始行号
    
    public int EndLine { get; set; }       // 结束行号
    
    public string Namespace { get; set; } = ""; // 命名空间
    
    public string ClassName { get; set; } = ""; // 类名（对于方法）
    
    public string Documentation { get; set; } = ""; // 文档注释
    
    public string ReturnType { get; set; } = ""; // 返回类型
    
    public string Parameters { get; set; } = ""; // 参数列表
    
    public List<string> Dependencies { get; set; } = new List<string>(); // 依赖项
    
    public string Modifiers { get; set; } = ""; // 修饰符（public, private等）
}