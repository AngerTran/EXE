namespace Exe.Models.Entities;

public class AssetReview
{
    public Guid Id { get; set; }
    public Guid AssetId { get; set; }
    public Guid UserId { get; set; }
    public short Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Asset Asset { get; set; } = null!;
    public Profile User { get; set; } = null!;
}
