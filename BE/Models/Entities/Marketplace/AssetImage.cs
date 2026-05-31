namespace Exe.Models.Entities;

public class AssetImage
{
    public Guid Id { get; set; }
    public Guid AssetId { get; set; }
    public string StoragePath { get; set; } = null!;
    public string? AltText { get; set; }
    public short SortOrder { get; set; }
    public bool IsThumbnail { get; set; }
    public DateTime CreatedAt { get; set; }

    public Asset Asset { get; set; } = null!;
}
