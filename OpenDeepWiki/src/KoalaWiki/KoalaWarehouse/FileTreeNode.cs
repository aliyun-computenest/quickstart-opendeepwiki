using System.Text;

namespace KoalaWiki.KoalaWarehouse;

/// <summary>
/// 文件树节点，用于构建节省tokens的树形结构
/// </summary>
public class FileTreeNode
{
    /// <summary>
    /// 节点名称
    /// </summary>
    public string Name { get; set; } = string.Empty;
    
    /// <summary>
    /// 节点类型：F=文件，D=目录
    /// </summary>
    public string Type { get; set; } = string.Empty;
    
    /// <summary>
    /// 子节点
    /// </summary>
    public Dictionary<string, FileTreeNode> Children { get; set; } = new();
    
    /// <summary>
    /// 是否为叶子节点（文件）
    /// </summary>
    public bool IsFile => Type == "F";
    
    /// <summary>
    /// 是否为目录节点
    /// </summary>
    public bool IsDirectory => Type == "D";
}

/// <summary>
/// 文件树构建器
/// </summary>
public static class FileTreeBuilder
{
    /// <summary>
    /// 从路径信息列表构建文件树
    /// </summary>
    /// <param name="pathInfos">路径信息列表</param>
    /// <param name="basePath">基础路径，用于计算相对路径</param>
    /// <returns>文件树根节点</returns>
    public static FileTreeNode BuildTree(List<PathInfo> pathInfos, string basePath)
    {
        var root = new FileTreeNode { Name = "/", Type = "D" };
        
        foreach (var pathInfo in pathInfos)
        {
            // 计算相对路径
            var relativePath = pathInfo.Path.Replace(basePath, "").TrimStart('\\', '/');
            
            // 过滤.开头的文件
            if (relativePath.StartsWith("."))
                continue;
                
            // 分割路径
            var parts = relativePath.Split(new[] { '\\', '/' }, StringSplitOptions.RemoveEmptyEntries);
            
            // 从根节点开始构建路径
            var currentNode = root;
            
            for (int i = 0; i < parts.Length; i++)
            {
                var part = parts[i];
                var isLastPart = i == parts.Length - 1;
                
                if (!currentNode.Children.ContainsKey(part))
                {
                    currentNode.Children[part] = new FileTreeNode
                    {
                        Name = part,
                        Type = isLastPart && pathInfo.Type == "File" ? "F" : "D"
                    };
                }
                
                currentNode = currentNode.Children[part];
            }
        }
        
        return root;
    }
    
    /// <summary>
    /// 将文件树转换为紧凑的字符串表示
    /// 格式示例：
    /// /
    ///   src/D
    ///     components/D
    ///       Header.tsx/F
    ///       Footer.tsx/F
    ///     pages/D
    ///       index.tsx/F
    /// </summary>
    /// <param name="node">文件树节点</param>
    /// <param name="indent">缩进级别</param>
    /// <returns>紧凑的字符串表示</returns>
    public static string ToCompactString(FileTreeNode node, int indent = 0)
    {
        var sb = new StringBuilder();
        var indentStr = new string(' ', indent * 2);
        
        if (indent == 0)
        {
            sb.AppendLine("/");
        }
        
        foreach (var child in node.Children.OrderBy(x => x.Value.IsFile).ThenBy(x => x.Key))
        {
            sb.AppendLine($"{indentStr}{child.Key}/{child.Value.Type}");
            
            if (child.Value.IsDirectory && child.Value.Children.Count > 0)
            {
                sb.Append(ToCompactString(child.Value, indent + 1));
            }
        }
        
        return sb.ToString();
    }
    
    /// <summary>
    /// 将文件树转换为极度紧凑的JSON格式
    /// 使用单字符键名来最大化节省tokens
    /// </summary>
    /// <param name="node">文件树节点</param>
    /// <returns>JSON字符串</returns>
    public static string ToCompactJson(FileTreeNode node)
    {
        return System.Text.Json.JsonSerializer.Serialize(SerializeNodeCompact(node), new System.Text.Json.JsonSerializerOptions
        {
            WriteIndented = false
        });
    }
    
