using Exe.DTOs.Marketplace;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/tag-groups")]
[Tags("4.4 Categories & Tags")]
[Produces("application/json")]
public class TagGroupsController(ILookupService lookupService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TagGroupListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTagGroups(CancellationToken cancellationToken)
    {
        var result = await lookupService.GetTagGroupsAsync(cancellationToken);
        return Ok(result);
    }
}
