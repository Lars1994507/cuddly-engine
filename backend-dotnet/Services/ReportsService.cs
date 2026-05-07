using CastleInventoryAX.Data;
using CastleInventoryAX.Services;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Services;

public class ReportsService(AppDbContext db, BomService bomService)
{
    private static BomService.BomNode ToBomNode(string id, string name, string status, string? version = null) =>
        new(id, name, status, version);

    // ── Report 1: listCastles ─────────────────────────────────────────────────

    public async Task<object> ListCastles(string? status, string? castleTypeId, string? blueprintId)
    {
        var q = db.Castles
            .Include(c => c.CastleType)
            .Include(c => c.Blueprint)
            .AsQueryable();
        if (status != null) q = q.Where(c => c.Status == status);
        if (castleTypeId != null) q = q.Where(c => c.CastleTypeId == castleTypeId);
        if (blueprintId != null) q = q.Where(c => c.BlueprintId == blueprintId);

        return (await q.OrderBy(c => c.CastleName).ToListAsync()).Select(c => new
        {
            castle_record_id = c.CastleRecordId,
            castle_name = c.CastleName,
            version = c.Version,
            status = c.Status,
            primary_purpose = c.PrimaryPurpose,
            castle_type = c.CastleType != null ? new { id = c.CastleType.CastleTypeId, name = c.CastleType.Name } : null,
            blueprint = c.Blueprint != null ? new { id = c.Blueprint.BlueprintId, name = c.Blueprint.Name } : null,
        });
    }

    // ── Report 2: listBlueprints ──────────────────────────────────────────────

    public async Task<object> ListBlueprints(string? status, string? category)
    {
        var q = db.Blueprints.AsQueryable();
        if (status != null) q = q.Where(b => b.Status == status);
        if (category != null) q = q.Where(b => b.Category == category);
        return await q.OrderBy(b => b.Name).ToListAsync();
    }

    // ── Report 3: listCastleTypes ─────────────────────────────────────────────

    public async Task<object> ListCastleTypes(string? status)
    {
        var q = db.CastleTypes.Include(ct => ct.Blueprints).ThenInclude(r => r.Blueprint).AsQueryable();
        if (status != null) q = q.Where(ct => ct.Status == status);

        return (await q.OrderBy(ct => ct.Name).ToListAsync()).Select(ct => new
        {
            castle_type_id = ct.CastleTypeId,
            ct.Name,
            ct.Description,
            common_purpose = ct.CommonPurpose,
            ct.Status,
            compatible_blueprints = ct.Blueprints.Select(b => new
            {
                id = b.Blueprint.BlueprintId,
                name = b.Blueprint.Name,
                status = b.Blueprint.Status,
            }),
        });
    }

    // ── Report 4: listCastleUnits ─────────────────────────────────────────────

    public async Task<object> ListCastleUnits(string? status)
    {
        var q = db.CastleUnits.AsQueryable();
        if (status != null) q = q.Where(u => u.Status == status);
        return await q.OrderBy(u => u.Name).ToListAsync();
    }

    // ── Report 5: listCastleServices ─────────────────────────────────────────

    public async Task<object> ListCastleServices(string? status)
    {
        var q = db.CastleServices.AsQueryable();
        if (status != null) q = q.Where(s => s.Status == status);
        return await q.OrderBy(s => s.Name).ToListAsync();
    }

    // ── Report 6: listComposites ──────────────────────────────────────────────

    public async Task<object> ListComposites(string? status, string? uiBackendScope)
    {
        var q = db.Composites.AsQueryable();
        if (status != null) q = q.Where(c => c.Status == status);
        if (uiBackendScope != null) q = q.Where(c => c.UiBackendScope == uiBackendScope);
        return await q.OrderBy(c => c.Name).ToListAsync();
    }

    // ── Report 7: listCompounds ───────────────────────────────────────────────

    public async Task<object> ListCompounds(string? status)
    {
        var q = db.Compounds.AsQueryable();
        if (status != null) q = q.Where(c => c.Status == status);
        return await q.OrderBy(c => c.Name).ToListAsync();
    }

    // ── Report 8: listAtomicAssets ────────────────────────────────────────────

