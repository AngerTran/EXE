using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.DTOs.Seller;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Profile;
using Exe.Repositories.Seller;
using Exe.Services.IServices;

namespace Exe.Services;

public class SellerService(
    IProfileRepository profileRepository,
    IAssetRepository assetRepository,
    IAssetService assetService,
    ISellerEarningRepository earningRepository,
    IUnitOfWork unitOfWork) : ISellerService
{
    public async Task<SellerMeResponse> GetMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await RoleAuthorization.EnsureSellerOrAdminAsync(profileRepository, userId, cancellationToken);
        var profile = await GetProfileOrThrowAsync(userId, cancellationToken);
        return await MapMeAsync(profile, cancellationToken);
    }

    public async Task<SellerAssetsResponse> ListMyAssetsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await RoleAuthorization.EnsureSellerOrAdminAsync(profileRepository, userId, cancellationToken);

        var stats = await BuildStatsAsync(userId, cancellationToken);
        var assets = await assetService.ListMyUploadsAsync(userId, query, cancellationToken);
        return new SellerAssetsResponse(stats, assets);
    }

    public Task<AssetDetailResponse?> GetMyAssetByIdAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default) =>
        assetService.GetMyAssetByIdAsync(userId, assetId, cancellationToken);

    public async Task<SellerMeResponse> UpdateProfileAsync(
        Guid userId,
        UpdateSellerProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        await RoleAuthorization.EnsureSellerOrAdminAsync(profileRepository, userId, cancellationToken);

        var profile = await profileRepository.GetActiveByIdForUpdateAsync(userId, cancellationToken)
            ?? throw new ForbiddenException("Profile not found.");

        if (!string.IsNullOrWhiteSpace(request.Name))
            profile.Name = request.Name.Trim();
        if (request.Bio is not null)
            profile.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();
        if (request.SellerWebsiteUrl is not null)
            profile.SellerWebsiteUrl = string.IsNullOrWhiteSpace(request.SellerWebsiteUrl)
                ? null
                : request.SellerWebsiteUrl.Trim();

        profile.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await MapMeAsync(profile, cancellationToken);
    }

    public async Task<SellerApplyResponse> ApplyAsync(
        Guid userId,
        SellerApplyRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetActiveByIdForUpdateAsync(userId, cancellationToken)
            ?? throw new ForbiddenException("Profile not found.");

        if (profile.Role is UserRole.Seller or UserRole.Admin)
            throw new ArgumentException("You are already a seller or admin.");

        var now = DateTime.UtcNow;
        profile.Role = UserRole.Seller;
        profile.SellerStatus = SellerStatus.Active;
        profile.SellerAppliedAt ??= now;
        profile.SellerApprovedAt = now;
        profile.UpdatedAt = now;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new SellerApplyResponse(profile.Id, profile.Role.ToString().ToLowerInvariant(), now);
    }

    public async Task<SellerEarningsResponse> ListEarningsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await RoleAuthorization.EnsureSellerOrAdminAsync(profileRepository, userId, cancellationToken);

        var summary = await BuildEarningsSummaryAsync(userId, cancellationToken);
        var (items, total) = await earningRepository.ListBySellerAsync(
            userId,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);

        return new SellerEarningsResponse(
            summary,
            new PagedResponse<SellerEarningItemResponse>(
                items.Select(e => new SellerEarningItemResponse(
                    e.Id,
                    e.OrderId,
                    e.Order.OrderCode,
                    e.AssetId,
                    e.Asset.Title,
                    e.GrossXu,
                    e.PlatformFeeXu,
                    e.NetXu,
                    e.Status.ToString().ToLowerInvariant(),
                    e.CreatedAt)).ToList(),
                query.NormalizedPage,
                query.NormalizedPageSize,
                total));
    }

    private async Task<SellerMeResponse> MapMeAsync(Models.Entities.Profile profile, CancellationToken cancellationToken)
    {
        var stats = await BuildStatsAsync(profile.Id, cancellationToken);
        var earnings = await BuildEarningsSummaryAsync(profile.Id, cancellationToken);

        return new SellerMeResponse(
            profile.Id,
            profile.Email,
            profile.Username,
            profile.Name,
            profile.Role.ToString().ToLowerInvariant(),
            profile.AvatarUrl,
            profile.Bio,
            profile.SellerWebsiteUrl,
            profile.SellerIsTrusted,
            profile.SellerStatus?.ToString().ToLowerInvariant(),
            profile.SellerAppliedAt,
            profile.SellerApprovedAt,
            stats,
            earnings);
    }

    private async Task<Models.Entities.Profile> GetProfileOrThrowAsync(Guid userId, CancellationToken cancellationToken) =>
        await profileRepository.GetActiveByIdWithDetailsAsync(userId, asNoTracking: true, cancellationToken)
        ?? throw new ForbiddenException("Profile not found.");

    private async Task<SellerStatsResponse> BuildStatsAsync(Guid userId, CancellationToken cancellationToken)
    {
        var counts = await assetRepository.GetUploaderStatsAsync(userId, cancellationToken);
        return new SellerStatsResponse(
            counts.Total,
            counts.Approved,
            counts.PendingReview,
            counts.Rejected,
            counts.Draft,
            counts.TotalDownloads);
    }

    private async Task<SellerEarningsSummaryResponse> BuildEarningsSummaryAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var (gross, fee, net, count) = await earningRepository.GetSummaryBySellerAsync(userId, cancellationToken);
        return new SellerEarningsSummaryResponse(gross, fee, net, count);
    }
}
