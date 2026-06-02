using Exe.DTOs.Common;
using Exe.DTOs.Wallet;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Profile;
using Exe.Repositories.Wallet;
using Exe.Services.IServices;

namespace Exe.Services;

public class WalletService(
    IWalletRepository walletRepository,
    IProfileRepository profileRepository,
    IUnitOfWork unitOfWork) : IWalletService
{
    public async Task<WalletMeResponse?> GetMyWalletAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var wallet = await walletRepository.GetByUserIdAsync(userId, cancellationToken);
        if (wallet is null)
            return null;
        var isUnlimited = await walletRepository.HasUnlimitedPlanAsync(userId, cancellationToken);
        return new WalletMeResponse(wallet.Balance, isUnlimited);
    }

    public async Task<PagedResponse<WalletTransactionResponse>> GetMyTransactionsAsync(
        Guid userId,
        PagedQuery query,
        CancellationToken cancellationToken = default)
    {
        var (items, total) = await walletRepository.GetTransactionsAsync(
            userId,
            query.Skip,
            query.NormalizedPageSize,
            cancellationToken);
        return new PagedResponse<WalletTransactionResponse>(
            items.Select(MapTransaction).ToList(),
            query.NormalizedPage,
            query.NormalizedPageSize,
            total);
    }

    public async Task<WalletMeResponse?> AdminUpdateBalanceAsync(
        Guid adminUserId,
        Guid targetUserId,
        AdminUpdateWalletBalanceRequest request,
        CancellationToken cancellationToken = default)
    {
        if (await profileRepository.GetRoleAsync(adminUserId, cancellationToken) != UserRole.Admin)
            throw new ForbiddenException("Admin access required.");
        if (request.Balance < 0)
            throw new ArgumentException("Balance cannot be negative.");

        var wallet = await walletRepository.GetByUserIdForUpdateAsync(targetUserId, cancellationToken);
        if (wallet is null)
            return null;

        var delta = request.Balance - wallet.Balance;
        wallet.Balance = request.Balance;
        wallet.UpdatedAt = DateTime.UtcNow;

        if (delta != 0)
        {
            unitOfWork.AddWalletTransaction(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTxType.Bonus,
                Amount = delta,
                BalanceAfter = wallet.Balance,
                Description = request.Reason ?? "Admin balance adjustment",
                ReferenceType = "admin_adjustment",
                ReferenceId = adminUserId,
                CreatedAt = DateTime.UtcNow
            });
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);
        var isUnlimited = await walletRepository.HasUnlimitedPlanAsync(targetUserId, cancellationToken);
        return new WalletMeResponse(wallet.Balance, isUnlimited);
    }

    private static WalletTransactionResponse MapTransaction(WalletTransaction t) =>
        new(
            t.Id,
            t.Type.ToString(),
            t.Amount,
            t.BalanceAfter,
            t.Description,
            t.ReferenceType,
            t.ReferenceId,
            t.CreatedAt);
}