    public async Task<object> ListAtomicAssets(string? status, string? assetType)
    {
        var q = db.AtomicAssets.AsQueryable();
        if (status != null) q = q.Where(a => a.Status == status);
        if (assetType != null) q = q.Where(a => a.AssetType == assetType);
        return await q.OrderBy(a => a.Name).ToListAsync();
    }

    // ── Report 9: getDependencyMap ────────────────────────────────────────────

    public async Task<object> GetDependencyMap(string entityId, string entityType)
    {
        var upstream = await GetUpstream(entityId, entityType);
        object downstream = entityType == "Castle"
            ? new { bom = await bomService.GenerateBom(entityId) }
            : await GetDownstream(entityId, entityType);

        return new { entity_id = entityId, entity_type = entityType, upstream, downstream };
    }

    private async Task<object> GetDownstream(string entityId, string entityType)
    {
        if (entityType == "CastleType")
        {
            var bps = await db.CastleTypeBlueprints.Where(r => r.CastleTypeId == entityId).Include(r => r.Blueprint).ToListAsync();
            var units = await db.CastleTypeCastleUnits.Where(r => r.CastleTypeId == entityId).Include(r => r.CastleUnit).ToListAsync();
            var svcs = await db.CastleTypeCastleServices.Where(r => r.CastleTypeId == entityId).Include(r => r.CastleService).ToListAsync();
            return new
            {
                blueprints = bps.Select(r => ToBomNode(r.Blueprint.BlueprintId, r.Blueprint.Name, r.Blueprint.Status, r.Blueprint.Version)),
                castle_units = units.Select(r => ToBomNode(r.CastleUnit.CastleUnitId, r.CastleUnit.Name, r.CastleUnit.Status)),
                castle_services = svcs.Select(r => ToBomNode(r.CastleService.CastleServiceId, r.CastleService.Name, r.CastleService.Status)),
            };
        }
        if (entityType == "Blueprint")
        {
            var units = await db.BlueprintCastleUnits.Where(r => r.BlueprintId == entityId).Include(r => r.CastleUnit).ToListAsync();
            var svcs = await db.BlueprintCastleServices.Where(r => r.BlueprintId == entityId).Include(r => r.CastleService).ToListAsync();
            var comps = await db.BlueprintComposites.Where(r => r.BlueprintId == entityId).Include(r => r.Composite).ToListAsync();
            return new
            {
                castle_units = units.Select(r => ToBomNode(r.CastleUnit.CastleUnitId, r.CastleUnit.Name, r.CastleUnit.Status)),
                castle_services = svcs.Select(r => ToBomNode(r.CastleService.CastleServiceId, r.CastleService.Name, r.CastleService.Status)),
                composites = comps.Select(r => ToBomNode(r.Composite.CompositeId, r.Composite.Name, r.Composite.Status, r.Composite.Version)),
            };
        }
        if (entityType == "CastleUnit")
        {
            var svcs = await db.CastleUnitServices.Where(r => r.CastleUnitId == entityId).Include(r => r.CastleService).ToListAsync();
            var comps = await db.CastleUnitComposites.Where(r => r.CastleUnitId == entityId).Include(r => r.Composite).ToListAsync();
            return new
            {
                castle_services = svcs.Select(r => ToBomNode(r.CastleService.CastleServiceId, r.CastleService.Name, r.CastleService.Status)),
                composites = comps.Select(r => ToBomNode(r.Composite.CompositeId, r.Composite.Name, r.Composite.Status, r.Composite.Version)),
            };
        }
        if (entityType == "CastleService")
        {
            var comps = await db.CastleServiceComposites.Where(r => r.CastleServiceId == entityId).Include(r => r.Composite).ToListAsync();
            var cpds = await db.CastleServiceCompounds.Where(r => r.CastleServiceId == entityId).Include(r => r.Compound).ToListAsync();
            var aas = await db.CastleServiceAtomicAssets.Where(r => r.CastleServiceId == entityId).Include(r => r.AtomicAsset).ToListAsync();
            return new
            {
                composites = comps.Select(r => ToBomNode(r.Composite.CompositeId, r.Composite.Name, r.Composite.Status, r.Composite.Version)),
                compounds = cpds.Select(r => ToBomNode(r.Compound.CompoundId, r.Compound.Name, r.Compound.Status, r.Compound.Version)),
                atomic_assets = aas.Select(r => ToBomNode(r.AtomicAsset.AtomicAssetId, r.AtomicAsset.Name, r.AtomicAsset.Status, r.AtomicAsset.Version)),
            };
        }
        if (entityType == "Composite")
        {
            var cpds = await db.CompositeCompounds.Where(r => r.CompositeId == entityId).Include(r => r.Compound).ToListAsync();
            var aas = await db.CompositeAtomicAssets.Where(r => r.CompositeId == entityId).Include(r => r.AtomicAsset).ToListAsync();
            return new
            {
                compounds = cpds.Select(r => ToBomNode(r.Compound.CompoundId, r.Compound.Name, r.Compound.Status, r.Compound.Version)),
                atomic_assets = aas.Select(r => ToBomNode(r.AtomicAsset.AtomicAssetId, r.AtomicAsset.Name, r.AtomicAsset.Status, r.AtomicAsset.Version)),
            };
        }
        if (entityType == "Compound")
        {
            var aas = await db.CompoundAtomicAssets.Where(r => r.CompoundId == entityId).Include(r => r.AtomicAsset).ToListAsync();
            return new
            {
                atomic_assets = aas.Select(r => ToBomNode(r.AtomicAsset.AtomicAssetId, r.AtomicAsset.Name, r.AtomicAsset.Status, r.AtomicAsset.Version)),
            };
        }
        return new { };
    }

