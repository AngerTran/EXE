using Exe.Models.Entities;

namespace Exe.Models;

public static class SubscriptionRules
{
    public static bool IsEffectivelyActive(Subscription subscription, DateTime? utcNow = null)
    {
        utcNow ??= DateTime.UtcNow;
        return subscription.Status == SubscriptionStatus.Active
            && (subscription.ExpiredAt is null || subscription.ExpiredAt > utcNow);
    }
}
