using Exe.Configuration;
using Exe.DTOs.Common;
using Exe.DTOs.Commerce;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Repositories.Commerce;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Profile;
using Exe.Services.IServices;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class OrderService(
    IOrderRepository orderRepository,
    IAssetRepository assetRepository,
    ICartRepository cartRepository,
    ISubscriptionPlanRepository subscriptionPlanRepository,
    IUserAssetRepository userAssetRepository,
    IPaymentRepository paymentRepository,
    IProfileRepository profileRepository,
    OrderFulfillmentService fulfillmentService,
    IUnitOfWork unitOfWork,
    IOptions<PaymentOptions> paymentOptions) : IOrderService
{
    private readonly PaymentOptions _paymentOptions = paymentOptions.Value;

    public async Task<PagedResponse<OrderResponse>> ListMyOrdersAsync(
        Guid userId,
        OrderStatus? status,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await orderRepository.ListForUserAsync(
            userId,
            status,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);

        return new PagedResponse<OrderResponse>(
            items.Select(MapOrder).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<PagedResponse<OrderResponse>> ListAllOrdersAsync(
        Guid adminUserId,
        Guid? userId,
        OrderStatus? status,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        if (await profileRepository.GetRoleAsync(adminUserId, cancellationToken) != UserRole.Admin)
            throw new ForbiddenException("Admin access required.");

        var (items, total) = await orderRepository.ListAllAsync(
            userId,
            status,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);

        return new PagedResponse<OrderResponse>(
            items.Select(MapOrder).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<OrderResponse?> GetMyOrderAsync(Guid userId, Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetByIdForUserAsync(orderId, userId, cancellationToken);
        return order is null ? null : MapOrder(order);
    }

    public async Task<OrderResponse> CreateSubscriptionOrderAsync(
        Guid userId,
        CreateSubscriptionOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        var plan = await subscriptionPlanRepository.GetByIdAsync(request.PlanId, true, cancellationToken)
            ?? throw new ArgumentException("Subscription plan not found.");

        var now = DateTime.UtcNow;
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = GenerateOrderCode("SUB"),
            UserId = userId,
            OrderType = OrderType.Subscription,
            Status = OrderStatus.Pending,
            SubtotalVnd = plan.PriceVnd,
            DiscountVnd = 0,
            TotalVnd = plan.PriceVnd,
            TotalXu = 0,
            CreatedAt = now,
            UpdatedAt = now
        };

        var item = new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            PlanId = plan.Id,
            ItemName = plan.Name,
            UnitPrice = plan.PriceVnd,
            Quantity = 1,
            LineTotal = plan.PriceVnd,
            CreatedAt = now,
            Plan = plan
        };
        order.Items = [item];
        orderRepository.Add(order);
        orderRepository.AddItems(order.Items);

        var method = PaymentMethodParser.Parse(request.PaymentMethod);
        var payment = new Payment
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

        if (_paymentOptions.AutoCompleteOnCreate)
        {
            payment.Status = PaymentStatus.Completed;
            payment.PaidAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;
            await fulfillmentService.FulfillOrderAsync(order, cancellationToken);
        }

        var saved = await orderRepository.GetByIdForUserAsync(order.Id, userId, cancellationToken) ?? order;
        return MapOrder(saved);
    }

    public async Task<OrderResponse> CreateAssetOrderAsync(
        Guid userId,
        CreateAssetOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        var requestedAssetIds = request.AssetIds?.Distinct().ToList();
        List<Asset> assets;

        if (requestedAssetIds is { Count: > 0 })
        {
            assets = [];
            foreach (var id in requestedAssetIds)
            {
                var asset = await assetRepository.GetApprovedByIdAsync(id, cancellationToken);
                if (asset is null)
                    throw new ArgumentException($"Asset '{id}' not found.");
                assets.Add(asset);
            }
        }
        else
        {
            var cartItems = await cartRepository.GetItemsAsync(userId, cancellationToken);
            assets = cartItems.Select(c => c.Asset).ToList();
            if (assets.Count == 0)
                throw new ArgumentException("Cart is empty.");
        }

        assets = assets
            .Where(a => a.PriceType == PriceType.Paid && a.DeletedAt == null && a.Status == AssetStatus.Approved)
            .ToList();
        if (assets.Count == 0)
            throw new ArgumentException("No paid assets available for checkout.");

        var ownedIds = new HashSet<Guid>();
        foreach (var asset in assets.ToList())
        {
            if (await userAssetRepository.ExistsAsync(userId, asset.Id, cancellationToken))
                ownedIds.Add(asset.Id);
        }

        assets = assets.Where(a => !ownedIds.Contains(a.Id)).ToList();
        if (assets.Count == 0)
            throw new ArgumentException("All selected assets are already owned.");

        var now = DateTime.UtcNow;
        var subtotal = assets.Sum(a => a.PriceVnd);
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderCode = GenerateOrderCode("AST"),
            UserId = userId,
            OrderType = OrderType.Asset,
            Status = OrderStatus.Pending,
            SubtotalVnd = subtotal,
            DiscountVnd = 0,
            TotalVnd = subtotal,
            TotalXu = 0,
            CreatedAt = now,
            UpdatedAt = now
        };

        var items = assets.Select(a => new OrderItem
        {
            Id = Guid.NewGuid(),
            OrderId = order.Id,
            AssetId = a.Id,
            ItemName = a.Title,
            UnitPrice = a.PriceVnd,
            Quantity = 1,
            LineTotal = a.PriceVnd,
            CreatedAt = now,
            Asset = a
        }).ToList();
        order.Items = items;

        orderRepository.Add(order);
        orderRepository.AddItems(items);

        var method = PaymentMethodParser.Parse(request.PaymentMethod);
        var payment = new Payment
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

        if (requestedAssetIds is null || requestedAssetIds.Count == 0)
        {
            var cartItems = await cartRepository.GetItemsAsync(userId, cancellationToken);
            var toRemove = cartItems.Where(c => assets.Select(a => a.Id).Contains(c.AssetId)).ToList();
            if (toRemove.Count > 0)
                cartRepository.RemoveRange(toRemove);
        }

        if (_paymentOptions.AutoCompleteOnCreate)
        {
            payment.Status = PaymentStatus.Completed;
            payment.PaidAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;
            await fulfillmentService.FulfillOrderAsync(order, cancellationToken);
        }
        else
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var saved = await orderRepository.GetByIdForUserAsync(order.Id, userId, cancellationToken) ?? order;
        return MapOrder(saved);
    }

    public async Task<OrderResponse?> AdminUpdateStatusAsync(
        Guid adminUserId,
        Guid orderId,
        UpdateOrderStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await profileRepository.GetRoleAsync(adminUserId, cancellationToken) != UserRole.Admin)
            throw new ForbiddenException("Admin access required.");

        var order = await orderRepository.GetByIdForUpdateAsync(orderId, cancellationToken);
        if (order is null)
            return null;

        order.Status = request.Status;
        if (request.Status == OrderStatus.Completed)
            order.CompletedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MapOrder(order);
    }

    private static OrderResponse MapOrder(Order o) =>
        new(
            o.Id,
            o.OrderCode,
            o.OrderType.ToString().ToLowerInvariant(),
            o.Status.ToString().ToLowerInvariant(),
            o.SubtotalVnd,
            o.DiscountVnd,
            o.TotalVnd,
            o.TotalXu,
            o.CompletedAt,
            o.CreatedAt,
            o.Items.Select(i => new OrderItemResponse(
                i.Id,
                i.AssetId,
                i.PlanId,
                i.ItemName,
                i.UnitPrice,
                i.Quantity,
                i.LineTotal)).ToList());

    private static string GenerateOrderCode(string prefix) =>
        $"{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
}
