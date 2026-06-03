using Exe.DTOs.Admin;
using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.DTOs.Support;
using Exe.Models;

namespace Exe.Services.IServices;

public interface IAdminService
{
    Task<AdminOverviewResponse> GetOverviewAsync(Guid adminUserId, CancellationToken cancellationToken = default);
    Task<PagedResponse<AdminUserResponse>> ListUsersAsync(
        Guid adminUserId,
        string? search,
        UserRole? role,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<AdminUserResponse?> UpdateUserAsync(
        Guid adminUserId,
        Guid targetUserId,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken = default);
    Task<AdminUserDetailResponse?> GetUserDetailAsync(
        Guid adminUserId,
        Guid targetUserId,
        CancellationToken cancellationToken = default);
    Task<bool> DeleteUserAsync(Guid adminUserId, Guid targetUserId, CancellationToken cancellationToken = default);
    Task<PagedResponse<ContactInquiryResponse>> ListContactInquiriesAsync(
        Guid adminUserId,
        string? status,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<ContactInquiryResponse?> UpdateContactInquiryAsync(
        Guid adminUserId,
        Guid inquiryId,
        UpdateContactInquiryRequest request,
        CancellationToken cancellationToken = default);
    Task<PagedResponse<AdminAuditLogResponse>> ListAuditLogsAsync(
        Guid adminUserId,
        Guid? userId,
        string? action,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<AdminAnalyticsRevenueResponse> GetAnalyticsRevenueAsync(
        Guid adminUserId,
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default);
    Task<AdminAnalyticsUsersResponse> GetAnalyticsUsersAsync(
        Guid adminUserId,
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default);
    Task<AdminAnalyticsAssetsResponse> GetAnalyticsAssetsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default);
    Task<AdminAnalyticsOrdersResponse> GetAnalyticsOrdersAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default);
    Task<SubscriptionPlanListResponse> ListSubscriptionPlansAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default);
    Task<SubscriptionPlanResponse> CreateSubscriptionPlanAsync(
        Guid adminUserId,
        AdminCreateSubscriptionPlanRequest request,
        CancellationToken cancellationToken = default);
    Task<SubscriptionPlanResponse?> UpdateSubscriptionPlanAsync(
        Guid adminUserId,
        Guid planId,
        AdminUpdateSubscriptionPlanRequest request,
        CancellationToken cancellationToken = default);
    Task<bool> DeleteSubscriptionPlanAsync(
        Guid adminUserId,
        Guid planId,
        CancellationToken cancellationToken = default);
}
