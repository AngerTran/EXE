using Exe.DTOs.Billing;

namespace Exe.Services.IServices;

public interface ISubscriptionUserService
{
    Task<SubscriptionMeResponse?> GetMySubscriptionAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SubscriptionHistoryItemResponse>> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> CancelMySubscriptionAsync(Guid userId, CancellationToken cancellationToken = default);
}
