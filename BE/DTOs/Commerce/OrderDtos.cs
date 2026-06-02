using System.ComponentModel.DataAnnotations;
using Exe.Models;

namespace Exe.DTOs.Commerce;

public record OrderItemResponse(
    Guid Id,
    Guid? AssetId,
    Guid? PlanId,
    string ItemName,
    long UnitPriceVnd,
    short Quantity,
    long LineTotalVnd);

public record OrderResponse(
    Guid Id,
    string OrderCode,
    string OrderType,
    string Status,
    long SubtotalVnd,
    long DiscountVnd,
    long TotalVnd,
    int TotalXu,
    DateTime? CompletedAt,
    DateTime CreatedAt,
    IReadOnlyList<OrderItemResponse> Items);

public record CreateSubscriptionOrderRequest(
    [Required] Guid PlanId,
    [Required] string PaymentMethod);

public record CreateAssetOrderRequest(
    [Required] string PaymentMethod,
    bool UseSubscriptionFreeAssets = true,
    IReadOnlyList<Guid>? AssetIds = null);

public record UpdateOrderStatusRequest(
    [Required] OrderStatus Status);
