using System.Diagnostics;
using System.Text;
using KoalaWiki.Domains.MCP;
using KoalaWiki.Functions;
using KoalaWiki.Prompts;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using ModelContextProtocol.Server;
using OpenAI.Chat;

namespace KoalaWiki.MCP.Tools;

public sealed class WarehouseTool(IKoalaWikiContext koala)
{
    /// <summary>
    /// 生成仓库文档
    /// </summary>
    /// <param name="server"></param>
    /// <param name="question"></param>
    /// <returns></returns>
    /// <exception cref="Exception"></exception>
    public async Task<string> GenerateDocumentAsync(
        IMcpServer server,
        string question)
    {
        var name = server.ServerOptions.Capabilities!.Experimental["name"].ToString();
        var owner = server.ServerOptions.Capabilities!.Experimental["owner"].ToString();

        var warehouse = await koala.Warehouses
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrganizationName == owner && x.Name == name);

        if (warehouse == null)
        {
            throw new Exception($"抱歉，您的仓库 {owner}/{name} 不存在或已被删除。");
        }

        var document = await koala.Documents
            .AsNoTracking()
            .Where(x => x.WarehouseId == warehouse.Id)
            .FirstOrDefaultAsync();

        if (document == null)
        {
            throw new Exception("抱歉，您的仓库没有文档，请先生成仓库文档。");
        }

        // 找到是否有相似的提问
        var similarQuestion = await koala.MCPHistories
            .AsNoTracking()
            .Where(x => x.WarehouseId == warehouse.Id && x.Question == question)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        // 如果是3天内的提问，直接返回
        if (similarQuestion != null && (DateTime.Now - similarQuestion.CreatedAt).TotalDays < 3)
        {
            return similarQuestion.Answer;
        }


        var kernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey, document.GitPath, OpenAIOptions.DeepResearchModel, false);

        var chat = kernel.GetRequiredService<IChatCompletionService>();

        // 解析仓库的目录结构
        var path = document.GitPath;

        var fileKernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey, path, OpenAIOptions.DeepResearchModel, false);

        var history = new ChatHistory();

        var readme = await DocumentsService.GenerateReadMe(warehouse, document.GitPath, koala);

        var catalogue = warehouse.OptimizedDirectoryStructure;
        if (string.IsNullOrWhiteSpace(catalogue))
        {
            catalogue = await DocumentsService.GetCatalogueSmartFilterAsync(document.GitPath, readme);
            if (!string.IsNullOrWhiteSpace(catalogue))
            {
                await koala.Warehouses.Where(x => x.Id == warehouse.Id)
                    .ExecuteUpdateAsync(x => x.SetProperty(y => y.OptimizedDirectoryStructure, catalogue));
            }
        }

        history.AddUserMessage(await PromptContext.Chat(nameof(PromptConstant.Chat.Responses),
            new KernelArguments()
            {
                ["catalogue"] = warehouse.OptimizedDirectoryStructure,
                ["repository_url"] = warehouse.Address,
                ["question"] = question,
            }, OpenAIOptions.ChatModel));

        var first = true;

        DocumentContext.DocumentStore = new DocumentStore();

        var sw = Stopwatch.StartNew();
        var sb = new StringBuilder();

        try
        {
            await foreach (var chatItem in chat.GetStreamingChatMessageContentsAsync(history,
                               new OpenAIPromptExecutionSettings()
                               {
                                   ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
                                   MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.ChatModel),
                                   Temperature = 0.5
                               }, fileKernel))
            {
                // 发送数据
                if (chatItem.InnerContent is StreamingChatCompletionUpdate message)
                {
                    if (string.IsNullOrEmpty(chatItem.Content))
                    {
                        continue;
                    }

                    if (!string.IsNullOrEmpty(chatItem.Content))
                    {
                        sb.Append(chatItem.Content);
                    }
                }
            }

            sw.Stop();

            var mcpHistory = new MCPHistory()
            {
                Id = Guid.NewGuid().ToString(),
                CostTime = (int)sw.ElapsedMilliseconds,
                CreatedAt = DateTime.Now,
                Question = question,
                Answer = sb.ToString(),
                WarehouseId = warehouse.Id,
                UserAgent = string.Empty,
                Ip = string.Empty,
                UserId = string.Empty
            };

            await koala.MCPHistories.AddAsync(mcpHistory);
            await koala.SaveChangesAsync();

            return sb.ToString();
        }
        catch (Exception e)
        {
            return "抱歉，发生了错误: " + e.Message;
        }
    }
}