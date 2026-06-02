using Exe.Models.Entities;

namespace Exe.Repositories.Marketplace;

public interface IBookmarkRepository
{
    Task<IReadOnlyList<Bookmark>> ListAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<Bookmark?> GetAsync(Guid userId, Guid assetId, CancellationToken cancellationToken = default);

    void Add(Bookmark bookmark);

    void Remove(Bookmark bookmark);
}
