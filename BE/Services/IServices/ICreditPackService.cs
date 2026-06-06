using Exe.DTOs.Billing;

namespace Exe.Services.IServices;

public interface ICreditPackService
{
    Task<CreditPackListResponse> ListPublicAsync(CancellationToken cancellationToken = default);
    Task<CreditPackListResponse> ListAdminAsync(Guid adminUserId, CancellationToken cancellationToken = default);
    Task<CreditPackResponse?> GetForOrderAsync(string packId, CancellationToken cancellationToken = default);
    Task<CreditPackResponse> CreateAsync(Guid adminUserId, AdminCreateCreditPackRequest request, CancellationToken cancellationToken = default);
    Task<CreditPackResponse?> UpdateAsync(Guid adminUserId, string id, AdminUpdateCreditPackRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid adminUserId, string id, CancellationToken cancellationToken = default);
    Task<bool> HardDeleteAsync(Guid adminUserId, string id, CancellationToken cancellationToken = default);
}
