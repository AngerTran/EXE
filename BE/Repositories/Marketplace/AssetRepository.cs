using Exe.Data;
using Exe.DTOs.Marketplace;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Marketplace;

public class AssetRepository(AppDbContext db) : IAssetRepository
{
    private IQueryable<Asset> ApprovedAssetsQuery =>
        db.Assets
            .AsNoTracking()
            .Where(a => a.Status == AssetStatus.Approved && a.DeletedAt == null);

    public async Task<(IReadOnlyList<Asset> Items, int Total)> ListApprovedAsync(
        AssetQueryParams query,
        Guid? viewerUserId = null,
        CancellationToken cancellationToken = default)
    {
        var q = ApprovedAssetsQuery
            .Include(a => a.Category)
            .Include(a => a.Uploader)
            .Include(a => a.AssetTags).ThenInclude(at => at.Tag)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            q = q.Where(a =>
                a.Title.ToLower().Contains(term)
                || (a.ShortDescription != null && a.ShortDescription.ToLower().Contains(term))
                || a.AssetTags.Any(at => at.Tag.Name.ToLower().Contains(term)));
        }

        if (query.CategoryId.HasValue)
            q = q.Where(a => a.CategoryId == query.CategoryId.Value);

        if (query.UploaderId.HasValue)
            q = q.Where(a => a.UploaderId == query.UploaderId.Value);

        if (!string.IsNullOrWhiteSpace(query.PriceType))
        {
            if (Enum.TryParse<PriceType>(query.PriceType, ignoreCase: true, out var priceType))
                q = q.Where(a => a.PriceType == priceType);
        }

        if (!string.IsNullOrWhiteSpace(query.Tag))
        {
            var tagSlug = query.Tag.Trim().ToLower();
            q = q.Where(a => a.AssetTags.Any(at => at.Tag.Slug == tagSlug || at.Tag.Name.ToLower() == tagSlug));
        }

        if (query.Featured)
        {
            q = viewerUserId.HasValue
                ? ApplySecondarySort(
                    q.OrderBy(a => db.UserAssets.Any(ua =>
                        ua.UserId == viewerUserId.Value && ua.AssetId == a.Id)),
                    "downloadCount",
                    "desc")
                : q.OrderByDescending(a => a.DownloadCount);
        }
        else if (viewerUserId.HasValue)
        {
            q = ApplySecondarySort(
                q.OrderBy(a => db.UserAssets.Any(ua =>
                    ua.UserId == viewerUserId.Value && ua.AssetId == a.Id)),
                query.Sort,
                query.Order);
        }
        else
        {
            q = ApplySort(q, query.Sort, query.Order);
        }

        var total = await q.CountAsync(cancellationToken);
        var page = query.Featured ? 1 : query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize switch
        {
            < 1 => 20,
            > 100 => 100,
            _ => query.PageSize
        };
        if (query.Featured && query.Limit is > 0)
            pageSize = Math.Min(pageSize, query.Limit.Value);

        var items = await q
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<Asset?> GetApprovedByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        ApprovedAssetsQuery
            .Include(a => a.Category)
            .Include(a => a.Uploader)
            .Include(a => a.AssetTags).ThenInclude(at => at.Tag)
            .Include(a => a.Files)
            .Include(a => a.Images)
            .Include(a => a.Reviews).ThenInclude(r => r.User)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public Task<Asset?> GetApprovedBySlugAsync(string slug, CancellationToken cancellationToken = default) =>
        ApprovedAssetsQuery
            .Include(a => a.Category)
            .Include(a => a.Uploader)
            .Include(a => a.AssetTags).ThenInclude(at => at.Tag)
            .Include(a => a.Files)
            .Include(a => a.Images)
            .Include(a => a.Reviews).ThenInclude(r => r.User)
            .FirstOrDefaultAsync(a => a.Slug == slug, cancellationToken);

