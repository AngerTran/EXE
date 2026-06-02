using Exe.Models.Entities;

namespace Exe.Repositories;

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    void AddWalletTransaction(WalletTransaction transaction);
}
