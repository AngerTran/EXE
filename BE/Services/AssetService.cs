using System.Text.RegularExpressions;
using Exe.Configuration;
using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Profile;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public partial class AssetService(
    IAssetRepository assetRepository,
    ICategoryRepository categoryRepository,
    ITagRepository tagRepository,
    IProfileRepository profileRepository,
    IUnitOfWork unitOfWork,
    IStorageService storageService,
    IOptions<StorageOptions> storageOptions) : IAssetService
{
    private readonly StorageOptions _storage = storageOptions.Value;

    public async Task<PagedResponse<AssetListItemResponse>> ListApprovedAsync(
        AssetQueryParams query,
        Guid? viewerUserId = null,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await assetRepository.ListApprovedAsync(query, viewerUserId, cancellationToken);
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize switch { < 1 => 20, > 100 => 100, _ => query.PageSize };
        return new PagedResponse<AssetListItemResponse>(items.Select(MapListItem).ToList(), page, pageSize, total);
    }

    public async Task<AssetDetailResponse?> GetApprovedByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var asset = await assetRepository.GetApprovedByIdAsync(id, cancellationToken);
        return asset is null ? null : MapDetail(asset);
    }

    public async Task<AssetDetailResponse?> GetApprovedBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var asset = await assetRepository.GetApprovedBySlugAsync(slug.Trim().ToLowerInvariant(), cancellationToken);
        return asset is null ? null : MapDetail(asset);
    }

    public async Task<AssetDetailResponse> CreateAsync(
        Guid userId,
        CreateAssetRequest request,
        CancellationToken cancellationToken = default)
    {
        await RoleAuthorization.EnsureSellerOrAdminAsync(profileRepository, userId, cancellationToken);

        var category = await categoryRepository.GetByIdAsync(request.CategoryId, cancellationToken)
            ?? throw new ArgumentException("Invalid category.");

        if (request.PriceType == PriceType.Free)
            request = request with { PriceVnd = 0, PriceXu = 0 };
        else if (request.PriceXu < 1)
            throw new ArgumentException("Paid assets must cost at least 1 xu.");
        else
            request = request with { PriceVnd = 0 };

        var slug = await GenerateUniqueSlugAsync(request.Title, null, cancellationToken);
        var tagIds = request.TagIds ?? [];
        var tags = await tagRepository.GetByIdsAsync(tagIds, cancellationToken);
        if (tags.Count != tagIds.Count)
            throw new ArgumentException("One or more tags are invalid.");

        var now = DateTime.UtcNow;
        var asset = new Asset
        {
            Id = Guid.NewGuid(),
            Slug = slug,
            Title = request.Title.Trim(),
            ShortDescription = TrimOptional(request.ShortDescription, 500),
            FullDescription = request.FullDescription?.Trim(),
            CategoryId = category.Id,
            UploaderId = userId,
            ArtStyle = request.ArtStyle,
            PriceType = request.PriceType,
            PriceVnd = request.PriceVnd,
            PriceXu = request.PriceXu,
            License = request.License,
            Status = AssetStatus.PendingReview,
            EngineUnity = request.EngineUnity,
            EngineUnreal = request.EngineUnreal,
            EngineGodot = request.EngineGodot,
            FeatureRigged = request.FeatureRigged,
            FeatureAnimated = request.FeatureAnimated,
            FeaturePbr = request.FeaturePbr,
            FeatureVrReady = request.FeatureVrReady,
            Version = TrimOptional(request.Version, 20),
            UnityVersion = TrimOptional(request.UnityVersion, 20),
            FileSizeBytes = request.FileSizeBytes,
            PolygonCount = TrimOptional(request.PolygonCount, 50),
            TextureResolution = TrimOptional(request.TextureResolution, 50),
            ThumbnailUrl = request.ThumbnailUrl,
            SubmittedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        asset.AssetTags = tags.Select(t => new AssetTag { AssetId = asset.Id, TagId = t.Id }).ToList();
        assetRepository.Add(asset);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var reloaded = await assetRepository.GetWithDetailsByIdAsync(asset.Id, cancellationToken)
            ?? throw new InvalidOperationException("Asset was created but could not be loaded.");
        return MapDetail(reloaded);
    }

    public async Task<AssetDetailResponse?> UpdateAsync(
        Guid userId,
        Guid assetId,
        UpdateAssetRequest request,
        CancellationToken cancellationToken = default)
    {
        var asset = await assetRepository.GetByIdForUpdateAsync(assetId, cancellationToken);
        if (asset is null || asset.UploaderId != userId)
            return null;

        if (asset.Status is not (AssetStatus.Draft or AssetStatus.PendingReview or AssetStatus.Rejected))
            throw new InvalidOperationException("Only draft, pending or rejected assets can be updated.");

        if (asset.Status == AssetStatus.Rejected)
        {
            asset.Status = AssetStatus.PendingReview;
            asset.RejectionReason = null;
            asset.SubmittedAt = DateTime.UtcNow;
        }

        return await ApplyUpdateAsync(asset, request, cancellationToken);
    }

    public async Task<AssetDetailResponse?> GetMyAssetByIdAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        await RoleAuthorization.EnsureSellerOrAdminAsync(profileRepository, userId, cancellationToken);

        var asset = await assetRepository.GetWithDetailsByIdAsync(assetId, cancellationToken);
        if (asset is null || asset.DeletedAt is not null || asset.UploaderId != userId)
            return null;

        return MapDetail(asset);
    }

    private async Task<AssetDetailResponse?> ApplyUpdateAsync(
        Asset asset,
        UpdateAssetRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Title is not null)
            asset.Title = request.Title.Trim();
        if (request.ShortDescription is not null)
            asset.ShortDescription = string.IsNullOrWhiteSpace(request.ShortDescription) ? null : request.ShortDescription.Trim();
        if (request.FullDescription is not null)
            asset.FullDescription = string.IsNullOrWhiteSpace(request.FullDescription) ? null : request.FullDescription.Trim();

        if (request.CategoryId.HasValue)
        {
            var category = await categoryRepository.GetByIdAsync(request.CategoryId.Value, cancellationToken)
                ?? throw new ArgumentException("Invalid category.");
            asset.CategoryId = category.Id;
        }

        if (request.ArtStyle.HasValue)
            asset.ArtStyle = request.ArtStyle;
        if (request.PriceType.HasValue)
        {
            asset.PriceType = request.PriceType.Value;
            if (asset.PriceType == PriceType.Free)
            {
                asset.PriceVnd = 0;
                asset.PriceXu = 0;
            }
        }

        if (request.PriceVnd.HasValue)
            asset.PriceVnd = request.PriceVnd.Value;
        if (request.PriceXu.HasValue)
            asset.PriceXu = request.PriceXu.Value;
        if (request.License.HasValue)
            asset.License = request.License.Value;
        if (request.EngineUnity.HasValue)
            asset.EngineUnity = request.EngineUnity.Value;
        if (request.EngineUnreal.HasValue)
            asset.EngineUnreal = request.EngineUnreal.Value;
        if (request.EngineGodot.HasValue)
            asset.EngineGodot = request.EngineGodot.Value;
        if (request.FeatureRigged.HasValue)
            asset.FeatureRigged = request.FeatureRigged.Value;
        if (request.FeatureAnimated.HasValue)
            asset.FeatureAnimated = request.FeatureAnimated.Value;
        if (request.FeaturePbr.HasValue)
            asset.FeaturePbr = request.FeaturePbr.Value;
        if (request.FeatureVrReady.HasValue)
            asset.FeatureVrReady = request.FeatureVrReady.Value;
        if (request.Version is not null)
            asset.Version = TrimOptional(request.Version, 20);
        if (request.UnityVersion is not null)
            asset.UnityVersion = TrimOptional(request.UnityVersion, 20);
        if (request.PolygonCount is not null)
            asset.PolygonCount = TrimOptional(request.PolygonCount, 50);
        if (request.TextureResolution is not null)
            asset.TextureResolution = TrimOptional(request.TextureResolution, 50);
        if (request.ThumbnailUrl is not null)
            asset.ThumbnailUrl = request.ThumbnailUrl;

        if (request.TagIds is not null)
        {
            var tags = await tagRepository.GetByIdsAsync(request.TagIds, cancellationToken);
            if (tags.Count != request.TagIds.Count)
                throw new ArgumentException("One or more tags are invalid.");

            assetRepository.RemoveAssetTags(asset);
            assetRepository.AddAssetTags(tags.Select(t => new AssetTag { AssetId = asset.Id, TagId = t.Id }));
        }

        asset.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var reloaded = await assetRepository.GetWithDetailsByIdAsync(asset.Id, cancellationToken);
        return reloaded is null ? null : MapDetail(reloaded);
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default)
    {
        var asset = await assetRepository.GetForHardDeleteAsync(assetId, cancellationToken);
        if (asset is null || asset.UploaderId != userId)
            return false;

        return await RemoveAssetAsync(asset, cancellationToken);
    }

    public async Task<AssetDetailResponse?> ApproveAsync(
        Guid adminUserId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);

        var asset = await assetRepository.GetByIdForUpdateAsync(assetId, cancellationToken);
        if (asset is null)
            return null;
        if (asset.Status != AssetStatus.PendingReview)
            throw new InvalidOperationException("Only pending assets can be approved.");

        var now = DateTime.UtcNow;
        asset.Status = AssetStatus.Approved;
        asset.ApprovedAt = now;
        asset.ApprovedBy = adminUserId;
        asset.RejectionReason = null;
        asset.UpdatedAt = now;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return await GetApprovedByIdAsync(assetId, cancellationToken);
    }

    public async Task<AssetDetailResponse?> RejectAsync(
        Guid adminUserId,
        Guid assetId,
        RejectAssetRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var asset = await assetRepository.GetByIdForUpdateAsync(assetId, cancellationToken);
        if (asset is null)
            return null;
        if (asset.Status != AssetStatus.PendingReview)
            throw new InvalidOperationException("Only pending assets can be rejected.");

        asset.Status = AssetStatus.Rejected;
        asset.RejectionReason = request.Reason.Trim();
        asset.ApprovedAt = null;
        asset.ApprovedBy = null;
        asset.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var reloaded = await assetRepository.GetWithDetailsByIdAsync(assetId, cancellationToken);
        return reloaded is null ? null : MapDetail(reloaded);
    }

    public async Task<PagedResponse<AssetListItemResponse>> ListMyUploadsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await RoleAuthorization.EnsureSellerOrAdminAsync(profileRepository, userId, cancellationToken);

        var (items, total) = await assetRepository.ListByUploaderAsync(
            userId,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);
        return new PagedResponse<AssetListItemResponse>(
            items.Select(MapListItem).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<PagedResponse<AssetListItemResponse>> ListAdminAsync(
        Guid adminUserId,
        string? search,
        AssetStatus? status,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var (items, total) = await assetRepository.ListAdminAsync(
            search,
            status,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);
        return new PagedResponse<AssetListItemResponse>(
            items.Select(MapListItem).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<AssetDetailResponse?> AdminUpdateAsync(
        Guid adminUserId,
        Guid assetId,
        UpdateAssetRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var asset = await assetRepository.GetByIdForUpdateAsync(assetId, cancellationToken);
        if (asset is null || asset.DeletedAt is not null)
            return null;

        if (asset.Status != AssetStatus.Approved)
            throw new InvalidOperationException("Only approved assets can be updated by admin.");

        return await ApplyUpdateAsync(asset, request, cancellationToken);
    }

    public async Task<bool> AdminDeleteAsync(
        Guid adminUserId,
        Guid assetId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var asset = await assetRepository.GetForHardDeleteAsync(assetId, cancellationToken);
        if (asset is null)
            return false;

        return await RemoveAssetAsync(asset, cancellationToken);
    }

    private async Task<bool> RemoveAssetAsync(Asset asset, CancellationToken cancellationToken)
    {
        var (userAssets, orderItems) =
            await assetRepository.GetPurchaseReferenceCountsAsync(asset.Id, cancellationToken);

        if (userAssets > 0 || orderItems > 0)
        {
            asset.DeletedAt = DateTime.UtcNow;
            asset.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }

        await assetRepository.RemoveWithDependentsAsync(asset, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PagedResponse<AssetListItemResponse>> ListPendingReviewAsync(
        Guid adminUserId,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var (items, total) = await assetRepository.ListPendingReviewAsync(query.Skip, query.NormalizedPageSize, cancellationToken);
        return new PagedResponse<AssetListItemResponse>(
            items.Select(MapListItem).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    private async Task EnsureAdminAsync(Guid userId, CancellationToken cancellationToken) =>
        await RoleAuthorization.EnsureAdminAsync(profileRepository, userId, cancellationToken);

    private async Task<string> GenerateUniqueSlugAsync(string title, Guid? excludeId, CancellationToken cancellationToken)
    {
        var baseSlug = Slugify(title);
        if (string.IsNullOrEmpty(baseSlug))
            baseSlug = "asset";

        var slug = baseSlug;
        var suffix = 1;
        while (await assetRepository.SlugExistsAsync(slug, excludeId, cancellationToken))
            slug = $"{baseSlug}-{suffix++}";
        return slug;
    }

    private static string? TrimOptional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static string Slugify(string title)
    {
        var slug = title.Trim().ToLowerInvariant();
        slug = NonAlphanumericRegex().Replace(slug, "-");
        slug = MultiDashRegex().Replace(slug, "-").Trim('-');
        return slug.Length > 120 ? slug[..120].Trim('-') : slug;
    }

    private static AssetListItemResponse MapListItem(Asset a) =>
        new(
            a.Id,
            a.Slug,
            a.Title,
            a.ShortDescription,
            a.CategoryId,
            a.Category?.Name ?? "",
            a.Uploader?.Name ?? "",
            a.Uploader?.Username ?? "",
            a.PriceType.ToString().ToLowerInvariant(),
            a.PriceVnd,
            a.PriceXu,
            a.PriceXu,
            a.RatingAvg,
            a.RatingCount,
            a.DownloadCount,
            a.ThumbnailUrl,
            a.AssetTags.Select(at => at.Tag?.Name ?? "").Where(n => n.Length > 0).ToList(),
            a.PriceType == PriceType.Free,
            a.Status.ToString().ToLowerInvariant());

    private AssetDetailResponse MapDetail(Asset a) =>
        new(
            a.Id,
            a.Slug,
            a.Title,
            a.ShortDescription,
            a.FullDescription,
            a.CategoryId,
            a.Category?.Name ?? "",
            a.UploaderId,
            a.Uploader?.Name ?? "",
            a.Uploader?.Username ?? "",
            a.ArtStyle?.ToString().ToLowerInvariant(),
            a.PriceType.ToString().ToLowerInvariant(),
            a.PriceVnd,
            a.PriceXu,
            a.License.ToString().ToLowerInvariant(),
            a.Status.ToString().ToLowerInvariant(),
            a.EngineUnity,
            a.EngineUnreal,
            a.EngineGodot,
            a.FeatureRigged,
            a.FeatureAnimated,
            a.FeaturePbr,
            a.FeatureVrReady,
            a.Version,
            a.RatingAvg,
            a.RatingCount,
            a.DownloadCount,
            a.ThumbnailUrl,
            a.AssetTags.Select(at => at.Tag?.Name ?? "").Where(n => n.Length > 0).ToList(),
            a.Files.Select(f => new AssetFileResponse(f.Id, f.FileName, f.FileType, f.FileSizeBytes, f.IsPrimary)).ToList(),
            a.Images.Select(i => new AssetImageResponse(i.Id, ResolveImagePublicUrl(i.StoragePath), i.AltText, i.IsThumbnail, i.SortOrder)).ToList(),
            a.Reviews.Select(r => new AssetReviewResponse(r.Id, r.User?.Name ?? "", r.Rating, r.Comment, r.CreatedAt)).ToList(),
            a.PriceType == PriceType.Free,
            a.CreatedAt);

    private string ResolveImagePublicUrl(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath))
            return storagePath;
        if (storagePath.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || storagePath.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return storagePath;
        return storageService.GetPublicObjectUrl(_storage.AssetImagesBucket, storagePath);
    }

    [GeneratedRegex(@"[^a-z0-9]+", RegexOptions.Compiled)]
    private static partial Regex NonAlphanumericRegex();

    [GeneratedRegex(@"-+", RegexOptions.Compiled)]
    private static partial Regex MultiDashRegex();
}
