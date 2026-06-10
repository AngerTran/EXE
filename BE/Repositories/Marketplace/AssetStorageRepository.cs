using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Marketplace;

public class AssetStorageRepository(AppDbContext db) : IAssetStorageRepository
{
    public Task<Asset?> GetAssetForStorageAsync(Guid assetId, CancellationToken cancellationToken = default) =>
        db.Assets
            .FirstOrDefaultAsync(a => a.Id == assetId && a.DeletedAt == null, cancellationToken);

    public Task<Asset?> GetAssetIncludingDeletedAsync(Guid assetId, CancellationToken cancellationToken = default) =>
        db.Assets.FirstOrDefaultAsync(a => a.Id == assetId, cancellationToken);

    public Task<int> CountImagesAsync(Guid assetId, CancellationToken cancellationToken = default) =>
        db.AssetImages.CountAsync(i => i.AssetId == assetId, cancellationToken);

    public Task<AssetFile?> GetPrimaryFileAsync(Guid assetId, CancellationToken cancellationToken = default) =>
        db.AssetFiles
            .Where(f => f.AssetId == assetId)
            .OrderByDescending(f => f.IsPrimary)
            .ThenBy(f => f.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> UserHasPurchasedAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default) =>
        db.UserAssets.AnyAsync(ua => ua.UserId == userId && ua.AssetId == assetId, cancellationToken);

    public void AddFile(AssetFile file) => db.AssetFiles.Add(file);

    public void AddImage(AssetImage image) => db.AssetImages.Add(image);

    public Task<AssetImage?> GetFirstPreviewImageAsync(Guid assetId, CancellationToken cancellationToken = default) =>
        db.AssetImages
            .Where(i => i.AssetId == assetId && !i.IsThumbnail)
            .OrderBy(i => i.SortOrder)
            .ThenBy(i => i.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<AssetImage?> GetThumbnailImageAsync(Guid assetId, CancellationToken cancellationToken = default) =>
        db.AssetImages
            .Where(i => i.AssetId == assetId && i.IsThumbnail)
            .OrderBy(i => i.SortOrder)
            .ThenByDescending(i => i.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<AssetImage?> GetImageByIdAsync(
        Guid assetId,
        Guid imageId,
        CancellationToken cancellationToken = default) =>
        db.AssetImages
            .FirstOrDefaultAsync(i => i.AssetId == assetId && i.Id == imageId, cancellationToken);

    public async Task IncrementDownloadStatsAsync(
        Guid assetId,
        Guid? userId,
        CancellationToken cancellationToken = default)
    {
        await db.Assets
            .Where(a => a.Id == assetId)
            .ExecuteUpdateAsync(
                s => s
                    .SetProperty(a => a.DownloadCount, a => a.DownloadCount + 1),
                cancellationToken);

        if (!userId.HasValue)
            return;

        var userAsset = await db.UserAssets
            .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.AssetId == assetId, cancellationToken);

        if (userAsset is null)
            return;

        userAsset.DownloadCount++;
        userAsset.LastDownloadAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }
}
