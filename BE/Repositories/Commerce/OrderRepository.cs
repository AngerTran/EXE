using Exe.Data;
using Exe.Models;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Commerce;

public class OrderRepository(AppDbContext db) : IOrderRepository
{
    private IQueryable<Order> WithItems() =>
        db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.User);

    public Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        WithItems().FirstOrDefaultAsync(o => o.Id == id, cancellationToken);

    public Task<Order?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default) =>
        WithItems().FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId, cancellationToken);

    public async Task<(IReadOnlyList<Order> Items, int Total)> ListForUserAsync(
        Guid userId,
        OrderStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = WithItems().Where(o => o.UserId == userId);
        if (status.HasValue)
            q = q.Where(o => o.Status == status.Value);

        q = q.OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<(IReadOnlyList<Order> Items, int Total)> ListAllAsync(
        Guid? userId,
        OrderStatus? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = WithItems().AsQueryable();
        if (userId.HasValue)
            q = q.Where(o => o.UserId == userId.Value);
        if (status.HasValue)
            q = q.Where(o => o.Status == status.Value);

        q = q.OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public async Task<(int TotalOrders, long TotalSpentVnd, int CompletedOrders, int PendingOrders)> GetSummaryForUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var orders = db.Orders.AsNoTracking().Where(o => o.UserId == userId);
        var total = await orders.CountAsync(cancellationToken);
        var spent = await orders
            .Where(o => o.Status == OrderStatus.Completed)
            .SumAsync(o => o.TotalVnd, cancellationToken);
        var completed = await orders.CountAsync(o => o.Status == OrderStatus.Completed, cancellationToken);
        var pending = await orders.CountAsync(o => o.Status == OrderStatus.Pending, cancellationToken);
        return (total, spent, completed, pending);
    }

    public void Add(Order order) => db.Orders.Add(order);

    public void AddItems(IEnumerable<OrderItem> items) => db.OrderItems.AddRange(items);

    public Task<Order?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Plan)
            .Include(o => o.Items)
                .ThenInclude(i => i.Asset)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
}
