using Exe.Data;
using Exe.Models;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Profile;

public class ProfileRepository(AppDbContext db) : IProfileRepository
{
    private IQueryable<Models.Entities.Profile> ActiveProfilesQuery =>
        db.Profiles.Where(p => p.DeletedAt == null);

    public Task<Models.Entities.Profile?> GetActiveByIdWithDetailsAsync(
        Guid id,
        bool asNoTracking = true,
        CancellationToken cancellationToken = default)
    {
        var query = ActiveProfilesQuery
            .Include(p => p.Wallet)
            .Include(p => p.Subscriptions.Where(s => s.Status == SubscriptionStatus.Active))
                .ThenInclude(s => s.Plan)
            .Where(p => p.Id == id);

        if (asNoTracking)
            query = query.AsNoTracking();

        return query.FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Models.Entities.Profile?> GetActiveByIdForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        ActiveProfilesQuery
            .Include(p => p.Wallet)
            .Include(p => p.Subscriptions.Where(s => s.Status == SubscriptionStatus.Active))
                .ThenInclude(s => s.Plan)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<UserRole?> GetRoleAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Profiles
            .AsNoTracking()
            .Where(p => p.Id == id && p.DeletedAt == null)
            .Select(p => (UserRole?)p.Role)
            .FirstOrDefaultAsync(cancellationToken);

    public Task<Models.Entities.Profile?> GetActiveByUsernameAsync(
        string username,
        bool asNoTracking = true,
        CancellationToken cancellationToken = default)
    {
        var normalized = username.Trim().ToLowerInvariant();
        var query = ActiveProfilesQuery.Where(p => p.Username.ToLower() == normalized);
        if (asNoTracking)
            query = query.AsNoTracking();
        return query.FirstOrDefaultAsync(cancellationToken);
    }

    public Task<Models.Entities.Profile?> GetPublicSellerByUsernameAsync(
        string username,
        CancellationToken cancellationToken = default) =>
        ActiveProfilesQuery
            .AsNoTracking()
            .Where(p =>
                p.Username.ToLower() == username.Trim().ToLower()
                && p.Role == UserRole.Seller
                && p.SellerStatus == SellerStatus.Active)
            .FirstOrDefaultAsync(cancellationToken);
}
