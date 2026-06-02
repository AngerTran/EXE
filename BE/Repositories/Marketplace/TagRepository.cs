using Exe.Data;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Marketplace;

public class TagRepository(AppDbContext db) : ITagRepository
{
    public async Task<IReadOnlyList<Tag>> GetTagsAsync(
        Guid? groupId = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.Tags.AsNoTracking().Include(t => t.Group).AsQueryable();
        if (groupId.HasValue)
            query = query.Where(t => t.GroupId == groupId.Value);

        return await query.OrderBy(t => t.Group.SortOrder).ThenBy(t => t.Name).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TagGroup>> GetTagGroupsWithTagsAsync(
        CancellationToken cancellationToken = default) =>
        await db.TagGroups
            .AsNoTracking()
            .Include(g => g.Tags.OrderBy(t => t.Name))
            .OrderBy(g => g.SortOrder)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Tag>> GetByIdsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
            return [];

        return await db.Tags.AsNoTracking().Where(t => ids.Contains(t.Id)).ToListAsync(cancellationToken);
    }
}
