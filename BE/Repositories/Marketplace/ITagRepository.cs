using Exe.Models.Entities;

namespace Exe.Repositories.Marketplace;

public interface ITagRepository
{
    Task<IReadOnlyList<Tag>> GetTagsAsync(
        Guid? groupId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<TagGroup>> GetTagGroupsWithTagsAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Tag>> GetByIdsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default);
}
