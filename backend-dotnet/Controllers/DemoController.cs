using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("demo")]
public class DemoController(AppDbContext db) : ControllerBase
{
    private static readonly string CsvPath = Path.GetFullPath(
        Path.Combine(AppContext.BaseDirectory, "../../../..", "db", "demo", "demo-data.csv"));

    // ── CSV Parser ────────────────────────────────────────────────────────────

    private record Section(List<string> Headers, List<List<string>> Rows);

    private static Dictionary<string, Section> ParseCsv(string content)
    {
        var sections = new Dictionary<string, Section>();
        Section? current = null;

        foreach (var rawLine in content.Split('\n'))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrEmpty(line) || line.StartsWith('#')) continue;

            if (line.StartsWith('[') && line.EndsWith(']'))
            {
                current = new Section([], []);
                sections[line[1..^1]] = current;
            }
            else if (current != null)
            {
                var cells = ParseCsvLine(line);
                if (current.Headers.Count == 0)
                    current.Headers.AddRange(cells);
                else
                    current.Rows.Add(cells);
            }
        }
        return sections;
    }

    private static List<string> ParseCsvLine(string line)
    {
        var result = new List<string>();
        var current = "";
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"') { current += '"'; i++; }
                else inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes) { result.Add(current.Trim()); current = ""; }
            else current += c;
        }
        result.Add(current.Trim());
        return result;
    }

    private static string F(List<string> row, List<string> headers, string name)
    {
        var idx = headers.IndexOf(name);
        return idx >= 0 && idx < row.Count ? row[idx].Trim() : "";
    }

    // ── Clear ────────────────────────────────────────────────────────────────

    private async Task ClearDemo()
    {
        await db.Castles.Where(e => e.CastleRecordId.Contains("-DEMO-")).ExecuteDeleteAsync();
        await db.CastleTypes.Where(e => e.CastleTypeId.Contains("-DEMO-")).ExecuteDeleteAsync();
        await db.Blueprints.Where(e => e.BlueprintId.Contains("-DEMO-")).ExecuteDeleteAsync();
        await db.CastleUnits.Where(e => e.CastleUnitId.Contains("-DEMO-")).ExecuteDeleteAsync();
        await db.CastleServices.Where(e => e.CastleServiceId.Contains("-DEMO-")).ExecuteDeleteAsync();
        await db.Composites.Where(e => e.CompositeId.Contains("-DEMO-")).ExecuteDeleteAsync();
        await db.Compounds.Where(e => e.CompoundId.Contains("-DEMO-")).ExecuteDeleteAsync();
        await db.AtomicAssets.Where(e => e.AtomicAssetId.Contains("-DEMO-")).ExecuteDeleteAsync();
    }

    // ── Load ─────────────────────────────────────────────────────────────────

    private async Task<Dictionary<string, int>> LoadDemo()
    {
        var content = await System.IO.File.ReadAllTextAsync(CsvPath);
        var s = ParseCsv(content);
        var counts = new Dictionary<string, int>();

        // AtomicAssets
        if (s.TryGetValue("AtomicAsset", out var aaSec))
        {
            foreach (var row in aaSec.Rows)
            {
                db.AtomicAssets.Add(new AtomicAsset
                {
                    AtomicAssetId = F(row, aaSec.Headers, "id"),
                    Name = F(row, aaSec.Headers, "name"),
                    AssetType = F(row, aaSec.Headers, "asset_type"),
                    Description = F(row, aaSec.Headers, "description"),
                    CodeLocation = F(row, aaSec.Headers, "code_location"),
                    Version = F(row, aaSec.Headers, "version"),
                    Status = F(row, aaSec.Headers, "status"),
                });
            }
            await db.SaveChangesAsync();
            counts["atomic_assets"] = aaSec.Rows.Count;
        }

        // Compounds
        if (s.TryGetValue("Compound", out var cpdSec))
        {
            foreach (var row in cpdSec.Rows)
            {
                db.Compounds.Add(new Compound
                {
                    CompoundId = F(row, cpdSec.Headers, "id"),
                    Name = F(row, cpdSec.Headers, "name"),
                    Description = F(row, cpdSec.Headers, "description"),
                    Version = F(row, cpdSec.Headers, "version"),
                    Status = F(row, cpdSec.Headers, "status"),
                });
            }
            await db.SaveChangesAsync();
            counts["compounds"] = cpdSec.Rows.Count;
        }

        // Compound → AtomicAsset
        if (s.TryGetValue("CompoundAtomicAsset", out var cpdAaSec))
        {
            foreach (var row in cpdAaSec.Rows)
                db.CompoundAtomicAssets.Add(new CompoundAtomicAsset
                {
                    CompoundId = F(row, cpdAaSec.Headers, "compound_id"),
                    AtomicAssetId = F(row, cpdAaSec.Headers, "atomic_asset_id"),
                });
            await db.SaveChangesAsync();
        }

        // Composites
        if (s.TryGetValue("Composite", out var compSec))
        {
            foreach (var row in compSec.Rows)
            {
                db.Composites.Add(new Composite
                {
                    CompositeId = F(row, compSec.Headers, "id"),
                    Name = F(row, compSec.Headers, "name"),
                    Description = F(row, compSec.Headers, "description"),
                    Version = F(row, compSec.Headers, "version"),
                    UiBackendScope = F(row, compSec.Headers, "ui_backend_scope"),
                    Status = F(row, compSec.Headers, "status"),
                });
            }
            await db.SaveChangesAsync();
            counts["composites"] = compSec.Rows.Count;
        }

        // Composite → Compound
        if (s.TryGetValue("CompositeCompound", out var compCpdSec))
        {
            foreach (var row in compCpdSec.Rows)
                db.CompositeCompounds.Add(new CompositeCompound
                {
                    CompositeId = F(row, compCpdSec.Headers, "composite_id"),
                    CompoundId = F(row, compCpdSec.Headers, "compound_id"),
                });
            await db.SaveChangesAsync();
        }

        // Composite → AtomicAsset
        if (s.TryGetValue("CompositeAtomicAsset", out var compAaSec))
        {
            foreach (var row in compAaSec.Rows)
                db.CompositeAtomicAssets.Add(new CompositeAtomicAsset
                {
                    CompositeId = F(row, compAaSec.Headers, "composite_id"),
                    AtomicAssetId = F(row, compAaSec.Headers, "atomic_asset_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleServices
        if (s.TryGetValue("CastleService", out var csSec))
        {
            foreach (var row in csSec.Rows)
            {
                db.CastleServices.Add(new CastleService
                {
                    CastleServiceId = F(row, csSec.Headers, "id"),
                    Name = F(row, csSec.Headers, "name"),
                    Capability = F(row, csSec.Headers, "capability"),
                    Status = F(row, csSec.Headers, "status"),
                });
            }
            await db.SaveChangesAsync();
            counts["castle_services"] = csSec.Rows.Count;
        }

        // CastleService → AtomicAsset
        if (s.TryGetValue("CastleServiceAtomicAsset", out var csAaSec))
        {
            foreach (var row in csAaSec.Rows)
                db.CastleServiceAtomicAssets.Add(new CastleServiceAtomicAsset
                {
                    CastleServiceId = F(row, csAaSec.Headers, "castle_service_id"),
                    AtomicAssetId = F(row, csAaSec.Headers, "atomic_asset_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleService → Composite
        if (s.TryGetValue("CastleServiceComposite", out var csCompSec))
        {
            foreach (var row in csCompSec.Rows)
                db.CastleServiceComposites.Add(new CastleServiceComposite
                {
                    CastleServiceId = F(row, csCompSec.Headers, "castle_service_id"),
                    CompositeId = F(row, csCompSec.Headers, "composite_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleService → Compound
        if (s.TryGetValue("CastleServiceCompound", out var csCpdSec))
        {
            foreach (var row in csCpdSec.Rows)
                db.CastleServiceCompounds.Add(new CastleServiceCompound
                {
                    CastleServiceId = F(row, csCpdSec.Headers, "castle_service_id"),
                    CompoundId = F(row, csCpdSec.Headers, "compound_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleUnits
        if (s.TryGetValue("CastleUnit", out var cuSec))
        {
            foreach (var row in cuSec.Rows)
            {
                db.CastleUnits.Add(new CastleUnit
                {
                    CastleUnitId = F(row, cuSec.Headers, "id"),
                    Name = F(row, cuSec.Headers, "name"),
                    Description = F(row, cuSec.Headers, "description"),
                    PermissionScope = F(row, cuSec.Headers, "permission_scope"),
                    Status = F(row, cuSec.Headers, "status"),
                });
            }
            await db.SaveChangesAsync();
            counts["castle_units"] = cuSec.Rows.Count;
        }

        // CastleUnit → CastleService
        if (s.TryGetValue("CastleUnitService", out var cuSvcSec))
        {
            foreach (var row in cuSvcSec.Rows)
                db.CastleUnitServices.Add(new CastleUnitService
                {
                    CastleUnitId = F(row, cuSvcSec.Headers, "castle_unit_id"),
                    CastleServiceId = F(row, cuSvcSec.Headers, "castle_service_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleUnit → Composite
        if (s.TryGetValue("CastleUnitComposite", out var cuCompSec))
        {
            foreach (var row in cuCompSec.Rows)
                db.CastleUnitComposites.Add(new CastleUnitComposite
                {
                    CastleUnitId = F(row, cuCompSec.Headers, "castle_unit_id"),
                    CompositeId = F(row, cuCompSec.Headers, "composite_id"),
                });
            await db.SaveChangesAsync();
        }

        // Blueprints
        if (s.TryGetValue("Blueprint", out var bpSec))
        {
            foreach (var row in bpSec.Rows)
            {
                db.Blueprints.Add(new Blueprint
                {
                    BlueprintId = F(row, bpSec.Headers, "id"),
                    Name = F(row, bpSec.Headers, "name"),
                    Category = F(row, bpSec.Headers, "category"),
                    Version = F(row, bpSec.Headers, "version"),
                    Purpose = F(row, bpSec.Headers, "purpose"),
                    Status = F(row, bpSec.Headers, "status"),
                });
            }
            await db.SaveChangesAsync();
            counts["blueprints"] = bpSec.Rows.Count;
        }

        // Blueprint → CastleUnit
        if (s.TryGetValue("BlueprintCastleUnit", out var bpCuSec))
        {
            foreach (var row in bpCuSec.Rows)
                db.BlueprintCastleUnits.Add(new BlueprintCastleUnit
                {
                    BlueprintId = F(row, bpCuSec.Headers, "blueprint_id"),
                    CastleUnitId = F(row, bpCuSec.Headers, "castle_unit_id"),
                });
            await db.SaveChangesAsync();
        }

        // Blueprint → CastleService
        if (s.TryGetValue("BlueprintCastleService", out var bpCsSec))
        {
            foreach (var row in bpCsSec.Rows)
                db.BlueprintCastleServices.Add(new BlueprintCastleService
                {
                    BlueprintId = F(row, bpCsSec.Headers, "blueprint_id"),
                    CastleServiceId = F(row, bpCsSec.Headers, "castle_service_id"),
                });
            await db.SaveChangesAsync();
        }

        // Blueprint → Composite
        if (s.TryGetValue("BlueprintComposite", out var bpCompSec))
        {
            foreach (var row in bpCompSec.Rows)
                db.BlueprintComposites.Add(new BlueprintComposite
                {
                    BlueprintId = F(row, bpCompSec.Headers, "blueprint_id"),
                    CompositeId = F(row, bpCompSec.Headers, "composite_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleTypes
        if (s.TryGetValue("CastleType", out var ctSec))
        {
            foreach (var row in ctSec.Rows)
            {
                db.CastleTypes.Add(new CastleType
                {
                    CastleTypeId = F(row, ctSec.Headers, "id"),
                    Name = F(row, ctSec.Headers, "name"),
                    Description = F(row, ctSec.Headers, "description"),
                    CommonPurpose = F(row, ctSec.Headers, "common_purpose"),
                    Status = F(row, ctSec.Headers, "status"),
                });
            }
            await db.SaveChangesAsync();
            counts["castle_types"] = ctSec.Rows.Count;
        }

        // CastleType → CastleUnit
        if (s.TryGetValue("CastleTypeCastleUnit", out var ctCuSec))
        {
            foreach (var row in ctCuSec.Rows)
                db.CastleTypeCastleUnits.Add(new CastleTypeCastleUnit
                {
                    CastleTypeId = F(row, ctCuSec.Headers, "castle_type_id"),
                    CastleUnitId = F(row, ctCuSec.Headers, "castle_unit_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleType → CastleService
        if (s.TryGetValue("CastleTypeCastleService", out var ctCsSec))
        {
            foreach (var row in ctCsSec.Rows)
                db.CastleTypeCastleServices.Add(new CastleTypeCastleService
                {
                    CastleTypeId = F(row, ctCsSec.Headers, "castle_type_id"),
                    CastleServiceId = F(row, ctCsSec.Headers, "castle_service_id"),
                });
            await db.SaveChangesAsync();
        }

        // CastleType → Blueprint
        if (s.TryGetValue("CastleTypeBlueprint", out var ctBpSec))
        {
            foreach (var row in ctBpSec.Rows)
                db.CastleTypeBlueprints.Add(new CastleTypeBlueprint
                {
                    CastleTypeId = F(row, ctBpSec.Headers, "castle_type_id"),
                    BlueprintId = F(row, ctBpSec.Headers, "blueprint_id"),
                });
            await db.SaveChangesAsync();
        }

        // Castles
        if (s.TryGetValue("Castle", out var castleSec))
        {
            foreach (var row in castleSec.Rows)
            {
                var typeId = F(row, castleSec.Headers, "castle_type_id");
                var bpId = F(row, castleSec.Headers, "blueprint_id");
                db.Castles.Add(new Castle
                {
                    CastleRecordId = F(row, castleSec.Headers, "id"),
                    CastleName = F(row, castleSec.Headers, "castle_name"),
                    Version = F(row, castleSec.Headers, "version"),
                    PrimaryPurpose = F(row, castleSec.Headers, "primary_purpose"),
                    Status = F(row, castleSec.Headers, "status"),
                    CastleTypeId = string.IsNullOrEmpty(typeId) ? null : typeId,
                    BlueprintId = string.IsNullOrEmpty(bpId) ? null : bpId,
                });
            }
            await db.SaveChangesAsync();
            counts["castles"] = castleSec.Rows.Count;
        }

        // Castle → CastleUnit
        if (s.TryGetValue("CastleCastleUnit", out var castCuSec))
        {
            foreach (var row in castCuSec.Rows)
                db.CastleCastleUnits.Add(new CastleCastleUnit
                {
                    CastleRecordId = F(row, castCuSec.Headers, "castle_record_id"),
                    CastleUnitId = F(row, castCuSec.Headers, "castle_unit_id"),
                });
            await db.SaveChangesAsync();
        }

        // Castle → CastleService
        if (s.TryGetValue("CastleCastleService", out var castCsSec))
        {
            foreach (var row in castCsSec.Rows)
                db.CastleCastleServices.Add(new CastleCastleService
                {
                    CastleRecordId = F(row, castCsSec.Headers, "castle_record_id"),
                    CastleServiceId = F(row, castCsSec.Headers, "castle_service_id"),
                });
            await db.SaveChangesAsync();
        }

        // LocalModifications
        if (s.TryGetValue("LocalModification", out var lmodSec))
        {
            foreach (var row in lmodSec.Rows)
            {
                db.LocalModifications.Add(new LocalModification
                {
                    ModificationId = F(row, lmodSec.Headers, "id"),
                    CastleRecordId = F(row, lmodSec.Headers, "castle_record_id"),
                    ModifiedItem = F(row, lmodSec.Headers, "modified_item"),
                    ChangeDescription = F(row, lmodSec.Headers, "change_description"),
                    Reason = F(row, lmodSec.Headers, "reason"),
                    ReviewStatus = F(row, lmodSec.Headers, "review_status") is { Length: > 0 } rs ? rs : "Pending",
                    PromotionRecommendation = F(row, lmodSec.Headers, "promotion_recommendation") is { Length: > 0 } pr ? pr : "RemainLocal",
                });
            }
            await db.SaveChangesAsync();
            counts["local_modifications"] = lmodSec.Rows.Count;
        }

        return counts;
    }

    // ── Routes ────────────────────────────────────────────────────────────────

    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        try
        {
            var counts = new
            {
                castles = await db.Castles.CountAsync(e => e.CastleRecordId.Contains("-DEMO-")),
                castle_types = await db.CastleTypes.CountAsync(e => e.CastleTypeId.Contains("-DEMO-")),
                blueprints = await db.Blueprints.CountAsync(e => e.BlueprintId.Contains("-DEMO-")),
                castle_units = await db.CastleUnits.CountAsync(e => e.CastleUnitId.Contains("-DEMO-")),
                castle_services = await db.CastleServices.CountAsync(e => e.CastleServiceId.Contains("-DEMO-")),
                composites = await db.Composites.CountAsync(e => e.CompositeId.Contains("-DEMO-")),
                compounds = await db.Compounds.CountAsync(e => e.CompoundId.Contains("-DEMO-")),
                atomic_assets = await db.AtomicAssets.CountAsync(e => e.AtomicAssetId.Contains("-DEMO-")),
                local_modifications = await db.LocalModifications.CountAsync(e => e.ModificationId.Contains("-DEMO-")),
            };
            var loaded = counts.castles > 0;
            return Ok(new { loaded, counts });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPost("load")]
    public async Task<IActionResult> Load()
    {
        try
        {
            await ClearDemo();
            var counts = await LoadDemo();
            return Ok(new { message = "Demo data loaded successfully", counts });
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException?.Message ?? "";
            var detail = string.IsNullOrEmpty(inner) ? ex.Message : $"{ex.Message} | Inner: {inner}";
            return StatusCode(500, new { error = detail });
        }
    }

    [HttpPost("clear")]
    public async Task<IActionResult> Clear()
    {
        try
        {
            await ClearDemo();
            return Ok(new { message = "Demo data cleared" });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpPost("clear-all")]
    public async Task<IActionResult> ClearAll()
    {
        try
        {
            await db.Castles.ExecuteDeleteAsync();
            await db.CastleTypes.ExecuteDeleteAsync();
            await db.Blueprints.ExecuteDeleteAsync();
            await db.CastleUnits.ExecuteDeleteAsync();
            await db.CastleServices.ExecuteDeleteAsync();
            await db.Composites.ExecuteDeleteAsync();
            await db.Compounds.ExecuteDeleteAsync();
            await db.AtomicAssets.ExecuteDeleteAsync();
            return Ok(new { message = "All data cleared" });
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }

    [HttpGet("csv")]
    public IActionResult DownloadCsv()
    {
        try
        {
            var content = System.IO.File.ReadAllBytes(CsvPath);
            return File(content, "text/csv", "demo-data.csv");
        }
        catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
    }
}
