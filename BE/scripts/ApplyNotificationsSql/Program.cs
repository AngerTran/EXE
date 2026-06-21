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
    throw new DirectoryNotFoundException("Could not find BE root.");
}

static string FindSqlFile(string beRoot, string fileName)
{
    foreach (var rel in new[] { Path.Combine("..", "docs", "sql", fileName), Path.Combine("..", "..", "docs", "sql", fileName) })
    {
        var path = Path.GetFullPath(Path.Combine(beRoot, rel));
        if (File.Exists(path))
            return path;
    }
    throw new FileNotFoundException($"Could not find docs/sql/{fileName}");
}

var beRoot = FindBeRoot();
var config = new ConfigurationBuilder()
    .SetBasePath(beRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .Build();

var connectionString = config.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection");

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

var step1 = await File.ReadAllTextAsync(FindSqlFile(beRoot, "add_notifications_step1_table.sql"));
await using (var cmd = new NpgsqlCommand(step1, conn))
    await cmd.ExecuteNonQueryAsync();
Console.WriteLine("OK: add_notifications_step1_table.sql");

var full = await File.ReadAllTextAsync(FindSqlFile(beRoot, "add_notifications.sql"));
await using (var cmd = new NpgsqlCommand(full, conn))
    await cmd.ExecuteNonQueryAsync();
Console.WriteLine("OK: add_notifications.sql");

await using var verify = new NpgsqlCommand("SELECT COUNT(*) FROM public.notifications", conn);
var count = (long?)await verify.ExecuteScalarAsync() ?? 0;
Console.WriteLine($"OK: notifications table exists (rows: {count})");
