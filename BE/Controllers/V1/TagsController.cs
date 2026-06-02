using Exe.DTOs.Marketplace;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/tags")]
[Tags("4.4 Categories & Tags")]
[Produces("application/json")]
public class TagsController(ILookupService lookupService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TagListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTags(
        [FromQuery] Guid? groupId,
        CancellationToken cancellationToken)
    {
        var result = await lookupService.GetTagsAsync(groupId, cancellationToken);
        return Ok(result);
    }
}