    private async Task<object> GetUpstream(string entityId, string entityType)
    {
        if (entityType == "AtomicAsset")
        {
            var cpds = await db.CompoundAtomicAssets.Where(r => r.AtomicAssetId == entityId).Include(r => r.Compound).ToListAsync();
            var comps = await db.CompositeAtomicAssets.Where(r => r.AtomicAssetId == entityId).Include(r => r.Composite).ToListAsync();
            var svcs = await db.CastleServiceAtomicAssets.Where(r => r.AtomicAssetId == entityId).Include(r => r.CastleService).ToListAsync();
            var svcIds = svcs.Select(r => r.CastleService.CastleServiceId).ToList();
            var castleRows = svcIds.Count > 0
                ? await db.CastleCastleServices.Where(r => svcIds.Contains(r.CastleServiceId)).Include(r => r.Castle).ToListAsync()
                : [];
            return new
            {
                compounds = cpds.Select(r => ToBomNode(r.Compound.CompoundId, r.Compound.Name, r.Compound.Status, r.Compound.Version)),
                composites = comps.Select(r => ToBomNode(r.Composite.CompositeId, r.Composite.Name, r.Composite.Status, r.Composite.Version)),
                castle_services = svcs.Select(r => ToBomNode(r.CastleService.CastleServiceId, r.CastleService.Name, r.CastleService.Status)),
                castles = castleRows.DistinctBy(r => r.Castle.CastleRecordId).Select(r => ToBomNode(r.Castle.CastleRecordId, r.Castle.CastleName, r.Castle.Status, r.Castle.Version)),
            };
        }
        if (entityType == "Compound")
        {
            var comps = await db.CompositeCompounds.Where(r => r.CompoundId == entityId).Include(r => r.Composite).ToListAsync();
            var svcs = await db.CastleServiceCompounds.Where(r => r.CompoundId == entityId).Include(r => r.CastleService).ToListAsync();
            var svcIds = svcs.Select(r => r.CastleService.CastleServiceId).ToList();
            var castleRows = svcIds.Count > 0
                ? await db.CastleCastleServices.Where(r => svcIds.Contains(r.CastleServiceId)).Include(r => r.Castle).ToListAsync()
                : [];
            return new
            {
                composites = comps.Select(r => ToBomNode(r.Composite.CompositeId, r.Composite.Name, r.Composite.Status, r.Composite.Version)),
                castle_services = svcs.Select(r => ToBomNode(r.CastleService.CastleServiceId, r.CastleService.Name, r.CastleService.Status)),
                castles = castleRows.DistinctBy(r => r.Castle.CastleRecordId).Select(r => ToBomNode(r.Castle.CastleRecordId, r.Castle.CastleName, r.Castle.Status, r.Castle.Version)),
            };
        }
        if (entityType == "Composite")
        {
            var units = await db.CastleUnitComposites.Where(r => r.CompositeId == entityId).Include(r => r.CastleUnit).ToListAsync();
            var svcs = await db.CastleServiceComposites.Where(r => r.CompositeId == entityId).Include(r => r.CastleService).ToListAsync();
            var unitIds = units.Select(r => r.CastleUnit.CastleUnitId).ToList();
            var svcIds = svcs.Select(r => r.CastleService.CastleServiceId).ToList();
            var seen = new HashSet<string>();
            var castles = new List<BomService.BomNode>();
            if (unitIds.Count > 0)
                foreach (var r in await db.CastleCastleUnits.Where(r => unitIds.Contains(r.CastleUnitId)).Include(r => r.Castle).ToListAsync())
                    if (seen.Add(r.Castle.CastleRecordId))
                        castles.Add(ToBomNode(r.Castle.CastleRecordId, r.Castle.CastleName, r.Castle.Status, r.Castle.Version));
            if (svcIds.Count > 0)
                foreach (var r in await db.CastleCastleServices.Where(r => svcIds.Contains(r.CastleServiceId)).Include(r => r.Castle).ToListAsync())
                    if (seen.Add(r.Castle.CastleRecordId))
                        castles.Add(ToBomNode(r.Castle.CastleRecordId, r.Castle.CastleName, r.Castle.Status, r.Castle.Version));
            return new
            {
                castle_units = units.Select(r => ToBomNode(r.CastleUnit.CastleUnitId, r.CastleUnit.Name, r.CastleUnit.Status)),
                castle_services = svcs.Select(r => ToBomNode(r.CastleService.CastleServiceId, r.CastleService.Name, r.CastleService.Status)),
                castles = (IEnumerable<BomService.BomNode>)castles,
            };
        }
        if (entityType == "CastleService")
        {
            var units = await db.CastleUnitServices.Where(r => r.CastleServiceId == entityId).Include(r => r.CastleUnit).ToListAsync();
            var castleRows = await db.CastleCastleServices.Where(r => r.CastleServiceId == entityId).Include(r => r.Castle).ToListAsync();
            return new
            {
                castle_units = units.Select(r => ToBomNode(r.CastleUnit.CastleUnitId, r.CastleUnit.Name, r.CastleUnit.Status)),
                castles = castleRows.Select(r => ToBomNode(r.Castle.CastleRecordId, r.Castle.CastleName, r.Castle.Status, r.Castle.Version)),
            };
        }
        if (entityType == "CastleUnit")
        {
            var castleRows = await db.CastleCastleUnits.Where(r => r.CastleUnitId == entityId).Include(r => r.Castle).ToListAsync();
            return new { castles = castleRows.Select(r => ToBomNode(r.Castle.CastleRecordId, r.Castle.CastleName, r.Castle.Status, r.Castle.Version)) };
        }
        if (entityType == "Blueprint")
        {
            var castleRows = await db.Castles.Where(c => c.BlueprintId == entityId).ToListAsync();
            var ctRows = await db.CastleTypeBlueprints.Where(r => r.BlueprintId == entityId).Include(r => r.CastleType).ToListAsync();
            return new
            {
                castles = castleRows.Select(c => ToBomNode(c.CastleRecordId, c.CastleName, c.Status, c.Version)),
                castle_types = ctRows.Select(r => ToBomNode(r.CastleType.CastleTypeId, r.CastleType.Name, r.CastleType.Status)),
            };
        }
        if (entityType == "CastleType")
        {
            var castleRows = await db.Castles.Where(c => c.CastleTypeId == entityId).ToListAsync();
            return new { castles = castleRows.Select(c => ToBomNode(c.CastleRecordId, c.CastleName, c.Status, c.Version)) };
        }
        return new { castles = Array.Empty<object>() };
    }

