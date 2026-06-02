using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Marketplace;

public record BookmarkListResponse(IReadOnlyList<AssetListItemResponse> Data);

public record CreateBookmarkRequest([Required] Guid AssetId);

public record ReviewItemResponse(
    Guid Id,
    Guid AssetId,
    string UserName,
    short Rating,
    string? Comment,
    DateTime CreatedAt,
    bool IsOwn);

public record CreateReviewRequest(
    [Range(1, 5)] short Rating,
    [MaxLength(2000)] string? Comment);

public record UpdateReviewRequest(
    [Range(1, 5)] short? Rating,
    [MaxLength(2000)] string? Comment);
