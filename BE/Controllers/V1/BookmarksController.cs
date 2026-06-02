using Exe.DTOs.Auth;
using Exe.DTOs.Marketplace;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/bookmarks")]
[Tags("4.11 Bookmarks")]
[Authorize]
[Produces("application/json")]
public class BookmarksController(IBookmarkService bookmarkService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await bookmarkService.ListAsync(userId.Value, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookmarkRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            await bookmarkService.AddAsync(userId.Value, request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpDelete("{assetId:guid}")]
    public async Task<IActionResult> Delete(Guid assetId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return await bookmarkService.RemoveAsync(userId.Value, assetId, cancellationToken) ? NoContent() : NotFound();
    }
}
