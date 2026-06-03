using Exe.Models;

namespace Exe.Services;

internal static class PaymentMethodParser
{
    public static PaymentMethod Parse(string paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod))
            throw new ArgumentException("Payment method is required.");

        if (Enum.TryParse<PaymentMethod>(paymentMethod, true, out var parsed))
            return parsed;

        var normalized = paymentMethod.Trim().ToLowerInvariant().Replace("-", "_");
        return normalized switch
        {
            "momo" or "mock" => PaymentMethod.Momo,
            "vnpay" => PaymentMethod.Vnpay,
            "bank" or "bank_transfer" or "banktransfer" => PaymentMethod.BankTransfer,
            "card" or "credit_card" or "creditcard" => PaymentMethod.CreditCard,
            _ => throw new ArgumentException($"Unsupported payment method '{paymentMethod}'.")
        };
    }
}
