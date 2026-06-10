using Exe.Repositories.Admin;
using Exe.Repositories.Notification;
using Exe.Repositories.Support;
using Exe.Repositories.Ai;
using Exe.Repositories.Billing;
using Exe.Repositories.Commerce;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Profile;
using Exe.Repositories.Wallet;

namespace Exe.Repositories;

public static class DependencyInjection
{
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IProfileRepository, ProfileRepository>();
        services.AddScoped<ISubscriptionPlanRepository, SubscriptionPlanRepository>();
        services.AddScoped<ICreditPackRepository, CreditPackRepository>();
        services.AddScoped<IWalletRepository, WalletRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ITagRepository, TagRepository>();
        services.AddScoped<IAssetRepository, AssetRepository>();
        services.AddScoped<IAssetStorageRepository, AssetStorageRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IUserAssetRepository, UserAssetRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IBookmarkRepository, BookmarkRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped<IAiRepository, AiRepository>();
        services.AddScoped<IAdminRepository, AdminRepository>();
        services.AddScoped<IContactInquiryRepository, ContactInquiryRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();

        return services;
    }
}
