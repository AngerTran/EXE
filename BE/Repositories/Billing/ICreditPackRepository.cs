using Exe.Models.Entities;

namespace Exe.Repositories.Billing;

public interface ICreditPackRepository
{
    Task<IReadOnlyList<CreditPack>> ListAsync(bool activeOnly, CancellationToken cancellationToken = default);
    Task<CreditPack?> GetByIdAsync(string id, bool activeOnly, CancellationToken cancellationToken = default);
    Task<CreditPack?> GetByIdForUpdateAsync(string id, CancellationToken cancellationToken = default);
    Task<int> CountAsync(CancellationToken cancellationToken = default);
    void Add(CreditPack pack);
    void Remove(CreditPack pack);
}
