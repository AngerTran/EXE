using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Exe.Data;

public static class DependencyInjection
{
    public static IServiceCollection AddSupabaseDatabase(
        this IServiceCollection services,
        string connectionString)
    {
        var dataSource = NpgsqlEnumSetup.BuildDataSource(connectionString);

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(dataSource).UseSnakeCaseNamingConvention());

        return services;
    }
}
