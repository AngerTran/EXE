using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
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

    public async Task<(int OrderCount, int AssetCount)> GetUserCountsDetailAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var orderCount = await db.Orders.CountAsync(o => o.UserId == userId, cancellationToken);
        var assetCount = await db.Assets.CountAsync(a => a.UploaderId == userId && a.DeletedAt == null, cancellationToken);
        return (orderCount, assetCount);
    }

    public async Task<(IReadOnlyList<ContactInquiry> Items, int Total)> ListContactInquiriesAsync(
        string? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.ContactInquiries.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(c => c.Status == status.Trim().ToLowerInvariant());
        q = q.OrderByDescending(c => c.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<ContactInquiry?> GetContactInquiryForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.ContactInquiries.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<AuditLog> Items, int Total)> ListAuditLogsAsync(
        Guid? userId,
        string? action,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.AuditLogs.AsNoTracking().AsQueryable();
        if (userId.HasValue)
            q = q.Where(a => a.UserId == userId.Value);
        if (!string.IsNullOrWhiteSpace(action))
            q = q.Where(a => a.Action == action.Trim());
        q = q.OrderByDescending(a => a.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<long> GetRevenueInRangeAsync(
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default)
    {
        var q = db.Orders.Where(o => o.Status == OrderStatus.Completed);
        if (from.HasValue)
            q = q.Where(o => o.CompletedAt >= from.Value);
        if (to.HasValue)
            q = q.Where(o => o.CompletedAt <= to.Value);
        return await q.SumAsync(o => o.TotalVnd, cancellationToken);
    }

    public async Task<IReadOnlyList<(DateTime Day, long Amount)>> GetRevenueByDayAsync(
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default)
    {
        var q = db.Orders
            .AsNoTracking()
            .Where(o => o.Status == OrderStatus.Completed && o.CompletedAt != null);
        if (from.HasValue)
            q = q.Where(o => o.CompletedAt >= from.Value);
        if (to.HasValue)
            q = q.Where(o => o.CompletedAt <= to.Value);

        var rows = await q
            .GroupBy(o => o.CompletedAt!.Value.Date)
            .Select(g => new { Day = g.Key, Amount = g.Sum(o => o.TotalVnd) })
            .OrderBy(x => x.Day)
            .ToListAsync(cancellationToken);
        return rows.Select(x => (x.Day, x.Amount)).ToList();
    }

    public async Task<IReadOnlyList<(DateTime Day, int Count)>> GetUserRegistrationsByDayAsync(
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default)
    {
        var q = db.Profiles.AsNoTracking().Where(p => p.DeletedAt == null);
        if (from.HasValue)
            q = q.Where(p => p.CreatedAt >= from.Value);
        if (to.HasValue)
            q = q.Where(p => p.CreatedAt <= to.Value);

        var rows = await q
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new { Day = g.Key, Count = g.Count() })
            .OrderBy(x => x.Day)
            .ToListAsync(cancellationToken);
        return rows.Select(x => (x.Day, x.Count)).ToList();
    }

    public async Task<IReadOnlyList<(Guid CategoryId, string CategoryName, int AssetCount, int DownloadCount)>> GetAssetStatsByCategoryAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await db.Assets
            .AsNoTracking()
            .Where(a => a.DeletedAt == null)
            .Include(a => a.Category)
            .GroupBy(a => new { a.CategoryId, a.Category!.Name })
            .Select(g => new
            {
                g.Key.CategoryId,
                CategoryName = g.Key.Name,
                AssetCount = g.Count(),
                DownloadCount = g.Sum(a => a.DownloadCount)
            })
            .OrderByDescending(x => x.DownloadCount)
            .ToListAsync(cancellationToken);
        return rows.Select(x => (x.CategoryId, x.CategoryName, x.AssetCount, x.DownloadCount)).ToList();
    }

    public async Task<IReadOnlyList<(OrderStatus Status, int Count)>> GetOrderCountsByStatusAsync(
        CancellationToken cancellationToken = default)
    {
        var rows = await db.Orders
            .AsNoTracking()
            .GroupBy(o => o.Status)
            .Select(g => new { g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        return rows.Select(x => (x.Key, x.Count)).ToList();
    }
}
