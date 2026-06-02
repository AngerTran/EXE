using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Marketplace;

public class BookmarkRepository(AppDbContext db) : IBookmarkRepository
{
    public async Task<IReadOnlyList<Bookmark>> ListAsync(
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await db.Bookmarks
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .Include(b => b.Asset).ThenInclude(a => a.Category)
            .Include(b => b.Asset).ThenInclude(a => a.Uploader)
            .Include(b => b.Asset).ThenInclude(a => a.AssetTags).ThenInclude(at => at.Tag)
            .Where(b => b.Asset.Status == AssetStatus.Approved && b.Asset.DeletedAt == null)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task<Bookmark?> GetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default) =>
        db.Bookmarks.FirstOrDefaultAsync(b => b.UserId == userId && b.AssetId == assetId, cancellationToken);

    public void Add(Bookmark bookmark) => db.Bookmarks.Add(bookmark);

    public void Remove(Bookmark bookmark) => db.Bookmarks.Remove(bookmark);
}
