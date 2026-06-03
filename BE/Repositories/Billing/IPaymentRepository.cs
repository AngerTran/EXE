using Exe.Models.Entities;

namespace Exe.Repositories.Billing;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Payment?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Payment> Items, int Total)> ListForUserAsync(
        Guid userId,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<Payment?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Payment?> GetByOrderIdForUpdateAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<Payment?> GetByOrderIdForUserAsync(Guid orderId, Guid userId, CancellationToken cancellationToken = default);

    void Add(Payment payment);
}
