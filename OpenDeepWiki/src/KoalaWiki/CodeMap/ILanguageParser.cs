namespace KoalaWiki.CodeMap;

public interface ILanguageParser
{
    List<string> ExtractImports(string fileContent);
    List<Function> ExtractFunctions(string fileContent);
    List<string> ExtractFunctionCalls(string functionBody);
    string ResolveImportPath(string import, string currentFilePath, string basePath);
    int GetFunctionLineNumber(string fileContent, string functionName);
}