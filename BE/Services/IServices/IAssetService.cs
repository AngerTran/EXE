using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.Models;

namespace Exe.Services.IServices;

public interface IAssetService
{
    Task<PagedResponse<AssetListItemResponse>> ListApprovedAsync(
        AssetQueryParams query,
        Guid? viewerUserId = null,
        CancellationToken cancellationToken = default);
    Task<AssetDetailResponse?> GetApprovedByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AssetDetailResponse?> GetApprovedBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<AssetDetailResponse> CreateAsync(Guid userId, CreateAssetRequest request, CancellationToken cancellationToken = default);
    Task<AssetDetailResponse?> UpdateAsync(Guid userId, Guid assetId, UpdateAssetRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);
    Task<AssetDetailResponse?> ApproveAsync(Guid adminUserId, Guid assetId, CancellationToken cancellationToken = default);
    Task<AssetDetailResponse?> RejectAsync(Guid adminUserId, Guid assetId, RejectAssetRequest request, CancellationToken cancellationToken = default);
    Task<PagedResponse<AssetListItemResponse>> ListPendingReviewAsync(Guid adminUserId, PagedQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<AssetListItemResponse>> ListMyUploadsAsync(Guid userId, PagedQuery query, CancellationToken cancellationToken = default);
    Task<PagedResponse<AssetListItemResponse>> ListAdminAsync(
        Guid adminUserId,
        string? search,
        AssetStatus? status,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<AssetDetailResponse?> AdminUpdateAsync(Guid adminUserId, Guid assetId, UpdateAssetRequest request, CancellationToken cancellationToken = default);
    Task<bool> AdminDeleteAsync(Guid adminUserId, Guid assetId, CancellationToken cancellationToken = default);
}
