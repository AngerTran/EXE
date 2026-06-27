using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Seller;

public interface ISellerEarningRepository
{
    Task<bool> ExistsForOrderAssetAsync(Guid orderId, Guid assetId, CancellationToken cancellationToken = default);

    Task<(int GrossXu, int PlatformFeeXu, int NetXu, int SaleCount)> GetSummaryBySellerAsync(
        Guid sellerId,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<SellerEarning> Items, int Total)> ListBySellerAsync(
        Guid sellerId,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    void Add(SellerEarning earning);
}
