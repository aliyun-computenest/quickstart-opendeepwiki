using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class CppCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            var lines = content.Split('\n');
            var result = new List<string>();
            var inMultiLineComment = false;
            var inPreprocessor = false;

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

                // 保留单行注释
                if (trimmedLine.StartsWith("//"))
                {
                    result.Add(line);
                    continue;
                }

                // 处理预处理指令
                if (trimmedLine.StartsWith("#"))
                {
                    result.Add(line);
                    inPreprocessor = trimmedLine.EndsWith("\\");
                    continue;
                }
                if (inPreprocessor)
                {
                    result.Add(line);
                    inPreprocessor = trimmedLine.EndsWith("\\");
                    continue;
                }

                // 保留重要结构行并对其进行规范化
                if (IsImportantCppLine(trimmedLine))
                {
                    result.Add(NormalizeCppLine(line));
                    continue;
                }

                // 保留独立的大括号以维持语法结构
                if (trimmedLine == "{" || trimmedLine == "}" || trimmedLine == "};")
                {
                    result.Add(line);
                }
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为重要的 C++ 代码行
        /// </summary>
        private bool IsImportantCppLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*#include\s+",                 // 头文件包含
                @"^\s*#define\s+",                  // 宏定义
                @"^\s*#if",                         // 条件编译开始
                @"^\s*#else",                       // 条件编译else
                @"^\s*#elif",                       // 条件编译elif
                @"^\s*#endif",                      // 条件编译结束
                @"^\s*#pragma",                     // 编译器指令
                @"^\s*namespace\s+",                // 命名空间声明
                @"^\s*using\s+",                    // using 声明
                @"^\s*template\s*<",                // 模板声明
                @"^\s*(class|struct|union|enum)\s+", // 类型声明
                @"^\s*(public|private|protected):",  // 访问修饰符
                @"^\s*(virtual|static|explicit|inline|constexpr|friend|extern|mutable)\s+", // 函数修饰符
                @"^\s*(const|volatile|noexcept|throw|final|override|delete|default)\s+", // 函数特性
                @"^\s*\w+::\w+\s*\(",               // 类方法实现
                @"^\s*\w+\s*\([^)]*\)\s*(\{|const|override|final|noexcept|throw|->|=|;)", // 函数声明/定义
                @"^\s*typedef\s+",                  // 类型定义
                @"^\s*using\s+\w+\s*=",             // 类型别名
                @"^\s*friend\s+",                   // 友元声明
                @"^\s*operator\s*",                 // 运算符重载
                @"^\s*~\w+\s*\(",                   // 析构函数
                @"^\s*\w+\s*\(\)\s*:\s*",           // 构造函数初始化列表
                @"^\s*static_assert\s*\(",          // 静态断言
                @"^\s*concept\s+",                  // C++20 概念
                @"^\s*requires\s+",                 // C++20 约束
                @"^\s*export\s+",                   // 模块导出
                @"^\s*import\s+",                   // 模块导入
                @"^\s*{",                           // 开始大括号
                @"^\s*}",                           // 结束大括号
                @"^\s*};",                          // 类/结构体定义结束
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
        }

        /// <summary>
        /// 规范化 C++ 重要代码行
        /// </summary>
        private string NormalizeCppLine(string line)
        {
            var working = line.TrimEnd();

            // 处理 lambda 表达式
            var lambdaIndex = working.IndexOf("](");
            if (lambdaIndex >= 0 && working.Contains("->"))
            {
                var arrowIndex = working.IndexOf("->");
                if (arrowIndex > lambdaIndex)
                {
                    var prefix = working.Substring(0, arrowIndex).TrimEnd();
                    return prefix + " -> { }";
                }
            }

            // 处理变量初始化
            var equalIndex = working.IndexOf('=');
            if (equalIndex >= 0 && !working.Contains("==") && !working.Contains("<=") && !working.Contains(">=") && !working.Contains("!="))
            {
                // 检查是否是类型别名或宏定义
                if (!Regex.IsMatch(working.Substring(0, equalIndex), @"^\s*(using|#define)"))
                {
                    var prefix = working.Substring(0, equalIndex).TrimEnd();
                    if (!prefix.EndsWith(";"))
                        prefix += ";";
                    return prefix;
                }
            }

            // 处理函数声明，确保函数体为空
            if (Regex.IsMatch(working, @"^\s*\w+\s*\([^)]*\)\s*(const|override|final|noexcept|throw)?\s*\{?\s*$"))
            {
                if (!working.EndsWith("{"))
                    return working + " { }";
                else
                    return working;
            }

            // 处理模板特化
            if (Regex.IsMatch(working, @"^\s*template\s*<.*>\s*$"))
            {
                return working;
            }

            return working;
        }
    }
} 