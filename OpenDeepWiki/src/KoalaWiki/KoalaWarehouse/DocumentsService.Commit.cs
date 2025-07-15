using System.Text.RegularExpressions;
using LibGit2Sharp;
using Microsoft.SemanticKernel;
using Newtonsoft.Json;

namespace KoalaWiki.KoalaWarehouse;

public partial class DocumentsService
{
    /// <summary>
    /// 生成更新日志
    /// </summary>
    public async Task<List<CommitResultDto>> GenerateUpdateLogAsync(string gitPath,
        string readme, string gitRepositoryUrl, string branch, Kernel kernel)
    {
        // 读取git log
        using var repo = new Repository(gitPath, new RepositoryOptions());

        var log = repo.Commits
            .OrderByDescending(x => x.Committer.When)
            .Take(20)
            .OrderBy(x => x.Committer.When)
            .ToList();

        string commitMessage = string.Empty;
        foreach (var commit in log)
        {
            commitMessage += "提交人：" + commit.Committer.Name + "\n提交内容\n<message>\n" + commit.Message +
                             "<message>";

            commitMessage += "\n提交时间：" + commit.Committer.When.ToString("yyyy-MM-dd HH:mm:ss") + "\n";
        }

        var plugin = kernel.Plugins["CodeAnalysis"]["CommitAnalyze"];

        var str = string.Empty;
        await foreach (var item in kernel.InvokeStreamingAsync(plugin, new KernelArguments()
                       {
                           ["readme"] = readme,
                           ["git_repository"] = gitRepositoryUrl,
                           ["commit_message"] = commitMessage,
                           ["branch"] = branch
                       }))
        {
            str += item;
        }

        var regex = new Regex(@"<changelog>(.*?)</changelog>",
            RegexOptions.Singleline);
        
        var match = regex.Match(str);

        if (match.Success)
        {
            // 提取到的内容
            str = match.Groups[1].Value;
        }

        var result = JsonConvert.DeserializeObject<List<CommitResultDto>>(str);

        return result;
    }

    public class CommitResultDto
    {
        public DateTime date { get; set; }

        public string title { get; set; }

        public string description { get; set; }
    }
}