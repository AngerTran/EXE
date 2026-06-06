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
    ?? throw new InvalidOperationException("Missing ConnectionStrings:DefaultConnection");

const string sql = """
    UPDATE subscription_plans
    SET credits_monthly = 100,
        features = '["100 xu miễn phí khi đăng ký", "Gợi ý assets cơ bản", "Truy cập marketplace đầy đủ", "Hỗ trợ qua email"]'::jsonb,
        updated_at = NOW()
    WHERE slug = 'free';

    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $function$
    DECLARE
      free_plan_id UUID;
      welcome_xu INT := 100;
      base_username TEXT;
      final_username TEXT;
      suffix INT := 0;
    BEGIN
      base_username := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'username', ''),
        split_part(NEW.email, '@', 1)
      );
      final_username := base_username;

      WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
        suffix := suffix + 1;
        final_username := base_username || suffix::TEXT;
      END LOOP;

      INSERT INTO public.profiles (id, username, email, name, role, avatar_url)
      VALUES (
        NEW.id,
        final_username,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', final_username),
        'customer',
        NEW.raw_user_meta_data->>'avatar_url'
      );

      SELECT id, COALESCE(credits_monthly, 100)
      INTO free_plan_id, welcome_xu
      FROM public.subscription_plans
      WHERE slug = 'free'
      LIMIT 1;

      IF free_plan_id IS NULL THEN
        welcome_xu := 100;
      END IF;

      INSERT INTO public.wallets (user_id, balance)
      VALUES (NEW.id, welcome_xu);

      IF free_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (user_id, plan_id, status, started_at)
        VALUES (NEW.id, free_plan_id, 'active', NOW());

        INSERT INTO public.wallet_transactions (wallet_id, type, amount, balance_after, description)
        SELECT w.id, 'BONUS', welcome_xu, welcome_xu, 'Xu chào mừng khi đăng ký'
        FROM public.wallets w WHERE w.user_id = NEW.id;
      END IF;

      RETURN NEW;
    END;
    $function$;
    """;

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand(sql, conn);
await cmd.ExecuteNonQueryAsync();
Console.WriteLine("Updated free plan welcome credits to 100 and handle_new_user() trigger.");
