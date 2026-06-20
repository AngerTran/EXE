using Exe.DTOs.Marketplace;
using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Marketplace;

public interface IAssetRepository
{
    Task<(IReadOnlyList<Asset> Items, int Total)> ListApprovedAsync(
        AssetQueryParams query,
        Guid? viewerUserId = null,
        CancellationToken cancellationToken = default);

    Task<Asset?> GetApprovedByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Asset?> GetApprovedBySlugAsync(string slug, CancellationToken cancellationToken = default);

    Task<Asset?> GetByIdForOwnerOrAdminAsync(
        Guid id,
        Guid? ownerId,
        bool includeNonApproved,
        CancellationToken cancellationToken = default);

    Task<Asset?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Asset?> GetWithDetailsByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<bool> SlugExistsAsync(string slug, Guid? excludeAssetId = null, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Asset> Items, int Total)> ListPendingReviewAsync(
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Asset> Items, int Total)> ListByUploaderAsync(
        Guid uploaderId,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Asset> Items, int Total)> ListAdminAsync(
        string? search,
        AssetStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    void Add(Asset asset);

    void RemoveAssetTags(Asset asset);

    void AddAssetTags(IEnumerable<AssetTag> assetTags);
}
