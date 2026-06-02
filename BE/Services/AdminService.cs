using Exe.DTOs.Admin;
using Exe.DTOs.Common;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Admin;
using Exe.Repositories.Profile;
using Exe.Repositories.Wallet;
using Exe.Services.IServices;

namespace Exe.Services;

public class AdminService(
    IAdminRepository adminRepository,
    IProfileRepository profileRepository,
    IWalletRepository walletRepository,
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
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        await EnsureAdminAsync(adminUserId, cancellationToken);

        var (users, total) = await adminRepository.ListUsersAsync(
            search,
            role,
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
        if (request.WalletBalance.HasValue && user.Wallet is not null)
        {
            user.Wallet.Balance = request.WalletBalance.Value;
            user.Wallet.UpdatedAt = DateTime.UtcNow;
        }
        user.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var reloaded = await adminRepository.GetByIdAsync(targetUserId, cancellationToken) ?? user;
        return MapUser(reloaded);
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
}
