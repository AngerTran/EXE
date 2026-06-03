using Exe.DTOs.Auth;
using Exe.DTOs.Common;
using Exe.DTOs.Marketplace;
using Exe.Extensions;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/assets")]
[Tags("4.5 Assets (Marketplace)")]
[Produces("application/json")]
public class AssetsController(IAssetService assetService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PagedResponse<AssetListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] AssetQueryParams query,
        CancellationToken cancellationToken)
    {
        var result = await assetService.ListApprovedAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResponse<AssetListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListMine(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        return Ok(await assetService.ListMyUploadsAsync(
            userId.Value,
            new PagedQuery(page, pageSize),
            cancellationToken));
    }

    [HttpGet("pending")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResponse<AssetListItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> ListPending(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var result = await assetService.ListPendingReviewAsync(
                userId.Value,
                new PagedQuery(page, pageSize),
                cancellationToken);
            return Ok(result);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "forbidden"));
        }
    }

    [HttpGet("slug/{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AssetDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var asset = await assetService.GetApprovedBySlugAsync(slug, cancellationToken);
        if (asset is null)
            return NotFound(new ErrorResponse("Asset not found.", "asset_not_found"));

        return Ok(asset);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AssetDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var asset = await assetService.GetApprovedByIdAsync(id, cancellationToken);
        if (asset is null)
            return NotFound(new ErrorResponse("Asset not found.", "asset_not_found"));

        return Ok(asset);
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(AssetDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateAssetRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var asset = await assetService.CreateAsync(userId.Value, request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = asset.Id }, asset);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpPatch("{id:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(AssetDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateAssetRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var asset = await assetService.UpdateAsync(userId.Value, id, request, cancellationToken);
            if (asset is null)
                return NotFound(new ErrorResponse("Asset not found or access denied.", "asset_not_found"));

            return Ok(asset);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "invalid_status"));
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        var deleted = await assetService.DeleteAsync(userId.Value, id, cancellationToken);
        if (!deleted)
            return NotFound(new ErrorResponse("Asset not found or access denied.", "asset_not_found"));

        return NoContent();
    }

    [HttpPatch("{id:guid}/approve")]
    [Authorize]
    [ProducesResponseType(typeof(AssetDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var asset = await assetService.ApproveAsync(userId.Value, id, cancellationToken);
            if (asset is null)
                return NotFound(new ErrorResponse("Asset not found.", "asset_not_found"));

            return Ok(asset);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "forbidden"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "invalid_status"));
        }
    }

    [HttpPatch("{id:guid}/reject")]
    [Authorize]
    [ProducesResponseType(typeof(AssetDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] RejectAssetRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var asset = await assetService.RejectAsync(userId.Value, id, request, cancellationToken);
            if (asset is null)
                return NotFound(new ErrorResponse("Asset not found.", "asset_not_found"));

            return Ok(asset);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "forbidden"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "invalid_status"));
        }
    }
}
