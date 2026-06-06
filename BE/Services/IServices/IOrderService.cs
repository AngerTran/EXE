using Exe.DTOs.Common;
using Exe.DTOs.Commerce;
using Exe.Models;

namespace Exe.Services.IServices;

public interface IOrderService
{
    Task<PagedResponse<OrderResponse>> ListMyOrdersAsync(
        Guid userId,
        OrderStatus? status,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<PagedResponse<OrderResponse>> ListAllOrdersAsync(
        Guid adminUserId,
        Guid? userId,
        OrderStatus? status,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<OrderResponse?> GetMyOrderAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default);
    Task<OrdersSummaryResponse> GetMyOrdersSummaryAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<OrderResponse> CreateSubscriptionOrderAsync(
        Guid userId,
        CreateSubscriptionOrderRequest request,
        CancellationToken cancellationToken = default);
    Task<OrderResponse> CreateAssetOrderAsync(
        Guid userId,
        CreateAssetOrderRequest request,
        CancellationToken cancellationToken = default);
    Task<OrderResponse> CreateCreditPackOrderAsync(
        Guid userId,
        CreateCreditPackOrderRequest request,
        CancellationToken cancellationToken = default);
    Task<OrderResponse?> AdminUpdateStatusAsync(
        Guid adminUserId,
        Guid orderId,
        UpdateOrderStatusRequest request,
        CancellationToken cancellationToken = default);
}
