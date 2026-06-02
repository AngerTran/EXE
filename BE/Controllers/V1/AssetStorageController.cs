using Exe.DTOs.Auth;
using Exe.DTOs.Marketplace;
using Exe.Extensions;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/assets/{assetId:guid}")]
[Tags("4.6 Asset Files & Images (Storage)")]
[Produces("application/json")]
public class AssetStorageController(IAssetStorageService assetStorageService) : ControllerBase
{
    [HttpPost("upload-url")]
    [Authorize]
    [ProducesResponseType(typeof(UploadUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateUploadUrl(
        Guid assetId,
        [FromBody] CreateUploadUrlRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var result = await assetStorageService.CreateUploadUrlAsync(
                userId.Value,
                assetId,
                request,
                cancellationToken);

            if (result is null)
                return NotFound(new ErrorResponse("Asset not found or not editable.", "asset_not_found"));

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ErrorResponse(ex.Message, "storage_unavailable"));
        }
    }

    [HttpPost("files")]
    [Authorize]
    [ProducesResponseType(typeof(AssetFileResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterFile(
        Guid assetId,
        [FromBody] RegisterAssetFileRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var result = await assetStorageService.RegisterFileAsync(
                userId.Value,
                assetId,
                request,
                cancellationToken);

            if (result is null)
                return NotFound(new ErrorResponse("Asset not found or not editable.", "asset_not_found"));

            return CreatedAtAction(nameof(RegisterFile), new { assetId }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpPost("images")]
    [Authorize]
    [ProducesResponseType(typeof(AssetImageResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegisterImage(
        Guid assetId,
        [FromBody] RegisterAssetImageRequest request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var result = await assetStorageService.RegisterImageAsync(
                userId.Value,
                assetId,
                request,
                cancellationToken);

            if (result is null)
                return NotFound(new ErrorResponse("Asset not found or not editable.", "asset_not_found"));

            return CreatedAtAction(nameof(RegisterImage), new { assetId }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpGet("download")]
    [Authorize]
    [ProducesResponseType(typeof(AssetDownloadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Download(
        Guid assetId,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var result = await assetStorageService.GetDownloadUrlAsync(
                userId.Value,
                assetId,
                cancellationToken);

            if (result is null)
                return StatusCode(StatusCodes.Status403Forbidden,
                    new ErrorResponse("Download not allowed or asset has no file.", "download_forbidden"));

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ErrorResponse(ex.Message, "storage_unavailable"));
        }
    }
}
