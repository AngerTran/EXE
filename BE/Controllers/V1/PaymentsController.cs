using Exe.DTOs.Auth;
using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/payments")]
[Tags("4.9 Payments")]
[Produces("application/json")]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
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

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var payment = await paymentService.GetMyPaymentAsync(userId.Value, id, cancellationToken);
        return payment is null ? NotFound() : Ok(payment);
    }

    [HttpPost("webhook/momo")]
    [AllowAnonymous]
    public async Task<IActionResult> MomoWebhook(
        [FromBody] PaymentWebhookRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await paymentService.HandleWebhookAsync("momo", request, cancellationToken);
            return Ok(new { received = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpPost("webhook/vnpay")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayWebhook(
        [FromBody] PaymentWebhookRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            await paymentService.HandleWebhookAsync("vnpay", request, cancellationToken);
            return Ok(new { received = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }
}
