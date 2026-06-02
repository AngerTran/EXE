using Exe.DTOs.Admin;
using Exe.DTOs.Auth;
using Exe.DTOs.Common;
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
}
