using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Repositories.Commerce;
using Exe.Repositories.Wallet;

namespace Exe.Services;

public class OrderFulfillmentService(
    IOrderRepository orderRepository,
    IUserAssetRepository userAssetRepository,
    ISubscriptionRepository subscriptionRepository,
    IWalletRepository walletRepository,
    IUnitOfWork unitOfWork)
{
    public async Task FulfillOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        if (order.Status == OrderStatus.Completed)
            return;

        if (order.OrderType == OrderType.Asset)
            await FulfillAssetOrderAsync(order, cancellationToken);

        if (order.OrderType == OrderType.Subscription)
            await FulfillSubscriptionOrderAsync(order, cancellationToken);

        if (order.OrderType == OrderType.CreditPack)
            await FulfillCreditPackOrderAsync(order, cancellationToken);

        order.Status = OrderStatus.Completed;
        order.CompletedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task FulfillAssetOrderAsync(Order order, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var newAssets = new List<UserAsset>();

        foreach (var item in order.Items.Where(i => i.AssetId.HasValue))
        {
            if (await userAssetRepository.ExistsAsync(order.UserId, item.AssetId!.Value, cancellationToken))
                continue;

            newAssets.Add(new UserAsset
            {
                Id = Guid.NewGuid(),
                UserId = order.UserId,
                AssetId = item.AssetId!.Value,
                OrderId = order.Id,
                AcquiredVia = "purchase",
                AcquiredAt = now
            });
        }

        if (newAssets.Count > 0)
            userAssetRepository.AddRange(newAssets);
    }

    private async Task FulfillSubscriptionOrderAsync(Order order, CancellationToken cancellationToken)
    {
        var planItem = order.Items.FirstOrDefault(i => i.PlanId.HasValue);
        if (planItem is null || planItem.Plan is null)
            return;

        var activeSubs = await subscriptionRepository.GetActiveForUpdateAsync(order.UserId, cancellationToken);
        foreach (var sub in activeSubs)
        {
            sub.Status = SubscriptionStatus.Expired;
            sub.ExpiredAt = DateTime.UtcNow;
            sub.UpdatedAt = DateTime.UtcNow;
        }

        var startedAt = DateTime.UtcNow;
        var newSub = new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = order.UserId,
            PlanId = planItem.PlanId!.Value,
            Status = SubscriptionStatus.Active,
            StartedAt = startedAt,
            ExpiredAt = startedAt.AddMonths(1),
            CreatedAt = startedAt,
            UpdatedAt = startedAt
        };
        subscriptionRepository.Add(newSub);

        if (planItem.Plan.CreditsMonthly.GetValueOrDefault() > 0)
        {
            var wallet = await walletRepository.GetByUserIdForUpdateAsync(order.UserId, cancellationToken);
            if (wallet is not null)
            {
                wallet.Balance += planItem.Plan.CreditsMonthly!.Value;
                wallet.UpdatedAt = DateTime.UtcNow;
                unitOfWork.AddWalletTransaction(new WalletTransaction
                {
                    Id = Guid.NewGuid(),
                    WalletId = wallet.Id,
                    Type = WalletTxType.SubscriptionGrant,
                    Amount = planItem.Plan.CreditsMonthly.Value,
                    BalanceAfter = wallet.Balance,
                    Description = $"Subscription credits for {planItem.Plan.Name}",
                    ReferenceType = "subscription",
                    ReferenceId = newSub.Id,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }
    }

    private async Task FulfillCreditPackOrderAsync(Order order, CancellationToken cancellationToken)
    {
        if (order.TotalXu <= 0)
            return;

        var wallet = await walletRepository.GetByUserIdForUpdateAsync(order.UserId, cancellationToken);
        if (wallet is null)
            return;

        var now = DateTime.UtcNow;
        wallet.Balance += order.TotalXu;
        wallet.UpdatedAt = now;
        unitOfWork.AddWalletTransaction(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = wallet.Id,
            Type = WalletTxType.Purchase,
            Amount = order.TotalXu,
            BalanceAfter = wallet.Balance,
            Description = $"Credit pack {order.OrderCode}",
            ReferenceType = "order",
            ReferenceId = order.Id,
            CreatedAt = now
        });
    }
}
