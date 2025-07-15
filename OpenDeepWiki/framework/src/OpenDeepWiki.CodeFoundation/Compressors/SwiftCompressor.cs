using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class SwiftCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            var lines = content.Split('\n');
            var result = new List<string>();
            var inMultiLineComment = false;

            foreach (var rawLine in lines)
            {
                var line = rawLine;
                var trimmedLine = line.Trim();

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

                // 保留单行注释
                if (trimmedLine.StartsWith("//"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留重要结构
                if (IsImportantSwiftLine(trimmedLine))
                {
                    result.Add(NormalizeSwiftLine(line));
                    continue;
                }

                // 保留独立的大括号
                if (trimmedLine == "{" || trimmedLine == "}")
                {
                    result.Add(line);
                }
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为重要的 Swift 代码行
        /// </summary>
        private bool IsImportantSwiftLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*import\s+",                   // import 语句
                @"^\s*@\w+",                        // 属性/装饰器
                @"^\s*class\s+",                    // 类声明
                @"^\s*struct\s+",                   // 结构体声明
                @"^\s*enum\s+",                     // 枚举声明
                @"^\s*protocol\s+",                 // 协议声明
                @"^\s*extension\s+",                // 扩展声明
                @"^\s*func\s+",                     // 函数声明
                @"^\s*var\s+",                      // 变量声明
                @"^\s*let\s+",                      // 常量声明
                @"^\s*typealias\s+",                // 类型别名
                @"^\s*init\s*\(",                   // 初始化器
                @"^\s*deinit\s*\{",                 // 反初始化器
                @"^\s*{",                           // 开始大括号
                @"^\s*}",                           // 结束大括号
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }

        /// <summary>
        /// 规范化 Swift 代码行
        /// </summary>
        private string NormalizeSwiftLine(string line)
        {
            var working = line.TrimEnd();

            // 处理变量赋值
            var equalIndex = working.IndexOf('=');
            if (equalIndex >= 0 && !working.Contains("=="))
            {
                var prefix = working.Substring(0, equalIndex).TrimEnd();
                return prefix;
            }

            // 处理函数声明，保留签名但移除实现
            if (Regex.IsMatch(working, @"^\s*func\s+.*\)\s*-?>?\s*\w*\s*{?\s*$"))
            {
                if (!working.EndsWith("{"))
                    return working + " {";
            }

            return working;
        }
    }
} 