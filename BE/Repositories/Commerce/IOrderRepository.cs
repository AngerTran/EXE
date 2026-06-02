using Exe.Models;
using Exe.Models.Entities;

namespace Exe.Repositories.Commerce;

public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Order?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<Order?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Order> Items, int Total)> ListForUserAsync(
        Guid userId,
        OrderStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Order> Items, int Total)> ListAllAsync(
        Guid? userId,
        OrderStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default);

    void Add(Order order);

    void AddItems(IEnumerable<OrderItem> items);
}
