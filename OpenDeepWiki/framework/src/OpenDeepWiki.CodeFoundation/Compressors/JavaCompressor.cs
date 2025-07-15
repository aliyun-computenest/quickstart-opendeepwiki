using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class JavaCompressor : ICodeCompressor
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

                // 跳过空行
                if (string.IsNullOrWhiteSpace(trimmedLine))
                    continue;

                // 处理多行注释开始/结束
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

                // 保留单行/文档注释
                if (trimmedLine.StartsWith("//"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留重要结构行并对其进行规范化
                if (IsImportantJavaLine(trimmedLine))
                {
                    result.Add(NormalizeJavaLine(line));
                    continue;
                }

                // 保留独立的大括号以维持语法结构
                if (trimmedLine == "{" || trimmedLine == "}")
                {
                    result.Add(line);
                }
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为重要的 Java 代码行
        /// </summary>
        private bool IsImportantJavaLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*package\s+",                  // package 声明
                @"^\s*import\s+",                   // import 语句
                @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*class\s+", // 类声明
                @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*interface\s+", // 接口声明
                @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*enum\s+", // 枚举声明
                @"^\s*@\w+",                        // 注解
                @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*\(",  // 方法声明
                @"^\s*(public|private|protected|static|final|volatile|transient)\s+.*\s+\w+\s*[{;=]", // 属性/字段声明
                @"^\s*{",                           // 开始大括号
                @"^\s*}",                           // 结束大括号
                @"^\s*throws\s+",                   // 异常声明
                @"^\s*extends\s+",                  // 继承声明
                @"^\s*implements\s+",               // 接口实现声明
                @"^\s*@Override",                   // 重写注解
                @"^\s*@Deprecated",                 // 弃用注解
                @"^\s*@SuppressWarnings",           // 忽略警告注解
                @"^\s*@FunctionalInterface",        // 函数式接口注解
                @"^\s*record\s+",                   // Java 16+ record 声明
                @"^\s*sealed\s+",                   // Java 17+ sealed 类声明
                @"^\s*permits\s+",                  // Java 17+ permits 声明
                @"^\s*non-sealed\s+"                // Java 17+ non-sealed 声明
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
        }

        /// <summary>
        /// 规范化 Java 重要代码行
        /// </summary>
        private string NormalizeJavaLine(string line)
        {
            var working = line.TrimEnd();

            // 处理 lambda 表达式
            var arrowIndex = working.IndexOf("->");
            if (arrowIndex >= 0)
            {
                var prefix = working.Substring(0, arrowIndex).TrimEnd();
                // 替换为空方法体
                return prefix + " -> { }";
            }

            // 处理字段/属性赋值
            var equalIndex = working.IndexOf('=');
            if (equalIndex >= 0 && !working.Contains("=="))
            {
                var prefix = working.Substring(0, equalIndex).TrimEnd();
                if (!prefix.EndsWith(";"))
                    prefix += ";";
                return prefix;
            }

            // 处理方法声明，确保方法体为空
            if (Regex.IsMatch(working, @"^\s*(public|private|protected|static|abstract|final|native|synchronized)\s+.*\)\s*\{?\s*$"))
            {
                if (!working.EndsWith("{"))
                    return working + " { }";
                else
                    return working;
            }

            return working;
        }
    }
} 