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
        if (asset is null || !await CanEditAssetAsync(userId, asset, cancellationToken))
            return null;

        ValidateUploadRequest(request);
        return await BuildUploadUrlAsync(assetId, request, cancellationToken);
    }

    public async Task<AssetFileResponse?> RegisterFileAsync(
        Guid userId,
        Guid assetId,
        RegisterAssetFileRequest request,
        CancellationToken cancellationToken = default)
    {
        var asset = await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null || !await CanEditAssetAsync(userId, asset, cancellationToken))
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
        if (asset is null || !await CanEditAssetAsync(userId, asset, cancellationToken))
            return null;

        return await RegisterImageCoreAsync(asset, assetId, request, cancellationToken);
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

    private async Task<bool> CanEditAssetAsync(
        Guid userId,
        Asset asset,
        CancellationToken cancellationToken)
    {
        var role = await profileRepository.GetRoleAsync(userId, cancellationToken);
        if (role == UserRole.Admin)
            return true;

        return asset.UploaderId == userId && asset.Status is AssetStatus.Draft or AssetStatus.PendingReview;
    }

    public async Task<UploadUrlResponse?> AdminCreateUploadUrlAsync(
        Guid adminUserId,
        Guid assetId,
        CreateUploadUrlRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await profileRepository.GetRoleAsync(adminUserId, cancellationToken) != UserRole.Admin)
            return null;

        var asset = await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null)
            return null;

        ValidateUploadRequest(request);
        return await BuildUploadUrlAsync(assetId, request, cancellationToken);
    }

    public async Task<AssetImageResponse?> AdminRegisterImageAsync(
        Guid adminUserId,
        Guid assetId,
        RegisterAssetImageRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await profileRepository.GetRoleAsync(adminUserId, cancellationToken) != UserRole.Admin)
            return null;

        var asset = await assetStorageRepository.GetAssetForStorageAsync(assetId, cancellationToken);
        if (asset is null)
            return null;

        return await RegisterImageCoreAsync(asset, assetId, request, cancellationToken);
    }

    private async Task<UploadUrlResponse> BuildUploadUrlAsync(
        Guid assetId,
        CreateUploadUrlRequest request,
        CancellationToken cancellationToken)
    {
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

    private async Task<AssetImageResponse> RegisterImageCoreAsync(
        Asset asset,
        Guid assetId,
        RegisterAssetImageRequest request,
        CancellationToken cancellationToken)
    {
        var storagePath = request.StoragePath.Trim();
        var altText = string.IsNullOrWhiteSpace(request.AltText) ? null : request.AltText.Trim();
        var publicUrl = storageService.GetPublicObjectUrl(_options.AssetImagesBucket, storagePath);

        if (request.ReplaceImageId is Guid replaceImageId)
        {
            var existingById = await assetStorageRepository.GetImageByIdAsync(assetId, replaceImageId, cancellationToken);
            if (existingById is not null && existingById.IsThumbnail == request.IsThumbnail)
            {
                existingById.StoragePath = storagePath;
                existingById.AltText = altText;
                if (request.IsThumbnail)
                    asset.ThumbnailUrl = publicUrl;

                asset.UpdatedAt = DateTime.UtcNow;
                await unitOfWork.SaveChangesAsync(cancellationToken);

                return new AssetImageResponse(
                    existingById.Id,
                    publicUrl,
                    existingById.AltText,
                    existingById.IsThumbnail,
                    existingById.SortOrder);
            }
        }

        if (request.IsThumbnail)
        {
            var existingThumbnail = await assetStorageRepository.GetThumbnailImageAsync(assetId, cancellationToken);
            if (existingThumbnail is not null)
            {
                existingThumbnail.StoragePath = storagePath;
                existingThumbnail.AltText = altText;
                asset.ThumbnailUrl = publicUrl;
                asset.UpdatedAt = DateTime.UtcNow;
                await unitOfWork.SaveChangesAsync(cancellationToken);

                return new AssetImageResponse(
                    existingThumbnail.Id,
                    publicUrl,
                    existingThumbnail.AltText,
                    existingThumbnail.IsThumbnail,
                    existingThumbnail.SortOrder);
            }
        }
        else if (request.SortOrder == 0)
        {
            var existingPreview = await assetStorageRepository.GetFirstPreviewImageAsync(assetId, cancellationToken);
            if (existingPreview is not null)
            {
                existingPreview.StoragePath = storagePath;
                existingPreview.AltText = altText;
                asset.UpdatedAt = DateTime.UtcNow;
                await unitOfWork.SaveChangesAsync(cancellationToken);

                return new AssetImageResponse(
                    existingPreview.Id,
                    publicUrl,
                    existingPreview.AltText,
                    existingPreview.IsThumbnail,
                    existingPreview.SortOrder);
            }
        }

        var count = await assetStorageRepository.CountImagesAsync(assetId, cancellationToken);
        if (count >= _options.MaxImagesPerAsset)
            throw new ArgumentException($"Maximum images per asset is {_options.MaxImagesPerAsset}.");

        var image = new AssetImage
        {
            Id = Guid.NewGuid(),
            AssetId = assetId,
            StoragePath = storagePath,
            AltText = altText,
            SortOrder = request.SortOrder,
            IsThumbnail = request.IsThumbnail,
            CreatedAt = DateTime.UtcNow
        };

        assetStorageRepository.AddImage(image);
        if (request.IsThumbnail)
            asset.ThumbnailUrl = publicUrl;

        asset.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new AssetImageResponse(
            image.Id,
            publicUrl,
            image.AltText,
            image.IsThumbnail,
            image.SortOrder);
    }

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
