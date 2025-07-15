using FastService;
using KoalaWiki.Core.DataAccess;
using KoalaWiki.Domains;
using KoalaWiki.Entities;
using LibGit2Sharp;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using KoalaWiki.Domains.Warehouse;

namespace KoalaWiki.Services;

[Tags("文档目录")]
[Route("/api/DocumentCatalog")]
public class DocumentCatalogService(IKoalaWikiContext dbAccess) : FastApi
{
    /// <summary>
    /// 获取目录列表
    /// </summary>
    /// <param name="organizationName"></param>
    /// <param name="name"></param>
    /// <returns></returns>
    /// <exception cref="NotFoundException"></exception>
    public async Task<object> GetDocumentCatalogsAsync(string organizationName, string name, string? branch)
    {
        var warehouse = await dbAccess.Warehouses
            .AsNoTracking()
            .Where(x => x.Name == name && x.OrganizationName == organizationName &&
                        (string.IsNullOrEmpty(branch) || x.Branch == branch) &&
                        (x.Status == WarehouseStatus.Completed || x.Status == WarehouseStatus.Processing))
            .FirstOrDefaultAsync();

        // 如果没有找到仓库，返回空列表
        if (warehouse == null)
        {
            throw new NotFoundException($"仓库不存在，请检查仓库名称和组织名称:{organizationName} {name}");
        }

        var document = await dbAccess.Documents
            .AsNoTracking()
            .Where(x => x.WarehouseId == warehouse.Id)
            .FirstOrDefaultAsync();

        var documentCatalogs = await dbAccess.DocumentCatalogs
            .Where(x => x.WarehouseId == warehouse.Id && x.IsDeleted == false)
            .ToListAsync();

        string lastUpdate;

        var branchs =
            (await dbAccess.Warehouses
                .Where(x => x.Name == name && x.OrganizationName == organizationName && x.Type == "git" &&
                            x.Status == WarehouseStatus.Completed)
                .OrderByDescending(x => x.Status == WarehouseStatus.Completed)
                .Select(x => x.Branch)
                .ToArrayAsync());

        return new
        {
            items = BuildDocumentTree(documentCatalogs),
            lastUpdate = document?.LastUpdate,
            document?.Description,
            progress = documentCatalogs.Count(x => x.IsCompleted) * 100 / documentCatalogs.Count,
            git = warehouse.Address,
            branchs = branchs,
            document?.WarehouseId,
            document?.LikeCount,
            document?.Status,
            document?.CommentCount,
        };
    }

    /// <summary>
    /// 根据目录id获取文件
    /// </summary>
    /// <returns></returns>
    public async Task GetDocumentByIdAsync(string owner, string name, string? branch,
        string path, HttpContext httpContext)
    {
        // 先根据仓库名称和组织名称找到仓库
        var query = await dbAccess.Warehouses
            .AsNoTracking()
            .Where(x => x.Name == name && x.OrganizationName == owner &&
                        (string.IsNullOrEmpty(branch) || x.Branch == branch) &&
                        (x.Status == WarehouseStatus.Completed || x.Status == WarehouseStatus.Processing))
            .FirstOrDefaultAsync();

        if (query == null)
        {
            throw new NotFoundException($"仓库不存在，请检查仓库名称和组织名称:{owner} {name}");
        }

        // 找到catalog
        var id = await dbAccess.DocumentCatalogs
            .AsNoTracking()
            .Where(x => x.WarehouseId == query.Id && x.Url == path && x.IsDeleted == false)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();

        var item = await dbAccess.DocumentFileItems
            .AsNoTracking()
            .Where(x => x.DocumentCatalogId == id)
            .FirstOrDefaultAsync();

        if (item == null)
        {
            throw new NotFoundException("文件不存在");
        }

        // 找到所有引用文件
        var fileSource = await dbAccess.DocumentFileItemSources.Where(x => x.DocumentFileItemId == item.Id)
            .ToListAsync();

        //md
        await httpContext.Response.WriteAsJsonAsync(new
        {
            content = item.Content,
            title = item.Title,
            fileSource,
            address = query?.Address.Replace(".git", string.Empty),
            query?.Branch,
            lastUpdate = item.CreatedAt,
            documentCatalogId = id
        });
    }

