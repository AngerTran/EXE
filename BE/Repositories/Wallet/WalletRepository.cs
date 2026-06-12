using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories.Billing;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Wallet;

public class WalletRepository(AppDbContext db, ISubscriptionRepository subscriptionRepository) : IWalletRepository
{
    public Task<Models.Entities.Wallet?> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        db.Wallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);

    public async Task<bool> HasUnlimitedPlanAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await subscriptionRepository.ExpireOverdueForUserAsync(userId, cancellationToken);

        var now = DateTime.UtcNow;
        return await db.Subscriptions
            .AsNoTracking()
            .AnyAsync(
                s => s.UserId == userId
                    && s.Status == SubscriptionStatus.Active
                    && (s.ExpiredAt == null || s.ExpiredAt > now)
                    && s.Plan.IsUnlimited,
                cancellationToken);
    }

    public async Task<(IReadOnlyList<WalletTransaction> Items, int Total)> GetTransactionsAsync(
        Guid userId,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var query = db.WalletTransactions
            .AsNoTracking()
            .Where(t => t.Wallet.UserId == userId)
            .OrderByDescending(t => t.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip(skip)
            .Take(take)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<Models.Entities.Wallet?> GetByUserIdForUpdateAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        db.Wallets.FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);

    public async Task<HashSet<Guid>> GetAssetPurchaseOrderIdsAsync(
        IReadOnlyList<Guid> orderIds,
        CancellationToken cancellationToken = default)
    {
        if (orderIds.Count == 0)
            return [];

        var ids = await db.WalletTransactions
            .AsNoTracking()
            .Where(t => t.Type == WalletTxType.AssetPurchase
                && t.ReferenceId != null
                && orderIds.Contains(t.ReferenceId.Value)
                && t.Amount < 0)
            .Select(t => t.ReferenceId!.Value)
            .ToListAsync(cancellationToken);

        return ids.ToHashSet();
    }
}
