using KoalaWiki.Core.Extensions;
using KoalaWiki.Provider.PostgreSQL;
using KoalaWiki.Provider.Sqlite;
using KoalaWiki.Provider.SqlServer;

namespace KoalaWiki.Extensions;

public static class DbContextExtensions
{
    public static IServiceCollection AddDbContext(this IServiceCollection services,
        IConfiguration configuration)
    {
        var dbType = Environment.GetEnvironmentVariable("DB_TYPE").GetTrimmedValueOrEmpty();
        var dbConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING").GetTrimmedValueOrEmpty();

        if (string.IsNullOrEmpty(dbType) || string.IsNullOrEmpty(dbConnectionString))
        {
            var dbTypeFromConfig = configuration.GetConnectionString("type")?.ToLower();
            if (dbTypeFromConfig == "postgres")
            {
                AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
                AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);
                services.AddPostgreSQLDbContext(configuration);
            }
            else if (dbTypeFromConfig == "sqlserver")
            {
                services.AddSqlServerDbContext(configuration);
            }
            else
            {
                services.AddSqliteDbContext(configuration);
            }

            return services;
        }

        if (dbType.Equals("postgres", StringComparison.OrdinalIgnoreCase))
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);
            services.AddPostgreSQLDbContext(dbConnectionString);
        }
        else if (dbType.Equals("sqlserver", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSqlServerDbContext(dbConnectionString);
        }
        else
        {
            services.AddSqliteDbContext(dbConnectionString);
        }

        return services;
    }
}