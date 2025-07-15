namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class SqlCompressor : ICodeCompressor
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

                // 保留单行注释
                if (trimmedLine.StartsWith("--"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留多行注释
                if (trimmedLine.StartsWith("/*"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留重要的 SQL 结构
                if (IsImportantSqlLine(trimmedLine))
                {
                    result.Add(line);
                    continue;
                }
            }

            return string.Join("\n", result);
        }

        /// <summary>
        /// 判断是否为重要的 SQL 代码行
        /// </summary>
        private bool IsImportantSqlLine(string line)
        {
            // 转换为大写以进行不区分大小写的比较
            var upperLine = line.ToUpper();
            
            var importantKeywords = new[]
            {
                "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", 
                "FULL", "CROSS", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
                "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE",
                "TABLE", "VIEW", "INDEX", "PROCEDURE", "FUNCTION", "TRIGGER", "SCHEMA",
                "DATABASE", "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "BEGIN", "TRANSACTION",
                "WITH", "UNION", "INTERSECT", "EXCEPT", "CASE", "WHEN", "THEN", "ELSE", "END"
            };

            return importantKeywords.Any(keyword => upperLine.Contains(keyword));
        }
    }
} 