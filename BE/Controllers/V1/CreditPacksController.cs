using Exe.DTOs.Billing;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/credit-packs")]
[Tags("4.4 Credit packs")]
[Produces("application/json")]
public class CreditPacksController(ICreditPackService creditPackService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CreditPackListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var result = await creditPackService.ListPublicAsync(cancellationToken);
        return Ok(result);
    }
}
