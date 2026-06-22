using System.Text.Json.Serialization;
using Exe.Configuration;
using Exe.Data;
using Exe.Extensions;
using Exe.Repositories;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.Extensions.Configuration.Json;
using Microsoft.Extensions.Options;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

// Render/Docker: tắt reload appsettings — tránh lỗi inotify limit (exit 139).
foreach (var source in builder.Configuration.Sources.OfType<JsonConfigurationSource>())
{
    source.ReloadOnChange = false;
}

builder.Services.Configure<SupabaseOptions>(
    builder.Configuration.GetSection(SupabaseOptions.SectionName));
builder.Services.Configure<StorageOptions>(
    builder.Configuration.GetSection(StorageOptions.SectionName));
builder.Services.Configure<PaymentOptions>(
    builder.Configuration.GetSection(PaymentOptions.SectionName));
builder.Services.Configure<BankTransferOptions>(
    builder.Configuration.GetSection(BankTransferOptions.SectionName));
builder.Services.Configure<AiOptions>(
    builder.Configuration.GetSection(AiOptions.SectionName));
builder.Services.PostConfigure<AiOptions>(options =>
{
    if (!string.IsNullOrWhiteSpace(options.ApiKey))
        return;
    var envKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
    if (!string.IsNullOrWhiteSpace(envKey))
        options.ApiKey = envKey.Trim();
});

var supabase = builder.Configuration
    .GetSection(SupabaseOptions.SectionName)
    .Get<SupabaseOptions>() ?? new SupabaseOptions();

var connectionString = ResolveConnectionString(builder.Configuration, builder.Environment);

builder.Services.AddSupabaseDatabase(connectionString);
builder.Services.AddRepositories();
builder.Services.AddSupabaseAuthentication(supabase);

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfileProvisioningService, ProfileProvisioningService>();
builder.Services.AddScoped<ISubscriptionPlanService, SubscriptionPlanService>();
builder.Services.AddScoped<ICreditPackService, CreditPackService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<ILookupService, LookupService>();
builder.Services.AddScoped<IAssetService, AssetService>();
builder.Services.AddScoped<IAssetStorageService, AssetStorageService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<OrderFulfillmentService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddSingleton<BankTransferInfoService>();
builder.Services.AddScoped<IUserAssetService, UserAssetService>();
builder.Services.AddScoped<IBookmarkService, BookmarkService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<ILlmChatService, LlmChatService>();
builder.Services.AddScoped<IAiAdvisorService, AiAdvisorService>();
builder.Services.AddHttpClient("LlmChat", client =>
{
    client.Timeout = TimeSpan.FromSeconds(90);
});
builder.Services.AddScoped<ISubscriptionUserService, SubscriptionUserService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IProfileAvatarService, ProfileAvatarService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHttpClient<IStorageService, SupabaseStorageService>(client =>
{
    client.BaseAddress = new Uri(supabase.Url.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(60);
});
builder.Services.AddHttpClient<ISupabaseAuthClient, SupabaseAuthClient>(client =>
{
    client.BaseAddress = new Uri(supabase.Url.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    });

builder.Services.AddSwaggerDocumentation();

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    var ai = app.Services.GetRequiredService<IOptions<AiOptions>>().Value;
    var aiMode = string.IsNullOrWhiteSpace(ai.ApiKey)
        ? "fallback (chưa có ApiKey)"
        : $"OpenAI {ai.Model}";
    app.Logger.LogInformation("AssetBox AI: {Mode}", aiMode);
}

app.UseSwaggerDocumentation();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static string ResolveConnectionString(IConfiguration configuration, IWebHostEnvironment environment)
{
    var candidates = new List<string?>();

    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrWhiteSpace(databaseUrl))
        candidates.Add(databaseUrl.Trim());

    var configured = configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrWhiteSpace(configured))
        candidates.Add(configured.Trim());

    foreach (var candidate in candidates)
    {
        if (TryNormalizeConnectionString(candidate, out var normalized))
            return normalized;
    }

    // Env trên Render có thể chỉ là hostname — đọc lại appsettings.json trong image.
    var appSettingsPath = Path.Combine(environment.ContentRootPath, "appsettings.json");
    if (File.Exists(appSettingsPath))
    {
        var fromFile = new ConfigurationBuilder()
            .AddJsonFile(appSettingsPath, optional: false, reloadOnChange: false)
            .Build()
            .GetConnectionString("DefaultConnection");
        if (TryNormalizeConnectionString(fromFile, out var fileCs))
            return fileCs;
    }

    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection is missing or invalid. " +
        "On Render set ConnectionStrings__DefaultConnection to the full Npgsql string, e.g. " +
        "Host=...;Port=5432;Database=postgres;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true. " +
        "Do not use hostname only.");
}

static bool TryNormalizeConnectionString(string? raw, out string connectionString)
{
    connectionString = string.Empty;
    if (string.IsNullOrWhiteSpace(raw))
        return false;

    var value = raw.Trim();

    if (value.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        || value.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        if (TryConvertPostgresUri(value, out connectionString))
            return true;
        return false;
    }

    if (!value.Contains('=', StringComparison.Ordinal))
        return false;

    try
    {
        _ = new NpgsqlConnectionStringBuilder(value);
        connectionString = value;
        return true;
    }
    catch
    {
        return false;
    }
}

static bool TryConvertPostgresUri(string uri, out string connectionString)
{
    connectionString = string.Empty;
    try
    {
        var parsed = new Uri(uri);
        if (parsed.Host.Length == 0)
            return false;

        var userInfo = parsed.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = parsed.Host,
            Port = parsed.Port > 0 ? parsed.Port : 5432,
            Database = parsed.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            SslMode = SslMode.Require,
        };
        if (userInfo.Length > 1)
            builder.Password = Uri.UnescapeDataString(userInfo[1]);

        connectionString = builder.ConnectionString;
        return true;
    }
    catch
    {
        return false;
    }
}
