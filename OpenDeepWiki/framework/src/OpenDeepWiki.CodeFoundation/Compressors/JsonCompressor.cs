using System.Text.Json;
using System.Text.Json.Nodes;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class JsonCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            try
            {
                var documentOptions = new JsonDocumentOptions { CommentHandling = JsonCommentHandling.Skip };
                var jsonNode = JsonNode.Parse(content, nodeOptions: null, documentOptions);

                if (jsonNode == null)
                {
                    return string.Empty;
                }
                
                var compressedNode = StripValues(jsonNode);
                
                return compressedNode.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
            }
            catch (JsonException)
            {
                // 如果解析失败，返回原始内容的非空行，作为降级方案
                return new MarkdownCompressor().Compress(content);
            }
        }

        private JsonNode StripValues(JsonNode node)
        {
            if (node is JsonObject jsonObject)
            {
                var newObject = new JsonObject();
                foreach (var property in jsonObject)
                {
                    newObject[property.Key] = StripValues(property.Value);
                }
                return newObject;
            }

            if (node is JsonArray jsonArray)
            {
                var newArray = new JsonArray();
                if (jsonArray.Count > 0)
                {
                    // 只保留第一个元素的结构作为示例
                    var firstElement = jsonArray[0];
                    if (firstElement != null)
                    {
                        newArray.Add(StripValues(firstElement));
                    }
                }
                return newArray;
            }

            if (node is JsonValue)
            {
                // 将所有原始值替换为默认值
                return JsonValue.Create(default(string));
            }

            return node;
        }
    }
} 