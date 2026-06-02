using Exe.Models.Entities;

namespace Exe.Repositories.Commerce;

public interface ICartRepository
{
    Task<IReadOnlyList<CartItem>> GetItemsAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<CartItem?> GetItemAsync(Guid userId, Guid cartItemId, CancellationToken cancellationToken = default);

    Task<CartItem?> GetItemByAssetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);

    void Add(CartItem item);

    void Remove(CartItem item);

    void RemoveRange(IEnumerable<CartItem> items);
}
