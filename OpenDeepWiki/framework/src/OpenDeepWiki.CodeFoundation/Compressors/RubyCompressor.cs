using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class RubyCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            var lines = content.Split('\n');
            var result = new List<string>();
            var inMultiLineComment = false;

            foreach (var rawLine in lines)
            {
                var line = rawLine;
                if (string.IsNullOrWhiteSpace(line))
                    continue;

                var trimmedLine = line.TrimEnd();

                // 处理多行注释 =begin/=end
                if (trimmedLine.StartsWith("=begin"))
                {
                    inMultiLineComment = true;
                    result.Add(line);
                    continue;
                }
                if (inMultiLineComment)
                {
                    result.Add(line);
                    if (trimmedLine.StartsWith("=end"))
                        inMultiLineComment = false;
                    continue;
                }

                // 保留单行注释
                if (trimmedLine.Trim().StartsWith("#"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留重要结构
                if (IsImportantRubyLine(line))
                {
                    result.Add(line);
                    // 对于 def/class，插入占位 end 保持语法有效
                    if (Regex.IsMatch(trimmedLine, @"^\s*(def|class|module)\s+", RegexOptions.IgnoreCase) && 
                        !trimmedLine.Contains(";") && !trimmedLine.EndsWith("end"))
                    {
                        var indent = Regex.Match(trimmedLine, @"^\s*").Value;
                        result.Add(indent + "  # 占位符");
                        result.Add(indent + "end");
                    }
                    continue;
                }
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为重要的 Ruby 代码行
        /// </summary>
        private bool IsImportantRubyLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*require\s+",                  // require 语句
                @"^\s*require_relative\s+",         // require_relative 语句
                @"^\s*load\s+",                     // load 语句
                @"^\s*include\s+",                  // include 模块
                @"^\s*extend\s+",                   // extend 模块
                @"^\s*class\s+",                    // 类声明
                @"^\s*module\s+",                   // 模块声明
                @"^\s*def\s+",                      // 方法定义
                @"^\s*attr_\w+\s+",                 // 属性方法
                @"^\s*alias\s+",                    // 别名
                @"^\s*private\s+",                  // 私有方法
                @"^\s*protected\s+",                // 保护方法
                @"^\s*public\s+",                   // 公共方法
                @"^\s*end\s*$",                     // end 关键字
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }
    }
} 