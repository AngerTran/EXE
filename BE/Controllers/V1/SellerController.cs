using Exe.DTOs.Auth;
using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.DTOs.Seller;
using Exe.Extensions;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/seller")]
[Tags("4.10 Seller")]
[Authorize]
[Produces("application/json")]
public class SellerController(ISellerService sellerService) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(SellerMeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken) =>
        await ExecuteAsync(() => sellerService.GetMeAsync(RequireUserId(), cancellationToken));

    [HttpGet("assets")]
    [ProducesResponseType(typeof(SellerAssetsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListAssets(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        await ExecuteAsync(() => sellerService.ListMyAssetsAsync(
            RequireUserId(),
            new PagedQuery(page, pageSize),
            cancellationToken));

    [HttpGet("assets/{id:guid}")]
    [ProducesResponseType(typeof(AssetDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAsset(Guid id, CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var asset = await sellerService.GetMyAssetByIdAsync(userId.Value, id, cancellationToken);
            return asset is null
                ? NotFound(new ErrorResponse("Asset not found.", "asset_not_found"))
                : Ok(asset);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(SellerMeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken) =>
        await ExecuteAsync(() => sellerService.GetMeAsync(RequireUserId(), cancellationToken));

    [HttpPatch("profile")]
    [ProducesResponseType(typeof(SellerMeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateSellerProfileRequest request,
        CancellationToken cancellationToken) =>
        await ExecuteAsync(() => sellerService.UpdateProfileAsync(RequireUserId(), request, cancellationToken));

    [HttpPost("apply")]
    [ProducesResponseType(typeof(SellerApplyResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Apply(
        [FromBody] SellerApplyRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var result = await sellerService.ApplyAsync(userId.Value, request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("earnings")]
    [ProducesResponseType(typeof(SellerEarningsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListEarnings(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        await ExecuteAsync(() => sellerService.ListEarningsAsync(
            RequireUserId(),
            new PagedQuery(page, pageSize),
            cancellationToken));

    private Guid RequireUserId() =>
        User.GetUserId() ?? throw new UnauthorizedAccessException();

    private async Task<IActionResult> ExecuteAsync<T>(Func<Task<T>> action)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            return Ok(await action());
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "forbidden"));
        }
    }
}
