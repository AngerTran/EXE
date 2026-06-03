using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Services.Payments;

public interface IPaymentGateway
{
    PaymentMethod Method { get; }
    bool IsAvailable { get; }
    Task<GatewayPaymentResult> CreatePaymentAsync(
        Payment payment,
        Order order,
        string ipnUrl,
        string returnUrl,
        CancellationToken cancellationToken = default);
}
