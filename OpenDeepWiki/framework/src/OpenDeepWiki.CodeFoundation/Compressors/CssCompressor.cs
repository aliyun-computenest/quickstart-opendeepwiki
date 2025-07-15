using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class CssCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            var lines = content.Split('\n');
            var result = new List<string>();
            var inComment = false;

            foreach (var rawLine in lines)
            {
                var line = rawLine;
                var trimmedLine = line.Trim();
                
                if (string.IsNullOrWhiteSpace(trimmedLine))
                    continue;

                // 处理 CSS 注释
                if (trimmedLine.StartsWith("/*"))
                {
                    inComment = true;
                    result.Add(line);
                    if (trimmedLine.Contains("*/"))
                        inComment = false;
                    continue;
                }
                if (inComment)
                {
                    result.Add(line);
                    if (trimmedLine.Contains("*/"))
                        inComment = false;
                    continue;
                }

                // 保留选择器和属性声明
                if (IsImportantCssLine(trimmedLine))
                {
                    result.Add(NormalizeCssLine(line));
                    continue;
                }

                // 保留大括号
                if (trimmedLine == "{" || trimmedLine == "}")
                {
                    result.Add(line);
                    continue;
                }
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为重要的 CSS 代码行
        /// </summary>
        private bool IsImportantCssLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*@import\s+",                  // @import 规则
                @"^\s*@media\s+",                   // @media 规则
                @"^\s*@font-face\s+",               // @font-face 规则
                @"^\s*@keyframes\s+",               // @keyframes 规则
                @"^\s*@supports\s+",                // @supports 规则
                @"^\s*@charset\s+",                 // @charset 规则
                @"^\s*@page\s+",                    // @page 规则
                @"^\s*@namespace\s+",               // @namespace 规则
                @"^\s*@counter-style\s+",           // @counter-style 规则
                @"^\s*@document\s+",                // @document 规则
                @"^\s*@viewport\s+",                // @viewport 规则
                @"^\s*[.#]?[a-z][a-z0-9_-]*",       // 选择器
                @"^\s*\[",                          // 属性选择器
                @"^\s*:",                           // 伪类选择器
                @"^\s*::",                          // 伪元素选择器
                @"^\s*>",                           // 子选择器
                @"^\s*\+",                          // 相邻兄弟选择器
                @"^\s*~",                           // 一般兄弟选择器
                @"^\s*\*",                          // 通用选择器
                @"^\s*[a-z-]+\s*:",                 // 属性声明
                @"^\s*{",                           // 开始大括号
                @"^\s*}",                           // 结束大括号
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
        }

        /// <summary>
        /// 规范化 CSS 代码行
        /// </summary>
        private string NormalizeCssLine(string line)
        {
            var working = line.TrimEnd();

            // 处理属性声明，移除值部分
            var colonIndex = working.IndexOf(':');
            if (colonIndex >= 0 && !working.StartsWith("@") && !working.StartsWith(":"))
            {
                var prefix = working.Substring(0, colonIndex + 1);
                return prefix;
            }

            return working;
        }
    }
} 