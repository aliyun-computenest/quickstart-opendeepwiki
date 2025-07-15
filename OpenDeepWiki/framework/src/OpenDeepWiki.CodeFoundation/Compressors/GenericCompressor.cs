using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class GenericCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            var lines = content.Split('\n');
            var result = new List<string>();
            var inMultiLineComment = false;

            foreach (var line in lines)
            {
                var trimmedLine = line.Trim();
                
                // 跳过空行
                if (string.IsNullOrWhiteSpace(trimmedLine))
                    continue;

                // 处理多行注释
                if (trimmedLine.StartsWith("/*"))
                {
                    inMultiLineComment = true;
                    result.Add(line);
                    if (trimmedLine.Contains("*/"))
                        inMultiLineComment = false;
                    continue;
                }
                
                if (inMultiLineComment)
                {
                    result.Add(line);
                    if (trimmedLine.Contains("*/"))
                        inMultiLineComment = false;
                    continue;
                }

                // 保留注释行
                if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("#") || 
                    trimmedLine.StartsWith("/*") || trimmedLine.StartsWith("*") ||
                    trimmedLine.StartsWith("'''") || trimmedLine.StartsWith("\"\"\""))
                {
                    result.Add(line);
                    continue;
                }

                // 保留结构性行（如函数声明、类声明等）
                if (IsStructuralLine(trimmedLine))
                {
                    result.Add(NormalizeStructuralLine(line));
                    continue;
                }

                // 保留非空行但移除实现细节
                var normalizedLine = NormalizeImplementationLine(line);
                if (!string.IsNullOrWhiteSpace(normalizedLine))
                    result.Add(normalizedLine);
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为结构性代码行（如函数声明、类声明等）
        /// </summary>
        private bool IsStructuralLine(string line)
        {
            // 检查常见的结构性关键字
            var structuralPatterns = new[]
            {
                @"^\s*(class|interface|enum|struct|namespace|import|using|include|require|from|package)\s+",
                @"^\s*(public|private|protected|internal|static|final|abstract|override|virtual|extern|const)\s+",
                @"^\s*(function|def|func|sub|proc|method|procedure|fn|fun|async|await|export)\s+",
                @"^\s*(var|let|const|dim|int|string|bool|float|double|void|auto|val|char)\s+",
                @"^\s*(@|\[|#)\w+",  // 装饰器、特性、注解
                @"^\s*<\w+",         // XML/HTML标签
                @"^\s*\w+\s*\(",     // 函数调用
                @"^\s*\{|\}|\(|\)|\[|\]", // 括号
                @"^\s*#\w+",         // 预处理指令
            };

            return structuralPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
        }

        /// <summary>
        /// 规范化结构性代码行
        /// </summary>
        private string NormalizeStructuralLine(string line)
        {
            // 保留函数/方法声明，但移除函数体
            if (Regex.IsMatch(line, @"^\s*(\w+\s+)*\w+\s*\([^)]*\)\s*(\{|\=>)"))
            {
                var match = Regex.Match(line, @"^(.*?\([^)]*\))");
                if (match.Success)
                    return match.Groups[1].Value + " { }";
            }

            // 保留变量声明，但移除初始化表达式
            if (Regex.IsMatch(line, @"^\s*(\w+\s+)*\w+\s*="))
            {
                var match = Regex.Match(line, @"^(.*?)=");
                if (match.Success)
                    return match.Groups[1].Value + ";";
            }

            return line;
        }

        /// <summary>
        /// 规范化实现代码行（移除实现细节）
        /// </summary>
        private string NormalizeImplementationLine(string line)
        {
            // 移除赋值表达式右侧
            if (line.Contains("=") && !line.Contains("==") && !line.Contains("!=") && !line.Contains("<=") && !line.Contains(">="))
            {
                var parts = line.Split('=', 2);
                if (parts.Length > 1)
                    return parts[0] + ";";
            }

            // 移除函数调用参数
            if (Regex.IsMatch(line, @"\w+\s*\("))
            {
                return Regex.Replace(line, @"(\w+\s*)\([^)]*\)", "$1();");
            }

            return line;
        }
    }
} 