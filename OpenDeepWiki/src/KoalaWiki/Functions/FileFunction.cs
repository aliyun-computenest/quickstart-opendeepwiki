using System.ComponentModel;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.SemanticKernel;
using OpenDeepWiki.CodeFoundation;
using OpenDeepWiki.CodeFoundation.Utils;

namespace KoalaWiki.Functions;

public class FileFunction(string gitPath)
{
    private readonly CodeCompressionService _codeCompressionService = new();

    /// <summary>
    /// 获取当前仓库压缩结构
    /// </summary>
    public string GetTree()
    {
        var ignoreFiles = DocumentsHelper.GetIgnoreFiles(gitPath);
        var pathInfos = new List<PathInfo>();

        // 递归扫描目录所有文件和目录
        DocumentsHelper.ScanDirectory(gitPath, pathInfos, ignoreFiles);

        var fileTree = FileTreeBuilder.BuildTree(pathInfos, gitPath);
        return FileTreeBuilder.ToCompactString(fileTree);
    }

    /// <summary>
    /// 获取文件基本信息
    /// </summary>
    /// <returns></returns>
    [KernelFunction(name: "FileInfo"), Description(
         "Before accessing or reading any file content, always use this method to retrieve the basic information for all specified files. Batch as many file paths as possible into a single call to maximize efficiency. Provide file paths as an array. The function returns a JSON object where each key is the file path and each value contains the file's name, size, extension, creation time, last write time, and last access time. Ensure this information is obtained and reviewed before proceeding to any file content operations."
     )]
    [return:
        Description(
            "Return a JSON object with file paths as keys and file information as values. The information includes file name, size, extension, creation time, last write time, and last access time."
        )]
    public string GetFileInfoAsync(
        [Description("File Path")] string[] filePath)
    {
        try
        {
            var dic = new Dictionary<string, string>();

            filePath = filePath.Distinct().ToArray();

            if (DocumentContext.DocumentStore?.Files != null)
            {
                DocumentContext.DocumentStore.Files.AddRange(filePath);
            }

            foreach (var item in filePath)
            {
                var fullPath = Path.Combine(gitPath, item.TrimStart('/'));
                if (!File.Exists(fullPath))
                {
                    dic[item] = "File not found";
                    continue;
                }

                Console.WriteLine($"Getting file info: {fullPath}");
                var info = new FileInfo(fullPath);

                // 获取文件信息
                dic[item] = JsonSerializer.Serialize(new
                {
                    info.Name,
                    info.Length,
                    info.Extension,
                    // 返回总行数
                    TotalLine = File.ReadAllLines(fullPath).Length,
                }, JsonSerializerOptions.Web);
            }

            return JsonSerializer.Serialize(dic, JsonSerializerOptions.Web);
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error getting file info: {ex.Message}");
            return $"Error getting file info: {ex.Message}";
        }
    }

