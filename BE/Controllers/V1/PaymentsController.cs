using Exe.DTOs.Auth;
using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.Extensions;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/payments")]
[Tags("4.9 Payments")]
[Produces("application/json")]
public class PaymentsController(
    IPaymentService paymentService,
    BankTransferInfoService bankTransferInfoService) : ControllerBase
{
    [HttpGet("bank-transfer-info")]
    [Authorize]
    [ProducesResponseType(typeof(BankTransferInfoResponse), StatusCodes.Status200OK)]
    public IActionResult GetBankTransferInfo(
        [FromQuery] long? amountVnd,
        [FromQuery] string? transferMemo)
    {
        var info = bankTransferInfoService.GetInfo(amountVnd, transferMemo);
        if (string.IsNullOrWhiteSpace(info.AccountNumber))
            return BadRequest(new ErrorResponse("Chưa cấu hình tài khoản ngân hàng (BankTransfer trong appsettings).", "bank_not_configured"));

        return Ok(info);
    }

    [HttpGet]
    [Authorize]
    [ProducesResponseType(typeof(PagedResponse<PaymentResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await paymentService.ListMyPaymentsAsync(
            userId.Value,
            new PagedQuery(page, pageSize),
            cancellationToken));
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(CreatePaymentResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePaymentRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var payment = await paymentService.CreatePaymentForOrderAsync(userId.Value, request, cancellationToken);
            return Created(string.Empty, payment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "configuration_error"));
        }
    }

    [HttpGet("by-order/{orderId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetByOrderId(Guid orderId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var payment = await paymentService.GetByOrderIdAsync(userId.Value, orderId, cancellationToken);
        return payment is null ? NotFound() : Ok(payment);
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var payment = await paymentService.GetMyPaymentAsync(userId.Value, id, cancellationToken);
        return payment is null ? NotFound() : Ok(payment);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var payment = await paymentService.CancelPaymentAsync(userId.Value, id, cancellationToken);
            return payment is null ? NotFound() : Ok(payment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "invalid_status"));
        }
    }
}
