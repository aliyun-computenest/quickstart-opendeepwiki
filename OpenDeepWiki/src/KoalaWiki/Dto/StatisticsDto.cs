namespace KoalaWiki.Dto;

/// <summary>
/// 系统统计数据DTO
/// </summary>
public class SystemStatisticsDto
{
    /// <summary>
    /// 总用户数
    /// </summary>
    public int TotalUsers { get; set; }

    /// <summary>
    /// 总仓库数
    /// </summary>
    public int TotalRepositories { get; set; }

    /// <summary>
    /// 总文档数
    /// </summary>
    public int TotalDocuments { get; set; }

    /// <summary>
    /// 总访问量
    /// </summary>
    public long TotalViews { get; set; }

    /// <summary>
    /// 本月新增用户数
    /// </summary>
    public int MonthlyNewUsers { get; set; }

    /// <summary>
    /// 本月新增仓库数
    /// </summary>
    public int MonthlyNewRepositories { get; set; }

    /// <summary>
    /// 本月新增文档数
    /// </summary>
    public int MonthlyNewDocuments { get; set; }

    /// <summary>
    /// 本月访问量
    /// </summary>
    public long MonthlyViews { get; set; }

    /// <summary>
    /// 用户增长率
    /// </summary>
    public decimal UserGrowthRate { get; set; }

    /// <summary>
    /// 仓库增长率
    /// </summary>
    public decimal RepositoryGrowthRate { get; set; }

    /// <summary>
    /// 文档增长率
    /// </summary>
    public decimal DocumentGrowthRate { get; set; }

    /// <summary>
    /// 访问量增长率
    /// </summary>
    public decimal ViewGrowthRate { get; set; }
}

/// <summary>
/// 最近仓库信息DTO
/// </summary>
public class RecentRepositoryDto
{
    /// <summary>
    /// 仓库ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 仓库名称
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 组织名称
    /// </summary>
    public string OrganizationName { get; set; } = string.Empty;

    /// <summary>
    /// 描述
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 状态
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// 是否推荐
    /// </summary>
    public bool IsRecommended { get; set; }

    /// <summary>
    /// 文档数量
    /// </summary>
    public int DocumentCount { get; set; }
}

/// <summary>
/// 最近用户信息DTO
/// </summary>
public class RecentUserDto
{
    /// <summary>
    /// 用户ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 用户名
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// 邮箱
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// 创建时间
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// 最后登录时间
    /// </summary>
    public DateTime? LastLoginAt { get; set; }

    /// <summary>
    /// 角色
    /// </summary>
    public List<string> Roles { get; set; } = new List<string>();

    /// <summary>
    /// 是否在线
    /// </summary>
    public bool IsOnline { get; set; }
}

/// <summary>
/// 趋势数据DTO
/// </summary>
public class TrendDataDto
{
    /// <summary>
    /// 日期
    /// </summary>
    public string Date { get; set; } = string.Empty;

    /// <summary>
    /// 数值
    /// </summary>
    public long Value { get; set; }
}

/// <summary>
/// 详细统计数据DTO
/// </summary>
public class DetailedStatisticsDto
{
    /// <summary>
    /// 系统统计数据
    /// </summary>
    public SystemStatisticsDto SystemStats { get; set; } = new();

    /// <summary>
    /// 最近创建的仓库
    /// </summary>
    public List<RecentRepositoryDto> RecentRepositories { get; set; } = new();

    /// <summary>
    /// 最近注册的用户
    /// </summary>
    public List<RecentUserDto> RecentUsers { get; set; } = new();

    /// <summary>
    /// 用户趋势数据（最近30天）
    /// </summary>
    public List<TrendDataDto> UserTrends { get; set; } = new();

    /// <summary>
    /// 仓库趋势数据（最近30天）
    /// </summary>
    public List<TrendDataDto> RepositoryTrends { get; set; } = new();

    /// <summary>
    /// 文档趋势数据（最近30天）
    /// </summary>
    public List<TrendDataDto> DocumentTrends { get; set; } = new();

    /// <summary>
    /// 访问量趋势数据（最近30天）
    /// </summary>
    public List<TrendDataDto> ViewTrends { get; set; } = new();
}

/// <summary>
/// 热门内容DTO
/// </summary>
public class PopularContentDto
{
    /// <summary>
    /// 内容ID
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// 内容标题
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// 内容类型
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// 访问次数
    /// </summary>
    public long ViewCount { get; set; }

    /// <summary>
    /// 最后访问时间
    /// </summary>
    public DateTime LastViewAt { get; set; }
} 