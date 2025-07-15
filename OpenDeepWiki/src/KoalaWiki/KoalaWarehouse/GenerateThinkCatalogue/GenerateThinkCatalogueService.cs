using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Core.Extensions;
using KoalaWiki.Domains;
using KoalaWiki.Domains.Warehouse;
using KoalaWiki.Entities;
using KoalaWiki.Prompts;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Newtonsoft.Json;

namespace KoalaWiki.KoalaWarehouse.GenerateThinkCatalogue;

public static class GenerateThinkCatalogueService
{
    public static async Task<DocumentResultCatalogue> GenerateCatalogue(string path, string gitRepository,
        string catalogue,
        Warehouse warehouse, ClassifyType? classify)
    {
        string promptName = nameof(PromptConstant.Warehouse.AnalyzeCatalogue);
        if (classify.HasValue)
        {
            promptName += classify;
        }

        string prompt = await PromptContext.Warehouse(promptName,
            new KernelArguments()
            {
                ["code_files"] = catalogue,
                ["git_repository_url"] = gitRepository.Replace(".git", ""),
                ["repository_name"] = warehouse.Name
            }, OpenAIOptions.AnalysisModel);

        DocumentResultCatalogue? result = null;

        var retryCount = 0;
        const int maxRetries = 5;
        Exception? exception = null;

        while (retryCount < maxRetries)
        {
            try
            {
                StringBuilder str = new StringBuilder();
                var history = new ChatHistory();
                history.AddSystemEnhance();
                history.AddUserMessage(prompt);

                history.AddAssistantMessage(
                    "Ok. Now I will start analyzing the core file. And I won't ask you questions or notify you. I will directly provide you with the required content. Please confirm");
                history.AddUserMessage(
                    "OK, I confirm that you can start analyzing the core file now. Please proceed with the analysis and provide the relevant content as required. There is no need to ask questions or notify me. The generated document structure will be refined and a complete and detailed directory structure of document types will be provided through project file reading and analysis.");

                var analysisModel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
                    OpenAIOptions.ChatApiKey, path, OpenAIOptions.AnalysisModel, false);

                var chat = analysisModel.Services.GetService<IChatCompletionService>();
                var settings = new OpenAIPromptExecutionSettings()
                {
                    ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
                    Temperature = 0.5,
                    MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.AnalysisModel)
                };

                await foreach (var item in chat.GetStreamingChatMessageContentsAsync(history,
                                   settings, analysisModel))
                {
                    str.Append(item);
                }

                if (DocumentOptions.RefineAndEnhanceQuality)
                {
                    history.AddAssistantMessage(str.ToString());
                    history.AddUserMessage(
                        "The directory you have provided now is not detailed enough, and the project code files have not been carefully analyzed.  Generate a complete project document directory structure and conduct a detailed analysis Organize hierarchically with clear explanations for each component's role and functionality. Please do your best and spare no effort.");

                    str.Clear();
                    await foreach (var item in chat.GetStreamingChatMessageContentsAsync(history, settings,
                                       analysisModel))
                    {
                        if (!string.IsNullOrEmpty(item.Content))
                        {
                            str.Append(item.Content);
                        }
                    }
                }

                // 可能需要先处理一下documentation_structure 有些模型不支持json
                var regex = new Regex(@"<documentation_structure>(.*?)</documentation_structure>",
                    RegexOptions.Singleline);
                var match = regex.Match(str.ToString());

                if (match.Success)
                {
                    // 提取到的内容
                    var extractedContent = match.Groups[1].Value;
                    str.Clear();
                    str.Append(extractedContent);
                }
                else
                {
                    // 尝试使用```json
                    var jsonRegex = new Regex(@"```json(.*?)```", RegexOptions.Singleline);
                    var jsonMatch = jsonRegex.Match(str.ToString());
                    if (jsonMatch.Success)
                    {
                        // 提取到的内容
                        var extractedContent = jsonMatch.Groups[1].Value;
                        str.Clear();
                        str.Append(extractedContent);
                    }
                    else
                    {
                        var jsonContentRegex = new Regex(@"\{(?:[^{}]|(?<open>{)|(?<-open>}))*(?(open)(?!))\}",
                            RegexOptions.Singleline);
                        var jsonContentMatch = jsonContentRegex.Match(str.ToString());

                        if (jsonContentMatch.Success)
                        {
                            // 提取到的内容
                            var extractedContent = jsonMatch.Groups[1].Value;
                            str.Clear();
                            str.Append(extractedContent);
                        }
                    }
                }


                try
                {
                    result = JsonConvert.DeserializeObject<DocumentResultCatalogue>(str.ToString().Trim()
                        .TrimStart("json"));
                }
                catch (Exception ex)
                {
                    Log.Logger.Error("反序列化失败: {ex}, 原始字符串: {str}", ex.ToString(), str.ToString().Trim());

                    // 开始尝试重试
                    Log.Logger.Information("处理仓库；{path} ,处理标题：{name} 失败:反序列化失败，开始尝试重试", path, warehouse.Name);
                    throw;
                }

                break;
            }
            catch (Exception ex)
            {
                Log.Logger.Warning("处理仓库；{path} ,处理标题：{name} 失败:{ex}", path, warehouse.Name, ex.ToString());
                exception = ex;
                retryCount++;
                if (retryCount >= maxRetries)
                {
                    Console.WriteLine($"处理 {warehouse.Name} 失败，已重试 {retryCount} 次，错误：{ex.Message}");
                }
                else
                {
                    // 等待一段时间后重试
                    await Task.Delay(5000 * retryCount);
                }
            }
        }

        return result;
    }
}