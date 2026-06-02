using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Marketplace;

public enum StorageUploadKind
{
    File,
    Image
}

public record CreateUploadUrlRequest(
    [Required] StorageUploadKind Kind,
    [Required, MaxLength(255)] string FileName,
    [Required, MaxLength(128)] string ContentType,
    [Range(1, long.MaxValue)] long FileSizeBytes);

public record UploadUrlResponse(
    string UploadUrl,
    string StoragePath,
    string Bucket,
    int ExpiresInSeconds);

public record RegisterAssetFileRequest(
    [Required, MaxLength(1024)] string StoragePath,
    [Required, MaxLength(255)] string FileName,
    [Required, MaxLength(64)] string FileType,
    [Range(1, long.MaxValue)] long FileSizeBytes,
    [MaxLength(64)] string? ChecksumSha256,
    [MaxLength(32)] string? UnityVersion,
    bool IsPrimary = true);

public record RegisterAssetImageRequest(
    [Required, MaxLength(1024)] string StoragePath,
    [MaxLength(255)] string? AltText,
    short SortOrder = 0,
    bool IsThumbnail = false);

public record AssetDownloadResponse(
    string DownloadUrl,
    string FileName,
    long FileSizeBytes,
    string? UnityVersion,
    int ExpiresInSeconds);
