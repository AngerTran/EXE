using Exe.DTOs.Ai;
using Exe.DTOs.Auth;
using Exe.Extensions;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/ai/sessions")]
[Tags("4.12 AI Advisor")]
[Authorize]
[Produces("application/json")]
public class AiSessionsController(IAiAdvisorService aiService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await aiService.ListSessionsAsync(userId.Value, cancellationToken));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAiSessionRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var session = await aiService.CreateSessionAsync(userId.Value, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = session.Id }, session);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var session = await aiService.GetSessionAsync(userId.Value, id, cancellationToken);
        return session is null ? NotFound() : Ok(session);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateAiSessionRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var session = await aiService.UpdateSessionAsync(userId.Value, id, request, cancellationToken);
        return session is null ? NotFound() : Ok(session);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        return await aiService.DeleteSessionAsync(userId.Value, id, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<IActionResult> SendMessage(
        Guid id,
        [FromBody] SendAiMessageRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        try
        {
            var result = await aiService.SendMessageAsync(userId.Value, id, request, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new ErrorResponse(ex.Message, "insufficient_credits"));
        }
    }

    [HttpGet("{id:guid}/export")]
    public async Task<IActionResult> Export(Guid id, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null) return Unauthorized();
        var export = await aiService.ExportSessionAsync(userId.Value, id, cancellationToken);
        return export is null ? NotFound() : Ok(export);
    }
}
