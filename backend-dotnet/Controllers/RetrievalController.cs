using CastleInventoryAX.Services;
using Microsoft.AspNetCore.Mvc;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("retrieval")]
public class RetrievalController(RetrievalService retrievalService) : ControllerBase
{
    [HttpGet("context")]
    public async Task<IActionResult> GetContext([FromQuery] string? castle_type_id, [FromQuery] string? blueprint_id)
    {
        if (string.IsNullOrEmpty(castle_type_id) || string.IsNullOrEmpty(blueprint_id))
            return BadRequest(new { error = "castle_type_id and blueprint_id are required" });
        try
        {
            var result = await retrievalService.GetRelevantContext(castle_type_id, blueprint_id);
            return Ok(result);
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("castle/{castleRecordId}")]
    public async Task<IActionResult> GetCastleContext(string castleRecordId)
    {
        try
        {
            var result = await retrievalService.GetContextForCastle(castleRecordId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return BadRequest(new { error = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}
