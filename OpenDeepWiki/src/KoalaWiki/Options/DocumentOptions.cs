namespace KoalaWiki.Options;

public class DocumentOptions
{
    public const string Name = "Document";

    /// <summary>
    /// 是否启用增量更新
    /// </summary>
    /// <returns></returns>
    public static bool EnableIncrementalUpdate { get; set; } = true;

    /// <summary>
    /// 排除的文件
    /// </summary>
    /// <returns></returns>
    public static string[] ExcludedFiles { get; set; } = [];

    /// <summary>
    /// 排除的文件夹
    /// </summary>
    /// <returns></returns>
    public static string[] ExcludedFolders { get; set; } = [];

    /// <summary>
    /// 是否启用智能过滤
    /// </summary>
    /// <returns></returns>
    public static bool EnableSmartFilter { get; set; } = true;

    /// <summary>
    /// 目录结构格式 (compact, json, pathlist, unix)
    /// </summary>
    /// <returns></returns>
    public static string CatalogueFormat { get; set; } = "compact";

    /// <summary>
    /// 是否启用代码依赖分析
    /// </summary>
    /// <returns></returns>
    public static bool EnableCodeDependencyAnalysis { get; set; } = false;

    /// <summary>
    /// 是否启用仓库功能提示任务
    /// </summary>
    public static bool EnableWarehouseFunctionPromptTask { get; set; } = true;

    /// <summary>
    /// 是否启用仓库描述任务
    /// </summary>
    public static bool EnableWarehouseDescriptionTask { get; set; } = true;

    /// <summary>
    /// 是否启用文件提交
    /// </summary>
    /// <returns></returns>
    public static bool EnableFileCommit { get; set; } = true;

    /// <summary>
    /// 精炼并且提高质量
    /// </summary>
    /// <returns></returns>
    public static bool RefineAndEnhanceQuality { get; set; } = true;
    
    /// <summary>
    /// 是否启用仓库提交
    /// </summary>
    /// <returns></returns>
    public static bool EnableWarehouseCommit { get; set; } = true;

    /// <summary>
    /// 是否启用代码压缩
    /// 当启用时，FileFunction读取代码文件时会应用压缩算法
    /// 压缩会保留注释、方法名等关键信息，但会移除多余的空白和格式
    /// </summary>
    /// <returns></returns>
    public static bool EnableCodeCompression { get; set; } = false;

    public static void InitConfig(IConfiguration configuration)
    {
        configuration.GetSection(Name).Get<DocumentOptions>();
        
        var enableWarehouseCommit = configuration.GetValue<bool?>($"ENABLE_WAREHOUSE_COMMIT") ?? true;
        
        EnableWarehouseCommit = enableWarehouseCommit;

        var enableFileCommit = configuration.GetValue<bool?>($"ENABLE_FILE_COMMIT") ?? true;

        EnableFileCommit = enableFileCommit;

        var enableIncrementalUpdate = configuration.GetValue<string>($"ENABLE_INCREMENTAL_UPDATE");
        if (!string.IsNullOrEmpty(enableIncrementalUpdate))
        {
            if (bool.TryParse(enableIncrementalUpdate, out var enable))
            {
                EnableIncrementalUpdate = enable;
            }
        }

        var refineAndEnhanceQuality =
            configuration.GetValue<string>($"REFINE_AND_ENHANCE_QUALITY");

        if (!string.IsNullOrEmpty(refineAndEnhanceQuality))
        {
            RefineAndEnhanceQuality = bool.TryParse(refineAndEnhanceQuality, out var enable) && enable;
        }

        var enableCodeDependencyAnalysis = configuration.GetValue<string>($"ENABLE_CODED_DEPENDENCY_ANALYSIS");

        if (!string.IsNullOrEmpty(enableCodeDependencyAnalysis))
        {
            if (bool.TryParse(enableCodeDependencyAnalysis, out var enable))
            {
                EnableCodeDependencyAnalysis = enable;
            }
        }

        var enableWarehouseFunctionPromptTask =
            configuration.GetValue<string>($"ENABLE_WAREHOUSE_FUNCTION_PROMPT_TASK");

        if (!string.IsNullOrEmpty(enableWarehouseFunctionPromptTask))
        {
            if (bool.TryParse(enableWarehouseFunctionPromptTask, out var enable))
            {
                EnableWarehouseFunctionPromptTask = enable;
            }
        }

        var enableWarehouseDescriptionTask = configuration.GetValue<string>($"ENABLE_WAREHOUSE_DESCRIPTION_TASK");
        if (!string.IsNullOrEmpty(enableWarehouseDescriptionTask))
        {
            if (bool.TryParse(enableWarehouseDescriptionTask, out var enable))
            {
                EnableWarehouseDescriptionTask = enable;
            }
        }

        var catalogueFormat = configuration.GetValue<string>($"CATALOGUE_FORMAT");
        if (!string.IsNullOrEmpty(catalogueFormat))
        {
            CatalogueFormat = catalogueFormat.ToLower();
        }

        var enableCodeCompression = configuration.GetValue<string>($"ENABLE_CODE_COMPRESSION");
        if (!string.IsNullOrEmpty(enableCodeCompression))
        {
            if (bool.TryParse(enableCodeCompression, out var enable))
            {
                EnableCodeCompression = enable;
            }
        }
    }
}