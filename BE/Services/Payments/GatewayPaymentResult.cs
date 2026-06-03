namespace Exe.Services.Payments;

public sealed record GatewayPaymentResult(
    string PayUrl,
    string GatewayRef,
    string? RawResponse = null);
