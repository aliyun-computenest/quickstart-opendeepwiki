using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class PhpCompressor : ICodeCompressor
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

                // 保留 PHP 开始/结束标签
                if (trimmedLine.StartsWith("<?php") || trimmedLine.StartsWith("<?") || trimmedLine.StartsWith("?>"))
                {
                    result.Add(line);
                    continue;
                }

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
                if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("#"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留重要结构
                if (IsImportantPhpLine(trimmedLine))
                {
                    result.Add(NormalizePhpLine(line));
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
        /// 判断是否为重要的 PHP 代码行
        /// </summary>
        private bool IsImportantPhpLine(string line)
        {
            var importantPatterns = new[]
            {
                @"^\s*namespace\s+",                // 命名空间声明
                @"^\s*use\s+",                      // use 语句
                @"^\s*require\s+",                  // require 语句
                @"^\s*require_once\s+",             // require_once 语句
                @"^\s*include\s+",                  // include 语句
                @"^\s*include_once\s+",             // include_once 语句
                @"^\s*class\s+",                    // 类声明
                @"^\s*interface\s+",                // 接口声明
                @"^\s*trait\s+",                    // trait 声明
                @"^\s*abstract\s+",                 // abstract 类/方法
                @"^\s*final\s+",                    // final 类/方法
                @"^\s*(public|private|protected)\s+", // 访问修饰符
                @"^\s*function\s+",                 // 函数声明
                @"^\s*\$\w+\s*=",                   // 变量赋值
                @"^\s*define\s*\(",                 // 常量定义
                @"^\s*const\s+",                    // 类常量
                @"^\s*{",                           // 开始大括号
                @"^\s*}",                           // 结束大括号
            };

            return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
        }

        /// <summary>
        /// 规范化 PHP 代码行
        /// </summary>
        private string NormalizePhpLine(string line)
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
            if (Regex.IsMatch(working, @"^\s*function\s+.*\)\s*{?\s*$"))
            {
                if (!working.EndsWith("{"))
                    return working + " {";
            }

            return working;
        }
    }
} 