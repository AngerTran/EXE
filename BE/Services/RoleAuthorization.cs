using Exe.Models;
using Exe.Repositories.Profile;

namespace Exe.Services;

public static class RoleAuthorization
{
    public static bool IsSellerOrAdmin(UserRole? role) =>
        role is UserRole.Seller or UserRole.Admin;

    public static bool IsAdmin(UserRole? role) =>
        role is UserRole.Admin;

    public static async Task<UserRole> GetRoleOrThrowAsync(
        IProfileRepository profileRepository,
        Guid userId,
        CancellationToken cancellationToken = default) =>
        await profileRepository.GetRoleAsync(userId, cancellationToken)
        ?? throw new ForbiddenException("Profile not found.");

    public static async Task EnsureSellerOrAdminAsync(
        IProfileRepository profileRepository,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetRoleOrThrowAsync(profileRepository, userId, cancellationToken);
        if (!IsSellerOrAdmin(role))
            throw new ForbiddenException("Seller or admin access required.");
    }

    public static async Task EnsureAdminAsync(
        IProfileRepository profileRepository,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetRoleOrThrowAsync(profileRepository, userId, cancellationToken);
        if (!IsAdmin(role))
            throw new ForbiddenException("Admin access required.");
    }
}
