using Exe.DTOs.Commerce;

namespace Exe.Services.IServices;

public interface IUserAssetService
{
    Task<IReadOnlyList<UserAssetListItemResponse>> ListAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserAssetDetailResponse?> GetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);
    Task<UserAssetDetailResponse?> RecordDownloadAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);
    Task<UserAssetFileDownloadResult?> DownloadFileAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);
    Task<bool> RemoveFromLibraryAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);
}
