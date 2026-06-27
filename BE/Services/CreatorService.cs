using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.DTOs.Seller;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Profile;
using Exe.Services.IServices;

namespace Exe.Services;

public class CreatorService(
    IProfileRepository profileRepository,
    IAssetRepository assetRepository,
    IAssetService assetService) : ICreatorService
{
    public async Task<CreatorPublicResponse?> GetByUsernameAsync(
        string username,
        CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetPublicSellerByUsernameAsync(username, cancellationToken);
        if (profile is null)
            return null;

        var stats = await BuildStatsAsync(profile.Id, cancellationToken);
        return MapCreator(profile, stats);
    }

    public async Task<CreatorAssetsResponse?> ListAssetsByUsernameAsync(
        string username,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetPublicSellerByUsernameAsync(username, cancellationToken);
        if (profile is null)
            return null;

        var stats = await BuildStatsAsync(profile.Id, cancellationToken);
        var assetQuery = new AssetQueryParams
        {
            UploaderId = profile.Id,
            Page = query.Page,
            PageSize = query.PageSize,
            Sort = "createdAt",
            Order = "desc"
        };
        var assets = await assetService.ListApprovedAsync(assetQuery, cancellationToken: cancellationToken);

        return new CreatorAssetsResponse(MapCreator(profile, stats), assets);
    }

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

    private static CreatorPublicResponse MapCreator(Models.Entities.Profile profile, SellerStatsResponse stats) =>
        new(
            profile.Id,
            profile.Username,
            profile.Name,
            profile.Bio,
            profile.AvatarUrl,
            profile.SellerWebsiteUrl,
            stats,
            profile.SellerApprovedAt ?? profile.CreatedAt);
}
