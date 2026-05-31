using Exe.Models;

namespace Exe.Models.Entities;

public class SubscriptionPlan
{
    public Guid Id { get; set; }
    public SubscriptionTier Slug { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public long PriceVnd { get; set; }
    public int? CreditsMonthly { get; set; }
    public bool IsUnlimited { get; set; }
    public string Features { get; set; } = "[]";
    public bool IsActive { get; set; } = true;
    public short SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Subscription> Subscriptions { get; set; } = [];
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
