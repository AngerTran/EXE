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

public record CreatePaymentRequest(
    [Required] Guid OrderId,
    [Required] string PaymentMethod);

public record CreatePaymentResponse(
    Guid PaymentId,
    Guid OrderId,
    long AmountVnd,
    string Method,
    string Status,
    /// <summary>Trang FE sau khi user hoàn tất bước thanh toán.</summary>
    string? RedirectUrl,
    /// <summary>URL điều hướng nội bộ (chuyển khoản).</summary>
    string? PayUrl);
