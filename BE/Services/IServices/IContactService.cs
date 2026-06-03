using Exe.DTOs.Common;
using Exe.DTOs.Support;

namespace Exe.Services.IServices;

public interface IContactService
{
    Task<ContactInquiryResponse> SubmitAsync(
        CreateContactInquiryRequest request,
        CancellationToken cancellationToken = default);
}
