using System.ClientModel;
using System.Collections.Concurrent;
using System.Diagnostics;
using KoalaWiki.Functions;
using KoalaWiki.Options;
using KoalaWiki.plugins;
using Microsoft.SemanticKernel;
using OpenAI;
using Serilog;

#pragma warning disable SKEXP0070

#pragma warning disable SKEXP0010

namespace KoalaWiki;

/// <summary>
/// 提供一个静态方法来创建和配置一个内核实例，用于各种基于ai的操作。
/// KernelFactory类负责设置必要的服务、插件和配置
/// 内核需要的，包括聊天完成服务，日志记录和文件处理功能。
/// 它支持多个AI模型提供者，并允许可选的代码分析功能。
/// </summary>
public static class KernelFactory
{
    public static Kernel GetKernel(string chatEndpoint,
        string apiKey,
        string gitPath,
        string model = "gpt-4.1", bool isCodeAnalysis = true)
    {
        using var activity = Activity.Current?.Source.StartActivity();
        activity?.SetTag("model", model);
        activity?.SetTag("provider", OpenAIOptions.ModelProvider);
        activity?.SetTag("code_analysis_enabled", isCodeAnalysis);
        activity?.SetTag("git_path", gitPath);

        var kernelBuilder = Kernel.CreateBuilder();

        kernelBuilder.Services.AddSerilog(Log.Logger);

        kernelBuilder.Services.AddSingleton<IPromptRenderFilter, LanguagePromptFilter>();

        if (OpenAIOptions.ModelProvider.Equals("OpenAI", StringComparison.OrdinalIgnoreCase))
        {
            kernelBuilder.AddOpenAIChatCompletion(model, new Uri(chatEndpoint), apiKey,
                httpClient: new HttpClient(new KoalaHttpClientHandler()
                {
                    //添加重试试
                    AllowAutoRedirect = true,
                    MaxAutomaticRedirections = 5,
                    MaxConnectionsPerServer = 200,
                })
                {
                    // 添加重试
                    Timeout = TimeSpan.FromSeconds(16000),
                });
        }
        else if (OpenAIOptions.ModelProvider.Equals("AzureOpenAI", StringComparison.OrdinalIgnoreCase))
        {
            kernelBuilder.AddAzureOpenAIChatCompletion(model, chatEndpoint, apiKey, httpClient: new HttpClient(
                new KoalaHttpClientHandler()
                {
                    //添加重试试
                    AllowAutoRedirect = true,
                    MaxAutomaticRedirections = 5,
                    MaxConnectionsPerServer = 200,
                })
            {
                // 添加重试
                Timeout = TimeSpan.FromSeconds(16000),
            });
        }
        else if (OpenAIOptions.ModelProvider.Equals("Anthropic", StringComparison.OrdinalIgnoreCase))
        {
            kernelBuilder.AddAnthropicChatCompletion(model, apiKey, httpClient: new HttpClient(
                new KoalaHttpClientHandler()
                {
                    //添加重试试
                    AllowAutoRedirect = true,
                    MaxAutomaticRedirections = 5,
                    MaxConnectionsPerServer = 200,
                })
            {
                // 添加重试
                Timeout = TimeSpan.FromSeconds(16000),
            });
        }
        else
        {
            activity?.SetStatus(ActivityStatusCode.Error, "不支持的模型提供者");
            throw new Exception("暂不支持：" + OpenAIOptions.ModelProvider + "，请使用OpenAI、AzureOpenAI或Anthropic");
        }

        if (isCodeAnalysis)
        {
            kernelBuilder.Plugins.AddFromPromptDirectory(Path.Combine(AppContext.BaseDirectory, "plugins",
                "CodeAnalysis"));
            activity?.SetTag("plugins.code_analysis", "loaded");
        }

        // 添加文件函数
        var fileFunction = new FileFunction(gitPath);
        kernelBuilder.Plugins.AddFromObject(fileFunction);
        activity?.SetTag("plugins.file_function", "loaded");

        if (DocumentOptions.EnableCodeDependencyAnalysis)
        {
            var codeAnalyzeFunction = new CodeAnalyzeFunction(gitPath);
            kernelBuilder.Plugins.AddFromObject(codeAnalyzeFunction);
            activity?.SetTag("plugins.code_analyze_function", "loaded");
        }

        var kernel = kernelBuilder.Build();
        kernel.FunctionInvocationFilters.Add(new FunctionResultInterceptor());

        activity?.SetStatus(ActivityStatusCode.Ok);
        activity?.SetTag("kernel.created", true);

        return kernel;
    }
}