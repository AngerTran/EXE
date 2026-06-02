using Exe.DTOs.Billing;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/subscriptions")]
[Tags("4.14 Subscriptions")]
[Authorize]
[Produces("application/json")]
public class SubscriptionsController(ISubscriptionUserService subscriptionService) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(SubscriptionMeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var sub = await subscriptionService.GetMySubscriptionAsync(userId.Value, cancellationToken);
        return sub is null ? NotFound() : Ok(sub);
    }

    [HttpGet("me/history")]
    public async Task<IActionResult> GetHistory(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await subscriptionService.GetHistoryAsync(userId.Value, cancellationToken));
    }

    [HttpPost("cancel")]
    public async Task<IActionResult> Cancel(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return await subscriptionService.CancelMySubscriptionAsync(userId.Value, cancellationToken)
            ? Ok(new { cancelled = true })
            : NotFound();
    }
}
