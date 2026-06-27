using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Seller;

public interface ISellerApplicationRepository
{
    Task<bool> HasPendingAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<SellerApplication?> GetPendingByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<SellerApplication?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<SellerApplication> Items, int Total)> ListAsync(
        SellerApplicationStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    void Add(SellerApplication application);
}
