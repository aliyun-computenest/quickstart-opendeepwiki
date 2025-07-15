using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class JavaScriptCompressor : ICodeCompressor
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
                if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("/*"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留重要结构并进行规范化
                if (IsImportantJavaScriptLine(trimmedLine))
                {
                    result.Add(NormalizeJavaScriptLine(line));
                    continue;
                }

                // 保留独立的大括号
                if (trimmedLine == "{" || trimmedLine == "}")
                {
                    result.Add(trimmedLine);
                }
            }

            return string.Join("\n", result);
        }
        
        /// <summary>
        /// 规范化 JavaScript/TypeScript 重要代码行：
        /// 1. 移除箭头函数/表达式主体实现
        /// 2. 移除变量赋值右侧表达式
        /// </summary>
        private string NormalizeJavaScriptLine(string line)
        {
            var working = line.TrimEnd();

            // 1. 统一处理函数/方法体，将其替换为 {}
            // 匹配以 { 结尾的行，并且不是单独的 {
            if (working.EndsWith("{") && working.Trim() != "{")
            {
                // 找到最后一个 ')' 或 '=>'，这通常是函数签名的结束
                var signatureEnd = working.LastIndexOf(')');
                var arrowEnd = working.LastIndexOf("=>");
                var lastIndex = Math.Max(signatureEnd, arrowEnd + 1);

                if (lastIndex > -1 && lastIndex < working.Length - 1)
                {
                    var prefix = working.Substring(0, lastIndex + 1).TrimEnd();
                    return prefix + " {}";
                }
            }
            
            // 2. 处理箭头函数 =>
            var arrowIndex = working.IndexOf("=>");
            if (arrowIndex >= 0)
            {
                // 避免处理已经有 {} 的情况
                if (!working.Substring(arrowIndex).Contains("{"))
                {
                    var prefix = working.Substring(0, arrowIndex).TrimEnd();
                    return prefix + " => {}";
                }
            }

            // 3. 处理变量赋值，仅当它是函数表达式时
            var equalIndex = working.IndexOf('=');
            if (equalIndex > 0 && (working.Contains("function") || working.Contains("=>")))
            {
                 // 这部分逻辑主要由上面的函数体处理覆盖，这里作为一个补充
                 // 对于复杂的单行函数，保留其定义，由上面的逻辑处理
                 return working;
            }
            // 对于非函数的重要行（如 import/export），保持原样
            else if (equalIndex == -1)
            {
                return working;
            }

            // 对于其他情况，如果不是函数赋值，则可能是一个简单的值，我们不在这里处理
            // IsImportantJavaScriptLine 应该足够智能以避免匹配它们
            return working;
        }

        /// <summary>
        /// 判断是否为重要的 JavaScript/TypeScript 代码行
        /// </summary>
        private bool IsImportantJavaScriptLine(string line)
        {
            // 这组正则表达式旨在更精确地捕获结构性代码
            var importantPatterns = new[]
            {
                // ES6+ 模块导入/导出
                @"^\s*(import|export)\s+",

                // 类、接口、枚举、类型别名声明 (支持 public/private/protected 等 TS 修饰符)
                @"^\s*((public|private|protected|static|readonly|abstract|async)\s+)*\s*(class|interface|enum|type)\s+\w+",

                // 标准函数声明 (function foo() {}) 和生成器函数 (function* foo() {})
                @"^\s*(async\s+)?function\*?\s+\w+\s*\(",

                // 变量/常量声明，且其值为函数表达式或箭头函数
                @"^\s*(const|let|var)\s+[\w\d_]+\s*[:=]\s*(async\s+)?(\([^)]*\)|[\w\d_]+)\s*=>", // const myFunc = (a) => ...
                @"^\s*(const|let|var)\s+[\w\d_]+\s*=\s*(async\s+)?function\*?", // const myFunc = function...
                
                // 类或对象中的方法定义
                @"^\s*(static\s+|get\s+|set\s+|async\s+)?\*?[\w\d_]+\s*\([^)]*\)\s*\{", // myMethod(args) {
                @"^\s*[\w\d_]+\s*:\s*(async\s+)?(function\*?\(|\([^)]*\)\s*=>)", // myProp: function() 或 myProp: () =>

                // 独立的大括号
                @"^\s*\{",
                @"^\s*}"
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }
    }
} 