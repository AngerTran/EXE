using Exe.Data;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Commerce;

public class UserAssetRepository(AppDbContext db) : IUserAssetRepository
{
    public Task<bool> ExistsAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default) =>
        db.UserAssets.AnyAsync(ua => ua.UserId == userId && ua.AssetId == assetId, cancellationToken);

    public async Task<IReadOnlyList<UserAsset>> ListAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await db.UserAssets
            .AsNoTracking()
            .Where(ua => ua.UserId == userId)
            .Include(ua => ua.Asset).ThenInclude(a => a.Category)
            .Include(ua => ua.Asset).ThenInclude(a => a.Files)
            .Include(ua => ua.Order!).ThenInclude(o => o.Items)
            .OrderByDescending(ua => ua.AcquiredAt)
            .ToListAsync(cancellationToken);

    public Task<UserAsset?> GetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default) =>
        db.UserAssets
            .Include(ua => ua.Asset).ThenInclude(a => a.Category)
            .Include(ua => ua.Asset).ThenInclude(a => a.Files)
            .Include(ua => ua.Order!).ThenInclude(o => o.Items)
            .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.AssetId == assetId, cancellationToken);

    public void Add(UserAsset userAsset) => db.UserAssets.Add(userAsset);

    public void AddRange(IEnumerable<UserAsset> items) => db.UserAssets.AddRange(items);

    public void Remove(UserAsset userAsset) => db.UserAssets.Remove(userAsset);
}
