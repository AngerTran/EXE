using Exe.DTOs.Common;
using NotificationEntity = Exe.Models.Entities.Notification;

namespace Exe.Repositories.Notification;

public interface INotificationRepository
{
    Task<(IReadOnlyList<NotificationEntity> Items, int Total)> ListAsync(
        Guid userId,
        PagedQuery query,
        bool unreadOnly = false,
        CancellationToken cancellationToken = default);

    Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<NotificationEntity?> GetByIdAsync(
        Guid userId,
        Guid id,
        CancellationToken cancellationToken = default);

    Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> MarkReadAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default);

    Task<int> DeleteAllAsync(Guid userId, CancellationToken cancellationToken = default);
}
