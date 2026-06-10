using Exe.DTOs.Common;
using Exe.DTOs.Notification;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Notification;
using Exe.Services.IServices;
using NotificationEntity = Exe.Models.Entities.Notification;

namespace Exe.Services;

public class NotificationService(
    INotificationRepository notificationRepository,
    IUnitOfWork unitOfWork) : INotificationService
{
    public async Task<PagedResponse<NotificationResponse>> ListAsync(
        Guid userId,
        PagedQuery query,
        bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await notificationRepository.ListAsync(
            userId, query, unreadOnly, cancellationToken);

        var data = items.Select(Map).ToList();
        return new PagedResponse<NotificationResponse>(
            data,
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<NotificationUnreadCountResponse> GetUnreadCountAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var count = await notificationRepository.CountUnreadAsync(userId, cancellationToken);
        return new NotificationUnreadCountResponse(count);
    }

    public Task<int> MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default) =>
        notificationRepository.MarkAllReadAsync(userId, cancellationToken);

    public async Task<bool> MarkReadAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var ok = await notificationRepository.MarkReadAsync(userId, id, cancellationToken);
        if (!ok)
            return false;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(Guid userId, Guid id, CancellationToken cancellationToken = default)
    {
        var ok = await notificationRepository.DeleteAsync(userId, id, cancellationToken);
        if (!ok)
            return false;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> DeleteAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var deleted = await notificationRepository.DeleteAllAsync(userId, cancellationToken);
        if (deleted > 0)
            await unitOfWork.SaveChangesAsync(cancellationToken);
        return deleted;
    }

    private static NotificationResponse Map(NotificationEntity n) =>
        new(
            n.Id,
            LevelToType(n.Level),
            CategoryToString(n.Category),
            n.Title,
            n.Body,
            n.ActionUrl,
            n.ReferenceType,
            n.ReferenceId,
            n.ReadAt is not null,
            n.CreatedAt);

    private static string LevelToType(NotificationLevel level) =>
        level.ToString().ToLowerInvariant();

    private static string CategoryToString(NotificationCategory category) =>
        category switch
        {
            NotificationCategory.Ai => "ai",
            _ => category.ToString().ToLowerInvariant()
        };
}
