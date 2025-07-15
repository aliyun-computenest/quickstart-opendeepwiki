using System.ClientModel.Primitives;
using System.Text.RegularExpressions;
using KoalaWiki.Domains;
using KoalaWiki.Dto;
using KoalaWiki.Prompts;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace KoalaWiki.KoalaWarehouse;

public class WarehouseClassify
{
    /// <summary>
    /// 根据仓库信息分析得出仓库分类
    /// </summary>
    public static async Task<ClassifyType?> ClassifyAsync(Kernel kernel, string catalog, string readme)
    {
        var prompt = await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.RepositoryClassification),
            new KernelArguments(new OpenAIPromptExecutionSettings()
            {
                Temperature = 0.1,
                MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.ChatModel)
            })
            {
                ["category"] = catalog,
                ["readme"] = readme
            }, OpenAIOptions.ChatModel);

        var result = string.Empty;
        var isDeep = false;

        await foreach (var i in kernel.InvokePromptStreamingAsync(prompt))
        {
            var jsonContent = JsonSerializer.Deserialize<OpenAIResponse>(ModelReaderWriter.Write(i.InnerContent));

            if (jsonContent?.choices.Length > 0)
            {
                if (string.IsNullOrEmpty(jsonContent.choices[0].message?.reasoning_content) &&
                    string.IsNullOrEmpty(jsonContent.choices[0].delta?.reasoning_content))
                {
                    if (isDeep)
                    {
                        result += "</think>";
                        isDeep = false;
                    }

                    result += i.ToString();
                    continue;
                }

                if (isDeep == false)
                {
                    result += "<think>";

                    isDeep = true;
                }

                // 提取分类结果
                result += jsonContent.choices[0].message?.reasoning_content ??
                          jsonContent.choices[0].delta?.reasoning_content;
            }
        }

        // 提取分类结果正则表达式<classify>(.*?)</classify>
        var regex = new Regex(@"<classify>(.*?)</classify>", RegexOptions.Singleline);

        var match = regex.Match(result);
        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value.Replace("classifyName:", "").Trim();

            // 将提取的内容转换为枚举类型
            if (Enum.TryParse<ClassifyType>(extractedContent, true, out var classifyType))
            {
                return classifyType;
            }
            else
            {
                return null;
            }
        }

        else
        {
            return null;
        }
    }
}