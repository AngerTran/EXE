using Exe.DTOs.Marketplace;

namespace Exe.Services.IServices;

public interface ILookupService
{
    Task<CategoryListResponse> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<TagListResponse> GetTagsAsync(Guid? groupId = null, CancellationToken cancellationToken = default);
    Task<TagGroupListResponse> GetTagGroupsAsync(CancellationToken cancellationToken = default);
}
