using Exe.DTOs.Auth;
using Exe.DTOs.Commerce;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/user-assets")]
[Tags("4.10 User Assets")]
[Authorize]
[Produces("application/json")]
public class UserAssetsController(IUserAssetService userAssetService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<UserAssetListItemResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await userAssetService.ListAsync(userId.Value, cancellationToken));
    }

    [HttpGet("{assetId:guid}")]
    public async Task<IActionResult> Get(Guid assetId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var item = await userAssetService.GetAsync(userId.Value, assetId, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost("{assetId:guid}/download")]
    public async Task<IActionResult> Download(Guid assetId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var item = await userAssetService.RecordDownloadAsync(userId.Value, assetId, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{assetId:guid}/file")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadFile(Guid assetId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        try
        {
            var file = await userAssetService.DownloadFileAsync(userId.Value, assetId, cancellationToken);
            return File(file!.Content, file.ContentType, file.FileName, enableRangeProcessing: true);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new ErrorResponse(ex.Message, "asset_file_not_found"));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ErrorResponse(ex.Message, "storage_unavailable"));
        }
    }

    [HttpDelete("{assetId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveFromLibrary(Guid assetId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();

        var removed = await userAssetService.RemoveFromLibraryAsync(userId.Value, assetId, cancellationToken);
        return removed ? NoContent() : NotFound(new ErrorResponse("Asset không có trong thư viện.", "user_asset_not_found"));
    }
}
