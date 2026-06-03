namespace Exe.Configuration;

public class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Bucket zip Unity (.zip, .unitypackage).</summary>
    public string AssetFilesBucket { get; set; } = "asset-files";

    /// <summary>Bucket ảnh preview / thumbnail (public read).</summary>
    public string AssetImagesBucket { get; set; } = "asset-images";

    /// <summary>Bucket avatar profile.</summary>
    public string AvatarsBucket { get; set; } = "avatars";

    public int UploadUrlExpiresSeconds { get; set; } = 7200;

    public int DownloadUrlExpiresSeconds { get; set; } = 3600;

    public long MaxZipBytes { get; set; } = 2_147_483_648;

    public long MaxImageBytes { get; set; } = 10_485_760;

    public int MaxImagesPerAsset { get; set; } = 15;
}
