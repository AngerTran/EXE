using Exe.DTOs.Marketplace;

namespace Exe.Services.IServices;

public interface IReviewService
{
    Task<IReadOnlyList<ReviewItemResponse>> ListByAssetAsync(Guid assetId, Guid? currentUserId, CancellationToken cancellationToken = default);
    Task<ReviewItemResponse> CreateAsync(Guid userId, Guid assetId, CreateReviewRequest request, CancellationToken cancellationToken = default);
    Task<ReviewItemResponse?> UpdateAsync(Guid userId, Guid reviewId, UpdateReviewRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid userId, Guid reviewId, CancellationToken cancellationToken = default);
}
