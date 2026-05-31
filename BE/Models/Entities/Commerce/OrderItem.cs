namespace Exe.Models.Entities;

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid? AssetId { get; set; }
    public Guid? PlanId { get; set; }
    public string ItemName { get; set; } = null!;
    public long UnitPrice { get; set; }
    public short Quantity { get; set; } = 1;
    public long LineTotal { get; set; }
    public DateTime CreatedAt { get; set; }

    public Order Order { get; set; } = null!;
    public Asset? Asset { get; set; }
    public SubscriptionPlan? Plan { get; set; }
}
