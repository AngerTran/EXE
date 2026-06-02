namespace Exe.DTOs.Billing;

/// <summary>Danh sách gói dịch vụ (Pricing page).</summary>
public record SubscriptionPlanListResponse(IReadOnlyList<SubscriptionPlanResponse> Data);

/// <summary>Chi tiết một gói subscription.</summary>
public record SubscriptionPlanResponse(
    Guid Id,
    string Slug,
    string Name,
    string? Description,
    long PriceVnd,
    int? CreditsMonthly,
    bool IsUnlimited,
    IReadOnlyList<string> Features,
    short SortOrder,
    bool IsActive);
