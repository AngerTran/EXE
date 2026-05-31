using System.Text;
using Exe.Configuration;
using Exe.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Exe.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddSupabaseAuthentication(
        this IServiceCollection services,
        SupabaseOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.Url))
            throw new InvalidOperationException("Supabase:Url is required.");

        var issuer = $"{options.Url.TrimEnd('/')}/auth/v1";
        var jwksUrl = $"{issuer}/.well-known/jwks.json";

        services.AddHttpClient(nameof(SupabaseJwksProvider), client =>
        {
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        services.AddSingleton<SupabaseJwksProvider>(sp =>
        {
            var factory = sp.GetRequiredService<IHttpClientFactory>();
            var http = factory.CreateClient(nameof(SupabaseJwksProvider));
            return new SupabaseJwksProvider(http, jwksUrl);
        });

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer();

        services.AddSingleton<IPostConfigureOptions<JwtBearerOptions>, SupabaseJwtBearerPostConfigure>();

        services.AddAuthorization();

        return services;
    }

    private sealed class SupabaseJwtBearerPostConfigure(
        SupabaseJwksProvider jwksProvider,
        IOptions<SupabaseOptions> options) : IPostConfigureOptions<JwtBearerOptions>
    {
        public void PostConfigure(string? name, JwtBearerOptions jwt)
        {
            if (name != JwtBearerDefaults.AuthenticationScheme)
                return;

            var supabase = options.Value;
            var issuer = $"{supabase.Url.TrimEnd('/')}/auth/v1";
            var hasLegacySecret = !string.IsNullOrWhiteSpace(supabase.JwtSecret)
                && !supabase.JwtSecret.StartsWith("YOUR_", StringComparison.Ordinal);

            jwt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKeyResolver = (_, _, kid, _) =>
                {
                    var keys = jwksProvider.GetSigningKeysAsync().GetAwaiter().GetResult();

                    if (!string.IsNullOrEmpty(kid))
                    {
                        var matched = keys
                            .Where(k => string.Equals(k.KeyId, kid, StringComparison.OrdinalIgnoreCase))
                            .ToList();
                        if (matched.Count > 0)
                            return matched;
                    }

                    if (hasLegacySecret)
                    {
                        keys =
                        [
                            .. keys,
                            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(supabase.JwtSecret))
                        ];
                    }

                    return keys;
                },
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = "authenticated",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1)
            };
        }
    }
}
