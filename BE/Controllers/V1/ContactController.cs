using Exe.DTOs.Auth;
using Exe.DTOs.Support;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/contact")]
[Tags("Contact")]
[Produces("application/json")]
public class ContactController(IContactService contactService) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ContactInquiryResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Submit(
        [FromBody] CreateContactInquiryRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var result = await contactService.SubmitAsync(request, cancellationToken);
        return Created(string.Empty, result);
    }
}
