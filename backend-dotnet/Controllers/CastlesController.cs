using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("castles")]
public class CastlesController(AppDbContext db) : ControllerBase
{
    private static readonly Regex CastleIdPattern = new(@"^CSTL-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly Regex LmodIdPattern = new(@"^LMOD-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];
    private static readonly string[] ValidReviewStatuses = ["Pending", "Approved", "Rejected"];
    private static readonly string[] ValidPromotions = ["RemainLocal", "PromoteToCompound", "PromoteToComposite", "PromoteToService", "PromoteToBlueprint"];

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public class CreateCastleDto
    {
        public string CastleRecordId { get; set; } = "";
        public string CastleName { get; set; } = "";
        public string Version { get; set; } = "";
        public string PrimaryPurpose { get; set; } = "";
        public string? Description { get; set; }
        public string? Status { get; set; }
        public string? BuildNotes { get; set; }
        public string? ReviewNotes { get; set; }
        public string? ReuseRecommendations { get; set; }
        public string? CastleTypeId { get; set; }
        public string? BlueprintId { get; set; }
    }

    public class UpdateCastleDto
    {
        public string? CastleName { get; set; }
        public string? Version { get; set; }
        public string? PrimaryPurpose { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public string? BuildNotes { get; set; }
        public string? ReviewNotes { get; set; }
        public string? ReuseRecommendations { get; set; }
        public string? CastleTypeId { get; set; }
        public string? BlueprintId { get; set; }
    }

    public class SetCastleTypeDto { public string? CastleTypeId { get; set; } }
    public class SetBlueprintDto { public string? BlueprintId { get; set; } }
    public class AddUnitDto { public string CastleUnitId { get; set; } = ""; }
    public class AddServiceDto { public string CastleServiceId { get; set; } = ""; }

    public class CreateLocalModDto
    {
        public string ModificationId { get; set; } = "";
        public string ModifiedItem { get; set; } = "";
        public string ChangeDescription { get; set; } = "";
        public string Reason { get; set; } = "";
        public string? RelatedAssetId { get; set; }
        public string? RelatedAssetType { get; set; }
        public string? RelatedBlueprintId { get; set; }
        public string? RelatedCastleServiceId { get; set; }
        public string? VersionNotes { get; set; }
        public string? ReviewStatus { get; set; }
        public string? PromotionRecommendation { get; set; }
        public string? TestingNotes { get; set; }
    }

    public class UpdateLocalModDto
    {
        public string? ModifiedItem { get; set; }
        public string? ChangeDescription { get; set; }
        public string? Reason { get; set; }
        public string? RelatedAssetId { get; set; }
        public string? RelatedAssetType { get; set; }
        public string? RelatedBlueprintId { get; set; }
        public string? RelatedCastleServiceId { get; set; }
        public string? VersionNotes { get; set; }
        public string? ReviewStatus { get; set; }
        public string? PromotionRecommendation { get; set; }
        public string? TestingNotes { get; set; }
    }

