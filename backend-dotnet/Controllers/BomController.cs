using CastleInventoryAX.Services;
using Microsoft.AspNetCore.Mvc;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("bom")]
public class BomController(BomService bomService) : ControllerBase
{
    [HttpGet("{castleRecordId}")]
    public async Task<IActionResult> GetBom(string castleRecordId)
    {
        try
        {
            var result = await bomService.GenerateBom(castleRecordId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("impact/{entityType}/{entityId}")]
    public async Task<IActionResult> GetImpact(string entityType, string entityId)
    {
        var validTypes = new[] { "AtomicAsset", "Compound", "Composite", "CastleService", "CastleUnit" };
        if (!validTypes.Contains(entityType))
            return BadRequest(new { error = $"Invalid entity_type \"{entityType}\". Must be one of: {string.Join(", ", validTypes)}" });

        try
        {
            var result = await bomService.TraceImpact(entityId, entityType);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
