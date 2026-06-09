using Exe.Models;
using Exe.Models.Entities;
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
        bool includeBanned,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<ProfileEntity?> GetUserForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ProfileEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(int OrderCount, int AssetCount)> GetUserCountsDetailAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<ContactInquiry> Items, int Total)> ListContactInquiriesAsync(
        string? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<ContactInquiry?> GetContactInquiryForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<AuditLog> Items, int Total)> ListAuditLogsAsync(
        Guid? userId,
        string? action,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<long> GetRevenueInRangeAsync(DateTime? from, DateTime? to, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(DateTime Day, long Amount)>> GetRevenueByDayAsync(
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(DateTime Day, int Count)>> GetUserRegistrationsByDayAsync(
        DateTime? from,
        DateTime? to,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(Guid CategoryId, string CategoryName, int AssetCount, int DownloadCount)>> GetAssetStatsByCategoryAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(OrderStatus Status, int Count)>> GetOrderCountsByStatusAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(OrderType Type, int Count)>> GetCompletedOrderCountsByTypeAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<(string Category, string ItemName, string? PlanSlug, int Count, long RevenueVnd)>> GetCompletedPurchaseStatsAsync(
        CancellationToken cancellationToken = default);
}
