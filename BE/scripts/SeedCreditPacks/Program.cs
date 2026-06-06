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

var config = new ConfigurationBuilder()
    .SetBasePath(FindBeRoot())
    .AddJsonFile("appsettings.json", optional: false)
    .Build();

var connectionString = config.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

const string sql = """
    CREATE TABLE IF NOT EXISTS credit_packs (
        id varchar(32) PRIMARY KEY,
        name varchar(120) NOT NULL,
        credits int NOT NULL CHECK (credits > 0),
        price_vnd bigint NOT NULL CHECK (price_vnd > 0),
        discount_percent smallint,
        sort_order smallint NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
    );

    INSERT INTO credit_packs (id, name, credits, price_vnd, discount_percent, sort_order, is_active)
    VALUES
        ('pack-200', 'Gói 200 xu', 200, 29000, NULL, 0, true),
        ('pack-800', 'Gói 800 xu', 800, 79000, 32, 1, true),
        ('pack-1900', 'Gói 1.900 xu', 1900, 150000, 45, 2, true)
    ON CONFLICT (id) DO NOTHING;
    """;

await using var cmd = new NpgsqlCommand(sql, conn);
await cmd.ExecuteNonQueryAsync();

Console.WriteLine("credit_packs table ready and default packs seeded.");
