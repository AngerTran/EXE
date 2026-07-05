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
    IReadOnlyList<OrderItemResponse> Items,
    Guid? PaymentId = null,
    string? PaymentRedirectUrl = null,
    Guid? UserId = null,
    string? UserEmail = null,
    string? UserName = null,
    DateTime? TransferReportedAt = null);

public record OrdersSummaryResponse(
    int TotalOrders,
    long TotalSpentVnd,
    int CompletedOrders,
    int PendingOrders);

public record CreateSubscriptionOrderRequest(
    [Required] Guid PlanId,
    [Required] string PaymentMethod);

public record CreateAssetOrderRequest(
    string? PaymentMethod = null,
    bool UseSubscriptionFreeAssets = false,
    IReadOnlyList<Guid>? AssetIds = null);

public record CreateCreditPackOrderRequest(
    [Required] string PackId,
    [Required] string PaymentMethod);

public record UpdateOrderStatusRequest(
    [Required] OrderStatus Status);
