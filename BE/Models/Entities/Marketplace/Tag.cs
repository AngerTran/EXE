namespace Exe.Models.Entities;

public class Tag
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public int UsageCount { get; set; }
    public DateTime CreatedAt { get; set; }

    public TagGroup Group { get; set; } = null!;
    public ICollection<AssetTag> AssetTags { get; set; } = [];
}
