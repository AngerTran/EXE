using Exe.Data;
using Exe.Models;
using ProfileEntity = Exe.Models.Entities.Profile;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Admin;

public class AdminRepository(AppDbContext db) : IAdminRepository
{
    public async Task<(int TotalUsers, int ActiveUsers)> GetUserCountsAsync(
        CancellationToken cancellationToken = default)
    {
        var total = await db.Profiles.CountAsync(p => p.DeletedAt == null, cancellationToken);
        var active = await db.Profiles.CountAsync(
            p => p.DeletedAt == null && p.Status == UserStatus.Active,
            cancellationToken);
        return (total, active);
    }

    public async Task<(int TotalAssets, int PendingAssets, int TotalDownloads)> GetAssetStatsAsync(
        CancellationToken cancellationToken = default)
    {
        var total = await db.Assets.CountAsync(a => a.DeletedAt == null, cancellationToken);
        var pending = await db.Assets.CountAsync(
            a => a.DeletedAt == null && a.Status == AssetStatus.PendingReview,
            cancellationToken);
        var downloads = await db.Assets
            .Where(a => a.DeletedAt == null)
            .SumAsync(a => a.DownloadCount, cancellationToken);
        return (total, pending, downloads);
    }

    public async Task<(int TotalOrders, long RevenueVnd)> GetOrderStatsAsync(
        CancellationToken cancellationToken = default)
    {
        var completed = db.Orders.Where(o => o.Status == OrderStatus.Completed);
        var count = await completed.CountAsync(cancellationToken);
        var revenue = await completed.SumAsync(o => o.TotalVnd, cancellationToken);
        return (count, revenue);
    }

    public async Task<(IReadOnlyList<ProfileEntity> Items, int Total)> ListUsersAsync(
        string? search,
        UserRole? role,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.Profiles
            .AsNoTracking()
            .Where(p => p.DeletedAt == null)
            .Include(p => p.Wallet)
            .Include(p => p.Subscriptions.Where(s => s.Status == SubscriptionStatus.Active))
                .ThenInclude(s => s.Plan)
            .AsQueryable();

        if (role.HasValue)
            q = q.Where(p => p.Role == role.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            q = q.Where(p =>
                p.Email.ToLower().Contains(term)
                || p.Name.ToLower().Contains(term)
                || p.Username.ToLower().Contains(term));
        }

        q = q.OrderByDescending(p => p.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<ProfileEntity?> GetUserForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Profiles
            .Include(p => p.Wallet)
            .FirstOrDefaultAsync(p => p.Id == id && p.DeletedAt == null, cancellationToken);

    public Task<ProfileEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Profiles
            .AsNoTracking()
            .Where(p => p.Id == id && p.DeletedAt == null)
            .Include(p => p.Wallet)
            .Include(p => p.Subscriptions.Where(s => s.Status == SubscriptionStatus.Active))
                .ThenInclude(s => s.Plan)
            .FirstOrDefaultAsync(cancellationToken);
}
