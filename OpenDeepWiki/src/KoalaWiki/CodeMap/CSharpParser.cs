// using System.Text.RegularExpressions;
// using Microsoft.CodeAnalysis.CSharp;
// using Microsoft.CodeAnalysis.CSharp.Syntax;
//
// namespace KoalaWiki.CodeMap;
//
// public class CSharpParser : ILanguageParser
// {
//     public List<string> ExtractImports(string fileContent)
//     {
//         var imports = new List<string>();
//         var syntaxTree = CSharpSyntaxTree.ParseText(fileContent);
//         var root = syntaxTree.GetCompilationUnitRoot();
//         
//         foreach (var usingDirective in root.Usings)
//         {
//             imports.Add(usingDirective.Name.ToString());
//         }
//             
//         return imports;
//     }
//
//     public List<Function> ExtractFunctions(string fileContent)
//     {
//         var functions = new List<Function>();
//         var syntaxTree = CSharpSyntaxTree.ParseText(fileContent);
//         var root = syntaxTree.GetCompilationUnitRoot();
//         
//         // 提取所有方法声明
//         var methodDeclarations = root.DescendantNodes().OfType<MethodDeclarationSyntax>();
//         
//         foreach (var method in methodDeclarations)
//         {
//             functions.Add(new Function
//             {
//                 Name = method.Identifier.ValueText,
//                 Body = method.Body?.ToString() ?? method.ExpressionBody?.ToString() ?? string.Empty
//             });
//         }
//             
//         return functions;
//     }
//
//     public List<string> ExtractFunctionCalls(string functionBody)
//     {
//         var functionCalls = new List<string>();
//             
//         try
//         {
//             var syntaxTree = CSharpSyntaxTree.ParseText($"class C {{ void M() {{ {functionBody} }} }}");
//             var root = syntaxTree.GetCompilationUnitRoot();
//             
//             // 提取所有方法调用
//             var invocations = root.DescendantNodes().OfType<InvocationExpressionSyntax>();
//             
//             foreach (var invocation in invocations)
//             {
//                 if (invocation.Expression is MemberAccessExpressionSyntax memberAccess)
//                 {
//                     functionCalls.Add(memberAccess.Name.Identifier.ValueText);
//                 }
//                 else if (invocation.Expression is IdentifierNameSyntax identifier)
//                 {
//                     functionCalls.Add(identifier.Identifier.ValueText);
//                 }
//             }
//         }
//         catch
//         {
//             // 使用正则表达式作为备用解析方法
//             var callRegex = new Regex(@"(\w+)\s*\(", RegexOptions.Compiled);
//             var matches = callRegex.Matches(functionBody);
//             
//             foreach (Match match in matches)
//             {
//                 var name = match.Groups[1].Value;
//                 if (!new[] { "if", "for", "while", "switch", "catch" }.Contains(name))
//                 {
//                     functionCalls.Add(name);
//                 }
//             }
//         }
//             
//         return functionCalls;
//     }
//
//     public string ResolveImportPath(string import, string currentFilePath, string basePath)
//     {
//         // C#使用命名空间而非直接引用文件，需要解析项目文件
//         var currentDir = Path.GetDirectoryName(currentFilePath);
//             
//         // 尝试从项目中查找类型
//         var parts = import.Split('.');
//         var typeName = parts.Last();
//             
//         // 在项目中查找包含此类型名称的文件
//         var possibleFiles = Directory.GetFiles(basePath, "*.cs", SearchOption.AllDirectories);
//             
//         foreach (var file in possibleFiles)
//         {
//             if (file == currentFilePath) continue;
//                 
//             var content = File.ReadAllText(file);
//             // 检查文件是否包含此类型声明
//             if (content.Contains($"class {typeName}") || 
//                 content.Contains($"struct {typeName}") || 
//                 content.Contains($"interface {typeName}") || 
//                 content.Contains($"enum {typeName}"))
//             {
//                 // 检查命名空间是否匹配
//                 var namespaceRegex = new Regex($@"namespace\s+({string.Join(@"\.", parts.Take(parts.Length - 1))})\s*{{");
//                 if (namespaceRegex.IsMatch(content))
//                 {
//                     return file;
//                 }
//             }
//         }
//             
//         return null;
//     }
//
//     public int GetFunctionLineNumber(string fileContent, string functionName)
//     {
//         var lines = fileContent.Split('\n');
//         var methodRegex = new Regex($@"\b{functionName}\s*\(");
//             
//         for (int i = 0; i < lines.Length; i++)
//         {
//             if (methodRegex.IsMatch(lines[i]) && lines[i].Contains("void") || 
//                 lines[i].Contains("int") || lines[i].Contains("string") || 
//                 lines[i].Contains("bool") || lines[i].Contains("object") ||
//                 lines[i].Contains("Task"))
//             {
//                 return i + 1;
//             }
//         }
//             
//         return 0;
//     }
// }