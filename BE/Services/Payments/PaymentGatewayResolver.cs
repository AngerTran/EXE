using Exe.Models;

namespace Exe.Services.Payments;

public class PaymentGatewayResolver(IEnumerable<IPaymentGateway> gateways)
{
    public IPaymentGateway? Get(PaymentMethod method) =>
        gateways.FirstOrDefault(g => g.Method == method && g.IsAvailable);
}