    // [KernelFunction, Description(
    //      "Read the specified file content. Always batch as many file paths as possible into a single call to minimize the number of invocations. Provide file paths as an array for maximum efficiency. The function returns a JSON object where each key is the file path and the value is the file content. If a file exceeds 100KB, instead of its content, return: 'If the file exceeds 100KB, you should use ReadFileFromLineAsync to read the file content line by line.' If the file size exceeds 10k, only 10k content will be returned."
    //  )]
    // [return:
    //     Description(
    //         "Return a JSON object with file paths as keys and file contents as values. For files over 100KB, return: 'If the file exceeds 100KB, you should use ReadFileFromLineAsync to read the file content line by line.' If the file size exceeds 10k, only 10k content will be returned."
    //     )]
    public async Task<string> ReadFilesAsync(
        [Description("File Path array. Always batch multiple file paths to reduce the number of function calls.")]
        string[] filePaths)
    {
        try
        {
            filePaths = filePaths.Distinct().ToArray();

            if (DocumentContext.DocumentStore?.Files != null)
            {
                DocumentContext.DocumentStore.Files.AddRange(filePaths);
            }

            var dic = new Dictionary<string, string>();
            foreach (var filePath in filePaths)
            {
                var item = Path.Combine(gitPath, filePath.TrimStart('/'));
                if (!File.Exists(item))
                {
                    continue;
                }

                Console.WriteLine($"Reading file: {item}");

                var info = new FileInfo(item);

                // 判断文件大小
                if (info.Length > 1024 * 100)
                {
                    dic[filePath] =
                        "If the file exceeds 100KB, you should use ReadFileFromLineAsync to read the file content line by line";
                }
                else
                {
                    // 读取整个文件内容
                    string content = await File.ReadAllTextAsync(item);

                    // 如果启用代码压缩且是代码文件，则应用压缩
                    if (DocumentOptions.EnableCodeCompression && CodeFileDetector.IsCodeFile(filePath))
                    {
                        content = _codeCompressionService.CompressCode(content, filePath);
                    }

                    dic[filePath] = content;
                }
            }

            return JsonSerializer.Serialize(dic, new JsonSerializerOptions()
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                WriteIndented = true,
            });
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            throw new Exception($"Error reading file: {ex.Message}");
        }
    }

    public async Task<string> ReadFileAsync(
        [Description("File Path")] string filePath)
    {
        try
        {
            if (DocumentContext.DocumentStore?.Files != null)
            {
                DocumentContext.DocumentStore.Files.Add(filePath);
            }

            filePath = Path.Combine(gitPath, filePath.TrimStart('/'));
            Console.WriteLine($"Reading file: {filePath}");

            var info = new FileInfo(filePath);
            // 判断文件是否存在
            if (!info.Exists)
            {
                return $"File not found: {filePath}";
            }

            // 判断文件大小
            if (info.Length > 1024 * 100)
            {
                return $"File too large: {filePath} ({info.Length / 1024 / 100}KB)";
            }

            // 读取整个文件内容
            string content = await File.ReadAllTextAsync(filePath);

            // 如果启用代码压缩且是代码文件，则应用压缩
            if (DocumentOptions.EnableCodeCompression && CodeFileDetector.IsCodeFile(filePath))
            {
                content = _codeCompressionService.CompressCode(content, filePath);
            }

            return content;
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }

    public class ReadFileInput
    {
        [Description(
            "An array of file items to read. Each item contains the file path and the start and end line numbers for reading. The file must exist and be readable. If the path is invalid or the file does not exist, an exception will be thrown.")]
        public ReadFileItemInput[] Items { get; set; } = [];
    }

    /// <summary>
    /// 从指定行数开始读取文件内容
    /// </summary>
    /// <returns></returns>
    [KernelFunction(name: "File"),
     Description(
         "Reads a file from the local filesystem. You can access any file directly by using this tool.\nAssume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.\n\nUsage:\n- The file_path parameter must be an absolute path, not a relative path\n- By default, it reads up to 2000 lines starting from the beginning of the file\n- You can optionally specify a line offset and limit (especially handy for long files), but it's recommended to read the whole file by not providing these parameters\n- Any lines longer than 2000 characters will be truncated\n- Results are returned using cat -n format, with line numbers starting at 1\n- This tool allows Claude Code to read images (eg PNG, JPG, etc). When reading an image file the contents are presented visually as Claude Code is a multimodal LLM.\n- For Jupyter notebooks (.ipynb files), use the NotebookRead instead\n- You have the capability to call multiple tools in a single response. It is always better to speculatively read multiple files as a batch that are potentially useful. \n- You will regularly be asked to read screenshots. If the user provides a path to a screenshot ALWAYS use this tool to view the file at the path. This tool will work with all temporary file paths like /var/folders/123/abc/T/TemporaryItems/NSIRD_screencaptureui_ZfB1tD/Screenshot.png\n- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.")]
    public async Task<string> ReadFileFromLineAsync(
        ReadFileItemInput[] items)
    {
        var dic = new Dictionary<string, string>();
        foreach (var item in items)
        {
            dic.Add($"fileName:{item.FilePath}\nstartLine:{item.Offset}\nendLine:{item.Limit}",
                await ReadItem(item.FilePath, item.Offset, item.Limit));
        }

        return JsonSerializer.Serialize(dic, JsonSerializerOptions.Web);
    }


    public async Task<string> ReadItem(
        [Description(
            "The absolute or relative path of the target file to read")]
        string filePath,
        [Description(
            "The line number to start reading from. Only provide if the file is too large to read at once")]
        int offset = 0,
        [Description(
            "The number of lines to read. Only provide if the file is too large to read at once.")]
        int limit = 200)
    {
        try
        {
            filePath = Path.Combine(gitPath, filePath.TrimStart('/'));
            Console.WriteLine(
                $"Reading file from line {offset}: {filePath} startLine={offset}, endLine={limit}");

            // 如果<0则读取全部
            if (offset < 0 && limit < 0)
            {
                return await ReadFileAsync(filePath);
            }

            // 如果endLine<0则读取到最后一行
            if (limit < 0)
            {
                limit = int.MaxValue;
            }

            // 先读取整个文件内容
            string fileContent = await File.ReadAllTextAsync(filePath);

            // 如果启用代码压缩且是代码文件，先对整个文件内容进行压缩
            if (DocumentOptions.EnableCodeCompression && CodeFileDetector.IsCodeFile(filePath))
            {
                fileContent = _codeCompressionService.CompressCode(fileContent, filePath);
            }

            // 将压缩后的内容按行分割
            var lines = fileContent.Split('\n');

            // 如果offset大于文件总行数，则返回空
            if (offset >= lines.Length)
            {
                return $"No content to read from line {offset} in file: {filePath}";
            }

            // 计算实际读取的行数
            int actualLimit = Math.Min(limit, lines.Length - offset);
            // 读取指定行数的内容
            var resultLines = new List<string>();
            for (int i = offset; i < offset + actualLimit && i < lines.Length; i++)
            {
                // 如果行内容超过2000字符，则截断
                if (lines[i].Length > 2000)
                {
                    resultLines.Add(lines[i][..2000]);
                }
                else
                {
                    resultLines.Add(lines[i]);
                }
            }

            // 将结果行号从1开始
            var numberedLines = resultLines.Select((line, index) => $"{index + 1}: {line}").ToList();

            return string.Join("\n", numberedLines);
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }
}

public class ReadFileItemInput
{
    [Description(
        "The absolute or relative path of the target file to read")]
    public string FilePath { get; set; }

    [Description(
        "The line number to start reading from. Only provide if the file is too large to read at once")]
    public int Offset { get; set; } = 0;

    [Description(
        "The number of lines to read. Only provide if the file is too large to read at once.")]
    public int Limit { get; set; } = 200;
}