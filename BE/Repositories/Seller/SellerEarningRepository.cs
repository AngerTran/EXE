using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Seller;

public class SellerEarningRepository(AppDbContext db) : ISellerEarningRepository
{
    public Task<bool> ExistsForOrderAssetAsync(Guid orderId, Guid assetId, CancellationToken cancellationToken = default) =>
        db.SellerEarnings.AsNoTracking()
            .AnyAsync(e => e.OrderId == orderId && e.AssetId == assetId, cancellationToken);

    public async Task<(int GrossXu, int PlatformFeeXu, int NetXu, int SaleCount)> GetSummaryBySellerAsync(
        Guid sellerId,
        CancellationToken cancellationToken = default)
    {
        var q = db.SellerEarnings.AsNoTracking()
            .Where(e => e.SellerId == sellerId && e.Status != SellerEarningStatus.PaidOut);

        var gross = await q.SumAsync(e => (int?)e.GrossXu, cancellationToken) ?? 0;
        var fee = await q.SumAsync(e => (int?)e.PlatformFeeXu, cancellationToken) ?? 0;
        var net = await q.SumAsync(e => (int?)e.NetXu, cancellationToken) ?? 0;
        var count = await q.CountAsync(cancellationToken);
        return (gross, fee, net, count);
    }

    public async Task<(IReadOnlyList<SellerEarning> Items, int Total)> ListBySellerAsync(
        Guid sellerId,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.SellerEarnings.AsNoTracking()
            .Include(e => e.Asset)
            .Include(e => e.Order)
            .Where(e => e.SellerId == sellerId)
            .OrderByDescending(e => e.CreatedAt);

        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public void Add(SellerEarning earning) => db.SellerEarnings.Add(earning);
}
