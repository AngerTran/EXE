using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Wallet;

public class WalletRepository(AppDbContext db) : IWalletRepository
{
    public Task<Models.Entities.Wallet?> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        db.Wallets
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);

    public Task<bool> HasUnlimitedPlanAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.Subscriptions
            .AsNoTracking()
            .AnyAsync(
                s => s.UserId == userId
                    && s.Status == SubscriptionStatus.Active
                    && s.Plan.IsUnlimited,
                cancellationToken);

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
}
