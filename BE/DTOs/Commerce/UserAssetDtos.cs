namespace Exe.DTOs.Commerce;

public record UserAssetListItemResponse(
    Guid AssetId,
    string Title,
    string Slug,
    string CategoryName,
    string? ThumbnailUrl,
    string AcquiredVia,
    int DownloadCount,
    DateTime? LastDownloadAt,
    DateTime AcquiredAt,
    bool IsDelisted);

public record UserAssetDetailResponse(
    Guid AssetId,
    string Title,
    string Slug,
    string? ShortDescription,
    string CategoryName,
    string? ThumbnailUrl,
    string AcquiredVia,
    int DownloadCount,
    DateTime AcquiredAt,
    string? DownloadUrl,
    int? DownloadExpiresInSeconds,
    bool IsDelisted);
