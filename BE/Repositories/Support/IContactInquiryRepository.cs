using Exe.Models.Entities;

namespace Exe.Repositories.Support;

public interface IContactInquiryRepository
{
    void Add(ContactInquiry inquiry);

    Task<ContactInquiry?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    Task<ContactInquiry?> GetByIdForUpdateAsync(Guid id, CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<ContactInquiry> Items, int Total)> ListAsync(
        string? status,
        int skip,
        int take,
        CancellationToken cancellationToken = default);
}
