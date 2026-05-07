using CastleInventoryAX.Data;
using CastleInventoryAX.Models;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Services;

public class BomService(AppDbContext db)
{
    // ── Shared ────────────────────────────────────────────────────────────────

    public record BomNode(string Id, string Name, string Status, string? Version = null, string? Warning = null);

    private static string? Warn(string status) =>
        status is "Deprecated" or "Archived" ? $"Status is {status}" : null;

    // ── BOM result types ──────────────────────────────────────────────────────

    public record BomAtomicAsset(string Id, string Name, string AssetType, string Version, string Status, string? Warning);
    public record BomCompound(string Id, string Name, string Version, string Status, string? Warning, List<BomAtomicAsset> AtomicAssets);
    public record BomComposite(string Id, string Name, string Version, string UiBackendScope, string Status, string? Warning, List<BomCompound> Compounds, List<BomAtomicAsset> AtomicAssets);
    public record BomCastleService(string Id, string Name, string Capability, string Status, string? Warning, List<BomComposite> Composites, List<BomCompound> Compounds, List<BomAtomicAsset> AtomicAssets);
    public record BomCastleUnit(string Id, string Name, string Status, string? Warning, List<BomCastleService> CastleServices);
    public record BomLocalMod(string ModificationId, string ModifiedItem, string ChangeDescription, string Reason, string ReviewStatus, string PromotionRecommendation);

    public record BomResult(
        string CastleRecordId, string CastleName, string Version, string Status, string? Warning,
        BomNode? CastleType, BomNode? Blueprint,
        List<BomCastleUnit> CastleUnits,
        List<BomLocalMod> LocalModifications);

    // ── Impact result types ───────────────────────────────────────────────────

    public record ImpactResult(
        string EntityId, string EntityType,
        List<BomNode>? Compounds = null,
        List<BomNode>? Composites = null,
        List<BomNode>? CastleServices = null,
        List<BomNode>? CastleUnits = null,
        List<BomNode>? Castles = null);

    // ── generateBOM ───────────────────────────────────────────────────────────

    public async Task<BomResult> GenerateBom(string castleRecordId)
    {
        var castle = await db.Castles
            .Include(c => c.CastleType)
            .Include(c => c.Blueprint)
            .Include(c => c.LocalModifications)
            .Include(c => c.CastleUnits)
                .ThenInclude(cu => cu.CastleUnit)
                    .ThenInclude(cu => cu.CastleServices)
                        .ThenInclude(cus => cus.CastleService)
                            .ThenInclude(cs => cs.Composites)
                                .ThenInclude(csc => csc.Composite)
                                    .ThenInclude(comp => comp.Compounds)
                                        .ThenInclude(cc => cc.Compound)
                                            .ThenInclude(c => c.AtomicAssets)
                                                .ThenInclude(caa => caa.AtomicAsset)
            .Include(c => c.CastleUnits)
                .ThenInclude(cu => cu.CastleUnit)
                    .ThenInclude(cu => cu.CastleServices)
                        .ThenInclude(cus => cus.CastleService)
                            .ThenInclude(cs => cs.Composites)
                                .ThenInclude(csc => csc.Composite)
                                    .ThenInclude(comp => comp.AtomicAssets)
                                        .ThenInclude(caa => caa.AtomicAsset)
            .Include(c => c.CastleUnits)
                .ThenInclude(cu => cu.CastleUnit)
                    .ThenInclude(cu => cu.CastleServices)
                        .ThenInclude(cus => cus.CastleService)
                            .ThenInclude(cs => cs.Compounds)
                                .ThenInclude(csc => csc.Compound)
                                    .ThenInclude(cpd => cpd.AtomicAssets)
                                        .ThenInclude(caa => caa.AtomicAsset)
            .Include(c => c.CastleUnits)
                .ThenInclude(cu => cu.CastleUnit)
                    .ThenInclude(cu => cu.CastleServices)
                        .ThenInclude(cus => cus.CastleService)
                            .ThenInclude(cs => cs.AtomicAssets)
                                .ThenInclude(csaa => csaa.AtomicAsset)
            .FirstOrDefaultAsync(c => c.CastleRecordId == castleRecordId)
            ?? throw new KeyNotFoundException($"Castle \"{castleRecordId}\" not found");

        return new BomResult(
            castle.CastleRecordId, castle.CastleName, castle.Version, castle.Status, Warn(castle.Status),
            castle.CastleType is { } ct
                ? new BomNode(ct.CastleTypeId, ct.Name, ct.Status, null, Warn(ct.Status))
                : null,
            castle.Blueprint is { } bp
                ? new BomNode(bp.BlueprintId, bp.Name, bp.Status, bp.Version, Warn(bp.Status))
                : null,
            castle.CastleUnits.Select(cu => MapUnit(cu.CastleUnit)).ToList(),
            castle.LocalModifications.Select(m => new BomLocalMod(
                m.ModificationId, m.ModifiedItem, m.ChangeDescription,
                m.Reason, m.ReviewStatus, m.PromotionRecommendation)).ToList());
    }