    // ── Castle CRUD ───────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCastleDto dto)
    {
        try
        {
            if (!CastleIdPattern.IsMatch(dto.CastleRecordId))
                return BadRequest(new { error = $"Invalid castle_record_id \"{dto.CastleRecordId}\". Expected format: CSTL-WORD-V001" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });

            var entity = new Castle
            {
                CastleRecordId = dto.CastleRecordId, CastleName = dto.CastleName, Version = dto.Version,
                PrimaryPurpose = dto.PrimaryPurpose, Description = dto.Description, Status = dto.Status ?? "Draft",
                BuildNotes = dto.BuildNotes, ReviewNotes = dto.ReviewNotes,
                ReuseRecommendations = dto.ReuseRecommendations,
                CastleTypeId = dto.CastleTypeId, BlueprintId = dto.BlueprintId,
            };
            db.Castles.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status, [FromQuery] string? castle_type_id, [FromQuery] string? blueprint_id)
    {
        try
        {
            if (status != null && !ValidStatuses.Contains(status))
                return BadRequest(new { error = $"Invalid status filter \"{status}\"" });
            var q = db.Castles.AsQueryable();
            if (status != null) q = q.Where(c => c.Status == status);
            if (castle_type_id != null) q = q.Where(c => c.CastleTypeId == castle_type_id);
            if (blueprint_id != null) q = q.Where(c => c.BlueprintId == blueprint_id);
            return Ok(await q.ToListAsync());
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.Castles.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateCastleDto dto)
    {
        try
        {
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });
            var entity = await db.Castles.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            if (dto.CastleName != null) entity.CastleName = dto.CastleName;
            if (dto.Version != null) entity.Version = dto.Version;
            if (dto.PrimaryPurpose != null) entity.PrimaryPurpose = dto.PrimaryPurpose;
            if (dto.Description != null) entity.Description = dto.Description;
            if (dto.Status != null) entity.Status = dto.Status;
            if (dto.BuildNotes != null) entity.BuildNotes = dto.BuildNotes;
            if (dto.ReviewNotes != null) entity.ReviewNotes = dto.ReviewNotes;
            if (dto.ReuseRecommendations != null) entity.ReuseRecommendations = dto.ReuseRecommendations;
            if (dto.CastleTypeId != null) entity.CastleTypeId = dto.CastleTypeId;
            if (dto.BlueprintId != null) entity.BlueprintId = dto.BlueprintId;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase) ? NotFound(new { error = ex.Message }) : BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.Castles.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    // ── Castle Type / Blueprint ────────────────────────────────────────────────

    [HttpPatch("{id}/castle-type")]
    public async Task<IActionResult> SetCastleType(string id, [FromBody] SetCastleTypeDto dto)
    {
        try
        {
            var entity = await db.Castles.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            entity.CastleTypeId = dto.CastleTypeId;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPatch("{id}/blueprint")]
    public async Task<IActionResult> SetBlueprint(string id, [FromBody] SetBlueprintDto dto)
    {
        try
        {
            var entity = await db.Castles.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });
            entity.BlueprintId = dto.BlueprintId;
            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    // ── Castle Units ──────────────────────────────────────────────────────────

    [HttpGet("{id}/castle-units")]
    public async Task<IActionResult> ListCastleUnits(string id)
    {
        var rows = await db.CastleCastleUnits.Where(r => r.CastleRecordId == id).Include(r => r.CastleUnit).ToListAsync();
        return Ok(rows.Select(r => r.CastleUnit));
    }

    [HttpPost("{id}/castle-units")]
    public async Task<IActionResult> AddCastleUnit(string id, [FromBody] AddUnitDto dto)
    {
        if (string.IsNullOrEmpty(dto.CastleUnitId)) return BadRequest(new { error = "castle_unit_id is required" });
        try { db.CastleCastleUnits.Add(new CastleCastleUnit { CastleRecordId = id, CastleUnitId = dto.CastleUnitId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/castle-units/{unitId}")]
    public async Task<IActionResult> RemoveCastleUnit(string id, string unitId)
    {
        var row = await db.CastleCastleUnits.FindAsync(id, unitId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleCastleUnits.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    // ── Castle Services ───────────────────────────────────────────────────────

    [HttpGet("{id}/castle-services")]
    public async Task<IActionResult> ListCastleServices(string id)
    {
        var rows = await db.CastleCastleServices.Where(r => r.CastleRecordId == id).Include(r => r.CastleService).ToListAsync();
        return Ok(rows.Select(r => r.CastleService));
    }

    [HttpPost("{id}/castle-services")]
    public async Task<IActionResult> AddCastleService(string id, [FromBody] AddServiceDto dto)
    {
        if (string.IsNullOrEmpty(dto.CastleServiceId)) return BadRequest(new { error = "castle_service_id is required" });
        try { db.CastleCastleServices.Add(new CastleCastleService { CastleRecordId = id, CastleServiceId = dto.CastleServiceId }); await db.SaveChangesAsync(); return StatusCode(204); }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/castle-services/{serviceId}")]
    public async Task<IActionResult> RemoveCastleService(string id, string serviceId)
    {
        var row = await db.CastleCastleServices.FindAsync(id, serviceId);
        if (row == null) return NotFound(new { error = "Not found" });
        db.CastleCastleServices.Remove(row);
        await db.SaveChangesAsync();
        return StatusCode(204);
    }

    // ── Local Modifications ───────────────────────────────────────────────────

    [HttpGet("{id}/local-modifications")]
    public async Task<IActionResult> ListLocalMods(string id)
    {
        var mods = await db.LocalModifications.Where(m => m.CastleRecordId == id).ToListAsync();
        return Ok(mods);
    }

    [HttpPost("{id}/local-modifications")]
    public async Task<IActionResult> CreateLocalMod(string id, [FromBody] CreateLocalModDto dto)
    {
        try
        {
            if (!LmodIdPattern.IsMatch(dto.ModificationId))
                return BadRequest(new { error = $"Invalid modification_id \"{dto.ModificationId}\". Expected format: LMOD-WORD-V001" });
            if (dto.ReviewStatus != null && !ValidReviewStatuses.Contains(dto.ReviewStatus))
                return BadRequest(new { error = $"Invalid review_status \"{dto.ReviewStatus}\"" });
            if (dto.PromotionRecommendation != null && !ValidPromotions.Contains(dto.PromotionRecommendation))
                return BadRequest(new { error = $"Invalid promotion_recommendation \"{dto.PromotionRecommendation}\"" });

            var entity = new LocalModification
            {
                ModificationId = dto.ModificationId, CastleRecordId = id,
                ModifiedItem = dto.ModifiedItem, ChangeDescription = dto.ChangeDescription,
                Reason = dto.Reason, RelatedAssetId = dto.RelatedAssetId,
                RelatedAssetType = dto.RelatedAssetType,
                RelatedBlueprintId = dto.RelatedBlueprintId,
                RelatedCastleServiceId = dto.RelatedCastleServiceId,
                VersionNotes = dto.VersionNotes,
                ReviewStatus = dto.ReviewStatus ?? "Pending",
                PromotionRecommendation = dto.PromotionRecommendation ?? "RemainLocal",
                TestingNotes = dto.TestingNotes,
            };
            db.LocalModifications.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("{id}/local-modifications/{modId}")]
    public async Task<IActionResult> GetLocalMod(string id, string modId)
    {
        var mod = await db.LocalModifications.FindAsync(modId);
        return mod == null ? NotFound(new { error = "Not found" }) : Ok(mod);
    }

    [HttpPatch("{id}/local-modifications/{modId}")]
    public async Task<IActionResult> UpdateLocalMod(string id, string modId, [FromBody] UpdateLocalModDto dto)
    {
        try
        {
            if (dto.ReviewStatus != null && !ValidReviewStatuses.Contains(dto.ReviewStatus))
                return BadRequest(new { error = $"Invalid review_status \"{dto.ReviewStatus}\"" });
            if (dto.PromotionRecommendation != null && !ValidPromotions.Contains(dto.PromotionRecommendation))
                return BadRequest(new { error = $"Invalid promotion_recommendation \"{dto.PromotionRecommendation}\"" });
            var mod = await db.LocalModifications.FindAsync(modId);
            if (mod == null) return NotFound(new { error = "Not found" });
            if (dto.ModifiedItem != null) mod.ModifiedItem = dto.ModifiedItem;
            if (dto.ChangeDescription != null) mod.ChangeDescription = dto.ChangeDescription;
            if (dto.Reason != null) mod.Reason = dto.Reason;
            if (dto.RelatedAssetId != null) mod.RelatedAssetId = dto.RelatedAssetId;
            if (dto.RelatedAssetType != null) mod.RelatedAssetType = dto.RelatedAssetType;
            if (dto.RelatedBlueprintId != null) mod.RelatedBlueprintId = dto.RelatedBlueprintId;
            if (dto.RelatedCastleServiceId != null) mod.RelatedCastleServiceId = dto.RelatedCastleServiceId;
            if (dto.VersionNotes != null) mod.VersionNotes = dto.VersionNotes;
            if (dto.ReviewStatus != null) mod.ReviewStatus = dto.ReviewStatus;
            if (dto.PromotionRecommendation != null) mod.PromotionRecommendation = dto.PromotionRecommendation;
            if (dto.TestingNotes != null) mod.TestingNotes = dto.TestingNotes;
            await db.SaveChangesAsync();
            return Ok(mod);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpDelete("{id}/local-modifications/{modId}")]
    public async Task<IActionResult> DeleteLocalMod(string id, string modId)
    {
        var mod = await db.LocalModifications.FindAsync(modId);
        if (mod == null) return NotFound(new { error = "Not found" });
        mod.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(mod);
    }
}
