using Exe.Data;
using Exe.Models.Entities;

namespace Exe.Repositories;

public class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);

    public void AddWalletTransaction(WalletTransaction transaction) =>
        db.WalletTransactions.Add(transaction);
}
