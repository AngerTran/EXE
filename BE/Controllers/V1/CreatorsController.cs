using Exe.DTOs.Auth;
using Exe.DTOs.Common;
using Exe.DTOs.Seller;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/creators")]
[Tags("4.11 Creators (Public)")]
[AllowAnonymous]
[Produces("application/json")]
public class CreatorsController(ICreatorService creatorService) : ControllerBase
{
    [HttpGet("{username}")]
    [ProducesResponseType(typeof(CreatorPublicResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByUsername(string username, CancellationToken cancellationToken)
    {
        var creator = await creatorService.GetByUsernameAsync(username, cancellationToken);
        return creator is null
            ? NotFound(new ErrorResponse("Creator not found.", "not_found"))
            : Ok(creator);
    }

    [HttpGet("{username}/assets")]
    [ProducesResponseType(typeof(CreatorAssetsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListAssets(
        string username,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await creatorService.ListAssetsByUsernameAsync(
            username,
            new PagedQuery(page, pageSize),
            cancellationToken);

        return result is null
            ? NotFound(new ErrorResponse("Creator not found.", "not_found"))
            : Ok(result);
    }
}
