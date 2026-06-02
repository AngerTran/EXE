namespace Exe.DTOs.Billing;

public record SubscriptionMeResponse(
    string? PlanSlug,
    string? PlanName,
    string Status,
    DateTime? StartedAt,
    DateTime? ExpiredAt,
    bool IsUnlimited,
    int? CreditsMonthly);

public record SubscriptionHistoryItemResponse(
    Guid Id,
    string PlanSlug,
    string PlanName,
    string Status,
    DateTime StartedAt,
    DateTime? ExpiredAt);
