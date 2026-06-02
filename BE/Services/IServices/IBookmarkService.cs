using Exe.DTOs.Marketplace;

namespace Exe.Services.IServices;

public interface IBookmarkService
{
    Task<BookmarkListResponse> ListAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(Guid userId, CreateBookmarkRequest request, CancellationToken cancellationToken = default);
    Task<bool> RemoveAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);
}