    private static object SerializeNodeCompact(FileTreeNode node)
    {
        if (node.IsFile)
        {
            return "F"; // 文件只需要一个标识符
        }
        
        var result = new Dictionary<string, object>();
        
        foreach (var child in node.Children)
        {
            result[child.Key] = SerializeNodeCompact(child.Value);
        }
        
        return result;
    }
    
    /// <summary>
    /// 将文件树转换为路径列表格式（但去重了公共前缀）
    /// 适用于需要路径列表但希望减少冗余的场景
    /// </summary>
    /// <param name="node">文件树节点</param>
    /// <param name="currentPath">当前路径</param>
    /// <returns>路径列表</returns>
    public static List<string> ToPathList(FileTreeNode node, string currentPath = "")
    {
        var paths = new List<string>();
        
        foreach (var child in node.Children)
        {
            var childPath = string.IsNullOrEmpty(currentPath) 
                ? child.Key 
                : $"{currentPath}/{child.Key}";
                
            if (child.Value.IsFile)
            {
                paths.Add(childPath);
            }
            else
            {
                // 如果目录只有一个子节点，可以压缩路径
                if (child.Value.Children.Count == 1)
                {
                    var subPaths = ToPathList(child.Value, childPath);
                    paths.AddRange(subPaths);
                }
                else
                {
                    paths.Add($"{childPath}/");
                    var subPaths = ToPathList(child.Value, childPath);
                    paths.AddRange(subPaths);
                }
            }
        }
        
        return paths;
    }
    
    /// <summary>
    /// 将文件树转换为Unix风格的树形结构
    /// 类似于 Unix tree 命令的输出效果
    /// 使用 ├── 和 └── 等字符来构建可视化的树形结构
    /// </summary>
    /// <param name="node">文件树节点</param>
    /// <param name="prefix">当前行的前缀</param>
    /// <param name="isLast">是否为父节点的最后一个子节点</param>
    /// <returns>Unix风格的树形字符串</returns>
    public static string ToUnixTree(FileTreeNode node, string prefix = "", bool isLast = true)
    {
        var sb = new StringBuilder();
        
        // 根节点特殊处理
        if (string.IsNullOrEmpty(prefix))
        {
            sb.AppendLine(".");
            foreach (var child in node.Children.OrderBy(x => x.Value.IsFile).ThenBy(x => x.Key))
            {
                var isLastChild = child.Equals(node.Children.OrderBy(x => x.Value.IsFile).ThenBy(x => x.Key).Last());
                sb.Append(ToUnixTree(child.Value, "", isLastChild, child.Key));
            }
        }
        
        return sb.ToString();
    }
    
    /// <summary>
    /// Unix风格树形结构的递归实现
    /// </summary>
    private static string ToUnixTree(FileTreeNode node, string prefix, bool isLast, string nodeName)
    {
        var sb = new StringBuilder();
        
        // 当前节点的连接符
        var connector = isLast ? "└── " : "├── ";
        
        // 输出当前节点
        sb.AppendLine($"{prefix}{connector}{nodeName}{(node.IsDirectory ? "/" : "")}");
        
        // 如果是目录且有子节点，递归处理子节点
        if (node.IsDirectory && node.Children.Count > 0)
        {
            var childPrefix = prefix + (isLast ? "    " : "│   ");
            var sortedChildren = node.Children.OrderBy(x => x.Value.IsFile).ThenBy(x => x.Key).ToList();
            
            for (int i = 0; i < sortedChildren.Count; i++)
            {
                var child = sortedChildren[i];
                var isLastChild = i == sortedChildren.Count - 1;
                sb.Append(ToUnixTree(child.Value, childPrefix, isLastChild, child.Key));
            }
        }
        
        return sb.ToString();
    }
}