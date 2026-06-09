using Exe.Configuration;
using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Repositories.Commerce;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class PaymentService(
    IPaymentRepository paymentRepository,
    IOrderRepository orderRepository,
    IUnitOfWork unitOfWork,
    IOptions<PaymentOptions> paymentOptions) : IPaymentService
{
    private readonly PaymentOptions _paymentOptions = paymentOptions.Value;

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

    public async Task<PaymentResponse?> GetByOrderIdAsync(
        Guid userId,
        Guid orderId,
        CancellationToken cancellationToken = default)
    {
        var payment = await paymentRepository.GetByOrderIdForUserAsync(orderId, userId, cancellationToken);
        return payment is null ? null : MapPayment(payment);
    }

    public async Task<CreatePaymentResponse> CreatePaymentForOrderAsync(
        Guid userId,
        CreatePaymentRequest request,
        CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetByIdForUserAsync(request.OrderId, userId, cancellationToken)
            ?? throw new ArgumentException("Order not found.");

        if (order.Status != OrderStatus.Pending)
            throw new ArgumentException("Order is not pending payment.");

        var existing = await paymentRepository.GetByOrderIdForUpdateAsync(order.Id, cancellationToken);
        if (existing is not null)
        {
            if (existing.Status == PaymentStatus.Pending)
                return MapCreateResponseForBank(existing, order);
            throw new ArgumentException("Order already has a completed payment.");
        }

        var method = PaymentMethodParser.Parse(request.PaymentMethod);
        var now = DateTime.UtcNow;
        var payment = new Models.Entities.Payment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrderId = order.Id,
            AmountVnd = order.TotalVnd,
            Method = method,
            Status = PaymentStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };
        paymentRepository.Add(payment);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapCreateResponseForBank(payment, order);
    }

    public async Task<PaymentResponse?> CancelPaymentAsync(
        Guid userId,
        Guid paymentId,
        CancellationToken cancellationToken = default)
    {
        var payment = await paymentRepository.GetByIdForUpdateAsync(paymentId, cancellationToken);
        if (payment is null || payment.UserId != userId)
            return null;

        if (payment.Status != PaymentStatus.Pending)
            throw new InvalidOperationException("Only pending payments can be cancelled.");

        payment.Status = PaymentStatus.Failed;
        payment.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapPayment(payment);
    }

    private string BuildFeReturnUrl(Guid orderId, Guid paymentId)
    {
        var url = _paymentOptions.FeReturnUrl.TrimEnd('/');
        return $"{url}?orderId={orderId}&paymentId={paymentId}";
    }

    private CreatePaymentResponse MapCreateResponseForBank(
        Models.Entities.Payment payment,
        Models.Entities.Order order)
    {
        var feReturn = BuildFeReturnUrl(order.Id, payment.Id);
        var templateUrl = string.Format(_paymentOptions.PaymentRedirectUrlTemplate, payment.Id);
        return MapCreateResponse(payment, order, feReturn, templateUrl);
    }

    private static CreatePaymentResponse MapCreateResponse(
        Models.Entities.Payment payment,
        Models.Entities.Order order,
        string? redirectUrl,
        string? payUrl) =>
        new(
            payment.Id,
            order.Id,
            payment.AmountVnd,
            payment.Method.ToString().ToLowerInvariant(),
            payment.Status.ToString().ToLowerInvariant(),
            redirectUrl,
            payUrl);

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
