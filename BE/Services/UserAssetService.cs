using Exe.DTOs.Commerce;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Commerce;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Wallet;
using Exe.Services.IServices;

namespace Exe.Services;

public class UserAssetService(
    IUserAssetRepository userAssetRepository,
    IWalletRepository walletRepository,
    IAssetStorageRepository assetStorageRepository,
    IAssetStorageService assetStorageService,
    IStorageService storageService,
    IUnitOfWork unitOfWork,
    Microsoft.Extensions.Options.IOptions<Exe.Configuration.StorageOptions> storageOptions) : IUserAssetService
{
    private readonly Exe.Configuration.StorageOptions _storageOptions = storageOptions.Value;

    public async Task<IReadOnlyList<UserAssetListItemResponse>> ListAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var assets = await userAssetRepository.ListAsync(userId, cancellationToken);
        var chargedOrderIds = await GetChargedOrderIdsAsync(assets, cancellationToken);
        return assets.Select(ua => MapListItem(ua, chargedOrderIds)).ToList();
    }

    public async Task<UserAssetDetailResponse?> GetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default)
    {
        var userAsset = await userAssetRepository.GetAsync(userId, assetId, cancellationToken);
        if (userAsset is null)
            return null;

        var chargedOrderIds = await GetChargedOrderIdsAsync([userAsset], cancellationToken);
        return await MapDetailAsync(userAsset, chargedOrderIds, includeDownloadUrl: false, cancellationToken);
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

        var chargedOrderIds = await GetChargedOrderIdsAsync([userAsset], cancellationToken);
        return await MapDetailAsync(userAsset, chargedOrderIds, includeDownloadUrl: true, cancellationToken);
    }

    public async Task<UserAssetFileDownloadResult?> DownloadFileAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        var userAsset = await userAssetRepository.GetAsync(userId, assetId, cancellationToken);
        if (userAsset is null)
            throw new KeyNotFoundException("Asset không có trong thư viện của bạn.");

        var primary = await assetStorageRepository.GetPrimaryFileAsync(assetId, cancellationToken);
        if (primary is null)
            throw new KeyNotFoundException("Asset chưa có file zip được đăng ký. Vui lòng liên hệ người bán.");

        var file = await assetStorageService.OpenDownloadStreamAsync(userId, assetId, cancellationToken);
        if (file is null)
            throw new KeyNotFoundException("Không thể tải file. Bạn có thể chưa có quyền tải asset này.");

        return new UserAssetFileDownloadResult(file.Content, file.FileName, file.ContentType);
    }

    public async Task<bool> RemoveFromLibraryAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        var userAsset = await userAssetRepository.GetAsync(userId, assetId, cancellationToken);
        if (userAsset is null)
            return false;

        userAssetRepository.Remove(userAsset);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<HashSet<Guid>> GetChargedOrderIdsAsync(
        IReadOnlyList<Models.Entities.UserAsset> assets,
        CancellationToken cancellationToken)
    {
        var orderIds = assets
            .Where(ua => ua.OrderId is not null)
            .Select(ua => ua.OrderId!.Value)
            .Distinct()
            .ToList();

        return await walletRepository.GetAssetPurchaseOrderIdsAsync(orderIds, cancellationToken);
    }

    private static UserAssetListItemResponse MapListItem(
        Models.Entities.UserAsset ua,
        HashSet<Guid> chargedOrderIds)
    {
        var (fileSizeBytes, primaryFileName) = ResolvePrimaryFile(ua);
        return new(
            ua.AssetId,
            ua.Asset.Title,
            ua.Asset.Slug,
            ua.Asset.Category.Name,
            ua.Asset.ThumbnailUrl,
            ua.AcquiredVia,
            ua.DownloadCount,
            ua.LastDownloadAt,
            ua.AcquiredAt,
            ua.Asset.DeletedAt is not null,
            fileSizeBytes,
            primaryFileName,
            ResolvePaidXu(ua, chargedOrderIds));
    }

    private static int ResolvePaidXu(Models.Entities.UserAsset ua, HashSet<Guid> chargedOrderIds)
    {
        if (ua.Asset.PriceType == PriceType.Free)
            return 0;

        if (ua.Order is not { Status: OrderStatus.Completed })
            return 0;

        if (ua.OrderId is null || !chargedOrderIds.Contains(ua.OrderId.Value))
            return 0;

        var line = ua.Order.Items.FirstOrDefault(i => i.AssetId == ua.AssetId);
        return line is not null ? (int)line.LineTotal : 0;
    }

    private static (long? FileSizeBytes, string? PrimaryFileName) ResolvePrimaryFile(Models.Entities.UserAsset ua)
    {
        var primary = ua.Asset.Files.FirstOrDefault(f => f.IsPrimary)
            ?? ua.Asset.Files.OrderBy(f => f.CreatedAt).FirstOrDefault();
        if (primary is not null)
            return (primary.FileSizeBytes, primary.FileName);

        return (ua.Asset.FileSizeBytes, null);
    }

    private async Task<UserAssetDetailResponse> MapDetailAsync(
        Models.Entities.UserAsset ua,
        HashSet<Guid> chargedOrderIds,
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

        var (fileSizeBytes, primaryFileName) = ResolvePrimaryFile(ua);

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
            expires,
            ua.Asset.DeletedAt is not null,
            fileSizeBytes,
            primaryFileName,
            ResolvePaidXu(ua, chargedOrderIds));
    }
}
