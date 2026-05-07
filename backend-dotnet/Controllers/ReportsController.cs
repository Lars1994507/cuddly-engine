using CastleInventoryAX.Services;
using Microsoft.AspNetCore.Mvc;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("reports")]
public class ReportsController(ReportsService reportsService) : ControllerBase
{
    [HttpGet("castles")]
    public async Task<IActionResult> ListCastles([FromQuery] string? status, [FromQuery] string? castle_type_id, [FromQuery] string? blueprint_id)
        => Ok(await reportsService.ListCastles(status, castle_type_id, blueprint_id));

    [HttpGet("blueprints")]
    public async Task<IActionResult> ListBlueprints([FromQuery] string? status, [FromQuery] string? category)
        => Ok(await reportsService.ListBlueprints(status, category));

    [HttpGet("castle-types")]
    public async Task<IActionResult> ListCastleTypes([FromQuery] string? status)
        => Ok(await reportsService.ListCastleTypes(status));

    [HttpGet("castle-units")]
    public async Task<IActionResult> ListCastleUnits([FromQuery] string? status)
        => Ok(await reportsService.ListCastleUnits(status));

    [HttpGet("castle-services")]
    public async Task<IActionResult> ListCastleServices([FromQuery] string? status)
        => Ok(await reportsService.ListCastleServices(status));

    [HttpGet("composites")]
    public async Task<IActionResult> ListComposites([FromQuery] string? status, [FromQuery] string? ui_backend_scope)
        => Ok(await reportsService.ListComposites(status, ui_backend_scope));

    [HttpGet("compounds")]
    public async Task<IActionResult> ListCompounds([FromQuery] string? status)
        => Ok(await reportsService.ListCompounds(status));

    [HttpGet("atomic-assets")]
    public async Task<IActionResult> ListAtomicAssets([FromQuery] string? status, [FromQuery] string? asset_type)
        => Ok(await reportsService.ListAtomicAssets(status, asset_type));

    [HttpGet("reuse")]
    public async Task<IActionResult> GetReuseReport()
        => Ok(await reportsService.GetReuseReport());

    [HttpGet("deprecated")]
    public async Task<IActionResult> GetDeprecated()
        => Ok(await reportsService.GetDeprecatedAssets());

    [HttpGet("duplicates")]
    public async Task<IActionResult> FindDuplicates()
        => Ok(await reportsService.FindDuplicates());

    [HttpGet("local-modifications")]
    public async Task<IActionResult> GetLocalModifications([FromQuery] string? castle_record_id)
        => Ok(await reportsService.GetLocalModifications(castle_record_id));

    [HttpGet("promotion-candidates")]
    public async Task<IActionResult> GetPromotionCandidates()
        => Ok(await reportsService.GetPromotionCandidates());

    [HttpGet("build-readiness/{castleRecordId}")]
    public async Task<IActionResult> GetBuildReadiness(string castleRecordId)
    {
        try { return Ok(await reportsService.GetBuildReadiness(castleRecordId)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("approval-status")]
    public async Task<IActionResult> GetApprovalStatus()
        => Ok(await reportsService.GetApprovalStatus());

    [HttpGet("dependency-map/{entityType}/{entityId}")]
    public async Task<IActionResult> GetDependencyMap(string entityType, string entityId)
    {
        try { return Ok(await reportsService.GetDependencyMap(entityId, entityType)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}
