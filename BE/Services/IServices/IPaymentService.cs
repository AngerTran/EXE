using Exe.DTOs.Billing;
using Exe.DTOs.Common;

namespace Exe.Services.IServices;

public interface IPaymentService
{
    Task<PagedResponse<PaymentResponse>> ListMyPaymentsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<PaymentResponse?> GetMyPaymentAsync(Guid userId, Guid paymentId, CancellationToken cancellationToken = default);
    Task<PaymentResponse?> GetByOrderIdAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default);
    Task<CreatePaymentResponse> CreatePaymentForOrderAsync(
        Guid userId,
        CreatePaymentRequest request,
        CancellationToken cancellationToken = default);
    Task<PaymentResponse?> CancelPaymentAsync(
        Guid userId,
        Guid paymentId,
        CancellationToken cancellationToken = default);
}
