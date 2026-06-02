using Exe.DTOs.Billing;

namespace Exe.Services.IServices;

public interface ISubscriptionPlanService
{
    Task<SubscriptionPlanListResponse> GetPlansAsync(bool activeOnly = true, CancellationToken cancellationToken = default);
    Task<SubscriptionPlanResponse?> GetByIdAsync(Guid id, bool activeOnly = true, CancellationToken cancellationToken = default);
    Task<SubscriptionPlanResponse?> GetBySlugAsync(string slug, bool activeOnly = true, CancellationToken cancellationToken = default);
}
