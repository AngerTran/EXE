namespace Exe.DTOs.Notification;

public record NotificationResponse(
    Guid Id,
    string Type,
    string Category,
    string Title,
    string? Description,
    string? ActionUrl,
    string? ReferenceType,
    Guid? ReferenceId,
    bool Read,
    DateTime CreatedAt);

public record NotificationUnreadCountResponse(int Count);
