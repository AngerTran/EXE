using System.ComponentModel.DataAnnotations;

namespace Exe.DTOs.Billing;

public record PaymentResponse(
    Guid Id,
    Guid? OrderId,
    long AmountVnd,
    string Method,
    string Status,
    string? GatewayRef,
    DateTime? PaidAt,
    DateTime CreatedAt);

public record PaymentWebhookRequest(
    string? TransactionId,
    string? Status);

public record CreatePaymentRequest(
    [Required] Guid OrderId,
    [Required] string PaymentMethod);

public record CreatePaymentResponse(
    Guid PaymentId,
    Guid OrderId,
    long AmountVnd,
    string Method,
    string Status,
    /// <summary>Trang FE sau khi cổng redirect về.</summary>
    string? RedirectUrl,
    /// <summary>URL mở MoMo/VNPay — FE: window.location.href = payUrl.</summary>
    string? PayUrl);
