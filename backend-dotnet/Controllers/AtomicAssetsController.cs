using System.Text.RegularExpressions;
using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("atomic-assets")]
public class AtomicAssetsController(AppDbContext db) : ControllerBase
{
    private static readonly Regex IdPattern = new(@"^AA-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$", RegexOptions.IgnoreCase);
    private static readonly string[] ValidAssetTypes = ["HelperFunction", "Validator", "Constant", "Type", "Enum", "UIElement", "FormattingFunction", "QueryHelper", "PermissionCheck", "LogicBlock"];
    private static readonly string[] ValidStatuses = ["Draft", "Active", "Deprecated", "Archived", "InReview", "Reusable"];

    public class CreateDto
    {
        public string AtomicAssetId { get; set; } = "";
        public string Name { get; set; } = "";
        public string AssetType { get; set; } = "";
        public string Description { get; set; } = "";
        public string CodeLocation { get; set; } = "";
        public string Version { get; set; } = "";
        public string? Status { get; set; }
        public string[]? Dependencies { get; set; }
        public string? ValidationNotes { get; set; }
        public string? ApprovedPatternNotes { get; set; }
    }

    public class UpdateDto
    {
        public string? Name { get; set; }
        public string? AssetType { get; set; }
        public string? Description { get; set; }
        public string? CodeLocation { get; set; }
        public string? Version { get; set; }
        public string? Status { get; set; }
        public string[]? Dependencies { get; set; }
        public string? ValidationNotes { get; set; }
        public string? ApprovedPatternNotes { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDto dto)
    {
        try
        {
            if (!IdPattern.IsMatch(dto.AtomicAssetId))
                return BadRequest(new { error = $"Invalid atomic_asset_id \"{dto.AtomicAssetId}\". Expected format: AA-WORD-V001" });
            if (!ValidAssetTypes.Contains(dto.AssetType))
                return BadRequest(new { error = $"Invalid asset_type \"{dto.AssetType}\"" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });

            var entity = new AtomicAsset
            {
                AtomicAssetId = dto.AtomicAssetId,
                Name = dto.Name,
                AssetType = dto.AssetType,
                Description = dto.Description,
                CodeLocation = dto.CodeLocation,
                Version = dto.Version,
                Status = dto.Status ?? "Draft",
                Dependencies = dto.Dependencies ?? [],
                ValidationNotes = dto.ValidationNotes,
                ApprovedPatternNotes = dto.ApprovedPatternNotes,
            };
            db.AtomicAssets.Add(entity);
            await db.SaveChangesAsync();
            return StatusCode(201, entity);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? asset_type, [FromQuery] string? status)
    {
        try
        {
            if (asset_type != null && !ValidAssetTypes.Contains(asset_type))
                return BadRequest(new { error = $"Invalid asset_type filter \"{asset_type}\"" });
            if (status != null && !ValidStatuses.Contains(status))
                return BadRequest(new { error = $"Invalid status filter \"{status}\"" });

            var q = db.AtomicAssets.AsQueryable();
            if (asset_type != null) q = q.Where(a => a.AssetType == asset_type);
            if (status != null) q = q.Where(a => a.Status == status);
            var assets = await q.ToListAsync();

            var ids = assets.Select(a => a.AtomicAssetId).ToList();
            var compoundCounts = await db.CompoundAtomicAssets
                .Where(r => ids.Contains(r.AtomicAssetId))
                .GroupBy(r => r.AtomicAssetId)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Count);
            var compositeCounts = await db.CompositeAtomicAssets
                .Where(r => ids.Contains(r.AtomicAssetId))
                .GroupBy(r => r.AtomicAssetId)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Count);
            var serviceCounts = await db.CastleServiceAtomicAssets
                .Where(r => ids.Contains(r.AtomicAssetId))
                .GroupBy(r => r.AtomicAssetId)
                .Select(g => new { Id = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Id, x => x.Count);

            var result = assets.Select(a =>
            {
                int cc = compoundCounts.GetValueOrDefault(a.AtomicAssetId, 0);
                int sc = compositeCounts.GetValueOrDefault(a.AtomicAssetId, 0);
                int sv = serviceCounts.GetValueOrDefault(a.AtomicAssetId, 0);
                int total = cc + sc + sv;
                var parts = new List<string>();
                if (cc > 0) parts.Add($"{cc} Cmpd");
                if (sc > 0) parts.Add($"{sc} Comp");
                if (sv > 0) parts.Add($"{sv} Svc");
                return new
                {
                    a.AtomicAssetId, a.Name, a.AssetType, a.Description, a.CodeLocation,
                    a.Version, a.Status, a.Dependencies, a.ValidationNotes, a.ApprovedPatternNotes,
                    a.CreatedAt, a.UpdatedAt,
                    usage_count = total,
                    usage_summary = parts.Count > 0 ? string.Join(" · ", parts) : "—",
                };
            });
            return Ok(result);
        }
        catch (Exception ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var entity = await db.AtomicAssets.FindAsync(id);
        return entity == null ? NotFound(new { error = "Not found" }) : Ok(entity);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateDto dto)
    {
        try
        {
            if (dto.AssetType != null && !ValidAssetTypes.Contains(dto.AssetType))
                return BadRequest(new { error = $"Invalid asset_type \"{dto.AssetType}\"" });
            if (dto.Status != null && !ValidStatuses.Contains(dto.Status))
                return BadRequest(new { error = $"Invalid status \"{dto.Status}\"" });

            var entity = await db.AtomicAssets.FindAsync(id);
            if (entity == null) return NotFound(new { error = "Not found" });

            if (dto.Name != null) entity.Name = dto.Name;
            if (dto.AssetType != null) entity.AssetType = dto.AssetType;
            if (dto.Description != null) entity.Description = dto.Description;
            if (dto.CodeLocation != null) entity.CodeLocation = dto.CodeLocation;
            if (dto.Version != null) entity.Version = dto.Version;
            if (dto.Status != null) entity.Status = dto.Status;
            if (dto.Dependencies != null) entity.Dependencies = dto.Dependencies;
            if (dto.ValidationNotes != null) entity.ValidationNotes = dto.ValidationNotes;
            if (dto.ApprovedPatternNotes != null) entity.ApprovedPatternNotes = dto.ApprovedPatternNotes;

            await db.SaveChangesAsync();
            return Ok(entity);
        }
        catch (Exception ex)
        {
            return ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase)
                ? NotFound(new { error = ex.Message })
                : BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Archive(string id)
    {
        var entity = await db.AtomicAssets.FindAsync(id);
        if (entity == null) return NotFound(new { error = "Not found" });
        entity.Status = "Archived";
        await db.SaveChangesAsync();
        return Ok(entity);
    }

    [HttpGet("{id}/compounds")]
    public async Task<IActionResult> ListCompounds(string id)
    {
        var rows = await db.CompoundAtomicAssets.Where(r => r.AtomicAssetId == id).Include(r => r.Compound).ToListAsync();
        return Ok(rows.Select(r => r.Compound));
    }

    [HttpGet("{id}/composites")]
    public async Task<IActionResult> ListComposites(string id)
    {
        var rows = await db.CompositeAtomicAssets.Where(r => r.AtomicAssetId == id).Include(r => r.Composite).ToListAsync();
        return Ok(rows.Select(r => r.Composite));
    }

    [HttpGet("{id}/castle-services")]
    public async Task<IActionResult> ListCastleServices(string id)
    {
        var rows = await db.CastleServiceAtomicAssets.Where(r => r.AtomicAssetId == id).Include(r => r.CastleService).ToListAsync();
        return Ok(rows.Select(r => r.CastleService));
    }
}
