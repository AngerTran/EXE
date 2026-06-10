using Exe.Models;

namespace Exe.Models.Entities;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public NotificationLevel Level { get; set; } = NotificationLevel.Info;
    public NotificationCategory Category { get; set; } = NotificationCategory.Account;
    public string Title { get; set; } = null!;
    public string? Body { get; set; }
    public string? ActionUrl { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string Metadata { get; set; } = "{}";
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Profile User { get; set; } = null!;
}
