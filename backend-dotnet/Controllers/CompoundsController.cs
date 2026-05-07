using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("compounds")]
public class CompoundsController(AppDbContext db) : ControllerBase
{
    private static readonly Regex IdPattern = new(@"^CMPD-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];

    public class CreateDto
    {
        public string CompoundId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
        public string Version { get; set; } = "";
        public string? Status { get; set; }
        public string? TestingNotes { get; set; }
    }

    public class UpdateDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Version { get; set; }
        public string? Status { get; set; }
        public string? TestingNotes { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        try
        {
            if (!IdPattern.IsMatch(dto.CompoundId))
                return BadRequest(new { error = $"Invalid compound_id \"{dto.CompoundId}\". Expected format: CMPD-WORD-V001" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });

            var entity = new Compound { CompoundId = dto.CompoundId, Name = dto.Name, Description = dto.Description, Version = dto.Version, Status = dto.Status ?? "Draft", TestingNotes = dto.TestingNotes };
            db.Compounds.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        if (status != null && !ValidStatuses.Contains(status))
            return BadRequest(new { error = $"Invalid status filter \"{status}\"" });
        var q = db.Compounds.AsQueryable();
        if (status != null) q = q.Where(c => c.Status == status);
        return Ok(await q.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.Compounds.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDto dto)
    {
        try
        {
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = await db.Compounds.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            if (dto.Name != null) entity.Name = dto.Name;
            if (dto.Description != null) entity.Description = dto.Description;
            if (dto.Version != null) entity.Version = dto.Version;
            if (dto.Status != null) entity.Status = dto.Status;
            if (dto.TestingNotes != null) entity.TestingNotes = dto.TestingNotes;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ? NotFound(new { error = ex.Message }) : BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.Compounds.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{id}/atomic-assets")]
    public async Task<IActionResult> ListAtomicAssets(string id)
    {
        var rows = await db.CompoundAtomicAssets.Where(r => r.CompoundId == id).Include(r => r.AtomicAsset).ToListAsync();
        return Ok(rows.Select(r => r.AtomicAsset));
    }

    [HttpPost("{id}/atomic-assets")]
    public async Task<IActionResult> AddAtomicAsset(string id, [FromBody] AddAtomicAssetDto dto)
    {
        if (string.IsNullOrEmpty(dto.AtomicAssetId)) return BadRequest(new { error = "atomic_asset_id is required" });
        try
        {
            db.CompoundAtomicAssets.Add(new CompoundAtomicAsset { CompoundId = id, AtomicAssetId = dto.AtomicAssetId });
            await db.SaveChangesAsync();
            return StatusCode(204);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/atomic-assets/{assetId}")]
    public async Task<IActionResult> RemoveAtomicAsset(string id, string assetId)
    {
        var row = await db.CompoundAtomicAssets.FindAsync(id, assetId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CompoundAtomicAssets.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    public class AddAtomicAssetDto { public string AtomicAssetId { get; set; } = ""; }
}
