using System.ComponentModel.DataAnnotations;
using Exe.Models;

namespace Exe.DTOs.Marketplace;

public record AssetListItemResponse(
    Guid Id,
    string Slug,
    string Title,
    string? ShortDescription,
    Guid CategoryId,
    string CategoryName,
    string UploaderName,
    string PriceType,
    long PriceVnd,
    int PriceXu,
    decimal RatingAvg,
    int RatingCount,
    int DownloadCount,
    string? ThumbnailUrl,
    IReadOnlyList<string> Tags,
    bool IsFree);

public record AssetFileResponse(
    Guid Id,
    string FileName,
    string FileType,
    long FileSizeBytes,
    bool IsPrimary);

public record AssetImageResponse(
    Guid Id,
    string StoragePath,
    string? AltText,
    bool IsThumbnail,
    short SortOrder);

public record AssetReviewResponse(
    Guid Id,
    string UserName,
    short Rating,
    string? Comment,
    DateTime CreatedAt);

public record AssetDetailResponse(
    Guid Id,
    string Slug,
    string Title,
    string? ShortDescription,
    string? FullDescription,
    Guid CategoryId,
    string CategoryName,
    Guid UploaderId,
    string UploaderName,
    string? ArtStyle,
    string PriceType,
    long PriceVnd,
    int PriceXu,
    string License,
    string Status,
    bool EngineUnity,
    bool EngineUnreal,
    bool EngineGodot,
    bool FeatureRigged,
    bool FeatureAnimated,
    bool FeaturePbr,
    bool FeatureVrReady,
    string? Version,
    decimal RatingAvg,
    int RatingCount,
    int DownloadCount,
    string? ThumbnailUrl,
    IReadOnlyList<string> Tags,
    IReadOnlyList<AssetFileResponse> Files,
    IReadOnlyList<AssetImageResponse> Images,
    IReadOnlyList<AssetReviewResponse> Reviews,
    bool IsFree,
    DateTime CreatedAt);

public record CreateAssetRequest(
    [Required, MaxLength(200)] string Title,
    [MaxLength(500)] string? ShortDescription,
    [MaxLength(5000)] string? FullDescription,
    [Required] Guid CategoryId,
    IReadOnlyList<Guid>? TagIds,
    ArtStyle? ArtStyle,
    [Required] PriceType PriceType,
    [Range(0, long.MaxValue)] long PriceVnd,
    [Range(0, int.MaxValue)] int PriceXu,
    LicenseType License = LicenseType.Standard,
    bool EngineUnity = true,
    bool EngineUnreal = false,
    bool EngineGodot = false,
    bool FeatureRigged = false,
    bool FeatureAnimated = false,
    bool FeaturePbr = false,
    bool FeatureVrReady = false,
    string? Version = null,
    string? UnityVersion = null,
    long? FileSizeBytes = null,
    string? PolygonCount = null,
    string? TextureResolution = null,
    string? ThumbnailUrl = null);

public record UpdateAssetRequest(
    [MaxLength(200)] string? Title,
    [MaxLength(500)] string? ShortDescription,
    [MaxLength(5000)] string? FullDescription,
    Guid? CategoryId,
    IReadOnlyList<Guid>? TagIds,
    ArtStyle? ArtStyle,
    PriceType? PriceType,
    long? PriceVnd,
    int? PriceXu,
    LicenseType? License,
    bool? EngineUnity,
    bool? EngineUnreal,
    bool? EngineGodot,
    bool? FeatureRigged,
    bool? FeatureAnimated,
    bool? FeaturePbr,
    bool? FeatureVrReady,
    string? Version,
    string? ThumbnailUrl);

public record RejectAssetRequest(
    [Required, MaxLength(1000)] string Reason);

public record AssetQueryParams
{
    public string? Search { get; init; }
    public Guid? CategoryId { get; init; }
    public string? PriceType { get; init; }
    public string? Tag { get; init; }
    public string Sort { get; init; } = "createdAt";
    public string Order { get; init; } = "desc";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
