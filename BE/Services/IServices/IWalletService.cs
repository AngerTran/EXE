using Exe.DTOs.Common;
using Exe.DTOs.Wallet;

namespace Exe.Services.IServices;

public interface IWalletService
{
    Task<WalletMeResponse?> GetMyWalletAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PagedResponse<WalletTransactionResponse>> GetMyTransactionsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default);
    Task<WalletMeResponse?> AdminUpdateBalanceAsync(
        Guid adminUserId,
        Guid targetUserId,
        AdminUpdateWalletBalanceRequest request,
        CancellationToken cancellationToken = default);
}
