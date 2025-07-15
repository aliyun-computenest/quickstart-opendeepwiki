using System.Diagnostics;
using System.Text.Json;
using Newtonsoft.Json;
using Serilog;

namespace KoalaWiki;

public sealed class KoalaHttpClientHandler : HttpClientHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        Log.Logger.Information("HTTP {Method} {Uri}", request.Method, request.RequestUri);

        var json = JsonConvert.DeserializeObject<dynamic>(await request.Content.ReadAsStringAsync());

        var model = $"{json.model}";

        // 兼容旧模型 ( max_completion_tokens => max_tokens )
        if (json != null && json.max_completion_tokens != null && model.StartsWith("o") == false)
        {
            json.max_tokens = json.max_completion_tokens;
            json.Remove("max_completion_tokens");
        }

        // GPT o系列不能传递温度
        if (model.StartsWith("o"))
        {
            json.Remove("temperature");
        }

        // 关闭推理模式: qwen3系列
        if (model.StartsWith("qwen3", StringComparison.CurrentCultureIgnoreCase)
            || model.IndexOf("/qwen3", StringComparison.CurrentCultureIgnoreCase) >= 0)
        {
            json.extra_body ??= new Newtonsoft.Json.Linq.JObject();

            if (request.RequestUri.ToString().StartsWith("https://dashscope.aliyuncs.com", StringComparison.CurrentCultureIgnoreCase))
            {
                json.extra_body.enable_thinking = false;
            }
            else
            {
                // 开源部署最佳实践
                json.temperature ??= 0.7;
                json.top_p ??= 0.8;
                json.extra_body.top_k ??= 20;
                json.extra_body.chat_template_kwargs ??= new Newtonsoft.Json.Linq.JObject();
                json.extra_body.chat_template_kwargs.enable_thinking = false;
            }
        }

        // 重写请求体
        request.Content = new StringContent(JsonConvert.SerializeObject(json),
            System.Text.Encoding.UTF8, "application/json");

        // 1. 启动计时
        var stopwatch = Stopwatch.StartNew();
        // 2. 发送请求
        var response = await base.SendAsync(request, cancellationToken)
            .ConfigureAwait(false);
        // 3. 停止计时
        stopwatch.Stop();

        // 如果响应错误那么输出错误信息
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
            Log.Logger.Error(
                "HTTP {Method} {Uri} => {StatusCode} in {ElapsedMilliseconds}ms, Error: {Error}",
                request.Method,
                request.RequestUri,
                (int)response.StatusCode,
                stopwatch.ElapsedMilliseconds,
                errorContent
            );
            Log.Logger.Information("Request JSON: {RequestJson}",
                await request.Content?.ReadAsStringAsync(cancellationToken) ?? "");

            throw new HttpRequestException(
                $"Request failed with status code {(int)response.StatusCode}: {errorContent}");
        }
        else
        {
            // 4. 记录简洁日志
            Log.Logger.Information(
                "HTTP {Method} {Uri} => {StatusCode} in {ElapsedMilliseconds}ms",
                request.Method,
                request.RequestUri,
                (int)response.StatusCode,
                stopwatch.ElapsedMilliseconds
            );
            return response;
        }
    }
}