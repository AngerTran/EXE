using Exe.DTOs.Auth;
using Exe.DTOs.Common;
using Exe.DTOs.Wallet;
using Exe.Extensions;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/wallets")]
[Tags("4.3 Wallet")]
[Produces("application/json")]
public class WalletsController(IWalletService walletService) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(WalletMeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyWallet(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        var wallet = await walletService.GetMyWalletAsync(userId.Value, cancellationToken);
        if (wallet is null)
            return NotFound(new ErrorResponse("Wallet not found.", "wallet_not_found"));

        return Ok(wallet);
    }

    [HttpGet("me/transactions")]
    [Authorize]
    [ProducesResponseType(typeof(PagedResponse<WalletTransactionResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyTransactions(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        var result = await walletService.GetMyTransactionsAsync(
            userId.Value,
            new PagedQuery(page, pageSize),
            cancellationToken);

        return Ok(result);
    }

    [HttpPatch("{userId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(WalletMeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdminUpdateBalance(
        Guid userId,
        [FromBody] AdminUpdateWalletBalanceRequest request,
        CancellationToken cancellationToken)
    {
        var adminId = User.GetUserId();
        if (adminId is null)
            return Unauthorized(new ErrorResponse("Invalid token.", "invalid_token"));

        try
        {
            var wallet = await walletService.AdminUpdateBalanceAsync(
                adminId.Value,
                userId,
                request,
                cancellationToken);

            if (wallet is null)
                return NotFound(new ErrorResponse("Wallet not found.", "wallet_not_found"));

            return Ok(wallet);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ErrorResponse(ex.Message, "forbidden"));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }
}
