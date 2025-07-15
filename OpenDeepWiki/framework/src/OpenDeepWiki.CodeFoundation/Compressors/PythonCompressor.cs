using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class PythonCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            var lines = content.Split('\n');
            var result = new List<string>();

            foreach (var rawLine in lines)
            {
                var line = rawLine;
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var trimmedLine = line.TrimEnd();

                // 保留注释
                if (trimmedLine.Trim().StartsWith("#"))
                {
                    result.Add(trimmedLine);
                    continue;
                }

                // 保留重要结构
                if (IsImportantPythonLine(line))
                {
                    result.Add(trimmedLine);

                    // 对于 def/class，插入占位 pass 保持语法有效
                    if (Regex.IsMatch(trimmedLine, @"^\s*(def|class)\s+", RegexOptions.IgnoreCase))
                    {
                        var indent = Regex.Match(trimmedLine, @"^\s*").Value;
                        result.Add(indent + "    pass");
                    }
                    continue;
                }
            }

            return string.Join("\n", result);
        }
        
        /// <summary>
        /// 判断是否为重要的 Python 代码行（去除变量赋值条目）
        /// </summary>
        private bool IsImportantPythonLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*import\s+",                   // import 语句
                @"^\s*from\s+.*import",             // from import 语句
                @"^\s*def\s+",                      // 函数定义
                @"^\s*class\s+",                    // 类定义
                @"^\s*@\w+",                        // 装饰器
                @"^\s*if\s+__name__\s*==",          // 主程序入口
                @"^\s*(if|elif|else|for|while|try|except|finally|with)[\s:]", // 控制结构
                @"^\s*return\s+",                   // return
                @"^\s*print\s*\("                  // print
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }
    }
} 