    private static BomCastleUnit MapUnit(CastleUnit u) => new(
        u.CastleUnitId, u.Name, u.Status, Warn(u.Status),
        u.CastleServices.Select(r => MapService(r.CastleService)).ToList());

    private static BomCastleService MapService(CastleService s) => new(
        s.CastleServiceId, s.Name, s.Capability, s.Status, Warn(s.Status),
        s.Composites.Select(r => MapComposite(r.Composite)).ToList(),
        s.Compounds.Select(r => MapCompound(r.Compound)).ToList(),
        s.AtomicAssets.Select(r => MapAtomicAsset(r.AtomicAsset)).ToList());

    private static BomComposite MapComposite(Composite c) => new(
        c.CompositeId, c.Name, c.Version, c.UiBackendScope, c.Status, Warn(c.Status),
        c.Compounds.Select(r => MapCompound(r.Compound)).ToList(),
        c.AtomicAssets.Select(r => MapAtomicAsset(r.AtomicAsset)).ToList());

    private static BomCompound MapCompound(Compound c) => new(
        c.CompoundId, c.Name, c.Version, c.Status, Warn(c.Status),
        c.AtomicAssets.Select(r => MapAtomicAsset(r.AtomicAsset)).ToList());

    private static BomAtomicAsset MapAtomicAsset(AtomicAsset a) => new(
        a.AtomicAssetId, a.Name, a.AssetType, a.Version, a.Status, Warn(a.Status));

    // ── traceImpact ───────────────────────────────────────────────────────────

