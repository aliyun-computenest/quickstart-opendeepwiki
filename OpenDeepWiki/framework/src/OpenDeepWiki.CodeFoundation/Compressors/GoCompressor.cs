using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class GoCompressor : ICodeCompressor
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
                if (IsImportantGoLine(trimmedLine))
                {
                    result.Add(NormalizeGoLine(line));
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
        /// 判断是否为重要的 Go 代码行
        /// </summary>
        private bool IsImportantGoLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*package\s+",                  // package 声明
                @"^\s*import\s+",                   // import 语句
                @"^\s*import\s+\(",                 // 多行 import 开始
                @"^\s*type\s+\w+\s+",               // 类型声明
                @"^\s*func\s+\(",                   // 方法接收器
                @"^\s*func\s+\w+\s*\(",             // 函数声明
                @"^\s*interface\s+",                // 接口声明
                @"^\s*struct\s+",                   // 结构体声明
                @"^\s*const\s+",                    // 常量声明
                @"^\s*var\s+",                      // 变量声明
                @"^\s*go\s+",                       // goroutine
                @"^\s*defer\s+",                    // defer
                @"^\s*{",                           // 开始大括号
                @"^\s*}",                           // 结束大括号
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }

        /// <summary>
        /// 规范化 Go 代码行
        /// </summary>
        private string NormalizeGoLine(string line)
        {
            var working = line.TrimEnd();

            // 处理变量赋值
            var equalIndex = working.IndexOf('=');
            if (equalIndex >= 0 && !working.Contains("=="))
            {
                var prefix = working.Substring(0, equalIndex).TrimEnd();
                if (!prefix.EndsWith(";"))
                    prefix += ";";
                return prefix;
            }

            // 处理函数声明，保留签名但移除实现
            if (Regex.IsMatch(working, @"^\s*func\s+.*\)\s*{?\s*$"))
            {
                if (!working.EndsWith("{"))
                    return working + " {";
            }

            return working;
        }
    }
} 