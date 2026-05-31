using Exe.Configuration;
using Exe.Data;
using Exe.Extensions;
using Exe.Repositories;
using Exe.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<SupabaseOptions>(
    builder.Configuration.GetSection(SupabaseOptions.SectionName));

var supabase = builder.Configuration
    .GetSection(SupabaseOptions.SectionName)
    .Get<SupabaseOptions>() ?? new SupabaseOptions();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

builder.Services.AddSupabaseDatabase(connectionString);
builder.Services.AddRepositories();
builder.Services.AddSupabaseAuthentication(supabase);

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHttpClient<ISupabaseAuthClient, SupabaseAuthClient>(client =>
{
    client.BaseAddress = new Uri(supabase.Url.TrimEnd('/') + "/");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddSwaggerDocumentation();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173")
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
