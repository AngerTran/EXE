using Exe.DTOs.Auth;
using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.Extensions;
using Exe.Models;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/admin/assets")]
[Tags("4.13 Admin Assets")]
[Authorize]
[Produces("application/json")]
public class AdminAssetsController(IAssetService assetService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] AssetStatus? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await assetService.ListAdminAsync(
                userId.Value,
                search,
                status,
                new PagedQuery(page, pageSize),
                cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateAssetRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var asset = await assetService.AdminUpdateAsync(userId.Value, id, request, cancellationToken);
            return asset is null ? NotFound() : Ok(asset);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "invalid_status"));
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var deleted = await assetService.AdminDeleteAsync(userId.Value, id, cancellationToken);
            return deleted ? NoContent() : NotFound();
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }
}
