using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Billing;

public class SubscriptionRepository(AppDbContext db) : ISubscriptionRepository
{
    public async Task ExpireOverdueForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var overdue = await db.Subscriptions
            .Where(s =>
                s.UserId == userId
                && s.Status == SubscriptionStatus.Active
                && s.ExpiredAt != null
                && s.ExpiredAt <= now)
            .ToListAsync(cancellationToken);

        if (overdue.Count == 0)
            return;

        foreach (var sub in overdue)
        {
            sub.Status = SubscriptionStatus.Expired;
            sub.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<Subscription?> GetActiveWithPlanAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await ExpireOverdueForUserAsync(userId, cancellationToken);

        var now = DateTime.UtcNow;
        return await db.Subscriptions
            .AsNoTracking()
            .Include(s => s.Plan)
            .Where(s =>
                s.UserId == userId
                && s.Status == SubscriptionStatus.Active
                && (s.ExpiredAt == null || s.ExpiredAt > now))
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> HasActivePaidPlanAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await ExpireOverdueForUserAsync(userId, cancellationToken);

        var now = DateTime.UtcNow;
        return await db.Subscriptions
            .AsNoTracking()
            .AnyAsync(
                s => s.UserId == userId
                    && s.Status == SubscriptionStatus.Active
                    && (s.ExpiredAt == null || s.ExpiredAt > now)
                    && s.Plan.Slug != SubscriptionTier.Free,
                cancellationToken);
    }

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
        CancellationToken cancellationToken = default)
    {
        await ExpireOverdueForUserAsync(userId, cancellationToken);

        var now = DateTime.UtcNow;
        return await db.Subscriptions
            .Include(s => s.Plan)
            .Where(s =>
                s.UserId == userId
                && s.Status == SubscriptionStatus.Active
                && (s.ExpiredAt == null || s.ExpiredAt > now))
            .ToListAsync(cancellationToken);
    }

    public void Add(Subscription subscription) => db.Subscriptions.Add(subscription);
}
