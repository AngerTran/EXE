using Exe.Data;
using Exe.DTOs.Common;
using Microsoft.EntityFrameworkCore;
using NotificationEntity = Exe.Models.Entities.Notification;

namespace Exe.Repositories.Notification;

public class NotificationRepository(AppDbContext db) : INotificationRepository
{
    private IQueryable<NotificationEntity> ForUser(Guid userId) =>
        db.Notifications.Where(n => n.UserId == userId);

    public async Task<(IReadOnlyList<NotificationEntity> Items, int Total)> ListAsync(
        Guid userId,
        PagedQuery query,
        bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        var q = ForUser(userId).AsNoTracking();
        if (unreadOnly)
            q = q.Where(n => n.ReadAt == null);

        var total = await q.CountAsync(cancellationToken);
        var items = await q
            .OrderByDescending(n => n.CreatedAt)
            .Skip(query.Skip)
            .Take(query.NormalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public Task<int> CountUnreadAsync(Guid userId, CancellationToken cancellationToken = default) =>
        ForUser(userId).CountAsync(n => n.ReadAt == null, cancellationToken);

    public Task<NotificationEntity?> GetByIdAsync(
        Guid userId,
        Guid id,
        CancellationToken cancellationToken = default) =>
        ForUser(userId).FirstOrDefaultAsync(n => n.Id == id, cancellationToken);

    public async Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await db.Notifications
            .Where(n => n.UserId == userId && n.ReadAt == null)
            .ExecuteUpdateAsync(
                s => s.SetProperty(n => n.ReadAt, now),
                cancellationToken);
    }

    public async Task<bool> MarkReadAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var notification = await GetByIdAsync(userId, id, cancellationToken);
        if (notification is null)
            return false;

        if (notification.ReadAt is not null)
            return true;

        notification.ReadAt = DateTime.UtcNow;
        return true;
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var notification = await GetByIdAsync(userId, id, cancellationToken);
        if (notification is null)
            return false;

        db.Notifications.Remove(notification);
        return true;
    }

    public async Task<int> DeleteAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await ForUser(userId).ToListAsync(cancellationToken);
        if (items.Count == 0)
            return 0;

        db.Notifications.RemoveRange(items);
        return items.Count;
    }
}
