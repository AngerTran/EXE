using Exe.Models;

namespace Exe.Models.Entities;

public class Profile
{
    public Guid Id { get; set; }
    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public UserRole Role { get; set; } = UserRole.Customer;
    public string? AvatarUrl { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public long TotalSpentVnd { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public Wallet? Wallet { get; set; }
    public ICollection<Subscription> Subscriptions { get; set; } = [];
    public ICollection<Asset> UploadedAssets { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<CartItem> CartItems { get; set; } = [];
    public ICollection<UserAsset> UserAssets { get; set; } = [];
    public ICollection<Bookmark> Bookmarks { get; set; } = [];
    public ICollection<AssetReview> Reviews { get; set; } = [];
    public ICollection<AiSession> AiSessions { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
}
