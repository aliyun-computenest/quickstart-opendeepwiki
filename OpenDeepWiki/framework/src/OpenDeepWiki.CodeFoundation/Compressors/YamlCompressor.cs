using System.IO;
using YamlDotNet.Core;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.ObjectGraphVisitors;

namespace OpenDeepWiki.CodeFoundation.Compressors
{
    public class YamlCompressor : ICodeCompressor
    {
        public string Compress(string content)
        {
            try
            {
                var deserializer = new DeserializerBuilder().Build();
                var serializer = new SerializerBuilder().Build();

                var yamlObject = deserializer.Deserialize(new StringReader(content));

                // 如果 YAML 为空或只是一个标量，则直接返回空字符串
                if (yamlObject == null || !(yamlObject is System.Collections.IDictionary || yamlObject is System.Collections.IList))
                {
                    return string.Empty;
                }

                // 创建一个访问者来转换值
                var valueStripper = new ValueStrippingVisitor();
                var processedObject = valueStripper.Strip(yamlObject);
                
                return serializer.Serialize(processedObject);
            }
            catch (YamlException)
            {
                // Fallback for invalid YAML
                return new MarkdownCompressor().Compress(content);
            }
        }
    }
    
    /// <summary>
    /// 递归地遍历反序列化后的对象，并将所有非集合类型的值替换为空字符串。
    /// </summary>
    public class ValueStrippingVisitor
    {
        public object Strip(object value)
        {
            if (value is System.Collections.IDictionary dictionary)
            {
                var newDict = new System.Collections.Generic.Dictionary<object, object>();
                foreach (var entry in dictionary.Keys)
                {
                    newDict[entry] = Strip(dictionary[entry]);
                }
                return newDict;
            }

            if (value is System.Collections.IList list)
            {
                var newList = new System.Collections.Generic.List<object>();
                foreach (var item in list)
                {
                    newList.Add(Strip(item));
                }
                // 对于列表，我们只保留一个示例结构，避免过长的输出
                if (newList.Count > 1)
                {
                    return new System.Collections.Generic.List<object> { newList[0] };
                }
                return newList;
            }

            // 对于所有其他类型（字符串、数字、布尔值等），替换为空字符串
            return string.Empty;
        }
    }
} 