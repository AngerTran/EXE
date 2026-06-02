using Exe.DTOs.Marketplace;
using Exe.Services.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Exe.Controllers.V1;

[ApiController]
[Route("api/v1/categories")]
[Tags("4.4 Categories & Tags")]
[Produces("application/json")]
public class CategoriesController(ILookupService lookupService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CategoryListResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var result = await lookupService.GetCategoriesAsync(cancellationToken);
        return Ok(result);
    }
}