    public Task<Asset?> GetByIdForOwnerOrAdminAsync(
        Guid id,
        Guid? ownerId,
        bool includeNonApproved,
        CancellationToken cancellationToken = default)
    {
        var q = db.Assets
            .Where(a => a.DeletedAt == null && a.Id == id);

        if (!includeNonApproved)
            q = q.Where(a => a.Status == AssetStatus.Approved);

        if (ownerId.HasValue)
            q = q.Where(a => a.UploaderId == ownerId.Value);

        return q
            .Include(a => a.Category)
            .Include(a => a.AssetTags)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Asset?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Assets
            .Include(a => a.AssetTags)
            .FirstOrDefaultAsync(a => a.Id == id && a.DeletedAt == null, cancellationToken);

    public Task<Asset?> GetWithDetailsByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Assets
            .AsNoTracking()
            .Where(a => a.DeletedAt == null && a.Id == id)
            .Include(a => a.Category)
            .Include(a => a.Uploader)
            .Include(a => a.AssetTags).ThenInclude(at => at.Tag)
            .Include(a => a.Files)
            .Include(a => a.Images)
            .Include(a => a.Reviews).ThenInclude(r => r.User)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> SlugExistsAsync(
        string slug,
        Guid? excludeAssetId = null,
        CancellationToken cancellationToken = default)
    {
        var q = db.Assets.Where(a => a.Slug == slug && a.DeletedAt == null);
        if (excludeAssetId.HasValue)
            q = q.Where(a => a.Id != excludeAssetId.Value);
        return q.AnyAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Asset> Items, int Total)> ListByUploaderAsync(
        Guid uploaderId,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.Assets
            .AsNoTracking()
            .Where(a => a.DeletedAt == null && a.UploaderId == uploaderId)
            .Include(a => a.Category)
            .Include(a => a.Uploader)
            .Include(a => a.AssetTags).ThenInclude(at => at.Tag)
            .OrderByDescending(a => a.CreatedAt);

        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<(int Total, int Approved, int PendingReview, int Rejected, int Draft, long TotalDownloads)> GetUploaderStatsAsync(
        Guid uploaderId,
        CancellationToken cancellationToken = default)
    {
        var q = db.Assets.AsNoTracking()
            .Where(a => a.DeletedAt == null && a.UploaderId == uploaderId);

        var total = await q.CountAsync(cancellationToken);
        var approved = await q.CountAsync(a => a.Status == AssetStatus.Approved, cancellationToken);
        var pendingReview = await q.CountAsync(a => a.Status == AssetStatus.PendingReview, cancellationToken);
        var rejected = await q.CountAsync(a => a.Status == AssetStatus.Rejected, cancellationToken);
        var draft = await q.CountAsync(a => a.Status == AssetStatus.Draft, cancellationToken);
        var totalDownloads = await q.SumAsync(a => (long)a.DownloadCount, cancellationToken);

        return (total, approved, pendingReview, rejected, draft, totalDownloads);
    }

    public async Task<(IReadOnlyList<Asset> Items, int Total)> ListAdminAsync(
        string? search,
        AssetStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.Assets
            .AsNoTracking()
            .Where(a => a.DeletedAt == null)
            .Include(a => a.Category)
            .Include(a => a.Uploader)
            .Include(a => a.AssetTags).ThenInclude(at => at.Tag)
            .AsQueryable();

        if (status.HasValue)
            q = q.Where(a => a.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            q = q.Where(a =>
                a.Title.ToLower().Contains(term)
                || (a.ShortDescription != null && a.ShortDescription.ToLower().Contains(term)));
        }

        q = q.OrderByDescending(a => a.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<(IReadOnlyList<Asset> Items, int Total)> ListPendingReviewAsync(
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.Assets
            .AsNoTracking()
            .Where(a => a.Status == AssetStatus.PendingReview && a.DeletedAt == null)
            .Include(a => a.Category)
            .Include(a => a.Uploader)
            .OrderByDescending(a => a.SubmittedAt);

        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<Asset?> GetForHardDeleteAsync(Guid assetId, CancellationToken cancellationToken = default) =>
        db.Assets
            .Include(a => a.AssetTags)
            .Include(a => a.Files)
            .Include(a => a.Images)
            .Include(a => a.Reviews)
            .FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);

    public async Task<(int UserAssets, int OrderItems)> GetPurchaseReferenceCountsAsync(
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        var userAssets = await db.UserAssets.CountAsync(ua => ua.AssetId == assetId, cancellationToken);
        var orderItems = await db.OrderItems.CountAsync(oi => oi.AssetId == assetId, cancellationToken);
        return (userAssets, orderItems);
    }

    public void Add(Asset asset) => db.Assets.Add(asset);

    public void RemoveAssetTags(Asset asset) => db.AssetTags.RemoveRange(asset.AssetTags);

    public void AddAssetTags(IEnumerable<AssetTag> assetTags) => db.AssetTags.AddRange(assetTags);

    public async Task RemoveWithDependentsAsync(Asset asset, CancellationToken cancellationToken = default)
    {
        var assetId = asset.Id;
        await db.CartItems.Where(c => c.AssetId == assetId).ExecuteDeleteAsync(cancellationToken);
        await db.Bookmarks.Where(b => b.AssetId == assetId).ExecuteDeleteAsync(cancellationToken);
        await db.AiMessageAssets.Where(a => a.AssetId == assetId).ExecuteDeleteAsync(cancellationToken);
        await db.SellerEarnings.Where(e => e.AssetId == assetId).ExecuteDeleteAsync(cancellationToken);
        db.AssetReviews.RemoveRange(asset.Reviews);
        db.AssetFiles.RemoveRange(asset.Files);
        db.AssetImages.RemoveRange(asset.Images);
        db.AssetTags.RemoveRange(asset.AssetTags);
        db.Assets.Remove(asset);
    }

    private static IQueryable<Asset> ApplySort(IQueryable<Asset> q, string sort, string order)
    {
        var desc = string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase);
        return sort.ToLowerInvariant() switch
        {
            "downloadcount" => desc ? q.OrderByDescending(a => a.DownloadCount) : q.OrderBy(a => a.DownloadCount),
            "ratingavg" => desc ? q.OrderByDescending(a => a.RatingAvg) : q.OrderBy(a => a.RatingAvg),
            "pricevnd" => desc ? q.OrderByDescending(a => a.PriceVnd) : q.OrderBy(a => a.PriceVnd),
            "title" => desc ? q.OrderByDescending(a => a.Title) : q.OrderBy(a => a.Title),
            _ => desc ? q.OrderByDescending(a => a.CreatedAt) : q.OrderBy(a => a.CreatedAt)
        };
    }

    private static IQueryable<Asset> ApplySecondarySort(
        IOrderedQueryable<Asset> q,
        string sort,
        string order)
    {
        var desc = string.Equals(order, "desc", StringComparison.OrdinalIgnoreCase);
        return sort.ToLowerInvariant() switch
        {
            "downloadcount" => desc ? q.ThenByDescending(a => a.DownloadCount) : q.ThenBy(a => a.DownloadCount),
            "ratingavg" => desc ? q.ThenByDescending(a => a.RatingAvg) : q.ThenBy(a => a.RatingAvg),
            "pricevnd" => desc ? q.ThenByDescending(a => a.PriceVnd) : q.ThenBy(a => a.PriceVnd),
            "title" => desc ? q.ThenByDescending(a => a.Title) : q.ThenBy(a => a.Title),
            _ => desc ? q.ThenByDescending(a => a.CreatedAt) : q.ThenBy(a => a.CreatedAt)
        };
    }
}
