using Exe.DTOs.Marketplace;
using Exe.Repositories.Marketplace;
using Exe.Services.IServices;

namespace Exe.Services;

public class LookupService(
    ICategoryRepository categoryRepository,
    ITagRepository tagRepository) : ILookupService
{
    public async Task<CategoryListResponse> GetCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await categoryRepository.GetActiveAsync(cancellationToken);
        return new CategoryListResponse(categories.Select(c =>
            new CategoryResponse(c.Id, c.Slug, c.Name, c.Description, c.Icon, c.SortOrder)).ToList());
    }

    public async Task<TagListResponse> GetTagsAsync(Guid? groupId = null, CancellationToken cancellationToken = default)
    {
        var tags = await tagRepository.GetTagsAsync(groupId, cancellationToken);
        return new TagListResponse(tags.Select(t =>
            new TagResponse(t.Id, t.GroupId, t.Name, t.Slug, t.UsageCount)).ToList());
    }

    public async Task<TagGroupListResponse> GetTagGroupsAsync(CancellationToken cancellationToken = default)
    {
        var groups = await tagRepository.GetTagGroupsWithTagsAsync(cancellationToken);
        return new TagGroupListResponse(groups.Select(g => new TagGroupResponse(
            g.Id,
            g.Slug,
            g.Label,
            g.SortOrder,
            g.Tags.Select(t => new TagResponse(t.Id, t.GroupId, t.Name, t.Slug, t.UsageCount)).ToList())).ToList());
    }
}
