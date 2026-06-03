using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Billing;

public interface ISubscriptionPlanRepository
{
    Task<IReadOnlyList<SubscriptionPlan>> GetPlansAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default);

    Task<SubscriptionPlan?> GetByIdAsync(
        Guid id,
        bool activeOnly = true,
        CancellationToken cancellationToken = default);

    Task<SubscriptionPlan?> GetBySlugAsync(
        SubscriptionTier slug,
        bool activeOnly = true,
        CancellationToken cancellationToken = default);

    Task<SubscriptionPlan?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    void Add(SubscriptionPlan plan);
}
