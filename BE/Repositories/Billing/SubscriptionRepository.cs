using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Billing;

public class SubscriptionRepository(AppDbContext db) : ISubscriptionRepository
{
    public Task<Subscription?> GetActiveWithPlanAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.Subscriptions
            .AsNoTracking()
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> HasActivePaidPlanAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.Subscriptions
            .AsNoTracking()
            .AnyAsync(
                s => s.UserId == userId
                    && s.Status == SubscriptionStatus.Active
                    && s.Plan.Slug != SubscriptionTier.Free,
                cancellationToken);

    public async Task<IReadOnlyList<Subscription>> GetHistoryAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await db.Subscriptions
            .AsNoTracking()
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Subscription>> GetActiveForUpdateAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await db.Subscriptions
            .Include(s => s.Plan)
            .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
            .ToListAsync(cancellationToken);

    public void Add(Subscription subscription) => db.Subscriptions.Add(subscription);
}
