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
