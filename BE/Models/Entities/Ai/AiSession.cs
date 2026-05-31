namespace Exe.Models.Entities;

public class AiSession
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = "Phiên mới";
    public string? ModelUsed { get; set; }
    public int TotalTokens { get; set; }
    public int TotalXuUsed { get; set; }
    public bool IsArchived { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Profile User { get; set; } = null!;
    public ICollection<AiMessage> Messages { get; set; } = [];
}
