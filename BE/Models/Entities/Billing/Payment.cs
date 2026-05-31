using Exe.Models;

namespace Exe.Models.Entities;

public class Payment
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public Guid? OrderId { get; set; }
    public long AmountVnd { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? GatewayRef { get; set; }
    public string Metadata { get; set; } = "{}";
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public Subscription? Subscription { get; set; }
    public Order? Order { get; set; }
}
