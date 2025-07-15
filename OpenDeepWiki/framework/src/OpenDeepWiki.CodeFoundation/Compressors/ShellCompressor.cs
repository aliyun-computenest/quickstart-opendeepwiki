using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class ShellCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            var lines = content.Split('\n');
            var result = new List<string>();

            foreach (var rawLine in lines)
            {
                var line = rawLine;
                var trimmedLine = line.Trim();
                
                if (string.IsNullOrWhiteSpace(trimmedLine))
                    continue;

                // 保留注释
                if (trimmedLine.StartsWith("#"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留 shebang
                if (trimmedLine.StartsWith("#!/"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留重要结构
                if (IsImportantShellLine(trimmedLine))
                {
                    result.Add(NormalizeShellLine(line));
                    continue;
                }
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为重要的 Shell 脚本代码行
        /// </summary>
        private bool IsImportantShellLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*function\s+\w+\s*\(\)",       // 函数声明
                @"^\s*\w+\s*\(\)\s*{",              // 函数声明（另一种形式）
                @"^\s*if\s+",                       // if 语句
                @"^\s*elif\s+",                     // elif 语句
                @"^\s*else\s*",                     // else 语句
                @"^\s*fi\s*",                       // if 结束
                @"^\s*for\s+",                      // for 循环
                @"^\s*while\s+",                    // while 循环
                @"^\s*until\s+",                    // until 循环
                @"^\s*do\s*",                       // do 关键字
                @"^\s*done\s*",                     // 循环结束
                @"^\s*case\s+",                     // case 语句
                @"^\s*esac\s*",                     // case 结束
                @"^\s*\w+\s*=",                     // 变量赋值
                @"^\s*export\s+",                   // 导出变量
                @"^\s*source\s+",                   // 引入其他脚本
                @"^\s*\.\s+",                       // 引入其他脚本（简写）
                @"^\s*alias\s+",                    // 别名定义
                @"^\s*trap\s+",                     // 信号捕获
                @"^\s*\{\s*",                       // 开始大括号
                @"^\s*\}\s*",                       // 结束大括号
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }

        /// <summary>
        /// 规范化 Shell 脚本代码行
        /// </summary>
        private string NormalizeShellLine(string line)
        {
            var working = line.TrimEnd();

            // 处理变量赋值
            var equalIndex = working.IndexOf('=');
            if (equalIndex >= 0 && !working.Contains("=="))
            {
                var prefix = working.Substring(0, equalIndex + 1);
                return prefix;
            }

            // 处理函数声明，保留签名但移除实现
            if (Regex.IsMatch(working, @"^\s*function\s+\w+\s*\(\)\s*{?\s*$") || 
                Regex.IsMatch(working, @"^\s*\w+\s*\(\)\s*{?\s*$"))
            {
                if (!working.EndsWith("{"))
                    return working + " {";
            }

            return working;
        }
    }
} 