    // ── Report 10: getReuseReport ─────────────────────────────────────────────

    public async Task<object> GetReuseReport()
    {
        var cuGroups = await db.CastleCastleUnits.GroupBy(r => r.CastleUnitId)
            .Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        var csGroups = await db.CastleCastleServices.GroupBy(r => r.CastleServiceId)
            .Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();

        var compSvcRows = await db.CastleServiceComposites.GroupBy(r => r.CompositeId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        var compUnitRows = await db.CastleUnitComposites.GroupBy(r => r.CompositeId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        var compBpRows = await db.BlueprintComposites.GroupBy(r => r.CompositeId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();

        var cpdCompRows = await db.CompositeCompounds.GroupBy(r => r.CompoundId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        var cpdSvcRows = await db.CastleServiceCompounds.GroupBy(r => r.CompoundId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();

        var aaCompRows = await db.CompoundAtomicAssets.GroupBy(r => r.AtomicAssetId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        var aaCompositRows = await db.CompositeAtomicAssets.GroupBy(r => r.AtomicAssetId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();
        var aaSvcRows = await db.CastleServiceAtomicAssets.GroupBy(r => r.AtomicAssetId).Select(g => new { Id = g.Key, Count = g.Count() }).ToListAsync();

        var compositeMap = AggregateIds([..compSvcRows, ..compUnitRows, ..compBpRows]);
        var compoundMap = AggregateIds([..cpdCompRows, ..cpdSvcRows]);
        var aaMap = AggregateIds([..aaCompRows, ..aaCompositRows, ..aaSvcRows]);

        var reusedCuIds = cuGroups.Where(r => r.Count >= 2).Select(r => r.Id).ToList();
        var reusedCsIds = csGroups.Where(r => r.Count >= 2).Select(r => r.Id).ToList();
        var reusedCompIds = compositeMap.Where(kv => kv.Value >= 2).Select(kv => kv.Key).ToList();
        var reusedCpdIds = compoundMap.Where(kv => kv.Value >= 2).Select(kv => kv.Key).ToList();
        var reusedAaIds = aaMap.Where(kv => kv.Value >= 2).Select(kv => kv.Key).ToList();

        var cuList = reusedCuIds.Count > 0 ? await db.CastleUnits.Where(u => reusedCuIds.Contains(u.CastleUnitId)).ToListAsync() : [];
        var csList = reusedCsIds.Count > 0 ? await db.CastleServices.Where(s => reusedCsIds.Contains(s.CastleServiceId)).ToListAsync() : [];
        var compList = reusedCompIds.Count > 0 ? await db.Composites.Where(c => reusedCompIds.Contains(c.CompositeId)).ToListAsync() : [];
        var cpdList = reusedCpdIds.Count > 0 ? await db.Compounds.Where(c => reusedCpdIds.Contains(c.CompoundId)).ToListAsync() : [];
        var aaList = reusedAaIds.Count > 0 ? await db.AtomicAssets.Where(a => reusedAaIds.Contains(a.AtomicAssetId)).ToListAsync() : [];

        return new
        {
            castle_units = cuList.Select(u => new { id = u.CastleUnitId, u.Name, u.Status, castle_count = cuGroups.FirstOrDefault(r => r.Id == u.CastleUnitId)?.Count ?? 0 }),
            castle_services = csList.Select(s => new { id = s.CastleServiceId, s.Name, s.Status, castle_count = csGroups.FirstOrDefault(r => r.Id == s.CastleServiceId)?.Count ?? 0 }),
            composites = compList.Select(c => new { id = c.CompositeId, c.Name, c.Status, parent_count = compositeMap.GetValueOrDefault(c.CompositeId, 0) }),
            compounds = cpdList.Select(c => new { id = c.CompoundId, c.Name, c.Status, parent_count = compoundMap.GetValueOrDefault(c.CompoundId, 0) }),
            atomic_assets = aaList.Select(a => new { id = a.AtomicAssetId, a.Name, a.AssetType, a.Status, parent_count = aaMap.GetValueOrDefault(a.AtomicAssetId, 0) }),
        };
    }

    private static Dictionary<string, int> AggregateIds(IEnumerable<dynamic> groups)
    {
        var map = new Dictionary<string, int>();
        foreach (var g in groups)
        {
            string id = g.Id;
            int count = g.Count;
            map[id] = map.GetValueOrDefault(id, 0) + count;
        }
        return map;
    }

    // ── Report 11: getDeprecatedAssets ────────────────────────────────────────

    public async Task<object> GetDeprecatedAssets()
    {
        var aa = await db.AtomicAssets.Where(a => a.Status == "Deprecated").ToListAsync();
        var cpd = await db.Compounds.Where(c => c.Status == "Deprecated").ToListAsync();
        var comp = await db.Composites.Where(c => c.Status == "Deprecated").ToListAsync();
        var cs = await db.CastleServices.Where(s => s.Status == "Deprecated").ToListAsync();
        var cu = await db.CastleUnits.Where(u => u.Status == "Deprecated").ToListAsync();
        var bp = await db.Blueprints.Where(b => b.Status == "Deprecated").ToListAsync();
        var ct = await db.CastleTypes.Where(c => c.Status == "Deprecated").ToListAsync();
        var castles = await db.Castles.Where(c => c.Status == "Deprecated").ToListAsync();

        return new
        {
            atomic_assets = aa.Select(a => new { id = a.AtomicAssetId, a.Name, a.AssetType }),
            compounds = cpd.Select(c => new { id = c.CompoundId, c.Name }),
            composites = comp.Select(c => new { id = c.CompositeId, c.Name }),
            castle_services = cs.Select(s => new { id = s.CastleServiceId, s.Name }),
            castle_units = cu.Select(u => new { id = u.CastleUnitId, u.Name }),
            blueprints = bp.Select(b => new { id = b.BlueprintId, b.Name }),
            castle_types = ct.Select(c => new { id = c.CastleTypeId, c.Name }),
            castles = castles.Select(c => new { id = c.CastleRecordId, name = c.CastleName }),
        };
    }

    // ── Report 12: findDuplicates ─────────────────────────────────────────────

    private static readonly string[] StripSuffixes = [
        " castle service", " castle unit", " castle type", " atomic asset",
        " composite", " compound", " blueprint", " castle",
        " service", " unit", " type",
    ];

    private static string NormalizeName(string name)
    {
        var n = name.ToLowerInvariant().Trim();
        n = System.Text.RegularExpressions.Regex.Replace(n, @"\s+v\d+$", "");
        foreach (var suffix in StripSuffixes)
            if (n.EndsWith(suffix)) { n = n[..^suffix.Length].Trim(); break; }
        return n;
    }

    public async Task<object> FindDuplicates()
    {
        var aa = await db.AtomicAssets.Select(a => new { id = a.AtomicAssetId, a.Name, EntityType = "AtomicAsset", a.Status }).ToListAsync();
        var cpd = await db.Compounds.Select(c => new { id = c.CompoundId, c.Name, EntityType = "Compound", c.Status }).ToListAsync();
        var comp = await db.Composites.Select(c => new { id = c.CompositeId, c.Name, EntityType = "Composite", c.Status }).ToListAsync();
        var cs = await db.CastleServices.Select(s => new { id = s.CastleServiceId, s.Name, EntityType = "CastleService", s.Status }).ToListAsync();
        var cu = await db.CastleUnits.Select(u => new { id = u.CastleUnitId, u.Name, EntityType = "CastleUnit", u.Status }).ToListAsync();
        var bp = await db.Blueprints.Select(b => new { id = b.BlueprintId, b.Name, EntityType = "Blueprint", b.Status }).ToListAsync();
        var ct = await db.CastleTypes.Select(c => new { id = c.CastleTypeId, c.Name, EntityType = "CastleType", c.Status }).ToListAsync();

        var all = aa.Cast<dynamic>().Concat(cpd).Concat(comp).Concat(cs).Concat(cu).Concat(bp).Concat(ct);
        var groups = new Dictionary<string, List<object>>();
        foreach (var entry in all)
        {
            string name = entry.Name;
            string id = entry.id;
            string entityType = entry.EntityType;
            string status = entry.Status;
            var key = NormalizeName(name);
            if (!groups.ContainsKey(key)) groups[key] = [];
            groups[key].Add(new { id, name, entity_type = entityType, status });
        }

        return groups
            .Where(kv => kv.Value.Count >= 2)
            .OrderBy(kv => kv.Key)
            .Select(kv => new { normalized_name = kv.Key, entries = kv.Value });
    }

    // ── Report 13: getLocalModifications ──────────────────────────────────────

    public async Task<object> GetLocalModifications(string? castleRecordId)
    {
        var q = db.LocalModifications.AsQueryable();
        if (castleRecordId != null) q = q.Where(m => m.CastleRecordId == castleRecordId);
        return await q.OrderBy(m => m.CreatedAt).ToListAsync();
    }

    // ── Report 14: getPromotionCandidates ─────────────────────────────────────

    public async Task<object> GetPromotionCandidates() =>
        await db.LocalModifications
            .Where(m => m.PromotionRecommendation != "RemainLocal")
            .OrderBy(m => m.PromotionRecommendation)
            .ToListAsync();

    // ── Report 15: getBuildReadiness ──────────────────────────────────────────

    public async Task<object> GetBuildReadiness(string castleRecordId)
    {
        var bom = await bomService.GenerateBom(castleRecordId);
        var issues = new List<object>();

        void CheckNode(string id, string name, string entityType, string? warning)
        {
            if (warning != null) issues.Add(new { entity_id = id, entity_name = name, entity_type = entityType, warning });
        }

        CheckNode(bom.CastleRecordId, bom.CastleName, "Castle", bom.Warning);
        if (bom.CastleType != null) CheckNode(bom.CastleType.Id, bom.CastleType.Name, "CastleType", bom.CastleType.Warning);
        if (bom.Blueprint != null) CheckNode(bom.Blueprint.Id, bom.Blueprint.Name, "Blueprint", bom.Blueprint.Warning);

        foreach (var unit in bom.CastleUnits)
        {
            CheckNode(unit.Id, unit.Name, "CastleUnit", unit.Warning);
            foreach (var svc in unit.CastleServices)
            {
                CheckNode(svc.Id, svc.Name, "CastleService", svc.Warning);
                foreach (var comp in svc.Composites)
                {
                    CheckNode(comp.Id, comp.Name, "Composite", comp.Warning);
                    foreach (var cpd in comp.Compounds)
                    {
                        CheckNode(cpd.Id, cpd.Name, "Compound", cpd.Warning);
                        foreach (var aa in cpd.AtomicAssets) CheckNode(aa.Id, aa.Name, "AtomicAsset", aa.Warning);
                    }
                    foreach (var aa in comp.AtomicAssets) CheckNode(aa.Id, aa.Name, "AtomicAsset", aa.Warning);
                }
                foreach (var cpd in svc.Compounds)
                {
                    CheckNode(cpd.Id, cpd.Name, "Compound", cpd.Warning);
                    foreach (var aa in cpd.AtomicAssets) CheckNode(aa.Id, aa.Name, "AtomicAsset", aa.Warning);
                }
                foreach (var aa in svc.AtomicAssets) CheckNode(aa.Id, aa.Name, "AtomicAsset", aa.Warning);
            }
        }

        return new
        {
            castle_record_id = bom.CastleRecordId,
            castle_name = bom.CastleName,
            ready = issues.Count == 0,
            issue_count = issues.Count,
            issues,
        };
    }

    // ── Report 16: getApprovalStatus ──────────────────────────────────────────

    public async Task<object> GetApprovalStatus()
    {
        var aa = await db.AtomicAssets.Where(a => a.Status == "InReview").ToListAsync();
        var cpd = await db.Compounds.Where(c => c.Status == "InReview").ToListAsync();
        var comp = await db.Composites.Where(c => c.Status == "InReview").ToListAsync();
        var cs = await db.CastleServices.Where(s => s.Status == "InReview").ToListAsync();
        var cu = await db.CastleUnits.Where(u => u.Status == "InReview").ToListAsync();
        var bp = await db.Blueprints.Where(b => b.Status == "InReview").ToListAsync();
        var ct = await db.CastleTypes.Where(c => c.Status == "InReview").ToListAsync();
        var castles = await db.Castles.Where(c => c.Status == "InReview").ToListAsync();

        return new
        {
            atomic_assets = aa.Select(a => new { id = a.AtomicAssetId, a.Name, a.AssetType }),
            compounds = cpd.Select(c => new { id = c.CompoundId, c.Name }),
            composites = comp.Select(c => new { id = c.CompositeId, c.Name }),
            castle_services = cs.Select(s => new { id = s.CastleServiceId, s.Name }),
            castle_units = cu.Select(u => new { id = u.CastleUnitId, u.Name }),
            blueprints = bp.Select(b => new { id = b.BlueprintId, b.Name }),
            castle_types = ct.Select(c => new { id = c.CastleTypeId, c.Name }),
            castles = castles.Select(c => new { id = c.CastleRecordId, name = c.CastleName }),
            total = aa.Count + cpd.Count + comp.Count + cs.Count + cu.Count + bp.Count + ct.Count + castles.Count,
        };
    }
}
