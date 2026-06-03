using System.ComponentModel.DataAnnotations;
using Exe.Models;

namespace Exe.DTOs.Admin;

public record AdminOverviewResponse(
    int TotalUsers,
    int ActiveUsers,
    int TotalAssets,
    int PendingAssets,
    int TotalOrders,
    long RevenueVnd,
    int TotalDownloads);

public record AdminUserResponse(
    Guid Id,
    string Email,
    string Name,
    string Username,
    string Role,
    string Status,
    int WalletBalance,
    string? SubscriptionPlan,
    long TotalSpentVnd,
    DateTime CreatedAt);

public record AdminUpdateUserRequest(
    UserRole? Role,
    UserStatus? Status,
    int? WalletBalance);

public record AdminUserDetailResponse(
    Guid Id,
    string Email,
    string Name,
    string Username,
    string Role,
    string Status,
    int WalletBalance,
    string? SubscriptionPlan,
    long TotalSpentVnd,
    DateTime CreatedAt,
    int OrderCount,
    int AssetCount);

public record AdminAuditLogResponse(
    Guid Id,
    Guid? UserId,
    string Action,
    string? EntityType,
    Guid? EntityId,
    string? OldValue,
    string? NewValue,
    string? IpAddress,
    DateTime CreatedAt);

public record AdminAnalyticsRevenueResponse(
    long TotalRevenueVnd,
    IReadOnlyList<AdminDailyCountResponse> ByDay);

public record AdminAnalyticsUsersResponse(
    int TotalUsers,
    IReadOnlyList<AdminDailyCountResponse> RegistrationsByDay);

public record AdminAnalyticsAssetsResponse(
    int TotalAssets,
    int TotalDownloads,
    IReadOnlyList<AdminCategoryStatResponse> ByCategory);

public record AdminAnalyticsOrdersResponse(
    int TotalOrders,
    IReadOnlyList<AdminOrderStatusStatResponse> ByStatus);

public record AdminDailyCountResponse(string Date, long Count);

public record AdminCategoryStatResponse(Guid CategoryId, string CategoryName, int AssetCount, int DownloadCount);

public record AdminOrderStatusStatResponse(string Status, int Count);

public record AdminCreateSubscriptionPlanRequest(
    [Required] SubscriptionTier Slug,
    [Required, MaxLength(100)] string Name,
    [MaxLength(500)] string? Description,
    [Range(0, long.MaxValue)] long PriceVnd,
    int? CreditsMonthly,
    bool IsUnlimited,
    IReadOnlyList<string>? Features,
    short SortOrder = 0,
    bool IsActive = true);

public record AdminUpdateSubscriptionPlanRequest(
    [MaxLength(100)] string? Name,
    [MaxLength(500)] string? Description,
    long? PriceVnd,
    int? CreditsMonthly,
    bool? IsUnlimited,
    IReadOnlyList<string>? Features,
    short? SortOrder,
    bool? IsActive);
