using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("composites")]
public class CompositesController(AppDbContext db) : ControllerBase
{
    private static readonly Regex IdPattern = new(@"^COMP-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];
    private static readonly string[] ValidScopes = ["UI", "Backend", "Both"];

    public class CreateDto
    {
        public string CompositeId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string Version { get; set; } = "";
        public string UiBackendScope { get; set; } = "";
        public string? Status { get; set; }
        public string[]? UsageReferences { get; set; }
        public string? ApprovalStatus { get; set; }
        public string? ReuseNotes { get; set; }
    }

    public class UpdateDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Version { get; set; }
        public string? UiBackendScope { get; set; }
        public string? Status { get; set; }
        public string[]? UsageReferences { get; set; }
        public string? ApprovalStatus { get; set; }
        public string? ReuseNotes { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        try
        {
            if (!IdPattern.IsMatch(dto.CompositeId))
                return BadRequest(new { error = $"Invalid composite_id \"{dto.CompositeId}\". Expected format: COMP-WORD-V001" });
            if (!ValidScopes.Contains(dto.UiBackendScope))
                return BadRequest(new { error = $"Invalid ui_backend_scope \"{dto.UiBackendScope}\"" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });

            var entity = new Composite { CompositeId = dto.CompositeId, Name = dto.Name, Description = dto.Description, Version = dto.Version, UiBackendScope = dto.UiBackendScope, Status = dto.Status ?? "Draft", UsageReferences = dto.UsageReferences ?? [], ApprovalStatus = dto.ApprovalStatus, ReuseNotes = dto.ReuseNotes };
            db.Composites.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? ui_backend_scope)
    {
        var q = db.Composites.AsQueryable();
        if (status != null) q = q.Where(c => c.Status == status);
        if (ui_backend_scope != null) q = q.Where(c => c.UiBackendScope == ui_backend_scope);
        return Ok(await q.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.Composites.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDto dto)
    {
        try
        {
            if (dto.UiBackendScope != null && !ValidScopes.Contains(dto.UiBackendScope))
                return BadRequest(new { error = $"Invalid ui_backend_scope \"{dto.UiBackendScope}\"" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = await db.Composites.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            if (dto.Name != null) entity.Name = dto.Name;
            if (dto.Description != null) entity.Description = dto.Description;
            if (dto.Version != null) entity.Version = dto.Version;
            if (dto.UiBackendScope != null) entity.UiBackendScope = dto.UiBackendScope;
            if (dto.Status != null) entity.Status = dto.Status;
            if (dto.UsageReferences != null) entity.UsageReferences = dto.UsageReferences;
            if (dto.ApprovalStatus != null) entity.ApprovalStatus = dto.ApprovalStatus;
            if (dto.ReuseNotes != null) entity.ReuseNotes = dto.ReuseNotes;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ? NotFound(new { error = ex.Message }) : BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.Composites.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{id}/compounds")]
    public async Task<IActionResult> ListCompounds(string id)
    {
        var rows = await db.CompositeCompounds.Where(r => r.CompositeId == id).Include(r => r.Compound).ToListAsync();
        return Ok(rows.Select(r => r.Compound));
    }

    [HttpPost("{id}/compounds")]
    public async Task<IActionResult> AddCompound(string id, [FromBody] AddCompoundDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompoundId)) return BadRequest(new { error = "compound_id is required" });
        try
        {
            db.CompositeCompounds.Add(new CompositeCompound { CompositeId = id, CompoundId = dto.CompoundId });
            await db.SaveChangesAsync();
            return StatusCode(204);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/compounds/{compoundId}")]
    public async Task<IActionResult> RemoveCompound(string id, string compoundId)
    {
        var row = await db.CompositeCompounds.FindAsync(id, compoundId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CompositeCompounds.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/atomic-assets")]
    public async Task<IActionResult> ListAtomicAssets(string id)
    {
        var rows = await db.CompositeAtomicAssets.Where(r => r.CompositeId == id).Include(r => r.AtomicAsset).ToListAsync();
        return Ok(rows.Select(r => r.AtomicAsset));
    }

    [HttpPost("{id}/atomic-assets")]
    public async Task<IActionResult> AddAtomicAsset(string id, [FromBody] AddAtomicAssetDto dto)
    {
        if (string.IsNullOrEmpty(dto.AtomicAssetId)) return BadRequest(new { error = "atomic_asset_id is required" });
        try
        {
            db.CompositeAtomicAssets.Add(new CompositeAtomicAsset { CompositeId = id, AtomicAssetId = dto.AtomicAssetId });
            await db.SaveChangesAsync();
            return StatusCode(204);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/atomic-assets/{assetId}")]
    public async Task<IActionResult> RemoveAtomicAsset(string id, string assetId)
    {
        var row = await db.CompositeAtomicAssets.FindAsync(id, assetId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CompositeAtomicAssets.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    public class AddCompoundDto { public string CompoundId { get; set; } = ""; }
    public class AddAtomicAssetDto { public string AtomicAssetId { get; set; } = ""; }
}
