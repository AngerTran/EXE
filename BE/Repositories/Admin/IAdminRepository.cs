using Exe.Models;
using ProfileEntity = Exe.Models.Entities.Profile;

namespace Exe.Repositories.Admin;

public interface IAdminRepository
{
    Task<(int TotalUsers, int ActiveUsers)> GetUserCountsAsync(CancellationToken cancellationToken = default);

    Task<(int TotalAssets, int PendingAssets, int TotalDownloads)> GetAssetStatsAsync(
        CancellationToken cancellationToken = default);

    Task<(int TotalOrders, long RevenueVnd)> GetOrderStatsAsync(CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<ProfileEntity> Items, int Total)> ListUsersAsync(
        string? search,
        UserRole? role,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<ProfileEntity?> GetUserForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ProfileEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
