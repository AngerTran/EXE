namespace Exe.Models.Entities;

public class Bookmark
{
    public Guid UserId { get; set; }
    public Guid AssetId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public Asset Asset { get; set; } = null!;
}
