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

var triggerSql = await File.ReadAllTextAsync(FindSqlFile(beRoot));

const string backfillShortWelcomeSql = """
    WITH short_welcome AS (
      SELECT w.id AS wallet_id
      FROM public.wallets w
      WHERE EXISTS (
        SELECT 1
        FROM public.wallet_transactions wt
        WHERE wt.wallet_id = w.id
          AND wt.type = 'BONUS'
          AND wt.amount = 10
          AND wt.description = 'Xu chào mừng khi đăng ký'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.wallet_transactions wt2
        WHERE wt2.wallet_id = w.id
          AND wt2.type = 'BONUS'
          AND wt2.description = 'Bù xu chào mừng (cập nhật 10 → 100)'
      )
    ),
    updated AS (
      UPDATE public.wallets w
      SET balance = w.balance + 90,
          updated_at = NOW()
      FROM short_welcome sw
      WHERE w.id = sw.wallet_id
      RETURNING w.id AS wallet_id, w.balance AS balance_after
    )
    INSERT INTO public.wallet_transactions (id, wallet_id, type, amount, balance_after, description, created_at)
    SELECT gen_random_uuid(), u.wallet_id, 'BONUS', 90, u.balance_after,
           'Bù xu chào mừng (cập nhật 10 → 100)', NOW()
    FROM updated u;
    """;

const string planSql = """
    UPDATE subscription_plans
    SET credits_monthly = 100,
        features = '["100 xu tặng ngay khi đăng ký tài khoản", "Chat AI gợi ý asset phù hợp dự án của bạn", "Duyệt & mua asset trên marketplace bằng xu", "Hỗ trợ qua email trong giờ hành chính"]'::jsonb,
        updated_at = NOW()
    WHERE slug = 'free';
    """;

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

await using (var planCmd = new NpgsqlCommand(planSql, conn))
    await planCmd.ExecuteNonQueryAsync();

await using (var triggerCmd = new NpgsqlCommand(triggerSql, conn))
    await triggerCmd.ExecuteNonQueryAsync();

int backfilled;
await using (var backfillCmd = new NpgsqlCommand(backfillShortWelcomeSql, conn))
    backfilled = await backfillCmd.ExecuteNonQueryAsync();

Console.WriteLine("Updated free plan to 100 xu, deployed handle_new_user() trigger.");
Console.WriteLine($"Backfilled welcome bonus for {backfilled} wallet(s) that had 10 xu.");
