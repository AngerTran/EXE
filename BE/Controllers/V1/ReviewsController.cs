using Exe.DTOs.Auth;
using Exe.DTOs.Marketplace;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/reviews")]
[Tags("4.11 Reviews")]
[Authorize]
[Produces("application/json")]
public class ReviewsController(IReviewService reviewService) : ControllerBase
{
    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var review = await reviewService.UpdateAsync(userId.Value, id, request, cancellationToken);
        return review is null ? NotFound() : Ok(review);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return await reviewService.DeleteAsync(userId.Value, id, cancellationToken) ? NoContent() : NotFound();
    }
}
