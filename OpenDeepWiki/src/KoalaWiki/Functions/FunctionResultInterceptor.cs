using Microsoft.SemanticKernel;

namespace KoalaWiki.Functions;

public class FunctionResultInterceptor : IFunctionInvocationFilter
{
    public async Task OnFunctionInvocationAsync(FunctionInvocationContext context,
        Func<FunctionInvocationContext, Task> next)
    {
        await next(context);
    }
}