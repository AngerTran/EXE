using Exe.Configuration;
using Exe.DTOs.Commerce;
using Exe.Repositories.Commerce;
using Exe.Repositories.Marketplace;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class UserAssetService(
    IUserAssetRepository userAssetRepository,
    IAssetStorageRepository assetStorageRepository,
    IStorageService storageService,
    IOptions<StorageOptions> storageOptions) : IUserAssetService
{
    private readonly StorageOptions _storageOptions = storageOptions.Value;

    public async Task<IReadOnlyList<UserAssetListItemResponse>> ListAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var assets = await userAssetRepository.ListAsync(userId, cancellationToken);
        return assets.Select(MapListItem).ToList();
    }

    public async Task<UserAssetDetailResponse?> GetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default)
    {
        var userAsset = await userAssetRepository.GetAsync(userId, assetId, cancellationToken);
        return userAsset is null ? null : await MapDetailAsync(userAsset, includeDownloadUrl: false, cancellationToken);
    }

    public async Task<UserAssetDetailResponse?> RecordDownloadAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        var userAsset = await userAssetRepository.GetAsync(userId, assetId, cancellationToken);
        if (userAsset is null)
            return null;

        await assetStorageRepository.IncrementDownloadStatsAsync(assetId, userId, cancellationToken);

        userAsset = await userAssetRepository.GetAsync(userId, assetId, cancellationToken);
        if (userAsset is null)
            return null;

        return await MapDetailAsync(userAsset, includeDownloadUrl: true, cancellationToken);
    }

    private static UserAssetListItemResponse MapListItem(Models.Entities.UserAsset ua) =>
        new(
            ua.AssetId,
            ua.Asset.Title,
            ua.Asset.Slug,
            ua.Asset.Category.Name,
            ua.Asset.ThumbnailUrl,
            ua.AcquiredVia,
            ua.DownloadCount,
            ua.LastDownloadAt,
            ua.AcquiredAt);

    private async Task<UserAssetDetailResponse> MapDetailAsync(
        Models.Entities.UserAsset ua,
        bool includeDownloadUrl,
        CancellationToken cancellationToken)
    {
        string? downloadUrl = null;
        int? expires = null;
        var primary = includeDownloadUrl
            ? await assetStorageRepository.GetPrimaryFileAsync(ua.AssetId, cancellationToken)
            : null;
        if (includeDownloadUrl && primary is not null)
        {
            downloadUrl = await storageService.CreateSignedDownloadUrlAsync(
                _storageOptions.AssetFilesBucket,
                primary.StoragePath,
                _storageOptions.DownloadUrlExpiresSeconds,
                cancellationToken);
            expires = _storageOptions.DownloadUrlExpiresSeconds;
        }

        return new UserAssetDetailResponse(
            ua.AssetId,
            ua.Asset.Title,
            ua.Asset.Slug,
            ua.Asset.ShortDescription,
            ua.Asset.Category.Name,
            ua.Asset.ThumbnailUrl,
            ua.AcquiredVia,
            ua.DownloadCount,
            ua.AcquiredAt,
            downloadUrl,
            expires);
    }
}
