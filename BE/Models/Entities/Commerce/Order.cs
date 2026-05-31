using Exe.Models;

namespace Exe.Models.Entities;

public class Order
{
    public Guid Id { get; set; }
    public string OrderCode { get; set; } = null!;
    public Guid UserId { get; set; }
    public OrderType OrderType { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public long SubtotalVnd { get; set; }
    public long DiscountVnd { get; set; }
    public long TotalVnd { get; set; }
    public int TotalXu { get; set; }
    public string? Notes { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; } = [];
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<UserAsset> UserAssets { get; set; } = [];
}
