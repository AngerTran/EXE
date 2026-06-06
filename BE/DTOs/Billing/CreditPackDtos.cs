using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Billing;

public record CreditPackResponse(
    string Id,
    string Name,
    int Credits,
    long PriceVnd,
    short? DiscountPercent,
    short SortOrder,
    bool IsActive);

public record CreditPackListResponse(IReadOnlyList<CreditPackResponse> Data);

public record AdminCreateCreditPackRequest(
    [Required][MaxLength(32)] string Id,
    [Required][MaxLength(120)] string Name,
    [Range(1, int.MaxValue)] int Credits,
    [Range(1, long.MaxValue)] long PriceVnd,
    short? DiscountPercent = null,
    short SortOrder = 0,
    bool IsActive = true);

public record AdminUpdateCreditPackRequest(
    string? Name = null,
    int? Credits = null,
    long? PriceVnd = null,
    short? DiscountPercent = null,
    short? SortOrder = null,
    bool? IsActive = null);
