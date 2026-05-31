namespace Exe.Models.Entities;

public class TagGroup
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = null!;
    public string Label { get; set; } = null!;
    public short SortOrder { get; set; }

    public ICollection<Tag> Tags { get; set; } = [];
}
