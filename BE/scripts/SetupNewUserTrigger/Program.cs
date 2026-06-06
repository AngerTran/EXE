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

static string FindSqlFile(string beRoot)
{
    var fromBe = Path.GetFullPath(Path.Combine(beRoot, "..", "docs", "sql", "handle_new_user.sql"));
    if (File.Exists(fromBe))
        return fromBe;

    var fromRepo = Path.GetFullPath(Path.Combine(beRoot, "..", "..", "docs", "sql", "handle_new_user.sql"));
    if (File.Exists(fromRepo))
        return fromRepo;

    throw new FileNotFoundException("Could not find docs/sql/handle_new_user.sql");
}

var beRoot = FindBeRoot();
var config = new ConfigurationBuilder()
    .SetBasePath(beRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .Build();

var connectionString = config.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection");

var sql = await File.ReadAllTextAsync(FindSqlFile(beRoot));

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand(sql, conn);
await cmd.ExecuteNonQueryAsync();

Console.WriteLine("OK: handle_new_user() + trigger on_auth_user_created + backfill missing profiles.");
