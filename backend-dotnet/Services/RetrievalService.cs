using CastleInventoryAX.Data;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Services;

public class RetrievalService(AppDbContext db)
{
    private static bool IsActive(string status) => status is not ("Deprecated" or "Archived");

    public record CompactCastleUnit(string Id, string Name, string Status);
    public record CompactCastleService(string Id, string Name, string Capability, string Status);
    public record CompactComposite(string Id, string Name, string UiBackendScope, string Status);
    public record CompactCompound(string Id, string Name, string Status);
    public record CompactAtomicAsset(string Id, string Name, string AssetType, string Status);

    public record RelevantContext(
        List<CompactCastleUnit> CastleUnits,
        List<CompactCastleService> CastleServices,
        List<CompactComposite> Composites,
        List<CompactCompound> Compounds,
        List<CompactAtomicAsset> AtomicAssets);

    public async Task<RelevantContext> GetRelevantContext(string castleTypeId, string blueprintId)
    {
        var ctUnits = await db.CastleTypeCastleUnits.Where(r => r.CastleTypeId == castleTypeId).Include(r => r.CastleUnit).ToListAsync();
        var ctServices = await db.CastleTypeCastleServices.Where(r => r.CastleTypeId == castleTypeId).Include(r => r.CastleService).ToListAsync();
        var bpUnits = await db.BlueprintCastleUnits.Where(r => r.BlueprintId == blueprintId).Include(r => r.CastleUnit).ToListAsync();
        var bpServices = await db.BlueprintCastleServices.Where(r => r.BlueprintId == blueprintId).Include(r => r.CastleService).ToListAsync();
        var bpComposites = await db.BlueprintComposites.Where(r => r.BlueprintId == blueprintId).Include(r => r.Composite).ToListAsync();

        var allUnits = ctUnits.Select(r => r.CastleUnit).Concat(bpUnits.Select(r => r.CastleUnit));
        var unitMap = new Dictionary<string, CompactCastleUnit>();
        foreach (var u in allUnits)
        {
            if (IsActive(u.Status) && !unitMap.ContainsKey(u.CastleUnitId))
                unitMap[u.CastleUnitId] = new(u.CastleUnitId, u.Name, u.Status);
        }

        var allServices = ctServices.Select(r => r.CastleService).Concat(bpServices.Select(r => r.CastleService));
        var serviceMap = new Dictionary<string, CompactCastleService>();
        foreach (var s in allServices)
        {
            if (IsActive(s.Status) && !serviceMap.ContainsKey(s.CastleServiceId))
                serviceMap[s.CastleServiceId] = new(s.CastleServiceId, s.Name, s.Capability, s.Status);
        }

        var serviceIds = serviceMap.Keys.ToList();
        var serviceComposites = serviceIds.Count > 0
            ? await db.CastleServiceComposites.Where(r => serviceIds.Contains(r.CastleServiceId)).Include(r => r.Composite).ToListAsync()
            : [];

        var compositeMap = new Dictionary<string, CompactComposite>();
        foreach (var r in bpComposites.Select(r => r.Composite).Concat(serviceComposites.Select(r => r.Composite)))
        {
            if (IsActive(r.Status) && !compositeMap.ContainsKey(r.CompositeId))
                compositeMap[r.CompositeId] = new(r.CompositeId, r.Name, r.UiBackendScope, r.Status);
        }

        var compositeIds = compositeMap.Keys.ToList();
        var compositeCompounds = compositeIds.Count > 0
            ? await db.CompositeCompounds.Where(r => compositeIds.Contains(r.CompositeId)).Include(r => r.Compound).ToListAsync()
            : [];

        var compoundMap = new Dictionary<string, CompactCompound>();
        foreach (var r in compositeCompounds)
        {
            var c = r.Compound;
            if (IsActive(c.Status) && !compoundMap.ContainsKey(c.CompoundId))
                compoundMap[c.CompoundId] = new(c.CompoundId, c.Name, c.Status);
        }

        var compoundIds = compoundMap.Keys.ToList();
        var compoundAssets = compoundIds.Count > 0
            ? await db.CompoundAtomicAssets.Where(r => compoundIds.Contains(r.CompoundId)).Include(r => r.AtomicAsset).ToListAsync()
            : [];

        var compositeDirectAssets = compositeIds.Count > 0
            ? await db.CompositeAtomicAssets.Where(r => compositeIds.Contains(r.CompositeId)).Include(r => r.AtomicAsset).ToListAsync()
            : [];

        var serviceDirectAssets = serviceIds.Count > 0
            ? await db.CastleServiceAtomicAssets.Where(r => serviceIds.Contains(r.CastleServiceId)).Include(r => r.AtomicAsset).ToListAsync()
            : [];

        var assetMap = new Dictionary<string, CompactAtomicAsset>();
        foreach (var r in compoundAssets.Select(r => r.AtomicAsset)
            .Concat(compositeDirectAssets.Select(r => r.AtomicAsset))
            .Concat(serviceDirectAssets.Select(r => r.AtomicAsset)))
        {
            if (IsActive(r.Status) && !assetMap.ContainsKey(r.AtomicAssetId))
                assetMap[r.AtomicAssetId] = new(r.AtomicAssetId, r.Name, r.AssetType, r.Status);
        }

        return new RelevantContext(
            unitMap.Values.OrderBy(u => u.Name).ToList(),
            serviceMap.Values.OrderBy(s => s.Name).ToList(),
            compositeMap.Values.OrderBy(c => c.Name).ToList(),
            compoundMap.Values.OrderBy(c => c.Name).ToList(),
            assetMap.Values.OrderBy(a => a.Name).ToList());
    }

    public async Task<RelevantContext> GetContextForCastle(string castleRecordId)
    {
        var castle = await db.Castles
            .Where(c => c.CastleRecordId == castleRecordId)
            .Select(c => new { c.CastleTypeId, c.BlueprintId })
            .FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException($"Castle \"{castleRecordId}\" not found");

        if (castle.CastleTypeId == null || castle.BlueprintId == null)
            throw new InvalidOperationException($"Castle \"{castleRecordId}\" must have both castle_type_id and blueprint_id set");

        return await GetRelevantContext(castle.CastleTypeId, castle.BlueprintId);
    }
}
