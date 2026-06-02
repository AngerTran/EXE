using Exe.Data;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Marketplace;

public class CategoryRepository(AppDbContext db) : ICategoryRepository
{
    public async Task<IReadOnlyList<Models.Entities.Category>> GetActiveAsync(
        CancellationToken cancellationToken = default) =>
        await db.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync(cancellationToken);

    public Task<Models.Entities.Category?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        db.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id && c.IsActive, cancellationToken);
}
