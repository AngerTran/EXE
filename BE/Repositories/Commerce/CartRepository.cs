using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Commerce;

public class CartRepository(AppDbContext db) : ICartRepository
{
    public async Task<IReadOnlyList<CartItem>> GetItemsAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await db.CartItems
            .AsNoTracking()
            .Where(c => c.UserId == userId)
            .Include(c => c.Asset).ThenInclude(a => a.Category)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<CartItem?> GetItemAsync(
        Guid userId,
        Guid cartItemId,
        CancellationToken cancellationToken = default) =>
        db.CartItems
            .Include(c => c.Asset).ThenInclude(a => a.Category)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Id == cartItemId, cancellationToken);

    public Task<CartItem?> GetItemByAssetAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default) =>
        db.CartItems
            .FirstOrDefaultAsync(c => c.UserId == userId && c.AssetId == assetId, cancellationToken);

    public void Add(CartItem item) => db.CartItems.Add(item);

    public void Remove(CartItem item) => db.CartItems.Remove(item);

    public void RemoveRange(IEnumerable<CartItem> items) => db.CartItems.RemoveRange(items);
}
