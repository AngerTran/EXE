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

var beRoot = FindBeRoot();
var config = new ConfigurationBuilder()
    .SetBasePath(beRoot)
    .AddJsonFile("appsettings.json", optional: false)
    .Build();

var connectionString = config.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection");

const string sql = """
    SELECT g.slug, g.label, t.name, t.slug
    FROM public.tags t
    JOIN public.tag_groups g ON g.id = t.group_id
    ORDER BY g.sort_order, g.slug, t.name;
    """;

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand(sql, conn);
await using var reader = await cmd.ExecuteReaderAsync();

var currentGroup = "";
while (await reader.ReadAsync())
{
    var groupSlug = reader.GetString(0);
    if (groupSlug != currentGroup)
    {
        currentGroup = groupSlug;
        Console.WriteLine($"\n## {reader.GetString(1)} ({groupSlug})");
    }
    Console.WriteLine($"  {reader.GetString(2)} ({reader.GetString(3)})");
}
