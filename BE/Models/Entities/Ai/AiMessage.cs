using Exe.Models;

namespace Exe.Models.Entities;

public class AiMessage
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public AiMessageRole Role { get; set; }
    public string Content { get; set; } = null!;
    public int TokenUsed { get; set; }
    public int XuCharged { get; set; }
    public string Metadata { get; set; } = "{}";
    public DateTime CreatedAt { get; set; }

    public AiSession Session { get; set; } = null!;
    public ICollection<AiMessageAsset> SuggestedAssets { get; set; } = [];
}
