using Exe.Models.Entities;

namespace Exe.Repositories.Marketplace;

public interface IAssetStorageRepository
{
    Task<Asset?> GetAssetForStorageAsync(Guid assetId, CancellationToken cancellationToken = default);

    Task<int> CountImagesAsync(Guid assetId, CancellationToken cancellationToken = default);

    Task<AssetFile?> GetPrimaryFileAsync(Guid assetId, CancellationToken cancellationToken = default);

    Task<bool> UserHasPurchasedAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);

    void AddFile(AssetFile file);

    void AddImage(AssetImage image);

    Task IncrementDownloadStatsAsync(
        Guid assetId,
        Guid? userId,
        CancellationToken cancellationToken = default);
}
