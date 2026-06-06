using Exe.Data;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Billing;

public class CreditPackRepository(AppDbContext db) : ICreditPackRepository
{
    private IQueryable<CreditPack> Query(bool activeOnly)
    {
        var q = db.CreditPacks.AsNoTracking();
        if (activeOnly)
            q = q.Where(p => p.IsActive);
        return q.OrderBy(p => p.SortOrder).ThenBy(p => p.PriceVnd);
    }

    public async Task<IReadOnlyList<CreditPack>> ListAsync(bool activeOnly, CancellationToken cancellationToken = default) =>
        await Query(activeOnly).ToListAsync(cancellationToken);

    public Task<CreditPack?> GetByIdAsync(string id, bool activeOnly, CancellationToken cancellationToken = default) =>
        Query(activeOnly).FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<CreditPack?> GetByIdForUpdateAsync(string id, CancellationToken cancellationToken = default) =>
        db.CreditPacks.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<int> CountAsync(CancellationToken cancellationToken = default) =>
        db.CreditPacks.CountAsync(cancellationToken);

    public void Add(CreditPack pack) => db.CreditPacks.Add(pack);

    public void Remove(CreditPack pack) => db.CreditPacks.Remove(pack);
}
