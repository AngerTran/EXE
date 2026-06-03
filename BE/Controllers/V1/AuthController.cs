using Exe.DTOs.Auth;
using Exe.Extensions;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

/// <summary>§4.1 Auth &amp; Profile — đăng ký, đăng nhập, profile, wallet, subscription.</summary>
[ApiController]
[Route("api/v1/auth")]
[Tags("4.1 Auth & Profile")]
[Produces("application/json")]
public class AuthController(
    IAuthService authService,
    ISupabaseAuthClient supabaseAuthClient,
    IProfileAvatarService profileAvatarService) : ControllerBase
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

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ForgotPassword(
        [FromBody] ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            await supabaseAuthClient.ForgotPasswordAsync(request, cancellationToken);
            return NoContent();
        }
        catch (SupabaseAuthException ex)
        {
            return StatusCode(ex.StatusCode, new ErrorResponse(ex.Message, "forgot_password_failed"));
        }
    }

    [HttpPost("me/avatar/upload-url")]
    [Authorize]
    [ProducesResponseType(typeof(Exe.DTOs.Marketplace.UploadUrlResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateAvatarUploadUrl(
        [FromBody] AvatarUploadUrlRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var result = await profileAvatarService.CreateAvatarUploadUrlAsync(userId.Value, request, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpPost("me/avatar")]
    [Authorize]
    [ProducesResponseType(typeof(MeResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmAvatar(
        [FromBody] ConfirmAvatarRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var me = await profileAvatarService.ConfirmAvatarAsync(userId.Value, request, cancellationToken);
            return me is null ? NotFound() : Ok(me);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    /// <summary>Logout — client nên gọi supabase.auth.signOut(); endpoint trả 204 để đồng bộ spec.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout() => NoContent();
}
