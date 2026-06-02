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
