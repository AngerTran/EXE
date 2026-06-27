using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Seller;

public class SellerApplicationRepository(AppDbContext db) : ISellerApplicationRepository
{
    public Task<bool> HasPendingAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.SellerApplications.AsNoTracking()
            .AnyAsync(a => a.UserId == userId && a.Status == SellerApplicationStatus.Pending, cancellationToken);

    public Task<SellerApplication?> GetPendingByUserIdAsync(Guid userId, CancellationToken cancellationToken = default) =>
        db.SellerApplications.AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == SellerApplicationStatus.Pending, cancellationToken);

    public Task<SellerApplication?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.SellerApplications
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<SellerApplication> Items, int Total)> ListAsync(
        SellerApplicationStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.SellerApplications.AsNoTracking()
            .Include(a => a.User)
            .AsQueryable();

        if (status.HasValue)
            q = q.Where(a => a.Status == status.Value);

        q = q.OrderByDescending(a => a.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public void Add(SellerApplication application) => db.SellerApplications.Add(application);
}
