using System.Text.Json;
using FastService;
using KoalaWiki.Domains;
using KoalaWiki.Domains.Statistics;
using KoalaWiki.Domains.Users;
using KoalaWiki.Domains.Warehouse;
using KoalaWiki.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KoalaWiki.Services;

/// <summary>
/// 统计服务
/// </summary>
[Tags("统计服务")]
[FastService.Route("/api/Statistics")]
[Filter(typeof(ResultFilter))]
public class StatisticsService(
    IKoalaWikiContext dbContext,
    ILogger<StatisticsService> logger) : FastApi
{
    /// <summary>
    /// 获取系统统计数据
    /// </summary>
    /// <returns>系统统计数据</returns>
    [Authorize(Roles = "admin")]
    public async Task<SystemStatisticsDto> GetSystemStatisticsAsync()
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        // 总统计数据
        var totalUsers = await dbContext.Users.CountAsync();
        var totalRepositories = await dbContext.Warehouses.CountAsync();
        var totalDocuments = await dbContext.DocumentFileItems.CountAsync();
        var totalViews = await dbContext.AccessRecords.LongCountAsync();

        // 本月新增数据
        var monthlyNewUsers = await dbContext.Users
            .Where(u => u.CreatedAt >= startOfMonth)
            .CountAsync();

        var monthlyNewRepositories = await dbContext.Warehouses
            .Where(w => w.CreatedAt >= startOfMonth)
            .CountAsync();

        var monthlyNewDocuments = await dbContext.DocumentFileItems
            .Where(d => d.CreatedAt >= startOfMonth)
            .CountAsync();

        var monthlyViews = await dbContext.AccessRecords
            .Where(a => a.CreatedAt >= startOfMonth)
            .LongCountAsync();

        // 上月对比数据（用于计算增长率）
        var lastMonthUsers = await dbContext.Users
            .Where(u => u.CreatedAt >= startOfLastMonth && u.CreatedAt < startOfMonth)
            .CountAsync();

        var lastMonthRepositories = await dbContext.Warehouses
            .Where(w => w.CreatedAt >= startOfLastMonth && w.CreatedAt < startOfMonth)
            .CountAsync();

        var lastMonthDocuments = await dbContext.DocumentFileItems
            .Where(d => d.CreatedAt >= startOfLastMonth && d.CreatedAt < startOfMonth)
            .CountAsync();

        var lastMonthViews = await dbContext.AccessRecords
            .Where(a => a.CreatedAt >= startOfLastMonth && a.CreatedAt < startOfMonth)
            .LongCountAsync();

        // 计算增长率
        var userGrowthRate = lastMonthUsers > 0
            ? (decimal)(monthlyNewUsers - lastMonthUsers) / lastMonthUsers * 100
            : monthlyNewUsers > 0
                ? 100
                : 0;

        var repositoryGrowthRate = lastMonthRepositories > 0
            ? (decimal)(monthlyNewRepositories - lastMonthRepositories) / lastMonthRepositories * 100
            : monthlyNewRepositories > 0
                ? 100
                : 0;

        var documentGrowthRate = lastMonthDocuments > 0
            ? (decimal)(monthlyNewDocuments - lastMonthDocuments) / lastMonthDocuments * 100
            : monthlyNewDocuments > 0
                ? 100
                : 0;

        var viewGrowthRate = lastMonthViews > 0
            ? (decimal)(monthlyViews - lastMonthViews) / lastMonthViews * 100
            : monthlyViews > 0
                ? 100
                : 0;

        return new SystemStatisticsDto
        {
            TotalUsers = totalUsers,
            TotalRepositories = totalRepositories,
            TotalDocuments = totalDocuments,
            TotalViews = totalViews,
            MonthlyNewUsers = monthlyNewUsers,
            MonthlyNewRepositories = monthlyNewRepositories,
            MonthlyNewDocuments = monthlyNewDocuments,
            MonthlyViews = monthlyViews,
            UserGrowthRate = Math.Round(userGrowthRate, 2),
            RepositoryGrowthRate = Math.Round(repositoryGrowthRate, 2),
            DocumentGrowthRate = Math.Round(documentGrowthRate, 2),
            ViewGrowthRate = Math.Round(viewGrowthRate, 2)
        };
    }

    /// <summary>
    /// 获取详细统计数据
    /// </summary>
    /// <returns>详细统计数据</returns>
    [Authorize(Roles = "admin")]
    public async Task<DetailedStatisticsDto> GetDetailedStatisticsAsync()
    {
        var systemStats = await GetSystemStatisticsAsync();
        var recentRepositories = await GetRecentRepositoriesAsync(10);
        var recentUsers = await GetRecentUsersAsync(10);
        var userTrends = await GetUserTrendsAsync(30);
        var repositoryTrends = await GetRepositoryTrendsAsync(30);
        var documentTrends = await GetDocumentTrendsAsync(30);
        var viewTrends = await GetViewTrendsAsync(30);

        return new DetailedStatisticsDto
        {
            SystemStats = systemStats,
            RecentRepositories = recentRepositories,
            RecentUsers = recentUsers,
            UserTrends = userTrends,
            RepositoryTrends = repositoryTrends,
            DocumentTrends = documentTrends,
            ViewTrends = viewTrends
        };
    }

    /// <summary>
    /// 获取最近创建的仓库
    /// </summary>
    /// <param name="count">数量</param>
    /// <returns>最近仓库列表</returns>
    [Authorize(Roles = "admin")]
    public async Task<List<RecentRepositoryDto>> GetRecentRepositoriesAsync(int count = 10)
    {
        var repositories = await dbContext.Warehouses
            .AsNoTracking()
            .OrderByDescending(w => w.CreatedAt)
            .Take(count)
            .Select(w => new RecentRepositoryDto
            {
                Id = w.Id,
                Name = w.Name,
                OrganizationName = w.OrganizationName,
                Description = w.Description,
                CreatedAt = w.CreatedAt,
                Status = w.Status.ToString(),
                IsRecommended = w.IsRecommended,
            })
            .ToListAsync();

        foreach (var repository in repositories)
        {
            // 获取仓库的最新提交信息
            var countAsync = await dbContext.DocumentCatalogs
                .AsNoTracking()
                .Where(c => c.WarehouseId == repository.Id)
                .OrderByDescending(c => c.CreatedAt)
                .CountAsync();

            repository.DocumentCount = countAsync;
        }

        return repositories;
    }

    /// <summary>
    /// 获取最近注册的用户
    /// </summary>
    /// <param name="count">数量</param>
    /// <returns>最近用户列表</returns>
    [Authorize(Roles = "admin")]
    public async Task<List<RecentUserDto>> GetRecentUsersAsync(int count = 10)
    {
        var users = await dbContext.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Take(count)
            .Select(u => new RecentUserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                CreatedAt = u.CreatedAt,
                LastLoginAt = u.LastLoginAt,
                IsOnline = u.LastLoginAt.HasValue &&
                           (DateTime.UtcNow - u.LastLoginAt.Value).TotalMinutes < 30
            })
            .ToListAsync();

        // 获取用户角色
        foreach (var user in users)
        {
            var roles = await dbContext.UserInRoles
                .AsNoTracking()
                .Where(ur => ur.UserId == user.Id)
                .Join(dbContext.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
                .ToListAsync();

            user.Roles = roles;
        }

        return users;
    }

    /// <summary>
    /// 获取用户趋势数据
    /// </summary>
    /// <param name="days">天数</param>
    /// <returns>趋势数据</returns>
    [Authorize(Roles = "admin")]
    public async Task<List<TrendDataDto>> GetUserTrendsAsync(int days = 30)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days);
        var endDate = DateTime.UtcNow.Date.AddDays(1);

        var userTrends = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.CreatedAt >= startDate && u.CreatedAt < endDate)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Value = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToListAsync();

        // 填充缺失的日期，值为0
        var result = new List<TrendDataDto>();
        for (var date = startDate; date < endDate; date = date.AddDays(1))
        {
            var existing = userTrends.FirstOrDefault(t => t.Date.ToString("yyyy-MM-dd") == date.ToString("yyyy-MM-dd"));

            if (existing != null)
            {
                result.Add(new TrendDataDto
                {
                    Date = existing.Date.ToString("yyyy-MM-dd"),
                    Value = existing.Value
                });
                continue;
            }

            result.Add(new TrendDataDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Value = 0
            });
        }

        return result;
    }

    /// <summary>
    /// 获取仓库趋势数据
    /// </summary>
    /// <param name="days">天数</param>
    /// <returns>趋势数据</returns>
    [Authorize(Roles = "admin")]
    public async Task<List<TrendDataDto>> GetRepositoryTrendsAsync(int days = 30)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days);
        var endDate = DateTime.UtcNow.Date.AddDays(1);

        var repositoryTrends = await dbContext.Warehouses
            .AsNoTracking()
            .Where(w => w.CreatedAt >= startDate && w.CreatedAt < endDate)
            .GroupBy(w => w.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Value = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToListAsync();

        // 填充缺失的日期，值为0
        var result = new List<TrendDataDto>();
        for (var date = startDate; date < endDate; date = date.AddDays(1))
        {
            var existing =
                repositoryTrends.FirstOrDefault(t => t.Date.ToString("yyyy-MM-dd") == date.ToString("yyyy-MM-dd"));
            if (existing != null)
            {
                result.Add(new TrendDataDto
                {
                    Date = existing.Date.ToString("yyyy-MM-dd"),
                    Value = existing.Value
                });
                continue;
            }

            result.Add(new TrendDataDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Value = 0
            });
        }

        return result;
    }

    /// <summary>
    /// 获取文档趋势数据
    /// </summary>
    /// <param name="days">天数</param>
    /// <returns>趋势数据</returns>
    [Authorize(Roles = "admin")]
    public async Task<List<TrendDataDto>> GetDocumentTrendsAsync(int days = 30)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days);
        var endDate = DateTime.UtcNow.Date.AddDays(1);

        var documentTrends = await dbContext.DocumentFileItems
            .AsNoTracking()
            .Where(d => d.CreatedAt >= startDate && d.CreatedAt < endDate)
            .GroupBy(d => d.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                Value = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToListAsync();

        // 填充缺失的日期，值为0
        var result = new List<TrendDataDto>();
        for (var date = startDate; date < endDate; date = date.AddDays(1))
        {
            var existing =
                documentTrends.FirstOrDefault(t => t.Date.ToString("yyyy-MM-dd") == date.ToString("yyyy-MM-dd"));

            if (existing != null)
            {
                result.Add(new TrendDataDto
                {
                    Date = existing.Date.ToString("yyyy-MM-dd"),
                    Value = existing.Value
                });
                continue;
            }

            result.Add(new TrendDataDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Value = 0
            });
        }

        return result;
    }

    /// <summary>
    /// 获取访问量趋势数据
    /// </summary>
    /// <param name="days">天数</param>
    /// <returns>趋势数据</returns>
    [Authorize(Roles = "admin")]
    public async Task<List<TrendDataDto>> GetViewTrendsAsync(int days = 30)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days);
        var endDate = DateTime.UtcNow.Date.AddDays(1);

        var viewTrends = await dbContext.AccessRecords
            .AsNoTracking()
            .Where(a => a.CreatedAt >= startDate && a.CreatedAt < endDate)
            .GroupBy(a => a.CreatedAt.Date)
            .Select(g => new 
            {
                Date = g.Key,
                Value = g.Count()
            })
            .OrderBy(t => t.Date)
            .ToListAsync();

        // 填充缺失的日期，值为0
        var result = new List<TrendDataDto>();
        for (var date = startDate; date < endDate; date = date.AddDays(1))
        {
            var existing = viewTrends.FirstOrDefault(t => t.Date.ToString("yyyy-MM-dd") == date.ToString("yyyy-MM-dd"));
            if (existing != null)
            {
                result.Add(new TrendDataDto
                {
                    Date = existing.Date.ToString("yyyy-MM-dd"),
                    Value = existing.Value
                });
                continue;
            }
            result.Add(new TrendDataDto
            {
                Date = date.ToString("yyyy-MM-dd"),
                Value = 0
            });
        }

        return result;
    }

    /// <summary>
    /// 获取热门内容
    /// </summary>
    /// <param name="days">统计天数</param>
    /// <param name="count">返回数量</param>
    /// <returns>热门内容列表</returns>
    [Authorize(Roles = "admin")]
    public async Task<List<PopularContentDto>> GetPopularContentAsync(int days = 7, int count = 10)
    {
        var startDate = DateTime.UtcNow.Date.AddDays(-days);

        var popularContent = await dbContext.AccessRecords
            .AsNoTracking()
            .Where(a => a.CreatedAt >= startDate &&
                        !string.IsNullOrEmpty(a.ResourceId) &&
                        !string.IsNullOrEmpty(a.ResourceType))
            .GroupBy(a => new { a.ResourceId, a.ResourceType })
            .Select(g => new
            {
                ResourceId = g.Key.ResourceId,
                ResourceType = g.Key.ResourceType,
                ViewCount = g.Count(),
                LastViewAt = g.Max(a => a.CreatedAt)
            })
            .OrderByDescending(x => x.ViewCount)
            .Take(count)
            .ToListAsync();

        var result = new List<PopularContentDto>();

        foreach (var item in popularContent)
        {
            string title = item.ResourceId;

            // 根据资源类型获取标题
            if (item.ResourceType == "Repository")
            {
                var warehouse = await dbContext.Warehouses
                    .AsNoTracking()
                    .Where(w => w.Id == item.ResourceId)
                    .Select(w => new { w.Name, w.OrganizationName })
                    .FirstOrDefaultAsync();

                if (warehouse != null)
                {
                    title = $"{warehouse.OrganizationName}/{warehouse.Name}";
                }
            }
            else if (item.ResourceType == "Document")
            {
                var document = await dbContext.DocumentFileItems
                    .AsNoTracking()
                    .Where(d => d.Id == item.ResourceId)
                    .Select(d => d.Title)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrEmpty(document))
                {
                    title = document;
                }
            }

            result.Add(new PopularContentDto
            {
                Id = item.ResourceId,
                Title = title,
                Type = item.ResourceType,
                ViewCount = item.ViewCount,
                LastViewAt = item.LastViewAt
            });
        }

        return result;
    }

    /// <summary>
    /// 记录访问
    /// </summary>
    /// <param name="resourceType">资源类型</param>
    /// <param name="resourceId">资源ID</param>
    /// <param name="userId">用户ID（可选）</param>
    /// <param name="ipAddress">IP地址</param>
    /// <param name="userAgent">用户代理</param>
    /// <param name="path">访问路径</param>
    /// <param name="method">请求方法</param>
    /// <param name="statusCode">状态码</param>
    /// <param name="responseTime">响应时间</param>
    /// <returns>是否成功</returns>
    public async Task<bool> RecordAccessAsync(
        string resourceType,
        string resourceId,
        string? userId = null,
        string ipAddress = "",
        string userAgent = "",
        string path = "",
        string method = "GET",
        int statusCode = 200,
        long responseTime = 0)
    {
        try
        {
            var accessRecord = new AccessRecord
            {
                ResourceType = resourceType,
                ResourceId = resourceId,
                UserId = userId,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                Path = path,
                Method = method,
                StatusCode = statusCode,
                ResponseTime = responseTime,
                CreatedAt = DateTime.UtcNow,
                Id = Guid.NewGuid().ToString()
            };

            await dbContext.AccessRecords.AddAsync(accessRecord);
            await dbContext.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "记录访问失败");
            return false;
        }
    }

    /// <summary>
    /// 生成每日统计数据
    /// </summary>
    /// <param name="date">统计日期（可选，默认为昨天）</param>
    /// <returns>是否成功</returns>
    [Authorize(Roles = "admin")]
    public async Task<bool> GenerateDailyStatisticsAsync(DateTime? date = null)
    {
        try
        {
            var targetDate = date?.Date ?? DateTime.UtcNow.Date.AddDays(-1);
            var nextDay = targetDate.AddDays(1);

            // 检查是否已存在该日期的统计数据
            var existingStats = await dbContext.DailyStatistics
                .FirstOrDefaultAsync(ds => ds.Date == targetDate);

            var newUsersCount = await dbContext.Users
                .Where(u => u.CreatedAt >= targetDate && u.CreatedAt < nextDay)
                .CountAsync();

            var newRepositoriesCount = await dbContext.Warehouses
                .Where(w => w.CreatedAt >= targetDate && w.CreatedAt < nextDay)
                .CountAsync();

            var newDocumentsCount = await dbContext.DocumentFileItems
                .Where(d => d.CreatedAt >= targetDate && d.CreatedAt < nextDay)
                .CountAsync();

            var pageViews = await dbContext.AccessRecords
                .Where(a => a.CreatedAt >= targetDate && a.CreatedAt < nextDay)
                .CountAsync();

            var uniqueVisitors = await dbContext.AccessRecords
                .Where(a => a.CreatedAt >= targetDate && a.CreatedAt < nextDay)
                .Select(a => a.IpAddress)
                .Distinct()
                .CountAsync();

            var activeUsers = await dbContext.AccessRecords
                .Where(a => a.CreatedAt >= targetDate && a.CreatedAt < nextDay &&
                            !string.IsNullOrEmpty(a.UserId))
                .Select(a => a.UserId)
                .Distinct()
                .CountAsync();

            if (existingStats != null)
            {
                // 更新现有统计数据
                existingStats.NewUsersCount = newUsersCount;
                existingStats.NewRepositoriesCount = newRepositoriesCount;
                existingStats.NewDocumentsCount = newDocumentsCount;
                existingStats.PageViews = pageViews;
                existingStats.UniqueVisitors = uniqueVisitors;
                existingStats.ActiveUsers = activeUsers;
                existingStats.UpdatedAt = DateTime.UtcNow;

                dbContext.DailyStatistics.Update(existingStats);
            }
            else
            {
                // 创建新的统计数据
                var dailyStats = new DailyStatistics
                {
                    Date = targetDate,
                    NewUsersCount = newUsersCount,
                    NewRepositoriesCount = newRepositoriesCount,
                    NewDocumentsCount = newDocumentsCount,
                    PageViews = pageViews,
                    UniqueVisitors = uniqueVisitors,
                    ActiveUsers = activeUsers,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await dbContext.DailyStatistics.AddAsync(dailyStats);
            }

            await dbContext.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "生成每日统计数据失败");
            return false;
        }
    }
}