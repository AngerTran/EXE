namespace Exe.Models.Entities;

public class AssetTag
{
    public Guid AssetId { get; set; }
    public Guid TagId { get; set; }

    public Asset Asset { get; set; } = null!;
    public Tag Tag { get; set; } = null!;
}
