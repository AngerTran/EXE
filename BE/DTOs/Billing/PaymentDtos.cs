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
    // Trang FE sau khi user hoàn tất bước thanh toán.
    string? RedirectUrl,
    // URL điều hướng nội bộ (chuyển khoản).
    string? PayUrl);
