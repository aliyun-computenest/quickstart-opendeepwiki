using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class RustCompressor : ICodeCompressor
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
                if (IsImportantRustLine(trimmedLine))
                {
                    result.Add(NormalizeRustLine(line));
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
        /// 判断是否为重要的 Rust 代码行
        /// </summary>
        private bool IsImportantRustLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*use\s+",                      // use 语句
                @"^\s*mod\s+",                      // mod 声明
                @"^\s*pub\s+",                      // pub 修饰符
                @"^\s*fn\s+",                       // 函数声明
                @"^\s*struct\s+",                   // 结构体声明
                @"^\s*enum\s+",                     // 枚举声明
                @"^\s*trait\s+",                    // trait 声明
                @"^\s*impl\s+",                     // impl 实现块
                @"^\s*type\s+",                     // 类型别名
                @"^\s*const\s+",                    // 常量声明
                @"^\s*static\s+",                   // 静态变量
                @"^\s*let\s+",                      // 变量声明
                @"^\s*#\[",                         // 属性宏
                @"^\s*macro_rules!\s+",             // 宏定义
                @"^\s*{",                           // 开始大括号
                @"^\s*}",                           // 结束大括号
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }

        /// <summary>
        /// 规范化 Rust 代码行
        /// </summary>
        private string NormalizeRustLine(string line)
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
            if (Regex.IsMatch(working, @"^\s*fn\s+.*\)\s*-?>?\s*\w*\s*{?\s*$"))
            {
                if (!working.EndsWith("{"))
                    return working + " {";
            }

            return working;
        }
    }
} 