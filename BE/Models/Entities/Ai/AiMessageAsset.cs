namespace Exe.Models.Entities;

public class AiMessageAsset
{
    public Guid MessageId { get; set; }
    public Guid AssetId { get; set; }
    public decimal? RelevanceScore { get; set; }
    public short SortOrder { get; set; }

    public AiMessage Message { get; set; } = null!;
    public Asset Asset { get; set; } = null!;
}
