using System.Text.Json;
using Exe.DTOs.Admin;
using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.DTOs.Support;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Admin;
using Exe.Repositories.Billing;
using Exe.Repositories.Profile;
using Exe.Services.IServices;

namespace Exe.Services;

public class AdminService(
    IAdminRepository adminRepository,
    IProfileRepository profileRepository,
    ISubscriptionPlanRepository subscriptionPlanRepository,
    IWalletService walletService,
    IUnitOfWork unitOfWork) : IAdminService
{
    public async Task<AdminOverviewResponse> GetOverviewAsync(Guid adminUserId, CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var (totalUsers, activeUsers) = await adminRepository.GetUserCountsAsync(cancellationToken);
        var (totalAssets, pendingAssets, totalDownloads) = await adminRepository.GetAssetStatsAsync(cancellationToken);
        var (totalOrders, revenueVnd) = await adminRepository.GetOrderStatsAsync(cancellationToken);

        return new AdminOverviewResponse(
            totalUsers,
            activeUsers,
            totalAssets,
            pendingAssets,
            totalOrders,
            revenueVnd,
            totalDownloads);
    }

    public async Task<PagedResponse<AdminUserResponse>> ListUsersAsync(
        Guid adminUserId,
        string? search,
        UserRole? role,
        bool includeBanned,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);

        var (users, total) = await adminRepository.ListUsersAsync(
            search,
            role,
            includeBanned,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);

        return new PagedResponse<AdminUserResponse>(
            users.Select(MapUser).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<AdminUserResponse?> UpdateUserAsync(
        Guid adminUserId,
        Guid targetUserId,
        AdminUpdateUserRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);

        var user = await adminRepository.GetUserForUpdateAsync(targetUserId, cancellationToken);
        if (user is null)
            return null;

        if (request.Role.HasValue)
            user.Role = request.Role.Value;
        if (request.Status.HasValue)
            user.Status = request.Status.Value;
        var profileChanged = request.Role.HasValue || request.Status.HasValue;
        if (profileChanged)
        {
            user.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        if (request.WalletBalance.HasValue)
        {
            await walletService.AdminUpdateBalanceAsync(
                adminUserId,
                targetUserId,
                new DTOs.Wallet.AdminUpdateWalletBalanceRequest(request.WalletBalance.Value, "admin_adjustment"),
                cancellationToken);
        }

        var reloaded = await adminRepository.GetByIdAsync(targetUserId, cancellationToken) ?? user;
        return MapUser(reloaded);
    }

    public async Task<AdminUserDetailResponse?> GetUserDetailAsync(
        Guid adminUserId,
        Guid targetUserId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var user = await adminRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (user is null)
            return null;

        var (orderCount, assetCount) = await adminRepository.GetUserCountsDetailAsync(targetUserId, cancellationToken);
        var activeSub = user.Subscriptions.OrderByDescending(s => s.StartedAt).FirstOrDefault();
        return new AdminUserDetailResponse(
            user.Id,
            user.Email,
            user.Name,
            user.Username,
            user.Role.ToString().ToLowerInvariant(),
            user.Status.ToString().ToLowerInvariant(),
            user.Wallet?.Balance ?? 0,
            activeSub?.Plan?.Name,
            user.TotalSpentVnd,
            user.CreatedAt,
            orderCount,
            assetCount);
    }

    public async Task<bool> DeleteUserAsync(
        Guid adminUserId,
        Guid targetUserId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var user = await adminRepository.GetUserForUpdateAsync(targetUserId, cancellationToken);
        if (user is null)
            return false;

        user.Status = UserStatus.Banned;
        user.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<PagedResponse<ContactInquiryResponse>> ListContactInquiriesAsync(
        Guid adminUserId,
        string? status,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var (items, total) = await adminRepository.ListContactInquiriesAsync(
            status,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);
        return new PagedResponse<ContactInquiryResponse>(
            items.Select(ContactService.Map).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<ContactInquiryResponse?> UpdateContactInquiryAsync(
        Guid adminUserId,
        Guid inquiryId,
        UpdateContactInquiryRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var status = request.Status.Trim().ToLowerInvariant();
        if (status is not ("new" or "replied"))
            throw new ArgumentException("Status must be 'new' or 'replied'.");

        var inquiry = await adminRepository.GetContactInquiryForUpdateAsync(inquiryId, cancellationToken);
        if (inquiry is null)
            return null;

        inquiry.Status = status;
        inquiry.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ContactService.Map(inquiry);
    }

    public async Task<PagedResponse<AdminAuditLogResponse>> ListAuditLogsAsync(
        Guid adminUserId,
        Guid? userId,
        string? action,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var (items, total) = await adminRepository.ListAuditLogsAsync(
            userId,
            action,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);
        return new PagedResponse<AdminAuditLogResponse>(
            items.Select(a => new AdminAuditLogResponse(
                a.Id,
                a.UserId,
                a.Action,
                a.EntityType,
                a.EntityId,
                a.OldValue,
                a.NewValue,
                a.IpAddress,
                a.CreatedAt)).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<AdminAnalyticsRevenueResponse> GetAnalyticsRevenueAsync(
        Guid adminUserId,
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var total = await adminRepository.GetRevenueInRangeAsync(from, to, cancellationToken);
        var byDay = await adminRepository.GetRevenueByDayAsync(from, to, cancellationToken);
        return new AdminAnalyticsRevenueResponse(
            total,
            byDay.Select(d => new AdminDailyCountResponse(d.Day.ToString("yyyy-MM-dd"), d.Amount)).ToList());
    }

    public async Task<AdminAnalyticsUsersResponse> GetAnalyticsUsersAsync(
        Guid adminUserId,
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var (totalUsers, _) = await adminRepository.GetUserCountsAsync(cancellationToken);
        var byDay = await adminRepository.GetUserRegistrationsByDayAsync(from, to, cancellationToken);
        return new AdminAnalyticsUsersResponse(
            totalUsers,
            byDay.Select(d => new AdminDailyCountResponse(d.Day.ToString("yyyy-MM-dd"), d.Count)).ToList());
    }

    public async Task<AdminAnalyticsAssetsResponse> GetAnalyticsAssetsAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var (totalAssets, _, totalDownloads) = await adminRepository.GetAssetStatsAsync(cancellationToken);
        var byCategory = await adminRepository.GetAssetStatsByCategoryAsync(cancellationToken);
        return new AdminAnalyticsAssetsResponse(
            totalAssets,
            totalDownloads,
            byCategory.Select(c => new AdminCategoryStatResponse(
                c.CategoryId, c.CategoryName, c.AssetCount, c.DownloadCount)).ToList());
    }

    public async Task<AdminAnalyticsOrdersResponse> GetAnalyticsOrdersAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var byStatus = await adminRepository.GetOrderCountsByStatusAsync(cancellationToken);
        var byType = await adminRepository.GetCompletedOrderCountsByTypeAsync(cancellationToken);
        var purchases = await adminRepository.GetCompletedPurchaseStatsAsync(cancellationToken);
        return new AdminAnalyticsOrdersResponse(
            byStatus.Sum(x => x.Count),
            byStatus.Select(s => new AdminOrderStatusStatResponse(
                s.Status.ToString().ToLowerInvariant(), s.Count)).ToList(),
            byType.Select(t => new AdminOrderTypeStatResponse(
                t.Type.ToString().ToLowerInvariant(), t.Count)).ToList(),
            purchases.Select(p => new AdminPurchaseStatResponse(
                p.Category, p.ItemName, p.PlanSlug, p.Count, p.RevenueVnd)).ToList());
    }

    public async Task<AdminAnalyticsAiUsageResponse> GetAnalyticsAiUsageAsync(
        Guid adminUserId,
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var totals = await adminRepository.GetAiUsageTotalsAsync(from, to, cancellationToken);
        var byDay = await adminRepository.GetAiUsageByDayAsync(from, to, cancellationToken);
        var byUser = await adminRepository.GetAiUsageByUserAsync(from, to, take: 10, cancellationToken);
        return new AdminAnalyticsAiUsageResponse(
            totals.TotalMessages,
            totals.TotalTokens,
            totals.TotalXuCharged,
            totals.ActiveSessions,
            byDay.Select(d => new AdminAiDailyUsageResponse(
                d.Day.ToString("yyyy-MM-dd"), d.Messages, d.Tokens, d.XuCharged)).ToList(),
            byUser.Select(u => new AdminAiUserUsageStatResponse(
                u.UserId, u.UserName, u.Email, u.MessageCount, u.TotalTokens, u.TotalXuCharged)).ToList());
    }

    public async Task<SubscriptionPlanListResponse> ListSubscriptionPlansAsync(
        Guid adminUserId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var plans = await subscriptionPlanRepository.GetPlansAsync(activeOnly: false, cancellationToken);
        return new SubscriptionPlanListResponse(plans.Select(MapPlan).ToList());
    }

    public async Task<SubscriptionPlanResponse> CreateSubscriptionPlanAsync(
        Guid adminUserId,
        AdminCreateSubscriptionPlanRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var existing = await subscriptionPlanRepository.GetBySlugAsync(request.Slug, activeOnly: false, cancellationToken);
        if (existing is not null)
            throw new ArgumentException($"Plan with slug '{request.Slug}' already exists.");

        var now = DateTime.UtcNow;
        var plan = new SubscriptionPlan
        {
            Id = Guid.NewGuid(),
            Slug = request.Slug,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            PriceVnd = request.PriceVnd,
            CreditsMonthly = request.CreditsMonthly,
            IsUnlimited = request.IsUnlimited,
            Features = SerializeFeatures(request.Features),
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedAt = now,
            UpdatedAt = now
        };
        subscriptionPlanRepository.Add(plan);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPlan(plan);
    }

    public async Task<SubscriptionPlanResponse?> UpdateSubscriptionPlanAsync(
        Guid adminUserId,
        Guid planId,
        AdminUpdateSubscriptionPlanRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var plan = await subscriptionPlanRepository.GetByIdForUpdateAsync(planId, cancellationToken);
        if (plan is null)
            return null;

        if (request.Name is not null)
            plan.Name = request.Name.Trim();
        if (request.Description is not null)
            plan.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        if (request.PriceVnd.HasValue)
            plan.PriceVnd = request.PriceVnd.Value;
        if (request.CreditsMonthly.HasValue)
            plan.CreditsMonthly = request.CreditsMonthly;
        if (request.IsUnlimited.HasValue)
            plan.IsUnlimited = request.IsUnlimited.Value;
        if (request.Features is not null)
            plan.Features = SerializeFeatures(request.Features);
        if (request.SortOrder.HasValue)
            plan.SortOrder = request.SortOrder.Value;
        if (request.IsActive.HasValue)
            plan.IsActive = request.IsActive.Value;
        plan.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPlan(plan);
    }

    public async Task<bool> DeleteSubscriptionPlanAsync(
        Guid adminUserId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var plan = await subscriptionPlanRepository.GetByIdForUpdateAsync(planId, cancellationToken);
        if (plan is null)
            return false;

        plan.IsActive = false;
        plan.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> HardDeleteSubscriptionPlanAsync(
        Guid adminUserId,
        Guid planId,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);
        var plan = await subscriptionPlanRepository.GetByIdForUpdateAsync(planId, cancellationToken);
        if (plan is null)
            return false;

        var (subscriptions, orderItems) =
            await subscriptionPlanRepository.GetReferenceCountsAsync(planId, cancellationToken);
        if (subscriptions > 0 || orderItems > 0)
        {
            throw new InvalidOperationException(
                $"Cannot permanently delete plan '{plan.Slug}': {subscriptions} subscription(s) and {orderItems} order item(s) still reference it.");
        }

        subscriptionPlanRepository.Remove(plan);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task EnsureAdminAsync(Guid userId, CancellationToken cancellationToken)
    {
        if (await profileRepository.GetRoleAsync(userId, cancellationToken) != UserRole.Admin)
            throw new ForbiddenException("Admin access required.");
    }

    private static AdminUserResponse MapUser(Models.Entities.Profile p)
    {
        var activeSub = p.Subscriptions.OrderByDescending(s => s.StartedAt).FirstOrDefault();
        return new AdminUserResponse(
            p.Id,
            p.Email,
            p.Name,
            p.Username,
            p.Role.ToString().ToLowerInvariant(),
            p.Status.ToString().ToLowerInvariant(),
            p.Wallet?.Balance ?? 0,
            activeSub?.Plan?.Name,
            p.TotalSpentVnd,
            p.CreatedAt);
    }

    private static SubscriptionPlanResponse MapPlan(SubscriptionPlan plan) =>
        new(
            plan.Id,
            plan.Slug.ToString().ToLowerInvariant(),
            plan.Name,
            plan.Description,
            plan.PriceVnd,
            plan.CreditsMonthly,
            plan.IsUnlimited,
            ParseFeatures(plan.Features),
            plan.SortOrder,
            plan.IsActive);

    private static IReadOnlyList<string> ParseFeatures(string featuresJson)
    {
        if (string.IsNullOrWhiteSpace(featuresJson))
            return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(featuresJson) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string SerializeFeatures(IReadOnlyList<string>? features) =>
        JsonSerializer.Serialize(features ?? []);
}
