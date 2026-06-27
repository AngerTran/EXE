using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Wallet;

public interface IWalletRepository
{
    Task<Models.Entities.Wallet?> GetByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<bool> HasUnlimitedPlanAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<WalletTransaction> Items, int Total)> GetTransactionsAsync(
        Guid userId,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<Models.Entities.Wallet?> GetByUserIdForUpdateAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    /// <summary>Tạo ví balance=0 nếu user chưa có (profile cũ / trigger DB thiếu).</summary>
    Task<Models.Entities.Wallet> GetOrCreateByUserIdForUpdateAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<HashSet<Guid>> GetAssetPurchaseOrderIdsAsync(
        IReadOnlyList<Guid> orderIds,
        CancellationToken cancellationToken = default);
}
