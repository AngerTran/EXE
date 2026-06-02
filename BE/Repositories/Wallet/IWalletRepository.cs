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
}
