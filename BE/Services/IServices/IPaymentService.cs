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
    Task HandleWebhookAsync(string provider, PaymentWebhookRequest request, CancellationToken cancellationToken = default);
}
