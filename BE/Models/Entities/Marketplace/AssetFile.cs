namespace Exe.Models.Entities;

public class AssetFile
{
    public Guid Id { get; set; }
    public Guid AssetId { get; set; }
    public string FileName { get; set; } = null!;
    public string StoragePath { get; set; } = null!;
    public string FileType { get; set; } = null!;
    public long FileSizeBytes { get; set; }
    public string? ChecksumSha256 { get; set; }
    public string? UnityVersion { get; set; }
    public bool IsPrimary { get; set; } = true;
    public DateTime CreatedAt { get; set; }

    public Asset Asset { get; set; } = null!;
}
