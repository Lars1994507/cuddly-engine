using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("blueprints")]
public class BlueprintsController(AppDbContext db) : ControllerBase
{
    private static readonly Regex IdPattern = new(@"^BP-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];

    public class CreateDto
    {
        public string BlueprintId { get; set; } = "";
        public string Name { get; set; } = "";
        public string Category { get; set; } = "";
        public string Version { get; set; } = "";
        public string? Status { get; set; }
        public string Purpose { get; set; } = "";
        public string? WhatItIsFor { get; set; }
        public string? WhatItIsNotFor { get; set; }
        public string? FrontendStructure { get; set; }
        public string? BackendStructure { get; set; }
        public string? AuthAssumptions { get; set; }
        public string? UserModelAssumptions { get; set; }
        public string? NavigationAssumptions { get; set; }
        public string[]? DefaultPages { get; set; }
        public string[]? DefaultComponents { get; set; }
        public string? ContextInventoryFilters { get; set; }
        public string? InitializationRules { get; set; }
        public string? PlaceholderRules { get; set; }
        public string[]? RequiredReviewSteps { get; set; }
    }

    public class UpdateDto
    {
        public string? Name { get; set; }
        public string? Category { get; set; }
        public string? Version { get; set; }
        public string? Status { get; set; }
        public string? Purpose { get; set; }
        public string? WhatItIsFor { get; set; }
        public string? WhatItIsNotFor { get; set; }
        public string? FrontendStructure { get; set; }
        public string? BackendStructure { get; set; }
        public string? AuthAssumptions { get; set; }
        public string? UserModelAssumptions { get; set; }
        public string? NavigationAssumptions { get; set; }
        public string[]? DefaultPages { get; set; }
        public string[]? DefaultComponents { get; set; }
        public string? ContextInventoryFilters { get; set; }
        public string? InitializationRules { get; set; }
        public string? PlaceholderRules { get; set; }
        public string[]? RequiredReviewSteps { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        try
        {
            if (!IdPattern.IsMatch(dto.BlueprintId))
                return BadRequest(new { error = $"Invalid blueprint_id \"{dto.BlueprintId}\". Expected format: BP-WORD-V001" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = new Blueprint
            {
                BlueprintId = dto.BlueprintId, Name = dto.Name, Category = dto.Category, Version = dto.Version,
                Status = dto.Status ?? "Draft", Purpose = dto.Purpose, WhatItIsFor = dto.WhatItIsFor, WhatItIsNotFor = dto.WhatItIsNotFor, FrontendStructure = dto.FrontendStructure,
                BackendStructure = dto.BackendStructure, AuthAssumptions = dto.AuthAssumptions,
                UserModelAssumptions = dto.UserModelAssumptions, NavigationAssumptions = dto.NavigationAssumptions,
                DefaultPages = dto.DefaultPages ?? [], DefaultComponents = dto.DefaultComponents ?? [],
                ContextInventoryFilters = dto.ContextInventoryFilters, InitializationRules = dto.InitializationRules,
                PlaceholderRules = dto.PlaceholderRules, RequiredReviewSteps = dto.RequiredReviewSteps ?? [],
            };
            db.Blueprints.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? category)
    {
        var q = db.Blueprints.AsQueryable();
        if (status != null) q = q.Where(b => b.Status == status);
        if (category != null) q = q.Where(b => b.Category == category);
        return Ok(await q.OrderBy(b => b.Name).ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.Blueprints.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDto dto)
    {
        try
        {
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = await db.Blueprints.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            if (dto.Name != null) entity.Name = dto.Name;
            if (dto.Category != null) entity.Category = dto.Category;
            if (dto.Version != null) entity.Version = dto.Version;
            if (dto.Status != null) entity.Status = dto.Status;
            if (dto.Purpose != null) entity.Purpose = dto.Purpose;
            if (dto.WhatItIsFor != null) entity.WhatItIsFor = dto.WhatItIsFor;
            if (dto.WhatItIsNotFor != null) entity.WhatItIsNotFor = dto.WhatItIsNotFor;
            if (dto.FrontendStructure != null) entity.FrontendStructure = dto.FrontendStructure;
            if (dto.BackendStructure != null) entity.BackendStructure = dto.BackendStructure;
            if (dto.AuthAssumptions != null) entity.AuthAssumptions = dto.AuthAssumptions;
            if (dto.UserModelAssumptions != null) entity.UserModelAssumptions = dto.UserModelAssumptions;
            if (dto.NavigationAssumptions != null) entity.NavigationAssumptions = dto.NavigationAssumptions;
            if (dto.DefaultPages != null) entity.DefaultPages = dto.DefaultPages;
            if (dto.DefaultComponents != null) entity.DefaultComponents = dto.DefaultComponents;
            if (dto.ContextInventoryFilters != null) entity.ContextInventoryFilters = dto.ContextInventoryFilters;
            if (dto.InitializationRules != null) entity.InitializationRules = dto.InitializationRules;
            if (dto.PlaceholderRules != null) entity.PlaceholderRules = dto.PlaceholderRules;
            if (dto.RequiredReviewSteps != null) entity.RequiredReviewSteps = dto.RequiredReviewSteps;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ? NotFound(new { error = ex.Message }) : BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.Blueprints.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{id}/castle-units")]
    public async Task<IActionResult> ListCastleUnits(string id)
    {
        var rows = await db.BlueprintCastleUnits.Where(r => r.BlueprintId == id).Include(r => r.CastleUnit).ToListAsync();
        return Ok(rows.Select(r => r.CastleUnit));
    }

    [HttpPost("{id}/castle-units")]
    public async Task<IActionResult> AddCastleUnit(string id, [FromBody] AddUnitDto dto)
    {
        if (string.IsNullOrEmpty(dto.CastleUnitId)) return BadRequest(new { error = "castle_unit_id is required" });
        try { db.BlueprintCastleUnits.Add(new BlueprintCastleUnit { BlueprintId = id, CastleUnitId = dto.CastleUnitId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/castle-units/{unitId}")]
    public async Task<IActionResult> RemoveCastleUnit(string id, string unitId)
    {
        var row = await db.BlueprintCastleUnits.FindAsync(id, unitId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.BlueprintCastleUnits.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/castle-services")]
    public async Task<IActionResult> ListCastleServices(string id)
    {
        var rows = await db.BlueprintCastleServices.Where(r => r.BlueprintId == id).Include(r => r.CastleService).ToListAsync();
        return Ok(rows.Select(r => r.CastleService));
    }

    [HttpPost("{id}/castle-services")]
    public async Task<IActionResult> AddCastleService(string id, [FromBody] AddServiceDto dto)
    {
        if (string.IsNullOrEmpty(dto.CastleServiceId)) return BadRequest(new { error = "castle_service_id is required" });
        try { db.BlueprintCastleServices.Add(new BlueprintCastleService { BlueprintId = id, CastleServiceId = dto.CastleServiceId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/castle-services/{serviceId}")]
    public async Task<IActionResult> RemoveCastleService(string id, string serviceId)
    {
        var row = await db.BlueprintCastleServices.FindAsync(id, serviceId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.BlueprintCastleServices.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    [HttpGet("{id}/composites")]
    public async Task<IActionResult> ListComposites(string id)
    {
        var rows = await db.BlueprintComposites.Where(r => r.BlueprintId == id).Include(r => r.Composite).ToListAsync();
        return Ok(rows.Select(r => r.Composite));
    }

    [HttpPost("{id}/composites")]
    public async Task<IActionResult> AddComposite(string id, [FromBody] AddCompositeDto dto)
    {
        if (string.IsNullOrEmpty(dto.CompositeId)) return BadRequest(new { error = "composite_id is required" });
        try { db.BlueprintComposites.Add(new BlueprintComposite { BlueprintId = id, CompositeId = dto.CompositeId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/composites/{compositeId}")]
    public async Task<IActionResult> RemoveComposite(string id, string compositeId)
    {
        var row = await db.BlueprintComposites.FindAsync(id, compositeId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.BlueprintComposites.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    public class AddUnitDto { public string CastleUnitId { get; set; } = ""; }
    public class AddServiceDto { public string CastleServiceId { get; set; } = ""; }
    public class AddCompositeDto { public string CompositeId { get; set; } = ""; }
}
