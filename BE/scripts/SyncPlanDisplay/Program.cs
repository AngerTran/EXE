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
    SET description = 'Bắt đầu miễn phí — trải nghiệm AI & marketplace',
        features = '["100 xu tặng ngay khi đăng ký tài khoản", "Chat AI gợi ý asset phù hợp dự án của bạn", "Duyệt & mua asset trên marketplace bằng xu", "Hỗ trợ qua email trong giờ hành chính"]'::jsonb,
        updated_at = NOW()
    WHERE slug = 'free';

    UPDATE subscription_plans
    SET name = 'STUDENT',
        credits_monthly = 1000,
        description = 'Giá sinh viên — lý tưởng cho CNTT, Game & Multimedia',
        features = '["1.000 xu được cấp mỗi tháng — đủ cho ~1.000 lượt chat", "Gợi ý asset thông minh theo thể loại & engine game", "Truy cập đầy đủ marketplace — asset miễn phí & trả phí", "Tài liệu tiếng Việt & hỗ trợ email ưu tiên 24h"]'::jsonb,
        updated_at = NOW()
    WHERE slug = 'student';

    UPDATE subscription_plans
    SET name = 'PRO',
        description = 'Dành cho indie dev, studio nhỏ & chuyên gia',
        features = '["Xu không giới hạn — chat thoải mái không lo hết xu", "AI advisor nâng cao — phân tích dự án chi tiết hơn", "Gói asset độc quyền & ưu tiên cập nhật nội dung mới", "Hỗ trợ ưu tiên — phản hồi trong vòng 2 giờ làm việc"]'::jsonb,
        updated_at = NOW()
    WHERE slug = 'pro';
    """;

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand(sql, conn);
await cmd.ExecuteNonQueryAsync();
Console.WriteLine("Synced subscription plan display text (descriptions + features).");
