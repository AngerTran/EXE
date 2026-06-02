using System.Text.Json;
using Exe.DTOs.Billing;
using Exe.Models;
using Exe.Repositories.Billing;
using Exe.Services.IServices;

namespace Exe.Services;

public class SubscriptionPlanService(ISubscriptionPlanRepository planRepository) : ISubscriptionPlanService
{
    public async Task<SubscriptionPlanListResponse> GetPlansAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var plans = await planRepository.GetPlansAsync(activeOnly, cancellationToken);
        return new SubscriptionPlanListResponse(plans.Select(MapToResponse).ToList());
    }

    public async Task<SubscriptionPlanResponse?> GetByIdAsync(
        Guid id,
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var plan = await planRepository.GetByIdAsync(id, activeOnly, cancellationToken);
        return plan is null ? null : MapToResponse(plan);
    }

    public async Task<SubscriptionPlanResponse?> GetBySlugAsync(
        string slug,
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        if (!Enum.TryParse<SubscriptionTier>(slug, true, out var tier))
            return null;
        var plan = await planRepository.GetBySlugAsync(tier, activeOnly, cancellationToken);
        return plan is null ? null : MapToResponse(plan);
    }

    private static SubscriptionPlanResponse MapToResponse(Models.Entities.SubscriptionPlan plan) =>
        new(
            plan.Id,
            plan.Slug.ToString().ToLowerInvariant(),
            plan.Name,
            plan.Description,
            plan.PriceVnd,
            plan.CreditsMonthly,
            plan.IsUnlimited,
            ParseFeatures(plan.Features),
            plan.SortOrder,
            plan.IsActive);

    private static IReadOnlyList<string> ParseFeatures(string featuresJson)
    {
        if (string.IsNullOrWhiteSpace(featuresJson))
            return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(featuresJson) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }
}
