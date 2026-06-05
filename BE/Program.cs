using System.Text.Json.Serialization;
using Exe.Configuration;
using Exe.Data;
using Exe.Extensions;
using Exe.Repositories;
using Exe.Services;
using Exe.Services.IServices;
using Exe.Services.Payments;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SupabaseOptions>(
    builder.Configuration.GetSection(SupabaseOptions.SectionName));
builder.Services.Configure<StorageOptions>(
    builder.Configuration.GetSection(StorageOptions.SectionName));
builder.Services.Configure<PaymentOptions>(
    builder.Configuration.GetSection(PaymentOptions.SectionName));
builder.Services.Configure<MomoOptions>(
    builder.Configuration.GetSection(MomoOptions.SectionName));
builder.Services.Configure<VnpayOptions>(
    builder.Configuration.GetSection(VnpayOptions.SectionName));

var supabase = builder.Configuration
    .GetSection(SupabaseOptions.SectionName)
    .Get<SupabaseOptions>() ?? new SupabaseOptions();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

builder.Services.AddSupabaseDatabase(connectionString);
builder.Services.AddRepositories();
builder.Services.AddSupabaseAuthentication(supabase);

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ISubscriptionPlanService, SubscriptionPlanService>();
builder.Services.AddScoped<IWalletService, WalletService>();
builder.Services.AddScoped<ILookupService, LookupService>();
builder.Services.AddScoped<IAssetService, AssetService>();
builder.Services.AddScoped<IAssetStorageService, AssetStorageService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<OrderFulfillmentService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<PaymentGatewayResolver>();
builder.Services.AddHttpClient<MomoPaymentGateway>();
builder.Services.AddScoped<IPaymentGateway, MomoPaymentGateway>(sp => sp.GetRequiredService<MomoPaymentGateway>());
builder.Services.AddScoped<IPaymentGateway, VnpayPaymentGateway>();
builder.Services.AddScoped<IUserAssetService, UserAssetService>();
builder.Services.AddScoped<IBookmarkService, BookmarkService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IAiAdvisorService, AiAdvisorService>();
builder.Services.AddScoped<ISubscriptionUserService, SubscriptionUserService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IProfileAvatarService, ProfileAvatarService>();
builder.Services.AddHttpClient<IStorageService, SupabaseStorageService>();
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

app.UseSwaggerDocumentation();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
