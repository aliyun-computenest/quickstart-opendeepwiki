using AngleSharp.Dom;
using AngleSharp.Html.Parser;
using System.IO;
using System.Linq;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class HtmlCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            try
            {
                var parser = new HtmlParser();
                var document = parser.ParseDocument(content);

                StripContent(document.Body);

                // 使用自定义的格式化器输出，以获得更好的控制
                var writer = new StringWriter();
                var formatter = new AngleSharp.Html.PrettyMarkupFormatter
                {
                    Indentation = "  ",
                    NewLine = "\n"
                };
                document.ToHtml(writer, formatter);
                return writer.ToString();
            }
            catch
            {
                // Fallback for invalid HTML
                return new MarkdownCompressor().Compress(content);
            }
        }

        private void StripContent(INode node)
        {
            if (node == null) return;
            
            // 收集要移除的子节点
            var nodesToRemove = node.ChildNodes
                .Where(n => n.NodeType == NodeType.Text || n.NodeType == NodeType.Comment)
                .ToList();

            // 移除它们
            foreach (var child in nodesToRemove)
            {
                node.RemoveChild(child);
            }

            // 对所有剩余的元素子节点进行递归处理
            foreach (var child in node.ChildNodes.OfType<IElement>())
            {
                StripContent(child);
            }
        }
    }
} 