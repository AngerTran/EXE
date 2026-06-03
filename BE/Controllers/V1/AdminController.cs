using Exe.DTOs.Admin;
using Exe.DTOs.Auth;
using Exe.DTOs.Common;
using Exe.DTOs.Support;
using Exe.Extensions;
using Exe.Models;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/admin")]
[Tags("4.13 Admin")]
[Authorize]
[Produces("application/json")]
public class AdminController(IAdminService adminService) : ControllerBase
{
    [HttpGet("overview")]
    [ProducesResponseType(typeof(AdminOverviewResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Overview(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.GetOverviewAsync(userId.Value, cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("users")]
    public async Task<IActionResult> ListUsers(
        [FromQuery] string? search,
        [FromQuery] UserRole? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.ListUsersAsync(
                userId.Value,
                search,
                role,
                new PagedQuery(page, pageSize),
                cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUser(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var user = await adminService.GetUserDetailAsync(userId.Value, id, cancellationToken);
            return user is null ? NotFound() : Ok(user);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpPatch("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser(
        Guid id,
        [FromBody] AdminUpdateUserRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var user = await adminService.UpdateUserAsync(userId.Value, id, request, cancellationToken);
            return user is null ? NotFound() : Ok(user);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var deleted = await adminService.DeleteUserAsync(userId.Value, id, cancellationToken);
            return deleted ? NoContent() : NotFound();
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("contact-inquiries")]
    public async Task<IActionResult> ListContactInquiries(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.ListContactInquiriesAsync(
                userId.Value,
                status,
                new PagedQuery(page, pageSize),
                cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpPatch("contact-inquiries/{id:guid}")]
    public async Task<IActionResult> UpdateContactInquiry(
        Guid id,
        [FromBody] UpdateContactInquiryRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var inquiry = await adminService.UpdateContactInquiryAsync(userId.Value, id, request, cancellationToken);
            return inquiry is null ? NotFound() : Ok(inquiry);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> ListAuditLogs(
        [FromQuery] Guid? userId,
        [FromQuery] string? action,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var adminId = User.GetUserId();
        if (adminId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.ListAuditLogsAsync(
                adminId.Value,
                userId,
                action,
                new PagedQuery(page, pageSize),
                cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("analytics/revenue")]
    public async Task<IActionResult> AnalyticsRevenue(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.GetAnalyticsRevenueAsync(userId.Value, from, to, cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("analytics/users")]
    public async Task<IActionResult> AnalyticsUsers(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.GetAnalyticsUsersAsync(userId.Value, from, to, cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("analytics/assets")]
    public async Task<IActionResult> AnalyticsAssets(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.GetAnalyticsAssetsAsync(userId.Value, cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("analytics/orders")]
    public async Task<IActionResult> AnalyticsOrders(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.GetAnalyticsOrdersAsync(userId.Value, cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("subscription-plans")]
    public async Task<IActionResult> ListSubscriptionPlans(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            return Ok(await adminService.ListSubscriptionPlansAsync(userId.Value, cancellationToken));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpPost("subscription-plans")]
    public async Task<IActionResult> CreateSubscriptionPlan(
        [FromBody] AdminCreateSubscriptionPlanRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var plan = await adminService.CreateSubscriptionPlanAsync(userId.Value, request, cancellationToken);
            return Created(string.Empty, plan);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpPatch("subscription-plans/{id:guid}")]
    public async Task<IActionResult> UpdateSubscriptionPlan(
        Guid id,
        [FromBody] AdminUpdateSubscriptionPlanRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var plan = await adminService.UpdateSubscriptionPlanAsync(userId.Value, id, request, cancellationToken);
            return plan is null ? NotFound() : Ok(plan);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpDelete("subscription-plans/{id:guid}")]
    public async Task<IActionResult> DeleteSubscriptionPlan(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var deleted = await adminService.DeleteSubscriptionPlanAsync(userId.Value, id, cancellationToken);
            return deleted ? NoContent() : NotFound();
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }
}
