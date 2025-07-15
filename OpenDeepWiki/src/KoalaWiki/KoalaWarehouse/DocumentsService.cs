using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using KoalaWiki.Domains;
using KoalaWiki.Domains.Warehouse;
using KoalaWiki.Entities;
using KoalaWiki.Functions;
using KoalaWiki.KoalaWarehouse.DocumentPending;
using KoalaWiki.KoalaWarehouse.GenerateThinkCatalogue;
using KoalaWiki.KoalaWarehouse.Overview;
using KoalaWiki.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace KoalaWiki.KoalaWarehouse;

public partial class DocumentsService
{
    private static readonly ActivitySource s_activitySource = new("KoalaWiki.Warehouse");

    /// <summary>
    /// Handles the asynchronous processing of a document within a specified warehouse, including parsing directory structures, generating update logs, and saving results to the database.
    /// </summary>
    /// <param name="document">The document to be processed.</param>
    /// <param name="warehouse">The warehouse associated with the document.</param>
    /// <param name="dbContext">The database context used for data operations.</param>
    /// <param name="gitRepository">The Git repository address related to the document.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task HandleAsync(Document document, Warehouse warehouse, IKoalaWikiContext dbContext,
        string gitRepository)
    {
        // 在WarehouseTask的Activity上下文中创建子Activity，形成完整的调用链
        using var activity = s_activitySource.StartActivity(ActivityKind.Server);
        activity?.SetTag("warehouse.id", warehouse.Id);
        activity?.SetTag("warehouse.name", warehouse.Name);
        activity?.SetTag("document.id", document.Id);
        activity?.SetTag("git.repository", gitRepository);

        using var handle = Activity.Current?.Source.StartActivity("处理文档完整流程",
            ActivityKind.Internal);

        // 解析仓库的目录结构
        var path = document.GitPath;

        var kernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey,
            path, OpenAIOptions.ChatModel);

        var fileKernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey, path, OpenAIOptions.ChatModel, false);

        // 步骤1: 读取生成README
        string readme;
        using (var readmeActivity = s_activitySource.StartActivity("读取生成README"))
        {
            readmeActivity?.SetTag("warehouse.id", warehouse.Id);
            readmeActivity?.SetTag("path", path);
            readme = await GenerateReadMe(warehouse, path, dbContext);
            readmeActivity?.SetTag("readme.length", readme?.Length ?? 0);
        }

        // 步骤2: 读取并且生成目录
        string catalogue;
        using (var catalogueActivity = s_activitySource.StartActivity("读取并生成目录结构"))
        {
            catalogueActivity?.SetTag("warehouse.id", warehouse.Id);
            catalogue = warehouse.OptimizedDirectoryStructure;

            if (string.IsNullOrWhiteSpace(catalogue))
            {
                catalogueActivity?.SetTag("action", "generate_new_catalogue");
                catalogue = await GetCatalogueSmartFilterOptimizedAsync(path, readme);
                if (!string.IsNullOrWhiteSpace(catalogue))
                {
                    await dbContext.Warehouses.Where(x => x.Id == warehouse.Id)
                        .ExecuteUpdateAsync(x => x.SetProperty(y => y.OptimizedDirectoryStructure, catalogue));
                }
            }
            else
            {
                catalogueActivity?.SetTag("action", "use_existing_catalogue");
            }

            catalogueActivity?.SetTag("catalogue.length", catalogue?.Length ?? 0);
        }

        // 步骤3: 读取或生成项目类别
        ClassifyType? classify;
        using (var classifyActivity = s_activitySource.StartActivity("读取或生成项目类别"))
        {
            classifyActivity?.SetTag("warehouse.id", warehouse.Id);
            classify = warehouse.Classify ?? await WarehouseClassify.ClassifyAsync(fileKernel, catalogue, readme);
            classifyActivity?.SetTag("classify", classify?.ToString());
        }

        await dbContext.Warehouses.Where(x => x.Id == warehouse.Id)
            .ExecuteUpdateAsync(x => x.SetProperty(y => y.Classify, classify));

        // 步骤4: 生成知识图谱
        using (var miniMapActivity = s_activitySource.StartActivity("生成知识图谱"))
        {
            miniMapActivity?.SetTag("warehouse.id", warehouse.Id);
            miniMapActivity?.SetTag("path", path);
            var miniMap = await MiniMapService.GenerateMiniMap(catalogue, warehouse, path);
            await dbContext.MiniMaps.Where(x => x.WarehouseId == warehouse.Id)
                .ExecuteDeleteAsync();
            await dbContext.MiniMaps.AddAsync(new MiniMap()
            {
                Id = Guid.NewGuid().ToString("N"),
                WarehouseId = warehouse.Id,
                Value = JsonSerializer.Serialize(miniMap, JsonSerializerOptions.Web)
            });
            miniMapActivity?.SetTag("minimap.generated", true);
        }

        // 步骤5: 生成概述
        string overview;
        using (var overviewActivity = s_activitySource.StartActivity("生成项目概述"))
        {
            overviewActivity?.SetTag("warehouse.id", warehouse.Id);
            overviewActivity?.SetTag("git.repository", gitRepository);
            overviewActivity?.SetTag("branch", warehouse.Branch);
            overview = await OverviewService.GenerateProjectOverview(fileKernel, catalogue, gitRepository,
                warehouse.Branch, readme, classify);

            // 先删除<project_analysis>标签内容
            var project_analysis = new Regex(@"<project_analysis>(.*?)</project_analysis>",
                RegexOptions.Singleline);
            var project_analysis_match = project_analysis.Match(overview);
            if (project_analysis_match.Success)
            {
                // 删除到的内容包括标签
                overview = overview.Replace(project_analysis_match.Value, "");
            }

            // 可能需要先处理一下documentation_structure 有些模型不支持json
            var overviewmatch = new Regex(@"<blog>(.*?)</blog>",
                RegexOptions.Singleline).Match(overview);

            if (overviewmatch.Success)
            {
                // 提取到的内容
                overview = overviewmatch.Groups[1].Value;
            }

            await dbContext.DocumentOverviews.Where(x => x.DocumentId == document.Id)
                .ExecuteDeleteAsync();

            await dbContext.DocumentOverviews.AddAsync(new DocumentOverview()
            {
                Content = overview,
                Title = "",
                DocumentId = document.Id,
                Id = Guid.NewGuid().ToString("N")
            });

            overviewActivity?.SetTag("overview.length", overview?.Length ?? 0);
        }

        // 步骤6: 生成目录结构
        List<DocumentCatalog> documentCatalogs;
        using (var catalogueStructureActivity = s_activitySource.StartActivity("生成目录结构"))
        {
            catalogueStructureActivity?.SetTag("warehouse.id", warehouse.Id);
            var result = await GenerateThinkCatalogueService.GenerateCatalogue(path, gitRepository, catalogue,
                warehouse,
                classify);

            documentCatalogs = new List<DocumentCatalog>();
            // 递归处理目录层次结构
            DocumentsHelper.ProcessCatalogueItems(result.items, null, warehouse, document, documentCatalogs);

            documentCatalogs.ForEach(x =>
            {
                x.IsCompleted = false;
                if (string.IsNullOrWhiteSpace(x.Prompt))
                {
                    x.Prompt = " ";
                }
            });

            // 删除遗留数据
            await dbContext.DocumentCatalogs.Where(x => x.WarehouseId == warehouse.Id)
                .ExecuteDeleteAsync();

            // 将解析的目录结构保存到数据库
            await dbContext.DocumentCatalogs.AddRangeAsync(documentCatalogs);

            await dbContext.SaveChangesAsync();
            catalogueStructureActivity?.SetTag("documents.count", documentCatalogs.Count);
        }

        // 步骤7: 生成目录结构中的文档
        using (var documentsGenerationActivity = s_activitySource.StartActivity("生成目录结构中的文档"))
        {
            documentsGenerationActivity?.SetTag("warehouse.id", warehouse.Id);
            documentsGenerationActivity?.SetTag("documents.count", documentCatalogs.Count);
            await DocumentPendingService.HandlePendingDocumentsAsync(documentCatalogs, fileKernel, catalogue,
                gitRepository,
                warehouse, path, dbContext, warehouse.Classify);
        }

        // 步骤8: 生成更新日志 (仅Git仓库)
        if (warehouse.Type.Equals("git", StringComparison.CurrentCultureIgnoreCase))
        {
            using var updateLogActivity = s_activitySource.StartActivity("生成更新日志");
            updateLogActivity?.SetTag("warehouse.id", warehouse.Id);
            updateLogActivity?.SetTag("warehouse.type", "git");
            updateLogActivity?.SetTag("git.address", warehouse.Address);
            updateLogActivity?.SetTag("git.branch", warehouse.Branch);

            await dbContext.DocumentCommitRecords.Where(x => x.WarehouseId == warehouse.Id)
                .ExecuteDeleteAsync();

            // 开始生成
            var committer = await GenerateUpdateLogAsync(document.GitPath, readme,
                warehouse.Address,
                warehouse.Branch,
                kernel);

            var record = committer.Select(x => new DocumentCommitRecord()
            {
                WarehouseId = warehouse.Id,
                CreatedAt = DateTime.Now,
                Author = string.Empty,
                Id = Guid.NewGuid().ToString("N"),
                CommitMessage = x.description,
                Title = x.title,
                LastUpdate = x.date,
            });

            // 如果重新生成则需要清空之前记录
            await dbContext.DocumentCommitRecords.Where(x => x.WarehouseId == warehouse.Id)
                .ExecuteDeleteAsync();

            await dbContext.DocumentCommitRecords.AddRangeAsync(record);
            updateLogActivity?.SetTag("commit_records.count", record.Count());
        }

        activity?.SetTag("processing.completed", true);
    }

    /// <summary>
    /// 获取智能过滤的优化树形目录结构
    /// </summary>
    /// <param name="path">扫描路径</param>
    /// <param name="readme">README内容</param>
    /// <param name="format">输出格式</param>
    /// <returns>优化后的目录结构</returns>
    public static async Task<string> GetCatalogueSmartFilterOptimizedAsync(string path, string readme,
        string format = "compact")
    {
        using var activity = s_activitySource.StartActivity("智能过滤优化目录结构", ActivityKind.Server);
        activity?.SetTag("path", path);
        activity?.SetTag("format", format);

        var ignoreFiles = DocumentsHelper.GetIgnoreFiles(path);
        var pathInfos = new List<PathInfo>();

        // 递归扫描目录所有文件和目录
        DocumentsHelper.ScanDirectory(path, pathInfos, ignoreFiles);
        activity?.SetTag("total_files", pathInfos.Count);

        // 如果文件数量较少，直接返回优化结构
        if (pathInfos.Count < 800)
        {
            activity?.SetTag("processing_type", "direct_build");
            var fileTree = FileTreeBuilder.BuildTree(pathInfos, path);
            return format.ToLower() switch
            {
                "json" => FileTreeBuilder.ToCompactJson(fileTree),
                "pathlist" => string.Join("\n", FileTreeBuilder.ToPathList(fileTree)),
                "compact" or _ => FileTreeBuilder.ToCompactString(fileTree)
            };
        }

        // 如果不启用智能过滤，返回优化结构
        if (DocumentOptions.EnableSmartFilter == false)
        {
            activity?.SetTag("processing_type", "smart_filter_disabled");
            var fileTree = FileTreeBuilder.BuildTree(pathInfos, path);
            return format.ToLower() switch
            {
                "json" => FileTreeBuilder.ToCompactJson(fileTree),
                "pathlist" => string.Join("\n", FileTreeBuilder.ToPathList(fileTree)),
                "compact" or _ => FileTreeBuilder.ToCompactString(fileTree)
            };
        }

        activity?.SetTag("processing_type", "ai_smart_filter");
        Log.Logger.Information($"开始优化目录结构（使用{DocumentOptions.CatalogueFormat}格式）");

        var analysisModel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey, path, OpenAIOptions.AnalysisModel);

        var codeDirSimplifier = analysisModel.Plugins["CodeAnalysis"]["CodeDirSimplifier"];

        // 使用优化的目录结构作为输入
        var optimizedInput = DocumentsHelper.GetCatalogueOptimized(path, DocumentOptions.CatalogueFormat);
        activity?.SetTag("optimized_input.length", optimizedInput?.Length ?? 0);

        var sb = new StringBuilder();
        int retryCount = 0;
        const int maxRetries = 5;
        Exception? lastException = null;

        while (retryCount < maxRetries)
        {
            try
            {
                await foreach (var item in analysisModel.InvokeStreamingAsync(codeDirSimplifier, new KernelArguments(
                                   new OpenAIPromptExecutionSettings()
                                   {
                                       MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.AnalysisModel)
                                   })
                               {
                                   ["code_files"] = optimizedInput,
                                   ["readme"] = readme
                               }))
                {
                    sb.Append(item);
                }

                // 成功则跳出循环
                lastException = null;
                break;
            }
            catch (Exception ex)
            {
                retryCount++;
                lastException = ex;
                Log.Logger.Error(ex, $"优化目录结构失败，重试第{retryCount}次");
                activity?.SetTag($"retry.{retryCount}.error", ex.Message);
                if (retryCount >= maxRetries)
                {
                    activity?.SetTag("failed_after_retries", true);
                    throw new Exception($"优化目录结构失败，已重试{maxRetries}次", ex);
                }

                await Task.Delay(5000 * retryCount);
                sb.Clear();
            }
        }

        activity?.SetTag("retry_count", retryCount);
        activity?.SetTag("raw_result.length", sb.Length);

        // 正则表达式提取response_file
        var regex = new Regex("<response_file>(.*?)</response_file>", RegexOptions.Singleline);
        var match = regex.Match(sb.ToString());
        if (match.Success)
        {
            activity?.SetTag("extraction_method", "response_file_tag");
            return match.Groups[1].Value;
        }

        // 可能是```json
        var jsonRegex = new Regex("```json(.*?)```", RegexOptions.Singleline);
        var jsonMatch = jsonRegex.Match(sb.ToString());
        if (jsonMatch.Success)
        {
            activity?.SetTag("extraction_method", "json_code_block");
            return jsonMatch.Groups[1].Value;
        }

        activity?.SetTag("extraction_method", "raw_content");
        return sb.ToString();
    }

    /// <summary>
    /// 获取智能过滤的目录结构（保持向后兼容的原始方法）
    /// </summary>
    /// <param name="path">扫描路径</param>
    /// <param name="readme">README内容</param>
    /// <returns>目录结构字符串</returns>
    public static async Task<string> GetCatalogueSmartFilterAsync(string path, string readme)
    {
        var ignoreFiles = DocumentsHelper.GetIgnoreFiles(path);

        var pathInfos = new List<PathInfo>();
        // 递归扫描目录所有文件和目录
        DocumentsHelper.ScanDirectory(path, pathInfos, ignoreFiles);
        var catalogue = new StringBuilder();

        foreach (var info in pathInfos)
        {
            // 删除前缀 Constant.GitPath
            var relativePath = info.Path.Replace(path, "").TrimStart('\\');

            // 过滤.开头的文件
            if (relativePath.StartsWith("."))
                continue;

            catalogue.Append($"{relativePath}\n");
        }

        // 如果文件数量小于800
        if (pathInfos.Count < 800)
        {
            // 直接返回
            return catalogue.ToString();
        }

        // 如果不启用则直接返回
        if (DocumentOptions.EnableSmartFilter == false)
        {
            return catalogue.ToString();
        }

        Log.Logger.Information("开始优化目录结构");

        var analysisModel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey, path, OpenAIOptions.AnalysisModel);

        var codeDirSimplifier = analysisModel.Plugins["CodeAnalysis"]["CodeDirSimplifier"];

        var sb = new StringBuilder();
        int retryCount = 0;
        const int maxRetries = 5;
        Exception? lastException = null;

        while (retryCount < maxRetries)
        {
            try
            {
                await foreach (var item in analysisModel.InvokeStreamingAsync(codeDirSimplifier, new KernelArguments(
                                   new OpenAIPromptExecutionSettings()
                                   {
                                       MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.AnalysisModel)
                                   })
                               {
                                   ["code_files"] = catalogue.ToString(),
                                   ["readme"] = readme
                               }))
                {
                    sb.Append(item);
                }

                // 成功则跳出循环
                lastException = null;
                break;
            }
            catch (Exception ex)
            {
                retryCount++;
                lastException = ex;
                Log.Logger.Error(ex, $"优化目录结构失败，重试第{retryCount}次");
                if (retryCount >= maxRetries)
                {
                    throw new Exception($"优化目录结构失败，已重试{maxRetries}次", ex);
                }

                await Task.Delay(5000 * retryCount);
                sb.Clear();
            }
        }

        // 正则表达式提取response_file
        var regex = new Regex("<response_file>(.*?)</response_file>", RegexOptions.Singleline);
        var match = regex.Match(sb.ToString());
        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value;
            catalogue.Clear();
            catalogue.Append(extractedContent);
        }
        else
        {
            // 可能是```json
            var jsonRegex = new Regex("```json(.*?)```", RegexOptions.Singleline);
            var jsonMatch = jsonRegex.Match(sb.ToString());
            if (jsonMatch.Success)
            {
                // 提取到的内容
                var extractedContent = jsonMatch.Groups[1].Value;
                catalogue.Clear();
                catalogue.Append(extractedContent);
            }
            else
            {
                catalogue.Clear();
                catalogue.Append(sb);
            }
        }

        return catalogue.ToString();
    }

    public static async Task<string> GenerateReadMe(Warehouse warehouse, string path,
        IKoalaWikiContext koalaWikiContext)
    {
        using var activity = s_activitySource.StartActivity("生成README文档", ActivityKind.Server);
        activity?.SetTag("warehouse.id", warehouse.Id);
        activity?.SetTag("warehouse.name", warehouse.Name);
        activity?.SetTag("path", path);

        var readme = await DocumentsHelper.ReadMeFile(path);
        activity?.SetTag("existing_readme_found", !string.IsNullOrEmpty(readme));
        activity?.SetTag("warehouse_readme_exists", !string.IsNullOrEmpty(warehouse.Readme));

        if (string.IsNullOrEmpty(readme) && string.IsNullOrEmpty(warehouse.Readme))
        {
            activity?.SetTag("action", "generate_new_readme");

            var catalogue = DocumentsHelper.GetCatalogue(path);
            activity?.SetTag("catalogue.length", catalogue?.Length ?? 0);

            var kernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
                OpenAIOptions.ChatApiKey,
                path, OpenAIOptions.ChatModel);

            var fileKernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
                OpenAIOptions.ChatApiKey, path, OpenAIOptions.ChatModel, false);

            // 生成README
            var generateReadmePlugin = kernel.Plugins["CodeAnalysis"]["GenerateReadme"];
            var generateReadme = await fileKernel.InvokeAsync(generateReadmePlugin, new KernelArguments(
                new OpenAIPromptExecutionSettings()
                {
                    ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
                })
            {
                ["catalogue"] = catalogue,
                ["git_repository"] = warehouse.Address.Replace(".git", ""),
                ["branch"] = warehouse.Branch
            });

            readme = generateReadme.ToString();
            activity?.SetTag("generated_readme.length", readme?.Length ?? 0);

            // 可能需要先处理一下documentation_structure 有些模型不支持json
            var readmeRegex = new Regex(@"<readme>(.*?)</readme>", RegexOptions.Singleline);
            var readmeMatch = readmeRegex.Match(readme);

            if (readmeMatch.Success)
            {
                // 提取到的内容
                var extractedContent = readmeMatch.Groups[1].Value;
                readme = extractedContent;
                activity?.SetTag("extraction_method", "readme_tag");
            }
            else
            {
                activity?.SetTag("extraction_method", "raw_content");
            }

            await koalaWikiContext.Warehouses.Where(x => x.Id == warehouse.Id)
                .ExecuteUpdateAsync(x => x.SetProperty(y => y.Readme, readme));
        }
        else
        {
            activity?.SetTag("action", "use_existing_readme");
            await koalaWikiContext.Warehouses.Where(x => x.Id == warehouse.Id)
                .ExecuteUpdateAsync(x => x.SetProperty(y => y.Readme, readme));
        }

        if (string.IsNullOrEmpty(readme))
        {
            activity?.SetTag("fallback_to_warehouse_readme", true);
            return warehouse.Readme;
        }

        activity?.SetTag("final_readme.length", readme?.Length ?? 0);
        return readme;
    }
}