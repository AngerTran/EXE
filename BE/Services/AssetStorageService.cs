using Exe.Configuration;
using Exe.DTOs.Marketplace;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Profile;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class AssetStorageService(
    IAssetStorageRepository assetStorageRepository,
    IProfileRepository profileRepository,
    IStorageService storageService,
    IUnitOfWork unitOfWork,
    IOptions<StorageOptions> storageOptions) : IAssetStorageService
{
    private readonly StorageOptions _options = storageOptions.Value;

    public async Task<UploadUrlResponse?> CreateUploadUrlAsync(
        Guid userId,
        Guid assetId,
        CreateUploadUrlRequest request,
        CancellationToken cancellationToken = default)
    {
        var asset = await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null || !CanEditAsset(userId, asset))
            return null;

        ValidateUploadRequest(request);

        var kindFolder = request.Kind == StorageUploadKind.File ? "files" : "images";
        var extension = Path.GetExtension(request.FileName);
        var objectPath = $"{assetId}/{kindFolder}/{Guid.NewGuid():N}{extension}";
        var bucket = request.Kind == StorageUploadKind.File ? _options.AssetFilesBucket : _options.AssetImagesBucket;

        var uploadUrl = await storageService.CreateSignedUploadUrlAsync(
            bucket,
            objectPath,
            _options.UploadUrlExpiresSeconds,
            cancellationToken);

        return new UploadUrlResponse(uploadUrl, objectPath, bucket, _options.UploadUrlExpiresSeconds);
    }

    public async Task<AssetFileResponse?> RegisterFileAsync(
        Guid userId,
        Guid assetId,
        RegisterAssetFileRequest request,
        CancellationToken cancellationToken = default)
    {
        var asset = await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null || !CanEditAsset(userId, asset))
            return null;

        if (request.FileSizeBytes <= 0 || request.FileSizeBytes > _options.MaxZipBytes)
            throw new ArgumentException($"Invalid file size. Max allowed is {_options.MaxZipBytes} bytes.");

        var file = new AssetFile
        {
            Id = Guid.NewGuid(),
            AssetId = assetId,
            StoragePath = request.StoragePath.Trim(),
            FileName = request.FileName.Trim(),
            FileType = request.FileType.Trim(),
            FileSizeBytes = request.FileSizeBytes,
            ChecksumSha256 = string.IsNullOrWhiteSpace(request.ChecksumSha256) ? null : request.ChecksumSha256.Trim(),
            UnityVersion = string.IsNullOrWhiteSpace(request.UnityVersion) ? null : request.UnityVersion.Trim(),
            IsPrimary = request.IsPrimary,
            CreatedAt = DateTime.UtcNow
        };

        assetStorageRepository.AddFile(file);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new AssetFileResponse(file.Id, file.FileName, file.FileType, file.FileSizeBytes, file.IsPrimary);
    }

    public async Task<AssetImageResponse?> RegisterImageAsync(
        Guid userId,
        Guid assetId,
        RegisterAssetImageRequest request,
        CancellationToken cancellationToken = default)
    {
        var asset = await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null || !CanEditAsset(userId, asset))
            return null;

        var count = await assetStorageRepository.CountImagesAsync(assetId, cancellationToken);
        if (count >= _options.MaxImagesPerAsset)
            throw new ArgumentException($"Maximum images per asset is {_options.MaxImagesPerAsset}.");

        var image = new AssetImage
        {
            Id = Guid.NewGuid(),
            AssetId = assetId,
            StoragePath = request.StoragePath.Trim(),
            AltText = string.IsNullOrWhiteSpace(request.AltText) ? null : request.AltText.Trim(),
            SortOrder = request.SortOrder,
            IsThumbnail = request.IsThumbnail,
            CreatedAt = DateTime.UtcNow
        };

        assetStorageRepository.AddImage(image);
        if (request.IsThumbnail)
        {
            asset.ThumbnailUrl = storageService.GetPublicObjectUrl(_options.AssetImagesBucket, image.StoragePath);
            asset.UpdatedAt = DateTime.UtcNow;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new AssetImageResponse(
            image.Id,
            storageService.GetPublicObjectUrl(_options.AssetImagesBucket, image.StoragePath),
            image.AltText,
            image.IsThumbnail,
            image.SortOrder);
    }

    public async Task<AssetDownloadResponse?> GetDownloadUrlAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        var isAdmin = await profileRepository.GetRoleAsync(userId, cancellationToken) == UserRole.Admin;
        var hasPurchased = await assetStorageRepository.UserHasPurchasedAsync(userId, assetId, cancellationToken);

        var asset = hasPurchased || isAdmin
            ? await assetStorageRepository.GetAssetIncludingDeletedAsync(assetId, cancellationToken)
            : await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null)
            return null;

        var canDownload = isAdmin
            || asset.UploaderId == userId
            || hasPurchased
            || (asset.DeletedAt == null
                && asset.Status == AssetStatus.Approved
                && asset.PriceType == PriceType.Free);

        if (!canDownload)
            return null;

        var file = await assetStorageRepository.GetPrimaryFileAsync(assetId, cancellationToken);
        if (file is null)
            return null;

        var url = await storageService.CreateSignedDownloadUrlAsync(
            _options.AssetFilesBucket,
            file.StoragePath,
            _options.DownloadUrlExpiresSeconds,
            cancellationToken);

        await assetStorageRepository.IncrementDownloadStatsAsync(assetId, userId, cancellationToken);

        return new AssetDownloadResponse(
            url,
            file.FileName,
            file.FileSizeBytes,
            file.UnityVersion,
            _options.DownloadUrlExpiresSeconds);
    }

    public async Task<AssetFileStreamResult?> OpenDownloadStreamAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        var isAdmin = await profileRepository.GetRoleAsync(userId, cancellationToken) == UserRole.Admin;
        var hasPurchased = await assetStorageRepository.UserHasPurchasedAsync(userId, assetId, cancellationToken);

        var asset = hasPurchased || isAdmin
            ? await assetStorageRepository.GetAssetIncludingDeletedAsync(assetId, cancellationToken)
            : await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null)
            return null;

        var canDownload = isAdmin
            || asset.UploaderId == userId
            || hasPurchased
            || (asset.DeletedAt == null
                && asset.Status == AssetStatus.Approved
                && asset.PriceType == PriceType.Free);

        if (!canDownload)
            return null;

        var file = await assetStorageRepository.GetPrimaryFileAsync(assetId, cancellationToken);
        if (file is null)
            return null;

        await assetStorageRepository.IncrementDownloadStatsAsync(assetId, userId, cancellationToken);

        var (content, contentType) = await storageService.OpenObjectAsync(
            _options.AssetFilesBucket,
            file.StoragePath,
            cancellationToken);

        return new AssetFileStreamResult(content, file.FileName, contentType);
    }

    private static bool CanEditAsset(Guid userId, Asset asset) =>
        asset.UploaderId == userId && asset.Status is AssetStatus.Draft or AssetStatus.PendingReview;

    private void ValidateUploadRequest(CreateUploadUrlRequest request)
    {
        if (request.FileSizeBytes <= 0)
            throw new ArgumentException("fileSizeBytes must be greater than 0.");

        if (request.Kind == StorageUploadKind.File && request.FileSizeBytes > _options.MaxZipBytes)
            throw new ArgumentException($"File exceeds maximum size {_options.MaxZipBytes} bytes.");
        if (request.Kind == StorageUploadKind.Image && request.FileSizeBytes > _options.MaxImageBytes)
            throw new ArgumentException($"Image exceeds maximum size {_options.MaxImageBytes} bytes.");
    }
}
