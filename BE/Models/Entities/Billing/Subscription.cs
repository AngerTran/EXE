using Exe.Models;

namespace Exe.Models.Entities;

public class Subscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PlanId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Pending;
    public DateTime StartedAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = [];
}
