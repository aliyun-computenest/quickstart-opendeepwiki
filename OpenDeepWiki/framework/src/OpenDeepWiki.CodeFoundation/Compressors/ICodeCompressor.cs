using System.Text.RegularExpressions;

namespace OpenDeepWiki.CodeFoundation.Compressors;

public interface ICodeCompressor
{
    string Compress(string content);
} 