using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Billing;

public interface ISubscriptionRepository
{
    /// <summary>Marks active subscriptions past <see cref="Subscription.ExpiredAt"/> as expired.</summary>
    Task ExpireOverdueForUserAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<Subscription?> GetActiveWithPlanAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> HasActivePaidPlanAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Subscription>> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Subscription>> GetActiveForUpdateAsync(Guid userId, CancellationToken cancellationToken = default);

    void Add(Subscription subscription);
}
