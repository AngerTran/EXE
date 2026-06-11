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
    var fromBe = Path.GetFullPath(Path.Combine(beRoot, "..", "docs", "sql", "add_fantasy_tileset_tags.sql"));
    if (File.Exists(fromBe))
        return fromBe;

    var fromRepo = Path.GetFullPath(Path.Combine(beRoot, "..", "..", "docs", "sql", "add_fantasy_tileset_tags.sql"));
    if (File.Exists(fromRepo))
        return fromRepo;

    throw new FileNotFoundException("Could not find docs/sql/add_fantasy_tileset_tags.sql");
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

const string verifySql = """
    SELECT g.label, t.name, t.slug
    FROM public.tags t
    JOIN public.tag_groups g ON g.id = t.group_id
    WHERE t.slug IN ('tiled', 'village', 'farm', 'fantasy', 'tileset', 'top-down', 'rpg')
    ORDER BY g.label, t.name;
    """;

await using var verifyCmd = new NpgsqlCommand(verifySql, conn);
await using var reader = await verifyCmd.ExecuteReaderAsync();
Console.WriteLine("Fantasy tileset tags:");
while (await reader.ReadAsync())
    Console.WriteLine($"  [{reader.GetString(0)}] {reader.GetString(1)} ({reader.GetString(2)})");
