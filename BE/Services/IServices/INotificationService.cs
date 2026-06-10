using Exe.DTOs.Common;
using Exe.DTOs.Notification;

namespace Exe.Services.IServices;

public interface INotificationService
{
    Task<PagedResponse<NotificationResponse>> ListAsync(
        Guid userId,
        PagedQuery query,
        bool unreadOnly = false,
        CancellationToken cancellationToken = default);

    Task<NotificationUnreadCountResponse> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> MarkReadAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);

    Task<int> DeleteAllAsync(Guid userId, CancellationToken cancellationToken = default);
}
