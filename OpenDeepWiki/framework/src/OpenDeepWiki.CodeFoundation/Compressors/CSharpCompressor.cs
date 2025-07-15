using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System.Collections.Generic;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class CSharpCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            // 使用最新的 C# 语言版本解析代码
            SyntaxTree tree = CSharpSyntaxTree.ParseText(content, new CSharpParseOptions(LanguageVersion.Latest));
            var root = tree.GetRoot();

            // 使用自定义的 Rewriter 遍历和修改语法树
            var rewriter = new EmptyBodyRewriter();
            var rewrittenRoot = rewriter.Visit(root);
            
            // 格式化修改后的代码，使其更整洁
            rewrittenRoot = rewrittenRoot.NormalizeWhitespace();

            return rewrittenRoot.ToFullString();
        }

        /// <summary>
        /// 一个基于 CSharpSyntaxRewriter 的访问者，用于清空方法体和移除实现细节。
        /// </summary>
        private class EmptyBodyRewriter : CSharpSyntaxRewriter
        {
            // 处理方法声明
            public override SyntaxNode VisitMethodDeclaration(MethodDeclarationSyntax node)
            {
                // 如果方法已经没有方法体（如接口定义、抽象方法），则不做改变
                if (node.Body == null && node.ExpressionBody == null)
                {
                    return base.VisitMethodDeclaration(node);
                }

                // 移除方法体和表达式体，并添加分号，将其转换为例 "public void MyMethod();"
                return node.WithBody(null)
                           .WithExpressionBody(null)
                           .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken));
            }

            // 处理构造函数声明
            public override SyntaxNode VisitConstructorDeclaration(ConstructorDeclarationSyntax node)
            {
                if (node.Body == null && node.ExpressionBody == null)
                {
                    return base.VisitConstructorDeclaration(node);
                }

                return node.WithBody(null)
                           .WithExpressionBody(null)
                           .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken));
            }
            
            // 处理析构函数声明
            public override SyntaxNode VisitDestructorDeclaration(DestructorDeclarationSyntax node)
            {
                 if (node.Body == null && node.ExpressionBody == null)
                {
                    return base.VisitDestructorDeclaration(node);
                }

                return node.WithBody(null)
                           .WithExpressionBody(null)
                           .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken));
            }

            // 处理属性声明
            public override SyntaxNode VisitPropertyDeclaration(PropertyDeclarationSyntax node)
            {
                var newNode = node;

                // 1. 移除初始化器
                if (newNode.Initializer != null)
                {
                    newNode = newNode.WithInitializer(null);
                }

                // 2. 处理表达式体属性 (=>)
                if (newNode.ExpressionBody != null)
                {
                    // 转换为带 get 访问器的属性
                    var getter = SyntaxFactory.AccessorDeclaration(SyntaxKind.GetAccessorDeclaration)
                                              .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken));
                    
                    newNode = newNode.WithExpressionBody(null)
                                     .WithAccessorList(SyntaxFactory.AccessorList(SyntaxFactory.SingletonList(getter)))
                                     .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.None));
                }
                
                // 3. 清理 get/set 访问器的方法体
                if (newNode.AccessorList != null)
                {
                    var cleanedAccessors = new List<AccessorDeclarationSyntax>();
                    foreach (var accessor in newNode.AccessorList.Accessors)
                    {
                        if (accessor.Body != null || accessor.ExpressionBody != null)
                        {
                            cleanedAccessors.Add(accessor.WithBody(null).WithExpressionBody(null).WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken)));
                        }
                        else
                        {
                            cleanedAccessors.Add(accessor);
                        }
                    }
                    newNode = newNode.WithAccessorList(newNode.AccessorList.WithAccessors(SyntaxFactory.List(cleanedAccessors)));
                }

                // 4. 如果有访问器列表，移除末尾的分号
                if (newNode.AccessorList != null && newNode.SemicolonToken.IsKind(SyntaxKind.SemicolonToken))
                {
                     newNode = newNode.WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.None));
                }

                return base.VisitPropertyDeclaration(newNode);
            }

            // 处理索引器声明
            public override SyntaxNode VisitIndexerDeclaration(IndexerDeclarationSyntax node)
            {
                var newNode = node;
                if (newNode.ExpressionBody != null)
                {
                    // 将表达式体转换为带 get 访问器的索引器
                    var getter = SyntaxFactory.AccessorDeclaration(SyntaxKind.GetAccessorDeclaration)
                                              .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken));

                    newNode = newNode.WithExpressionBody(null)
                                     .WithAccessorList(SyntaxFactory.AccessorList(SyntaxFactory.SingletonList(getter)))
                                     .WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.None));
                }
                
                if (newNode.AccessorList != null)
                {
                    var cleanedAccessors = new List<AccessorDeclarationSyntax>();
                    foreach (var accessor in newNode.AccessorList.Accessors)
                    {
                        if (accessor.Body != null || accessor.ExpressionBody != null)
                        {
                            cleanedAccessors.Add(accessor.WithBody(null).WithExpressionBody(null).WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken)));
                        }
                        else
                        {
                            cleanedAccessors.Add(accessor);
                        }
                    }
                    newNode = newNode.WithAccessorList(newNode.AccessorList.WithAccessors(SyntaxFactory.List(cleanedAccessors)));
                }

                return base.VisitIndexerDeclaration(newNode);
            }

            // 处理字段声明，移除初始化值
            public override SyntaxNode VisitFieldDeclaration(FieldDeclarationSyntax node)
            {
                var declarators = new List<VariableDeclaratorSyntax>();
                bool madeChange = false;
                foreach (var variable in node.Declaration.Variables)
                {
                    if (variable.Initializer != null)
                    {
                        declarators.Add(variable.WithInitializer(null));
                        madeChange = true;
                    }
                    else
                    {
                        declarators.Add(variable);
                    }
                }

                if (madeChange)
                {
                    var newDeclaration = node.Declaration.WithVariables(SyntaxFactory.SeparatedList(declarators));
                    return node.WithDeclaration(newDeclaration);
                }

                return base.VisitFieldDeclaration(node);
            }
             
             // 处理事件字段声明
             public override SyntaxNode VisitEventFieldDeclaration(EventFieldDeclarationSyntax node)
             {
                var declarators = new List<VariableDeclaratorSyntax>();
                bool madeChange = false;
                foreach (var variable in node.Declaration.Variables)
                {
                    if (variable.Initializer != null)
                    {
                        declarators.Add(variable.WithInitializer(null));
                        madeChange = true;
                    }
                    else
                    {
                        declarators.Add(variable);
                    }
                }

                if (madeChange)
                {
                    var newDeclaration = node.Declaration.WithVariables(SyntaxFactory.SeparatedList(declarators));
                    return node.WithDeclaration(newDeclaration);
                }

                return base.VisitEventFieldDeclaration(node);
             }
        }
    }
} 