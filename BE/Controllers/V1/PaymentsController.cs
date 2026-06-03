using Exe.Configuration;
using Exe.DTOs.Auth;
using Exe.DTOs.Billing;
using Exe.DTOs.Common;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/payments")]
[Tags("4.9 Payments")]
[Produces("application/json")]
public class PaymentsController(
    IPaymentService paymentService,
    IOptions<PaymentOptions> paymentOptions) : ControllerBase
{
    private readonly PaymentOptions _paymentOptions = paymentOptions.Value;

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

    /// <summary>MoMo IPN — JSON body từ MoMo server.</summary>
    [HttpPost("webhook/momo")]
    [AllowAnonymous]
    public async Task<IActionResult> MomoWebhook(
        [FromBody] MomoIpnRequest request,
        CancellationToken cancellationToken)
    {
        var secretCheck = ValidateWebhookSecret();
        if (secretCheck is not null)
            return secretCheck;

        try
        {
            await paymentService.HandleMomoIpnAsync(request, cancellationToken);
            return Ok(new { received = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    /// <summary>VNPay IPN — query string (VNPay gọi GET).</summary>
    [HttpGet("webhook/vnpay")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayWebhook(CancellationToken cancellationToken)
    {
        var secretCheck = ValidateWebhookSecret();
        if (secretCheck is not null)
            return secretCheck;

        try
        {
            await paymentService.HandleVnpayIpnAsync(Request.Query, cancellationToken);
            return Content("OK", "text/plain");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    /// <summary>Webhook mock/dev — body { transactionId, status }.</summary>
    [HttpPost("webhook/vnpay")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayWebhookMock(
        [FromBody] PaymentWebhookRequest request,
        CancellationToken cancellationToken)
    {
        var secretCheck = ValidateWebhookSecret();
        if (secretCheck is not null)
            return secretCheck;

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

    private IActionResult? ValidateWebhookSecret()
    {
        if (string.IsNullOrWhiteSpace(_paymentOptions.WebhookSecret))
            return null;

        if (!Request.Headers.TryGetValue("X-Webhook-Secret", out var provided)
            || provided != _paymentOptions.WebhookSecret)
        {
            return Unauthorized(new ErrorResponse("Invalid webhook secret.", "unauthorized"));
        }

        return null;
    }
}
