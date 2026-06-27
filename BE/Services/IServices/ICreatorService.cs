using Exe.DTOs.Common;
using Exe.DTOs.Seller;
using Exe.Services.IServices;

namespace Exe.Services.IServices;

public interface ICreatorService
{
    Task<CreatorPublicResponse?> GetByUsernameAsync(
        string username,
        CancellationToken cancellationToken = default);

    Task<CreatorAssetsResponse?> ListAssetsByUsernameAsync(
        string username,
        PagedQuery query,
        CancellationToken cancellationToken = default);
}
