using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Commerce;

public record CartAssetPreview(
    Guid Id,
    string Title,
    string? ThumbnailUrl,
    string CategoryName,
    string PriceType,
    long PriceVnd,
    bool IsFree);

public record CartItemResponse(
    Guid Id,
    Guid AssetId,
    short Quantity,
    CartAssetPreview Asset,
    long LineTotalVnd);

public record CartResponse(
    IReadOnlyList<CartItemResponse> Items,
    long SubtotalVnd,
    int ItemCount);

public record AddCartItemRequest(
    [Required] Guid AssetId,
    [Range(1, 100)] short Quantity = 1);

public record UpdateCartItemRequest(
    [Range(1, 100)] short Quantity);
