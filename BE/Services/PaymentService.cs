using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Repositories.Commerce;
using Exe.Services.IServices;

namespace Exe.Services;

public class PaymentService(
    IPaymentRepository paymentRepository,
    IOrderRepository orderRepository,
    OrderFulfillmentService fulfillmentService,
    IUnitOfWork unitOfWork) : IPaymentService
{
    public async Task<PagedResponse<PaymentResponse>> ListMyPaymentsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await paymentRepository.ListForUserAsync(
            userId,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);

        return new PagedResponse<PaymentResponse>(
            items.Select(MapPayment).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<PaymentResponse?> GetMyPaymentAsync(
        Guid userId,
        Guid paymentId,
        CancellationToken cancellationToken = default)
    {
        var payment = await paymentRepository.GetByIdForUserAsync(paymentId, userId, cancellationToken);
        return payment is null ? null : MapPayment(payment);
    }

    public async Task HandleWebhookAsync(
        string provider,
        PaymentWebhookRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.TransactionId))
            throw new ArgumentException("transactionId is required.");

        if (!Guid.TryParse(request.TransactionId, out var paymentId))
            throw new ArgumentException("transactionId must be a valid payment id.");

        var payment = await paymentRepository.GetByIdForUpdateAsync(paymentId, cancellationToken)
            ?? throw new ArgumentException("Payment not found.");

        if (!string.Equals(payment.Method.ToString(), provider, StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Webhook provider mismatch.");

        var status = request.Status?.Trim().ToLowerInvariant();
        if (status is "completed" or "success" or "paid")
        {
            if (payment.Status != PaymentStatus.Completed)
            {
                payment.Status = PaymentStatus.Completed;
                payment.PaidAt = DateTime.UtcNow;
                payment.UpdatedAt = DateTime.UtcNow;

                if (payment.OrderId.HasValue)
                {
                    var order = await orderRepository.GetByIdForUpdateAsync(payment.OrderId.Value, cancellationToken);
                    if (order is not null)
                        await fulfillmentService.FulfillOrderAsync(order, cancellationToken);
                }
                else
                {
                    await unitOfWork.SaveChangesAsync(cancellationToken);
                }
            }
            return;
        }

        if (status is "failed" or "cancelled")
        {
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return;
        }

        throw new ArgumentException("Unsupported payment status.");
    }

    private static PaymentResponse MapPayment(Models.Entities.Payment p) =>
        new(
            p.Id,
            p.OrderId,
            p.AmountVnd,
            p.Method.ToString().ToLowerInvariant(),
            p.Status.ToString().ToLowerInvariant(),
            p.GatewayRef,
            p.PaidAt,
            p.CreatedAt);
}
