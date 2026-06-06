using Exe.DTOs.Auth;
using Exe.DTOs.Commerce;
using Exe.DTOs.Common;
using Exe.Extensions;
using Exe.Models;
using Exe.Services;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/orders")]
[Tags("4.8 Orders")]
[Authorize]
[Produces("application/json")]
public class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<OrderResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] OrderStatus? status,
        [FromQuery] Guid? userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var currentUserId = User.GetUserId();
        if (currentUserId is null) return Unauthorized();

        if (userId.HasValue || Request.Query.ContainsKey("all"))
        {
            try
            {
                var result = await orderService.ListAllOrdersAsync(
                    currentUserId.Value,
                    userId,
                    status,
                    new PagedQuery(page, pageSize),
                    cancellationToken);
                return Ok(result);
            }
            catch (ForbiddenException ex)
            {
                return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
            }
        }

        return Ok(await orderService.ListMyOrdersAsync(
            currentUserId.Value,
            status,
            new PagedQuery(page, pageSize),
            cancellationToken));
    }

    [HttpGet("me/summary")]
    [ProducesResponseType(typeof(OrdersSummaryResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySummary(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await orderService.GetMyOrdersSummaryAsync(userId.Value, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var order = await orderService.GetMyOrderAsync(userId.Value, id, cancellationToken);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPost("subscription")]
    public async Task<IActionResult> CreateSubscriptionOrder(
        [FromBody] CreateSubscriptionOrderRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var order = await orderService.CreateSubscriptionOrderAsync(userId.Value, request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            return StatusCode(500, new ErrorResponse(ex.InnerException?.Message ?? ex.Message, "database_error"));
        }
    }

    [HttpPost("assets")]
    public async Task<IActionResult> CreateAssetOrder(
        [FromBody] CreateAssetOrderRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var order = await orderService.CreateAssetOrderAsync(userId.Value, request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Not enough xu", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new ErrorResponse(ex.Message, "insufficient_credits"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "wallet_error"));
        }
    }

    [HttpPost("credit-packs")]
    public async Task<IActionResult> CreateCreditPackOrder(
        [FromBody] CreateCreditPackOrderRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        try
        {
            var order = await orderService.CreateCreditPackOrderAsync(userId.Value, request, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("subscription", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new ErrorResponse(ex.Message, "subscription_required"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "order_error"));
        }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var order = await orderService.AdminUpdateStatusAsync(userId.Value, id, request, cancellationToken);
            return order is null ? NotFound() : Ok(order);
        }
        catch (ForbiddenException ex)
        {
            return StatusCode(403, new ErrorResponse(ex.Message, "forbidden"));
        }
    }
}
