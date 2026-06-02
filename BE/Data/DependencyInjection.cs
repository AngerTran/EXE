using Exe.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Exe.Data;

public static class DependencyInjection
{
    public static IServiceCollection AddSupabaseDatabase(
        this IServiceCollection services,
        string connectionString)
    {
        var dataSource = NpgsqlEnumSetup.BuildDataSource(connectionString);

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(dataSource, npgsql =>
            {
                npgsql.MapEnum<UserRole>("user_role");
                npgsql.MapEnum<UserStatus>("user_status");
                npgsql.MapEnum<SubscriptionTier>("subscription_tier");
                npgsql.MapEnum<SubscriptionStatus>("subscription_status");
                npgsql.MapEnum<WalletTxType>("wallet_tx_type");
                npgsql.MapEnum<PaymentStatus>("payment_status");
                npgsql.MapEnum<PaymentMethod>("payment_method");
                npgsql.MapEnum<OrderType>("order_type");
                npgsql.MapEnum<OrderStatus>("order_status");
                npgsql.MapEnum<AssetStatus>("asset_status");
                npgsql.MapEnum<PriceType>("price_type");
                npgsql.MapEnum<LicenseType>("license_type");
                npgsql.MapEnum<ArtStyle>("art_style");
                npgsql.MapEnum<AiMessageRole>("ai_message_role");
            }).UseSnakeCaseNamingConvention());

        return services;
    }
}
