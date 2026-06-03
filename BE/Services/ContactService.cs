using Exe.DTOs.Support;
using Exe.Models.Entities;
using Exe.Repositories;
using Exe.Repositories.Support;
using Exe.Services.IServices;

namespace Exe.Services;

public class ContactService(
    IContactInquiryRepository contactRepository,
    IUnitOfWork unitOfWork) : IContactService
{
    public async Task<ContactInquiryResponse> SubmitAsync(
        CreateContactInquiryRequest request,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var inquiry = new ContactInquiry
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            GameIdea = string.IsNullOrWhiteSpace(request.GameIdea) ? null : request.GameIdea.Trim(),
            ConsultType = request.ConsultType.Trim(),
            Message = request.Message.Trim(),
            Status = "new",
            CreatedAt = now,
            UpdatedAt = now
        };
        contactRepository.Add(inquiry);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(inquiry);
    }

    internal static ContactInquiryResponse Map(ContactInquiry c) =>
        new(c.Id, c.Name, c.Email, c.Phone, c.GameIdea, c.ConsultType, c.Message, c.Status, c.CreatedAt, c.UpdatedAt);
}
