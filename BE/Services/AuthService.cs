using Exe.DTOs.Auth;
using Exe.Models;
using Exe.Repositories;
using Exe.Repositories.Profile;
using Exe.Services.IServices;

namespace Exe.Services;

public class AuthService(
    IProfileRepository profileRepository,
    IUnitOfWork unitOfWork,
    ISupabaseAuthClient supabaseAuthClient) : IAuthService
{
    public Task<AuthSessionResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default) =>
        supabaseAuthClient.RegisterAsync(request, cancellationToken);

    public Task<AuthSessionResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default) =>
        supabaseAuthClient.LoginAsync(request, cancellationToken);

    public async Task<MeResponse?> GetMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetActiveByIdWithDetailsAsync(userId, asNoTracking: true, cancellationToken);
        if (profile is null)
            return null;
        if (profile.Status == UserStatus.Banned)
            throw new AccountBannedException();
        return MapToMeResponse(profile);
    }

    public async Task<MeResponse?> UpdateMeAsync(
        Guid userId,
        UpdateProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var profile = await profileRepository.GetActiveByIdForUpdateAsync(userId, cancellationToken);
        if (profile is null)
            return null;
        if (profile.Status == UserStatus.Banned)
            throw new AccountBannedException();

        var changed = false;
        if (request.Name is not null)
        {
            var name = request.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Name cannot be empty.");
            profile.Name = name;
            changed = true;
        }
        if (request.AvatarUrl is not null)
        {
            profile.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
            changed = true;
        }

        if (changed)
        {
            profile.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return MapToMeResponse(profile);
    }

    private static MeResponse MapToMeResponse(Models.Entities.Profile profile)
    {
        var activeSubscription = profile.Subscriptions
            .Where(s => s.Status == SubscriptionStatus.Active)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefault();
        var planTier = activeSubscription?.Plan.Slug ?? SubscriptionTier.Free;
        var isUnlimited = activeSubscription?.Plan.IsUnlimited ?? false;
        return new MeResponse(
            profile.Id,
            profile.Email,
            profile.Username,
            profile.Name,
            profile.Role.ToString().ToLowerInvariant(),
            profile.AvatarUrl,
            new MeWalletResponse(profile.Wallet?.Balance ?? 0, isUnlimited),
            new MeSubscriptionResponse(
                planTier.ToString().ToLowerInvariant(),
                activeSubscription?.Status.ToString().ToLowerInvariant() ?? "active",
                activeSubscription?.ExpiredAt));
    }
}
