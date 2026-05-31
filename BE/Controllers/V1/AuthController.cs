using Exe.DTOs.Auth;
using Exe.Extensions;
using Exe.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

/// <summary>§4.1 Auth &amp; Profile — đăng ký, đăng nhập, profile, wallet, subscription.</summary>
[ApiController]
[Route("api/v1/auth")]
[Tags("4.1 Auth & Profile")]
[Produces("application/json")]
public class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Đăng ký qua Supabase Auth (tuỳ chọn — FE có thể gọi Supabase client trực tiếp).</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthSessionResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var session = await authService.RegisterAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetMe), session);
        }
        catch (SupabaseAuthException ex) when (ex.StatusCode is 400 or 422)
        {
            return BadRequest(new ErrorResponse(ex.Message, "auth/register_failed"));
        }
        catch (SupabaseAuthException ex) when (ex.StatusCode == 409)
        {
            return Conflict(new ErrorResponse(ex.Message, "email_already_exists"));
        }
        catch (SupabaseAuthException ex) when (ex.StatusCode == 429)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new ErrorResponse(ex.Message, "rate_limit_exceeded"));
        }
        catch (SupabaseAuthException ex) when (ex.StatusCode == StatusCodes.Status503ServiceUnavailable)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ErrorResponse(ex.Message, "supabase_unreachable"));
        }
        catch (SupabaseAuthException ex)
        {
            return StatusCode(ex.StatusCode, new ErrorResponse(ex.Message, "auth/register_failed"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "configuration_error"));
        }
    }

    /// <summary>Đăng nhập qua Supabase Auth (tuỳ chọn — FE có thể gọi Supabase client trực tiếp).</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthSessionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var session = await authService.LoginAsync(request, cancellationToken);
            return Ok(session);
        }
        catch (SupabaseAuthException ex) when (ex.StatusCode is 400 or 401 or 422)
        {
            return Unauthorized(new ErrorResponse(ex.Message, "invalid_credentials"));
        }
        catch (SupabaseAuthException ex) when (ex.StatusCode == 429)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests,
                new ErrorResponse(ex.Message, "rate_limit_exceeded"));
        }
        catch (SupabaseAuthException ex)
        {
            return StatusCode(ex.StatusCode, new ErrorResponse(ex.Message, "auth/login_failed"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "configuration_error"));
        }
    }

    /// <summary>Profile hiện tại + wallet + subscription.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var me = await authService.GetMeAsync(userId.Value, cancellationToken);
            if (me is null)
                return NotFound(new ErrorResponse("Profile not found.", "profile_not_found"));

            return Ok(me);
        }
        catch (AccountBannedException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "account_banned"));
        }
    }

    /// <summary>Cập nhật name, avatar_url.</summary>
    [HttpPatch("me")]
    [Authorize]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateMe(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        if (request.Name is null && request.AvatarUrl is null)
            return BadRequest(new ErrorResponse("At least one field (name or avatarUrl) is required.", "validation_error"));

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var me = await authService.UpdateMeAsync(userId.Value, request, cancellationToken);
            if (me is null)
                return NotFound(new ErrorResponse("Profile not found.", "profile_not_found"));

            return Ok(me);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (AccountBannedException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "account_banned"));
        }
    }

    /// <summary>Logout — client nên gọi supabase.auth.signOut(); endpoint trả 204 để đồng bộ spec.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout() => NoContent();
}
