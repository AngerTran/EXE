using Exe.Configuration;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Repositories.Commerce;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Seller;
using Exe.Repositories.Wallet;
using Microsoft.Extensions.Options;

namespace Exe.Services;

public class OrderFulfillmentService(
    IUserAssetRepository userAssetRepository,
    ISubscriptionRepository subscriptionRepository,
    IWalletRepository walletRepository,
    IAssetRepository assetRepository,
    ISellerEarningRepository sellerEarningRepository,
    IUnitOfWork unitOfWork,
    IOptions<SellerOptions> sellerOptions)
{
    private readonly SellerOptions _sellerOptions = sellerOptions.Value;

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
            var assetId = item.AssetId!.Value;

            if (await userAssetRepository.ExistsAsync(order.UserId, assetId, cancellationToken))
                continue;

            newAssets.Add(new UserAsset
            {
                Id = Guid.NewGuid(),
                UserId = order.UserId,
                AssetId = assetId,
                OrderId = order.Id,
                AcquiredVia = "purchase",
                AcquiredAt = now
            });

            await CreditSellerForAssetSaleAsync(order, item, assetId, now, cancellationToken);
        }

        if (newAssets.Count > 0)
            userAssetRepository.AddRange(newAssets);
    }

    private async Task CreditSellerForAssetSaleAsync(
        Order order,
        OrderItem item,
        Guid assetId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var grossXu = (int)item.LineTotal;
        if (grossXu <= 0)
            return;

        if (await sellerEarningRepository.ExistsForOrderAssetAsync(order.Id, assetId, cancellationToken))
            return;

        var asset = await assetRepository.GetApprovedByIdAsync(assetId, cancellationToken);
        if (asset is null)
            return;

        var sellerId = asset.UploaderId;
        if (sellerId == order.UserId)
            return;

        var feePercent = Math.Clamp(_sellerOptions.PlatformFeePercent, 0, 100);
        var platformFeeXu = (int)Math.Round(grossXu * feePercent / 100.0, MidpointRounding.AwayFromZero);
        var netXu = grossXu - platformFeeXu;
        if (netXu <= 0)
            return;

        var sellerWallet = await walletRepository.GetOrCreateByUserIdForUpdateAsync(sellerId, cancellationToken);

        sellerWallet.Balance += netXu;
        sellerWallet.UpdatedAt = now;
        unitOfWork.AddWalletTransaction(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            WalletId = sellerWallet.Id,
            Type = WalletTxType.SellerSale,
            Amount = netXu,
            BalanceAfter = sellerWallet.Balance,
            Description = $"Seller sale {order.OrderCode} — {asset.Title}",
            ReferenceType = "order",
            ReferenceId = order.Id,
            CreatedAt = now
        });

        sellerEarningRepository.Add(new SellerEarning
        {
            Id = Guid.NewGuid(),
            SellerId = sellerId,
            OrderId = order.Id,
            AssetId = assetId,
            GrossXu = grossXu,
            PlatformFeeXu = platformFeeXu,
            NetXu = netXu,
            Status = SellerEarningStatus.Available,
            CreatedAt = now
        });
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
            var wallet = await walletRepository.GetOrCreateByUserIdForUpdateAsync(order.UserId, cancellationToken);
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

    private async Task FulfillCreditPackOrderAsync(Order order, CancellationToken cancellationToken)
    {
        if (order.TotalXu <= 0)
            return;

        var wallet = await walletRepository.GetOrCreateByUserIdForUpdateAsync(order.UserId, cancellationToken);

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
