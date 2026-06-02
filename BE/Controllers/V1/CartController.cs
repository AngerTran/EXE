using Exe.DTOs.Auth;
using Exe.DTOs.Commerce;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/cart")]
[Tags("4.7 Cart")]
[Authorize]
[Produces("application/json")]
public class CartController(ICartService cartService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(CartResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCart(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await cartService.GetCartAsync(userId.Value, cancellationToken));
    }

    [HttpPost("items")]
    [ProducesResponseType(typeof(CartItemResponse), StatusCodes.Status201Created)]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var item = await cartService.AddItemAsync(userId.Value, request, cancellationToken);
            return CreatedAtAction(nameof(GetCart), item);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "validation_error"));
        }
    }

    [HttpPatch("items/{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateCartItemRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var item = await cartService.UpdateItemAsync(userId.Value, id, request, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> RemoveItem(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return await cartService.RemoveItemAsync(userId.Value, id, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        await cartService.ClearCartAsync(userId.Value, cancellationToken);
        return NoContent();
    }
}
