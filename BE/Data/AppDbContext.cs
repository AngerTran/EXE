using System.Net;
using Microsoft.EntityFrameworkCore;
using Exe.Models.Entities;

namespace Exe.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Profile> Profiles => Set<Profile>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
    public DbSet<CreditPack> CreditPacks => Set<CreditPack>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<TagGroup> TagGroups => Set<TagGroup>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Asset> Assets => Set<Asset>();
    public DbSet<AssetFile> AssetFiles => Set<AssetFile>();
    public DbSet<AssetImage> AssetImages => Set<AssetImage>();
    public DbSet<AssetTag> AssetTags => Set<AssetTag>();
    public DbSet<AssetReview> AssetReviews => Set<AssetReview>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<UserAsset> UserAssets => Set<UserAsset>();
    public DbSet<AiSession> AiSessions => Set<AiSession>();
    public DbSet<AiMessage> AiMessages => Set<AiMessage>();
    public DbSet<AiMessageAsset> AiMessageAssets => Set<AiMessageAsset>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ContactInquiry> ContactInquiries => Set<ContactInquiry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profile>(e =>
        {
            e.ToTable("profiles");
            e.Property(p => p.Role).HasColumnType("user_role");
            e.Property(p => p.Status).HasColumnType("user_status");
        });

        modelBuilder.Entity<SubscriptionPlan>(e =>
        {
            e.ToTable("subscription_plans");
            e.Property(p => p.Slug).HasColumnType("subscription_tier");
            e.Property(p => p.Features).HasColumnType("jsonb");
        });

        modelBuilder.Entity<CreditPack>(e =>
        {
            e.ToTable("credit_packs");
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasMaxLength(32);
            e.Property(p => p.Name).HasMaxLength(120);
        });

        modelBuilder.Entity<Subscription>(e =>
        {
            e.ToTable("subscriptions");
            e.Property(s => s.Status).HasColumnType("subscription_status");
        });

        modelBuilder.Entity<Wallet>(e => e.ToTable("wallets"));

        modelBuilder.Entity<WalletTransaction>(e =>
        {
            e.ToTable("wallet_transactions");
            e.Property(t => t.Type).HasColumnType("wallet_tx_type");
        });

        modelBuilder.Entity<Category>(e => e.ToTable("categories"));
        modelBuilder.Entity<TagGroup>(e => e.ToTable("tag_groups"));
        modelBuilder.Entity<Tag>(e => e.ToTable("tags"));

        modelBuilder.Entity<Asset>(e =>
        {
            e.ToTable("assets");
            e.Property(a => a.ArtStyle).HasColumnType("art_style");
            e.Property(a => a.PriceType).HasColumnType("price_type");
            e.Property(a => a.License).HasColumnType("license_type");
            e.Property(a => a.Status).HasColumnType("asset_status");
            e.HasOne(a => a.Approver).WithMany().HasForeignKey(a => a.ApprovedBy).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AssetFile>(e => e.ToTable("asset_files"));
        modelBuilder.Entity<AssetImage>(e => e.ToTable("asset_images"));

        modelBuilder.Entity<AssetTag>(e =>
        {
            e.ToTable("asset_tags");
            e.HasKey(t => new { t.AssetId, t.TagId });
        });

        modelBuilder.Entity<AssetReview>(e => e.ToTable("asset_reviews"));

        modelBuilder.Entity<Bookmark>(e =>
        {
            e.ToTable("bookmarks");
            e.HasKey(b => new { b.UserId, b.AssetId });
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.Property(o => o.OrderType).HasColumnType("order_type");
            e.Property(o => o.Status).HasColumnType("order_status");
        });

        modelBuilder.Entity<OrderItem>(e => e.ToTable("order_items"));

        modelBuilder.Entity<Payment>(e =>
        {
            e.ToTable("payments");
            e.Property(p => p.Method).HasColumnType("payment_method");
            e.Property(p => p.Status).HasColumnType("payment_status");
            e.Property(p => p.Metadata).HasColumnType("jsonb");
        });

        modelBuilder.Entity<CartItem>(e => e.ToTable("cart_items"));
        modelBuilder.Entity<UserAsset>(e => e.ToTable("user_assets"));

        modelBuilder.Entity<AiSession>(e => e.ToTable("ai_sessions"));

        modelBuilder.Entity<AiMessage>(e =>
        {
            e.ToTable("ai_messages");
            e.Property(m => m.Role).HasColumnType("ai_message_role");
            e.Property(m => m.Metadata).HasColumnType("jsonb");
        });

        modelBuilder.Entity<AiMessageAsset>(e =>
        {
            e.ToTable("ai_message_assets");
            e.HasKey(a => new { a.MessageId, a.AssetId });
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.ToTable("audit_logs");
            e.Property(a => a.IpAddress)
                .HasConversion(
                    v => string.IsNullOrWhiteSpace(v) ? null : IPAddress.Parse(v),
                    v => v == null ? null : v.ToString());
        });

        modelBuilder.Entity<ContactInquiry>(e =>
        {
            e.ToTable("contact_inquiries");
            e.Property(c => c.Status).HasMaxLength(20);
        });
    }
}
