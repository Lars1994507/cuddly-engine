using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("castle-services")]
public class CastleServicesController(AppDbContext db) : ControllerBase
{
    private static readonly Regex IdPattern = new(@"^CS-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];

    public class CreateDto
    {
        public string CastleServiceId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Capability { get; set; } = "";
        public string[]? BackendModules { get; set; }
        public string? ApiContracts { get; set; }
        public string? DatabaseInteractions { get; set; }
        public string? FrontendVisibility { get; set; }
        public string? AdminControls { get; set; }
        public string? Observability { get; set; }
        public string? Logging { get; set; }
        public string? HealthChecks { get; set; }
        public string? PermissionRules { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateDto
    {
        public string? Name { get; set; }
        public string? Capability { get; set; }
        public string[]? BackendModules { get; set; }
        public string? ApiContracts { get; set; }
        public string? DatabaseInteractions { get; set; }
        public string? FrontendVisibility { get; set; }
        public string? AdminControls { get; set; }
        public string? Observability { get; set; }
        public string? Logging { get; set; }
        public string? HealthChecks { get; set; }
        public string? PermissionRules { get; set; }
        public string? Status { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        try
        {
            if (!IdPattern.IsMatch(dto.CastleServiceId))
                return BadRequest(new { error = $"Invalid castle_service_id \"{dto.CastleServiceId}\". Expected format: CS-WORD-V001" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });

            var entity = new CastleService
            {
                CastleServiceId = dto.CastleServiceId, Name = dto.Name, Capability = dto.Capability,
                BackendModules = dto.BackendModules ?? [], ApiContracts = dto.ApiContracts,
                DatabaseInteractions = dto.DatabaseInteractions, FrontendVisibility = dto.FrontendVisibility,
                AdminControls = dto.AdminControls, Observability = dto.Observability,
                Logging = dto.Logging, HealthChecks = dto.HealthChecks,
                PermissionRules = dto.PermissionRules, Status = dto.Status ?? "Draft",
            };
            db.CastleServices.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status)
    {
        var q = db.CastleServices.AsQueryable();
        if (status != null) q = q.Where(s => s.Status == status);
        return Ok(await q.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.CastleServices.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDto dto)
    {
        try
        {
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = await db.CastleServices.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            if (dto.Name != null) entity.Name = dto.Name;
            if (dto.Capability != null) entity.Capability = dto.Capability;
            if (dto.BackendModules != null) entity.BackendModules = dto.BackendModules;
            if (dto.ApiContracts != null) entity.ApiContracts = dto.ApiContracts;
            if (dto.DatabaseInteractions != null) entity.DatabaseInteractions = dto.DatabaseInteractions;
            if (dto.FrontendVisibility != null) entity.FrontendVisibility = dto.FrontendVisibility;
            if (dto.AdminControls != null) entity.AdminControls = dto.AdminControls;
            if (dto.Observability != null) entity.Observability = dto.Observability;
            if (dto.Logging != null) entity.Logging = dto.Logging;
            if (dto.HealthChecks != null) entity.HealthChecks = dto.HealthChecks;
            if (dto.PermissionRules != null) entity.PermissionRules = dto.PermissionRules;
            if (dto.Status != null) entity.Status = dto.Status;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ? NotFound(new { error = ex.Message }) : BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.CastleServices.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{id}/composites")]
    public async Task<IActionResult> ListComposites(string id)
    {
        var rows = await db.CastleServiceComposites.Where(r => r.CastleServiceId == id).Include(r => r.Composite).ToListAsync();
        return Ok(rows.Select(r => r.Composite));
    }

    [HttpPost("{id}/composites")]
    public async Task<IActionResult> AddComposite(string id, [FromBody] AddCompositeDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompositeId)) return BadRequest(new { error = "composite_id is required" });
        try { db.CastleServiceComposites.Add(new CastleServiceComposite { CastleServiceId = id, CompositeId = dto.CompositeId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/composites/{compositeId}")]
    public async Task<IActionResult> RemoveComposite(string id, string compositeId)
    {
        var row = await db.CastleServiceComposites.FindAsync(id, compositeId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleServiceComposites.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/compounds")]
    public async Task<IActionResult> ListCompounds(string id)
    {
        var rows = await db.CastleServiceCompounds.Where(r => r.CastleServiceId == id).Include(r => r.Compound).ToListAsync();
        return Ok(rows.Select(r => r.Compound));
    }

    [HttpPost("{id}/compounds")]
    public async Task<IActionResult> AddCompound(string id, [FromBody] AddCompoundDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompoundId)) return BadRequest(new { error = "compound_id is required" });
        try { db.CastleServiceCompounds.Add(new CastleServiceCompound { CastleServiceId = id, CompoundId = dto.CompoundId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/compounds/{compoundId}")]
    public async Task<IActionResult> RemoveCompound(string id, string compoundId)
    {
        var row = await db.CastleServiceCompounds.FindAsync(id, compoundId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleServiceCompounds.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/atomic-assets")]
    public async Task<IActionResult> ListAtomicAssets(string id)
    {
        var rows = await db.CastleServiceAtomicAssets.Where(r => r.CastleServiceId == id).Include(r => r.AtomicAsset).ToListAsync();
        return Ok(rows.Select(r => r.AtomicAsset));
    }

    [HttpPost("{id}/atomic-assets")]
    public async Task<IActionResult> AddAtomicAsset(string id, [FromBody] AddAtomicAssetDto dto)
    {
        if (string.IsNullOrEmpty(dto.AtomicAssetId)) return BadRequest(new { error = "atomic_asset_id is required" });
        try { db.CastleServiceAtomicAssets.Add(new CastleServiceAtomicAsset { CastleServiceId = id, AtomicAssetId = dto.AtomicAssetId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/atomic-assets/{assetId}")]
    public async Task<IActionResult> RemoveAtomicAsset(string id, string assetId)
    {
        var row = await db.CastleServiceAtomicAssets.FindAsync(id, assetId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleServiceAtomicAssets.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    public class AddCompositeDto { public string CompositeId { get; set; } = ""; }
    public class AddCompoundDto { public string CompoundId { get; set; } = ""; }
    public class AddAtomicAssetDto { public string AtomicAssetId { get; set; } = ""; }
}
