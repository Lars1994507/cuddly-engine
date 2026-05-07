using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("castle-types")]
public class CastleTypesController(AppDbContext db) : ControllerBase
{
    private static readonly Regex IdPattern = new(@"^CT-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];

    public class CreateDto
    {
        public string CastleTypeId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string CommonPurpose { get; set; } = "";
        public string[]? TypicalUseCases { get; set; }
        public string? RecommendedAssetFilters { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? CommonPurpose { get; set; }
        public string[]? TypicalUseCases { get; set; }
        public string? RecommendedAssetFilters { get; set; }
        public string? Status { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        try
        {
            if (!IdPattern.IsMatch(dto.CastleTypeId))
                return BadRequest(new { error = $"Invalid castle_type_id \"{dto.CastleTypeId}\". Expected format: CT-WORD-V001" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = new CastleType { CastleTypeId = dto.CastleTypeId, Name = dto.Name, Description = dto.Description, CommonPurpose = dto.CommonPurpose, TypicalUseCases = dto.TypicalUseCases ?? [], RecommendedAssetFilters = dto.RecommendedAssetFilters, Status = dto.Status ?? "Draft" };
            db.CastleTypes.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        var q = db.CastleTypes.AsQueryable();
        if (status != null) q = q.Where(ct => ct.Status == status);
        return Ok(await q.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.CastleTypes.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDto dto)
    {
        try
        {
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = await db.CastleTypes.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            if (dto.Name != null) entity.Name = dto.Name;
            if (dto.Description != null) entity.Description = dto.Description;
            if (dto.CommonPurpose != null) entity.CommonPurpose = dto.CommonPurpose;
            if (dto.TypicalUseCases != null) entity.TypicalUseCases = dto.TypicalUseCases;
            if (dto.RecommendedAssetFilters != null) entity.RecommendedAssetFilters = dto.RecommendedAssetFilters;
            if (dto.Status != null) entity.Status = dto.Status;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ? NotFound(new { error = ex.Message }) : BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.CastleTypes.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{id}/blueprints")]
    public async Task<IActionResult> ListBlueprints(string id)
    {
        var rows = await db.CastleTypeBlueprints.Where(r => r.CastleTypeId == id).Include(r => r.Blueprint).ToListAsync();
        return Ok(rows.Select(r => r.Blueprint));
    }

    [HttpPost("{id}/blueprints")]
    public async Task<IActionResult> AddBlueprint(string id, [FromBody] AddBlueprintDto dto)
    {
        if (string.IsNullOrEmpty(dto.BlueprintId)) return BadRequest(new { error = "blueprint_id is required" });
        try { db.CastleTypeBlueprints.Add(new CastleTypeBlueprint { CastleTypeId = id, BlueprintId = dto.BlueprintId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/blueprints/{blueprintId}")]
    public async Task<IActionResult> RemoveBlueprint(string id, string blueprintId)
    {
        var row = await db.CastleTypeBlueprints.FindAsync(id, blueprintId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleTypeBlueprints.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/castle-units")]
    public async Task<IActionResult> ListCastleUnits(string id)
    {
        var rows = await db.CastleTypeCastleUnits.Where(r => r.CastleTypeId == id).Include(r => r.CastleUnit).ToListAsync();
        return Ok(rows.Select(r => r.CastleUnit));
    }

    [HttpPost("{id}/castle-units")]
    public async Task<IActionResult> AddCastleUnit(string id, [FromBody] AddUnitDto dto)
    {
        if (string.IsNullOrEmpty(dto.CastleUnitId)) return BadRequest(new { error = "castle_unit_id is required" });
        try { db.CastleTypeCastleUnits.Add(new CastleTypeCastleUnit { CastleTypeId = id, CastleUnitId = dto.CastleUnitId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/castle-units/{unitId}")]
    public async Task<IActionResult> RemoveCastleUnit(string id, string unitId)
    {
        var row = await db.CastleTypeCastleUnits.FindAsync(id, unitId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleTypeCastleUnits.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/castle-services")]
    public async Task<IActionResult> ListCastleServices(string id)
    {
        var rows = await db.CastleTypeCastleServices.Where(r => r.CastleTypeId == id).Include(r => r.CastleService).ToListAsync();
        return Ok(rows.Select(r => r.CastleService));
    }

    [HttpPost("{id}/castle-services")]
    public async Task<IActionResult> AddCastleService(string id, [FromBody] AddServiceDto dto)
    {
        if (string.IsNullOrEmpty(dto.CastleServiceId)) return BadRequest(new { error = "castle_service_id is required" });
        try { db.CastleTypeCastleServices.Add(new CastleTypeCastleService { CastleTypeId = id, CastleServiceId = dto.CastleServiceId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/castle-services/{serviceId}")]
    public async Task<IActionResult> RemoveCastleService(string id, string serviceId)
    {
        var row = await db.CastleTypeCastleServices.FindAsync(id, serviceId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleTypeCastleServices.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    public class AddBlueprintDto { public string BlueprintId { get; set; } = ""; }
    public class AddUnitDto { public string CastleUnitId { get; set; } = ""; }
    public class AddServiceDto { public string CastleServiceId { get; set; } = ""; }
}
