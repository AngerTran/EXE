using Exe.Models.Entities;

namespace Exe.Repositories.Commerce;

public interface IUserAssetRepository
{
    Task<bool> ExistsAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserAsset>> ListAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<UserAsset?> GetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);

    void Add(UserAsset userAsset);

    void AddRange(IEnumerable<UserAsset> items);

    void Remove(UserAsset userAsset);
}
