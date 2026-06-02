using Exe.DTOs.Auth;
using Exe.DTOs.Marketplace;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/assets/{assetId:guid}/reviews")]
[Tags("4.11 Reviews")]
[Produces("application/json")]
public class AssetReviewsController(IReviewService reviewService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List(Guid assetId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        return Ok(await reviewService.ListByAssetAsync(assetId, userId, cancellationToken));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(
        Guid assetId,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var review = await reviewService.CreateAsync(userId.Value, assetId, request, cancellationToken);
            return CreatedAtAction(nameof(List), new { assetId }, review);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }
}
