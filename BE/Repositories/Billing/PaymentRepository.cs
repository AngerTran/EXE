using Exe.Data;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Billing;

public class PaymentRepository(AppDbContext db) : IPaymentRepository
{
    public Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<Payment?> GetByIdForUserAsync(Guid id, Guid userId, CancellationToken cancellationToken = default) =>
        db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId, cancellationToken);

    public async Task<(IReadOnlyList<Payment> Items, int Total)> ListForUserAsync(
        Guid userId,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.Payments
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt);

        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<Payment?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Payments.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

    public Task<Payment?> GetByOrderIdForUpdateAsync(Guid orderId, CancellationToken cancellationToken = default) =>
        db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId, cancellationToken);

    public Task<Payment?> GetByOrderIdForUserAsync(Guid orderId, Guid userId, CancellationToken cancellationToken = default) =>
        db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.OrderId == orderId && p.UserId == userId, cancellationToken);

    public void Add(Payment payment) => db.Payments.Add(payment);
}
