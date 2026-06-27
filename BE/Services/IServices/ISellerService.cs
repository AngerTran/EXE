using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.DTOs.Seller;
using Exe.Repositories.Marketplace;
using Exe.Repositories.Profile;

namespace Exe.Services.IServices;

public interface ISellerService
{
    Task<SellerMeResponse> GetMeAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<SellerAssetsResponse> ListMyAssetsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default);

    Task<AssetDetailResponse?> GetMyAssetByIdAsync(
        Guid userId,
        Guid assetId,
        CancellationToken cancellationToken = default);

    Task<SellerMeResponse> UpdateProfileAsync(
        Guid userId,
        UpdateSellerProfileRequest request,
        CancellationToken cancellationToken = default);

    Task<SellerApplyResponse> ApplyAsync(
        Guid userId,
        SellerApplyRequest request,
        CancellationToken cancellationToken = default);

    Task<SellerEarningsResponse> ListEarningsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default);
}
