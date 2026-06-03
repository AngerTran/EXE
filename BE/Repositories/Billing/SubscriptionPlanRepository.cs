using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Billing;

public class SubscriptionPlanRepository(AppDbContext db) : ISubscriptionPlanRepository
{
    private IQueryable<SubscriptionPlan> PlansQuery(bool activeOnly)
    {
        var query = db.SubscriptionPlans.AsNoTracking();
        if (activeOnly)
            query = query.Where(p => p.IsActive);
        return query.OrderBy(p => p.SortOrder).ThenBy(p => p.Name);
    }

    public async Task<IReadOnlyList<SubscriptionPlan>> GetPlansAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default) =>
        await PlansQuery(activeOnly).ToListAsync(cancellationToken);

    public Task<SubscriptionPlan?> GetByIdAsync(
        Guid id,
        bool activeOnly = true,
        CancellationToken cancellationToken = default) =>
        PlansQuery(activeOnly).FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<SubscriptionPlan?> GetBySlugAsync(
        SubscriptionTier slug,
        bool activeOnly = true,
        CancellationToken cancellationToken = default) =>
        PlansQuery(activeOnly).FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);

    public Task<SubscriptionPlan?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.SubscriptionPlans.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public void Add(SubscriptionPlan plan) => db.SubscriptionPlans.Add(plan);
}