    /// <summary>
    /// 更新目录信息
    /// </summary>
    public async Task<bool> UpdateCatalogAsync([Required] UpdateCatalogRequest request)
    {
        try
        {
            var catalog = await dbAccess.DocumentCatalogs.FindAsync(request.Id);
            if (catalog == null)
            {
                return false;
            }

            catalog.Name = request.Name;
            catalog.Prompt = request.Prompt;

            await dbAccess.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            // 记录异常
            Console.WriteLine($"更新目录失败: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// 更新文档内容
    /// </summary>
    public async Task<bool> UpdateDocumentContentAsync([Required] UpdateDocumentContentRequest request)
    {
        try
        {
            var item = await dbAccess.DocumentFileItems
                .Where(x => x.DocumentCatalogId == request.Id)
                .FirstOrDefaultAsync();

            if (item == null)
            {
                return false;
            }

            item.Content = request.Content;
            await dbAccess.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            // 记录异常
            Console.WriteLine($"更新文档内容失败: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// 递归构建文档目录树形结构
    /// </summary>
    /// <param name="documents">所有文档目录列表</param>
    /// <returns>树形结构文档目录</returns>
    private List<object> BuildDocumentTree(List<DocumentCatalog> documents)
    {
        var result = new List<object>();

        // 获取顶级目录
        var topLevel = documents.Where(x => x.ParentId == null).OrderBy(x => x.Order).ToList();

        foreach (var item in topLevel)
        {
            var children = GetChildren(item.Id, documents);
            if (children == null || children.Count == 0)
            {
                result.Add(new
                {
                    label = item.Name,
                    Url = item.Url,
                    item.Description,
                    key = item.Id,
                    lastUpdate = item.CreatedAt,
                    // 是否启用
                    disabled = item.IsCompleted == false
                });
            }
            else
            {
                result.Add(new
                {
                    label = item.Name,
                    item.Description,
                    Url = item.Url,
                    key = item.Id,
                    lastUpdate = item.CreatedAt,
                    children,
                    // 是否启用
                    disabled = item.IsCompleted == false
                });
            }
        }

        return result;
    }

    /// <summary>
    /// 递归获取子目录
    /// </summary>
    /// <param name="parentId">父目录ID</param>
    /// <param name="documents">所有文档目录列表</param>
    /// <returns>子目录列表</returns>
    private List<object> GetChildren(string parentId, List<DocumentCatalog> documents)
    {
        var children = new List<object>();
        var directChildren = documents.Where(x => x.ParentId == parentId).OrderBy(x => x.Order).ToList();

        foreach (var child in directChildren)
        {
            // 递归获取子目录的子目录
            var subChildren = GetChildren(child.Id, documents);

            if (subChildren == null || subChildren.Count == 0)
            {
                children.Add(new
                {
                    label = child.Name,
                    lastUpdate = child.CreatedAt,
                    Url = child.Url,
                    key = child.Id,
                    child.Description,
                    // 是否启用
                    disabled = child.IsCompleted == false
                });
            }
            else
            {
                children.Add(new
                {
                    label = child.Name,
                    key = child.Id,
                    Url = child.Url,
                    child.Description,
                    lastUpdate = child.CreatedAt,
                    children = subChildren,
                    // 是否启用
                    disabled = child.IsCompleted == false
                });
            }
        }

        return children;
    }
}

/// <summary>
/// 更新目录请求
/// </summary>
public class UpdateCatalogRequest
{
    /// <summary>
    /// 目录ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 目录名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 提示词
    /// </summary>
    public string Prompt { get; set; } = string.Empty;
}

/// <summary>
/// 更新文档内容请求
/// </summary>
public class UpdateDocumentContentRequest
{
    /// <summary>
    /// 文档目录ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 文档内容
    /// </summary>
    public string Content { get; set; } = string.Empty;
}