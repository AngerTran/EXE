using Microsoft.Extensions.Configuration;
using Npgsql;

static string FindBeRoot()
{
    foreach (var dir in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
    {
        var current = new DirectoryInfo(Path.GetFullPath(dir));
        while (current is not null)
        {
            if (File.Exists(Path.Combine(current.FullName, "appsettings.json"))
                && File.Exists(Path.Combine(current.FullName, "Exe.csproj")))
                return current.FullName;
            current = current.Parent!;
        }
    }
    throw new DirectoryNotFoundException("Could not find BE root (appsettings.json).");
}

var config = new ConfigurationBuilder()
    .SetBasePath(FindBeRoot())
    .AddJsonFile("appsettings.json", optional: false)
    .Build();

var connectionString = config.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection in appsettings.json");

const string sql = """
    UPDATE subscription_plans
    SET price_vnd = 29000,
        name = 'STUDENT',
        description = 'Gói sinh viên',
        is_active = true,
        updated_at = NOW()
    WHERE slug = 'student';

    UPDATE subscription_plans
    SET is_active = true,
        updated_at = NOW()
    WHERE slug = 'indie';

    UPDATE subscription_plans
    SET price_vnd = 99000,
        name = 'PRO',
        description = 'Gói chuyên nghiệp',
        is_active = true,
        updated_at = NOW()
    WHERE slug = 'pro';
    """;

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand(sql, conn);
var rows = await cmd.ExecuteNonQueryAsync();
Console.WriteLine($"Sync subscription plans OK ({rows} statements affected).");
