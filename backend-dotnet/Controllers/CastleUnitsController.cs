using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("castle-units")]
public class CastleUnitsController(AppDbContext db) : ControllerBase
{
    private static readonly Regex IdPattern = new(@"^CU-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];

    public class CreateDto
    {
        public string CastleUnitId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string PermissionScope { get; set; } = "";
        public string? DomainNotes { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? PermissionScope { get; set; }
        public string? DomainNotes { get; set; }
        public string? Status { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        try
        {
            if (!IdPattern.IsMatch(dto.CastleUnitId))
                return BadRequest(new { error = $"Invalid castle_unit_id \"{dto.CastleUnitId}\". Expected format: CU-WORD-V001" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = new CastleUnit { CastleUnitId = dto.CastleUnitId, Name = dto.Name, Description = dto.Description, PermissionScope = dto.PermissionScope, DomainNotes = dto.DomainNotes, Status = dto.Status ?? "Draft" };
            db.CastleUnits.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        var q = db.CastleUnits.AsQueryable();
        if (status != null) q = q.Where(u => u.Status == status);
        return Ok(await q.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.CastleUnits.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDto dto)
    {
        try
        {
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = await db.CastleUnits.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            if (dto.Name != null) entity.Name = dto.Name;
            if (dto.Description != null) entity.Description = dto.Description;
            if (dto.PermissionScope != null) entity.PermissionScope = dto.PermissionScope;
            if (dto.DomainNotes != null) entity.DomainNotes = dto.DomainNotes;
            if (dto.Status != null) entity.Status = dto.Status;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ? NotFound(new { error = ex.Message }) : BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.CastleUnits.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{id}/services")]
    public async Task<IActionResult> ListServices(string id)
    {
        var rows = await db.CastleUnitServices.Where(r => r.CastleUnitId == id).Include(r => r.CastleService).ToListAsync();
        return Ok(rows.Select(r => r.CastleService));
    }

    [HttpPost("{id}/services")]
    public async Task<IActionResult> AddService(string id, [FromBody] AddServiceDto dto)
    {
        if (string.IsNullOrEmpty(dto.CastleServiceId)) return BadRequest(new { error = "castle_service_id is required" });
        try { db.CastleUnitServices.Add(new CastleUnitService { CastleUnitId = id, CastleServiceId = dto.CastleServiceId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/services/{serviceId}")]
    public async Task<IActionResult> RemoveService(string id, string serviceId)
    {
        var row = await db.CastleUnitServices.FindAsync(id, serviceId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleUnitServices.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/composites")]
    public async Task<IActionResult> ListComposites(string id)
    {
        var rows = await db.CastleUnitComposites.Where(r => r.CastleUnitId == id).Include(r => r.Composite).ToListAsync();
        return Ok(rows.Select(r => r.Composite));
    }

    [HttpPost("{id}/composites")]
    public async Task<IActionResult> AddComposite(string id, [FromBody] AddCompositeDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompositeId)) return BadRequest(new { error = "composite_id is required" });
        try { db.CastleUnitComposites.Add(new CastleUnitComposite { CastleUnitId = id, CompositeId = dto.CompositeId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/composites/{compositeId}")]
    public async Task<IActionResult> RemoveComposite(string id, string compositeId)
    {
        var row = await db.CastleUnitComposites.FindAsync(id, compositeId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleUnitComposites.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    public class AddServiceDto { public string CastleServiceId { get; set; } = ""; }
    public class AddCompositeDto { public string CompositeId { get; set; } = ""; }
}
