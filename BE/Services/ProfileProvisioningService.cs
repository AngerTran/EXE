using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Billing;
using Exe.Services.IServices;
using Microsoft.EntityFrameworkCore;

namespace Exe.Services;

public class ProfileProvisioningService(
    AppDbContext db,
    ISubscriptionPlanRepository subscriptionPlanRepository,
    IUnitOfWork unitOfWork) : IProfileProvisioningService
{
    public async Task EnsureProfileAsync(
        Guid userId,
        ProfileBootstrapInfo info,
        CancellationToken cancellationToken = default)
    {
        if (await db.Profiles.AnyAsync(p => p.Id == userId, cancellationToken))
            return;

        var email = info.Email.Trim();
        var name = string.IsNullOrWhiteSpace(info.Name) ? email.Split('@')[0] : info.Name.Trim();
        var baseUsername = string.IsNullOrWhiteSpace(info.Username)
            ? email.Split('@')[0]
            : info.Username.Trim();
        var username = await ResolveUniqueUsernameAsync(baseUsername, cancellationToken);
        var now = DateTime.UtcNow;

        var freePlan = await subscriptionPlanRepository.GetBySlugAsync(SubscriptionTier.Free, true, cancellationToken);
        var welcomeXu = freePlan?.CreditsMonthly ?? 100;

        db.Profiles.Add(new Profile
        {
            Id = userId,
            Username = username,
            Email = email,
            Name = name,
            Role = UserRole.Customer,
            Status = UserStatus.Active,
            CreatedAt = now,
            UpdatedAt = now
        });

        var wallet = new Wallet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Balance = welcomeXu,
            UpdatedAt = now
        };
        db.Wallets.Add(wallet);

        if (freePlan is not null)
        {
            db.Subscriptions.Add(new Subscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                PlanId = freePlan.Id,
                Status = SubscriptionStatus.Active,
                StartedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            });

            db.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                WalletId = wallet.Id,
                Type = WalletTxType.Bonus,
                Amount = welcomeXu,
                BalanceAfter = welcomeXu,
                Description = "Xu chào mừng khi đăng ký",
                CreatedAt = now
            });
        }

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // Trigger DB hoặc request song song đã tạo profile.
        }
    }

    private async Task<string> ResolveUniqueUsernameAsync(string baseUsername, CancellationToken cancellationToken)
    {
        var candidate = baseUsername;
        var suffix = 0;
        while (await db.Profiles.AnyAsync(p => p.Username == candidate, cancellationToken))
        {
            suffix++;
            candidate = $"{baseUsername}{suffix}";
        }

        return candidate;
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException?.Message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) == true
        || ex.InnerException?.Message.Contains("unique constraint", StringComparison.OrdinalIgnoreCase) == true;
}
