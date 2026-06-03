using Exe.Data;
using Exe.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Exe.Repositories.Support;

public class ContactInquiryRepository(AppDbContext db) : IContactInquiryRepository
{
    public void Add(ContactInquiry inquiry) => db.ContactInquiries.Add(inquiry);

    public Task<ContactInquiry?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.ContactInquiries.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public Task<ContactInquiry?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.ContactInquiries.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<(IReadOnlyList<ContactInquiry> Items, int Total)> ListAsync(
        string? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var q = db.ContactInquiries.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(c => c.Status == status.Trim().ToLowerInvariant());

        q = q.OrderByDescending(c => c.CreatedAt);
        var total = await q.CountAsync(cancellationToken);
        var items = await q.Skip(skip).Take(take).ToListAsync(cancellationToken);
        return (items, total);
    }
}
