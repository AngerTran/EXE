using Exe.DTOs.Billing;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Services.IServices;

namespace Exe.Services;

public class SubscriptionUserService(
    ISubscriptionRepository subscriptionRepository,
    IUnitOfWork unitOfWork) : ISubscriptionUserService
{
    public async Task<SubscriptionMeResponse?> GetMySubscriptionAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sub = await subscriptionRepository.GetActiveWithPlanAsync(userId, cancellationToken);
        if (sub is null)
            return null;

        return new SubscriptionMeResponse(
            sub.Plan.Slug.ToString().ToLowerInvariant(),
            sub.Plan.Name,
            sub.Status.ToString().ToLowerInvariant(),
            sub.StartedAt,
            sub.ExpiredAt,
            sub.Plan.IsUnlimited,
            sub.Plan.CreditsMonthly);
    }

    public async Task<IReadOnlyList<SubscriptionHistoryItemResponse>> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var items = await subscriptionRepository.GetHistoryAsync(userId, cancellationToken);
        return items.Select(s => new SubscriptionHistoryItemResponse(
            s.Id,
            s.Plan.Slug.ToString().ToLowerInvariant(),
            s.Plan.Name,
            s.Status.ToString().ToLowerInvariant(),
            s.StartedAt,
            s.ExpiredAt)).ToList();
    }

    public async Task<bool> CancelMySubscriptionAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var activeSubs = await subscriptionRepository.GetActiveForUpdateAsync(userId, cancellationToken);
        if (activeSubs.Count == 0)
            return false;

        foreach (var sub in activeSubs)
        {
            sub.Status = SubscriptionStatus.Cancelled;
            sub.CancelledAt = DateTime.UtcNow;
            sub.ExpiredAt ??= DateTime.UtcNow;
            sub.UpdatedAt = DateTime.UtcNow;
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }
}
