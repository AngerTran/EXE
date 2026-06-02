using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Profile;

public interface IProfileRepository
{
    Task<Models.Entities.Profile?> GetActiveByIdWithDetailsAsync(
        Guid id,
        bool asNoTracking = true,
        CancellationToken cancellationToken = default);

    Task<Models.Entities.Profile?> GetActiveByIdForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<UserRole?> GetRoleAsync(Guid id, CancellationToken cancellationToken = default);
}