    public async Task<ImpactResult> TraceImpact(string entityId, string entityType)
    {
        var compoundIds = new HashSet<string>();
        var compositeIds = new HashSet<string>();
        var castleServiceIds = new HashSet<string>();
        var castleUnitIds = new HashSet<string>();
        var castleIds = new HashSet<string>();

        if (entityType == "AtomicAsset")
        {
            (await db.CompoundAtomicAssets.Where(r => r.AtomicAssetId == entityId).Select(r => r.CompoundId).ToListAsync())
                .ForEach(id => compoundIds.Add(id));
            (await db.CompositeAtomicAssets.Where(r => r.AtomicAssetId == entityId).Select(r => r.CompositeId).ToListAsync())
                .ForEach(id => compositeIds.Add(id));
            (await db.CastleServiceAtomicAssets.Where(r => r.AtomicAssetId == entityId).Select(r => r.CastleServiceId).ToListAsync())
                .ForEach(id => castleServiceIds.Add(id));
        }

        if (entityType == "Compound")
        {
            (await db.CompositeCompounds.Where(r => r.CompoundId == entityId).Select(r => r.CompositeId).ToListAsync())
                .ForEach(id => compositeIds.Add(id));
            (await db.CastleServiceCompounds.Where(r => r.CompoundId == entityId).Select(r => r.CastleServiceId).ToListAsync())
                .ForEach(id => castleServiceIds.Add(id));
        }

        if (compoundIds.Count > 0)
        {
            var ids = compoundIds.ToList();
            (await db.CompositeCompounds.Where(r => ids.Contains(r.CompoundId)).Select(r => r.CompositeId).ToListAsync())
                .ForEach(id => compositeIds.Add(id));
            (await db.CastleServiceCompounds.Where(r => ids.Contains(r.CompoundId)).Select(r => r.CastleServiceId).ToListAsync())
                .ForEach(id => castleServiceIds.Add(id));
        }

        if (entityType == "Composite")
        {
            (await db.CastleServiceComposites.Where(r => r.CompositeId == entityId).Select(r => r.CastleServiceId).ToListAsync())
                .ForEach(id => castleServiceIds.Add(id));
            (await db.CastleUnitComposites.Where(r => r.CompositeId == entityId).Select(r => r.CastleUnitId).ToListAsync())
                .ForEach(id => castleUnitIds.Add(id));
        }

        if (compositeIds.Count > 0)
        {
            var ids = compositeIds.ToList();
            (await db.CastleServiceComposites.Where(r => ids.Contains(r.CompositeId)).Select(r => r.CastleServiceId).ToListAsync())
                .ForEach(id => castleServiceIds.Add(id));
            (await db.CastleUnitComposites.Where(r => ids.Contains(r.CompositeId)).Select(r => r.CastleUnitId).ToListAsync())
                .ForEach(id => castleUnitIds.Add(id));
        }

        if (entityType == "CastleService")
        {
            (await db.CastleUnitServices.Where(r => r.CastleServiceId == entityId).Select(r => r.CastleUnitId).ToListAsync())
                .ForEach(id => castleUnitIds.Add(id));
            (await db.CastleCastleServices.Where(r => r.CastleServiceId == entityId).Select(r => r.CastleRecordId).ToListAsync())
                .ForEach(id => castleIds.Add(id));
        }

        if (castleServiceIds.Count > 0)
        {
            var ids = castleServiceIds.ToList();
            (await db.CastleUnitServices.Where(r => ids.Contains(r.CastleServiceId)).Select(r => r.CastleUnitId).ToListAsync())
                .ForEach(id => castleUnitIds.Add(id));
            (await db.CastleCastleServices.Where(r => ids.Contains(r.CastleServiceId)).Select(r => r.CastleRecordId).ToListAsync())
                .ForEach(id => castleIds.Add(id));
        }

        if (entityType == "CastleUnit")
        {
            (await db.CastleCastleUnits.Where(r => r.CastleUnitId == entityId).Select(r => r.CastleRecordId).ToListAsync())
                .ForEach(id => castleIds.Add(id));
        }

        if (castleUnitIds.Count > 0)
        {
            var ids = castleUnitIds.ToList();
            (await db.CastleCastleUnits.Where(r => ids.Contains(r.CastleUnitId)).Select(r => r.CastleRecordId).ToListAsync())
                .ForEach(id => castleIds.Add(id));
        }

        // Build result
        List<BomNode>? compounds = null;
        List<BomNode>? composites = null;
        List<BomNode>? services = null;
        List<BomNode>? units = null;

        if (entityType == "AtomicAsset")
        {
            var cIds = compoundIds.ToList();
            compounds = cIds.Count > 0
                ? (await db.Compounds.Where(c => cIds.Contains(c.CompoundId)).ToListAsync())
                    .Select(c => new BomNode(c.CompoundId, c.Name, c.Status, c.Version, Warn(c.Status))).ToList()
                : [];
        }

        if (entityType is "AtomicAsset" or "Compound")
        {
            var cIds = compositeIds.ToList();
            composites = cIds.Count > 0
                ? (await db.Composites.Where(c => cIds.Contains(c.CompositeId)).ToListAsync())
                    .Select(c => new BomNode(c.CompositeId, c.Name, c.Status, c.Version, Warn(c.Status))).ToList()
                : [];
        }

        if (entityType is "AtomicAsset" or "Compound" or "Composite")
        {
            var cIds = castleServiceIds.ToList();
            services = cIds.Count > 0
                ? (await db.CastleServices.Where(s => cIds.Contains(s.CastleServiceId)).ToListAsync())
                    .Select(s => new BomNode(s.CastleServiceId, s.Name, s.Status, null, Warn(s.Status))).ToList()
                : [];
        }

        if (entityType != "CastleUnit")
        {
            var uIds = castleUnitIds.ToList();
            units = uIds.Count > 0
                ? (await db.CastleUnits.Where(u => uIds.Contains(u.CastleUnitId)).ToListAsync())
                    .Select(u => new BomNode(u.CastleUnitId, u.Name, u.Status, null, Warn(u.Status))).ToList()
                : [];
        }

        var cstIds = castleIds.ToList();
        var castles = cstIds.Count > 0
            ? (await db.Castles.Where(c => cstIds.Contains(c.CastleRecordId)).ToListAsync())
                .Select(c => new BomNode(c.CastleRecordId, c.CastleName, c.Status, c.Version, Warn(c.Status))).ToList()
            : [];

        return new ImpactResult(entityId, entityType, compounds, composites, services, units, castles);
    }
}
