using Exe.Configuration;
using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Repositories.Commerce;
using Exe.Services.IServices;
using Exe.Services.Payments;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class PaymentService(
    IPaymentRepository paymentRepository,
    IOrderRepository orderRepository,
    OrderFulfillmentService fulfillmentService,
    IUnitOfWork unitOfWork,
    PaymentGatewayResolver gatewayResolver,
    IOptions<PaymentOptions> paymentOptions,
    IOptions<MomoOptions> momoOptions,
    IOptions<VnpayOptions> vnpayOptions) : IPaymentService
{
    private readonly PaymentOptions _paymentOptions = paymentOptions.Value;
    private readonly MomoOptions _momo = momoOptions.Value;
    private readonly VnpayOptions _vnpay = vnpayOptions.Value;

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
                return await BuildCreateResponseAsync(existing, order, cancellationToken);
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

        var gateway = gatewayResolver.Get(method);
        if (gateway is not null)
        {
            var ipnUrl = BuildIpnUrl(method);
            var returnUrl = BuildFeReturnUrl(order.Id, payment.Id);
            var result = await gateway.CreatePaymentAsync(payment, order, ipnUrl, returnUrl, cancellationToken);
            payment.GatewayRef = result.GatewayRef;
            payment.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return MapCreateResponse(payment, order, returnUrl, result.PayUrl);
        }

        if (method is PaymentMethod.Momo or PaymentMethod.Vnpay)
        {
            throw new InvalidOperationException(
                $"{method} gateway is not configured. Set Momo/Vnpay section in appsettings or use Payment:AutoCompleteOnCreate for dev.");
        }

        var feReturn = BuildFeReturnUrl(order.Id, payment.Id);
        var templateUrl = string.Format(_paymentOptions.PaymentRedirectUrlTemplate, payment.Id);
        return MapCreateResponse(payment, order, feReturn, templateUrl);
    }

    private async Task<CreatePaymentResponse> BuildCreateResponseAsync(
        Models.Entities.Payment payment,
        Models.Entities.Order order,
        CancellationToken cancellationToken)
    {
        var gateway = gatewayResolver.Get(payment.Method);
        if (gateway is not null && string.IsNullOrEmpty(payment.GatewayRef))
        {
            var result = await gateway.CreatePaymentAsync(
                payment,
                order,
                BuildIpnUrl(payment.Method),
                BuildFeReturnUrl(order.Id, payment.Id),
                cancellationToken);
            payment.GatewayRef = result.GatewayRef;
            payment.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return MapCreateResponse(payment, order, BuildFeReturnUrl(order.Id, payment.Id), result.PayUrl);
        }

        return MapCreateResponse(
            payment,
            order,
            BuildFeReturnUrl(order.Id, payment.Id),
            payment.Method is PaymentMethod.Momo or PaymentMethod.Vnpay ? null : string.Format(_paymentOptions.PaymentRedirectUrlTemplate, payment.Id));
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

    public Task HandleWebhookAsync(
        string provider,
        PaymentWebhookRequest request,
        CancellationToken cancellationToken = default) =>
        CompletePaymentByIdAsync(request.TransactionId, request.Status, cancellationToken);

    public async Task HandleMomoIpnAsync(MomoIpnRequest request, CancellationToken cancellationToken = default)
    {
        if (!_momo.IsConfigured)
            throw new InvalidOperationException("MoMo is not configured.");

        if (string.IsNullOrWhiteSpace(request.OrderId))
            throw new ArgumentException("Invalid MoMo IPN payload.");

        // orderId khi tạo payment = Payment.Id (GUID)
        if (!Guid.TryParse(request.OrderId, out var paymentId))
            throw new ArgumentException("Invalid MoMo orderId.");

        var payment = await paymentRepository.GetByIdForUpdateAsync(paymentId, cancellationToken)
            ?? throw new ArgumentException("Payment not found.");

        if (payment.AmountVnd != request.Amount)
            throw new ArgumentException("MoMo IPN amount mismatch.");

        var status = request.ResultCode == 0 ? "completed" : "failed";
        await CompletePaymentByIdAsync(paymentId.ToString(), status, cancellationToken);
    }

    public async Task HandleVnpayIpnAsync(IQueryCollection query, CancellationToken cancellationToken = default)
    {
        if (!_vnpay.IsConfigured)
            throw new InvalidOperationException("VNPay is not configured.");

        var dict = query.ToDictionary(kv => kv.Key, kv => kv.Value.ToString() ?? "", StringComparer.OrdinalIgnoreCase);
        if (!VnpayPaymentGateway.TryVerifyReturnUrl(dict, _vnpay.HashSecret, out var txnRef, out var success))
            throw new ArgumentException("Invalid VNPay IPN signature.");

        if (!Guid.TryParseExact(txnRef, "N", out var paymentId))
            throw new ArgumentException("Invalid vnp_TxnRef.");

        await CompletePaymentByIdAsync(paymentId.ToString(), success ? "completed" : "failed", cancellationToken);
    }

    private async Task CompletePaymentByIdAsync(
        string? transactionId,
        string? status,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(transactionId))
            throw new ArgumentException("transactionId is required.");

        if (!Guid.TryParse(transactionId, out var paymentId))
            throw new ArgumentException("transactionId must be a valid payment id.");

        var payment = await paymentRepository.GetByIdForUpdateAsync(paymentId, cancellationToken)
            ?? throw new ArgumentException("Payment not found.");

        var normalized = status?.Trim().ToLowerInvariant();
        if (normalized is "completed" or "success" or "paid")
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

        if (normalized is "failed" or "cancelled")
        {
            payment.Status = PaymentStatus.Failed;
            payment.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return;
        }

        throw new ArgumentException("Unsupported payment status.");
    }

    private string BuildIpnUrl(PaymentMethod method)
    {
        var baseUrl = _paymentOptions.ApiPublicBaseUrl.TrimEnd('/');
        if (string.IsNullOrEmpty(baseUrl))
            throw new InvalidOperationException(
                "Payment:ApiPublicBaseUrl is required for MoMo/VNPay (use ngrok URL when developing locally).");

        return method switch
        {
            PaymentMethod.Momo => $"{baseUrl}/api/v1/payments/webhook/momo",
            PaymentMethod.Vnpay => $"{baseUrl}/api/v1/payments/webhook/vnpay",
            _ => throw new ArgumentException("Unsupported gateway method.")
        };
    }

    private string BuildFeReturnUrl(Guid orderId, Guid paymentId)
    {
        var url = _paymentOptions.FeReturnUrl.TrimEnd('/');
        return $"{url}?orderId={orderId}&paymentId={paymentId}";
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
