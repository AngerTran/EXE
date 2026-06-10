using Exe.DTOs.Marketplace;

namespace Exe.Services.IServices;

public interface IAssetStorageService
{
    Task<UploadUrlResponse?> CreateUploadUrlAsync(
        Guid userId,
        Guid assetId,
        CreateUploadUrlRequest request,
        CancellationToken cancellationToken = default);
    Task<AssetFileResponse?> RegisterFileAsync(
        Guid userId,
        Guid assetId,
        RegisterAssetFileRequest request,
        CancellationToken cancellationToken = default);
    Task<AssetImageResponse?> RegisterImageAsync(
        Guid userId,
        Guid assetId,
        RegisterAssetImageRequest request,
        CancellationToken cancellationToken = default);
    Task<UploadUrlResponse?> AdminCreateUploadUrlAsync(
        Guid adminUserId,
        Guid assetId,
        CreateUploadUrlRequest request,
        CancellationToken cancellationToken = default);
    Task<AssetImageResponse?> AdminRegisterImageAsync(
        Guid adminUserId,
        Guid assetId,
        RegisterAssetImageRequest request,
        CancellationToken cancellationToken = default);
    Task<AssetDownloadResponse?> GetDownloadUrlAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default);
    Task<AssetFileStreamResult?> OpenDownloadStreamAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default);
}
