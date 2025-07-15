namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class MarkdownCompressor : ICodeCompressor
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
                if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("#") || trimmedLine.StartsWith("---"))
                {
                    result.Add(line);
                    continue;
                }

                // 保留非空行
                result.Add(trimmedLine);
            }

            return string.Join("\n", result);
        }
    }
} 