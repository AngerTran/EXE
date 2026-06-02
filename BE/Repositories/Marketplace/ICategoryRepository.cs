using Exe.Models.Entities;

namespace Exe.Repositories.Marketplace;

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> GetActiveAsync(CancellationToken cancellationToken = default);

    Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
