using Exe.Models.Entities;

namespace Exe.Repositories.Marketplace;

public interface IReviewRepository
{
    Task<IReadOnlyList<AssetReview>> ListByAssetAsync(Guid assetId, CancellationToken cancellationToken = default);

    Task<AssetReview?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<AssetReview?> GetByUserAndAssetAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default);

    void Add(AssetReview review);

    void Remove(AssetReview review);

    Task RecalculateAssetRatingAsync(Guid assetId, CancellationToken cancellationToken = default);
}
