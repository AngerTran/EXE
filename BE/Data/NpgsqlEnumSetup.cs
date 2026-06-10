using Npgsql;
using Exe.Models;

namespace Exe.Data;

public static class NpgsqlEnumSetup
{
    public static NpgsqlDataSource BuildDataSource(string connectionString)
    {
        var builder = new NpgsqlDataSourceBuilder(connectionString);

        builder.MapEnum<UserRole>("user_role");
        builder.MapEnum<UserStatus>("user_status");
        builder.MapEnum<SubscriptionTier>("subscription_tier");
        builder.MapEnum<SubscriptionStatus>("subscription_status");
        builder.MapEnum<WalletTxType>("wallet_tx_type");
        builder.MapEnum<PaymentStatus>("payment_status");
        builder.MapEnum<PaymentMethod>("payment_method");
        builder.MapEnum<OrderType>("order_type");
        builder.MapEnum<OrderStatus>("order_status");
        builder.MapEnum<AssetStatus>("asset_status");
        builder.MapEnum<PriceType>("price_type");
        builder.MapEnum<LicenseType>("license_type");
        builder.MapEnum<ArtStyle>("art_style");
        builder.MapEnum<AiMessageRole>("ai_message_role");
        builder.MapEnum<NotificationLevel>("notification_level");
        builder.MapEnum<NotificationCategory>("notification_category");

        return builder.Build();
    }
}
