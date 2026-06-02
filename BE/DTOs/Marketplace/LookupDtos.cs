namespace Exe.DTOs.Marketplace;

public record CategoryResponse(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    string? Icon,
    short SortOrder);

public record CategoryListResponse(IReadOnlyList<CategoryResponse> Data);

public record TagResponse(
    Guid Id,
    Guid GroupId,
    string Name,
    string Slug,
    int UsageCount);

public record TagListResponse(IReadOnlyList<TagResponse> Data);

public record TagGroupResponse(
    Guid Id,
    string Slug,
    string Label,
    short SortOrder,
    IReadOnlyList<TagResponse> Tags);

public record TagGroupListResponse(IReadOnlyList<TagGroupResponse> Data);
