using KoalaWiki.KoalaWarehouse;
using Microsoft.SemanticKernel;

namespace KoalaWiki.plugins;

public class LanguagePromptFilter : IPromptRenderFilter
{
    public async Task OnPromptRenderAsync(PromptRenderContext context, Func<PromptRenderContext, Task> next)
    {
        await next(context);

        context.RenderedPrompt = "/no_think " + context.RenderedPrompt + Environment.NewLine + Prompt.Language;
    }
}