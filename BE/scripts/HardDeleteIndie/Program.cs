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
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection.");

const string checkSql = """
    SELECT
      (SELECT COUNT(*) FROM subscriptions s
       JOIN subscription_plans p ON p.id = s.plan_id WHERE p.slug = 'indie') AS subs,
      (SELECT COUNT(*) FROM order_items oi
       JOIN subscription_plans p ON p.id = oi.plan_id WHERE p.slug = 'indie') AS orders;
    """;

const string deleteSql = "DELETE FROM subscription_plans WHERE slug = 'indie';";

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

await using (var check = new NpgsqlCommand(checkSql, conn))
await using (var reader = await check.ExecuteReaderAsync())
{
    await reader.ReadAsync();
    var subs = reader.GetInt64(0);
    var orders = reader.GetInt64(1);
    if (subs > 0 || orders > 0)
    {
        Console.WriteLine($"Cannot delete indie: {subs} subscription(s), {orders} order item(s) still reference it.");
        return;
    }
}

await using var del = new NpgsqlCommand(deleteSql, conn);
var rows = await del.ExecuteNonQueryAsync();
Console.WriteLine(rows > 0 ? "Hard-deleted indie plan from database." : "Indie plan not found (already deleted).");
