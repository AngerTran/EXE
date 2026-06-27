using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;

namespace Exe.DTOs.Seller;

public record CreatorPublicResponse(
    Guid UserId,
    string Username,
    string Name,
    string? Bio,
    string? AvatarUrl,
    string? WebsiteUrl,
    SellerStatsResponse Stats,
    DateTime MemberSince);

public record CreatorAssetsResponse(
    CreatorPublicResponse Creator,
    PagedResponse<AssetListItemResponse> Assets);
