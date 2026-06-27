using System.ComponentModel.DataAnnotations;
using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;

namespace Exe.DTOs.Seller;

public record SellerStatsResponse(
    int TotalAssets,
    int ApprovedCount,
    int PendingReviewCount,
    int RejectedCount,
    int DraftCount,
    long TotalDownloads);

public record SellerEarningsSummaryResponse(
    int TotalGrossXu,
    int TotalPlatformFeeXu,
    int TotalNetXu,
    int SaleCount);

public record SellerMeResponse(
    Guid UserId,
    string Email,
    string Username,
    string Name,
    string Role,
    string? AvatarUrl,
    string? Bio,
    string? SellerWebsiteUrl,
    bool SellerIsTrusted,
    string? SellerStatus,
    DateTime? SellerAppliedAt,
    DateTime? SellerApprovedAt,
    SellerStatsResponse Stats,
    SellerEarningsSummaryResponse Earnings);

public record SellerAssetsResponse(
    SellerStatsResponse Stats,
    PagedResponse<AssetListItemResponse> Assets);

public record UpdateSellerProfileRequest(
    [MaxLength(120)] string? Name,
    [MaxLength(2000)] string? Bio,
    [MaxLength(500)] string? SellerWebsiteUrl);

public record SellerApplyRequest(
    [MaxLength(2000)] string? Reason,
    [MaxLength(500)] string? PortfolioUrl);

public record SellerApplyResponse(
    Guid UserId,
    string Role,
    DateTime ActivatedAt);

public record SellerEarningItemResponse(
    Guid Id,
    Guid OrderId,
    string OrderCode,
    Guid AssetId,
    string AssetTitle,
    int GrossXu,
    int PlatformFeeXu,
    int NetXu,
    string Status,
    DateTime CreatedAt);

public record SellerEarningsResponse(
    SellerEarningsSummaryResponse Summary,
    PagedResponse<SellerEarningItemResponse> Items);
