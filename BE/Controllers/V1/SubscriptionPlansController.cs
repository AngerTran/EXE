using Exe.DTOs.Auth;
using Exe.DTOs.Billing;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

/// <summary>§4.2 Subscription Plans — catalog gói Miễn phí / Student / Indie / Pro.</summary>
[ApiController]
[Route("api/v1/subscription-plans")]
[Tags("4.2 Subscription Plans")]
[Produces("application/json")]
public class SubscriptionPlansController(ISubscriptionPlanService planService) : ControllerBase
{
    /// <summary>Danh sách gói dịch vụ (mặc định chỉ gói đang active).</summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SubscriptionPlanListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPlans(
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await planService.GetPlansAsync(activeOnly, cancellationToken);
        return Ok(result);
    }

    /// <summary>Chi tiết gói theo slug (free, student, indie, pro) — tiện cho Checkout FE.</summary>
    [HttpGet("slug/{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SubscriptionPlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(
        string slug,
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var plan = await planService.GetBySlugAsync(slug, activeOnly, cancellationToken);
        if (plan is null)
            return NotFound(new ErrorResponse($"Subscription plan '{slug}' not found.", "plan_not_found"));

        return Ok(plan);
    }

    /// <summary>Chi tiết gói theo id.</summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SubscriptionPlanResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        Guid id,
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var plan = await planService.GetByIdAsync(id, activeOnly, cancellationToken);
        if (plan is null)
            return NotFound(new ErrorResponse("Subscription plan not found.", "plan_not_found"));

        return Ok(plan);
    }
}
