using System.Linq;
using System.Xml.Linq;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class XmlCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            try
            {
                var doc = XDocument.Parse(content, LoadOptions.PreserveWhitespace);
                StripValues(doc.Root);
                return doc.ToString();
            }
            catch
            {
                // Fallback for invalid XML
                return new MarkdownCompressor().Compress(content);
            }
        }

        private void StripValues(XElement element)
        {
            if (element == null) return;

            // Remove text content from the current element
            var textNodes = element.Nodes().OfType<XText>().ToList();
            foreach (var textNode in textNodes)
            {
                textNode.Remove();
            }

            // Clear attribute values
            foreach (var attribute in element.Attributes())
            {
                attribute.Value = "";
            }

            // Recurse for all child elements
            foreach (var child in element.Elements())
            {
                StripValues(child);
            }
        }
    }
} 