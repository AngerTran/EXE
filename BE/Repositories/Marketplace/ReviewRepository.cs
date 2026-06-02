using Exe.Data;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Marketplace;

public class ReviewRepository(AppDbContext db) : IReviewRepository
{
    public async Task<IReadOnlyList<AssetReview>> ListByAssetAsync(
        Guid assetId,
        CancellationToken cancellationToken = default) =>
        await db.AssetReviews
            .AsNoTracking()
            .Where(r => r.AssetId == assetId)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<AssetReview?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.AssetReviews
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<AssetReview?> GetByUserAndAssetAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default) =>
        db.AssetReviews.FirstOrDefaultAsync(r => r.UserId == userId && r.AssetId == assetId, cancellationToken);

    public void Add(AssetReview review) => db.AssetReviews.Add(review);

    public void Remove(AssetReview review) => db.AssetReviews.Remove(review);

    public async Task RecalculateAssetRatingAsync(Guid assetId, CancellationToken cancellationToken = default)
    {
        var stats = await db.AssetReviews
            .Where(r => r.AssetId == assetId)
            .GroupBy(_ => 1)
            .Select(g => new { Avg = g.Average(r => (decimal)r.Rating), Count = g.Count() })
            .FirstOrDefaultAsync(cancellationToken);

        await db.Assets
            .Where(a => a.Id == assetId)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(a => a.RatingAvg, stats?.Avg ?? 0)
                    .SetProperty(a => a.RatingCount, stats?.Count ?? 0),
                cancellationToken);
    }
}
