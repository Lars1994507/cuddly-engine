using System.Text.Json.Serialization;
using CastleInventoryAX.Services;
using Microsoft.AspNetCore.Mvc;

namespace CastleInventoryAX.Controllers;

[ApiController]
[Route("diagram")]
public class DiagramController(BomService bomService) : ControllerBase
{
    public record DiagramNode(string Id, string Label, string Type, string Status,
        [property: JsonPropertyName("subLabel")] string? SubLabel = null);
    public record DiagramEdge(string Source, string Target);
    public record DiagramResult(string CastleRecordId, string CastleName, List<DiagramNode> Nodes, List<DiagramEdge> Edges);

    [HttpGet("castle/{castleRecordId}")]
    public async Task<IActionResult> GetDiagram(string castleRecordId)
    {
        try
        {
            var bom = await bomService.GenerateBom(castleRecordId);
            return Ok(BomToGraph(bom));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private static DiagramResult BomToGraph(BomService.BomResult bom)
    {
        var nodes = new List<DiagramNode>();
        var edges = new List<DiagramEdge>();
        var seenNodes = new HashSet<string>();
        var seenEdges = new HashSet<string>();

        void Node(string id, string label, string type, string status, string? subLabel = null)
        {
            if (seenNodes.Add(id))
                nodes.Add(new DiagramNode(id, label, type, status, subLabel));
        }

        void Edge(string source, string target)
        {
            if (seenEdges.Add($"{source}→{target}"))
                edges.Add(new DiagramEdge(source, target));
        }

        var castleId = bom.CastleRecordId;
        Node(castleId, bom.CastleName, "Castle", bom.Status);

        if (bom.CastleType is { } ct)
        {
            Node(ct.Id, ct.Name, "CastleType", ct.Status);
            Edge(castleId, ct.Id);
        }

        if (bom.Blueprint is { } bp)
        {
            Node(bp.Id, bp.Name, "Blueprint", bp.Status);
            Edge(castleId, bp.Id);
        }

        foreach (var unit in bom.CastleUnits)
            AddUnit(unit, castleId);

        foreach (var mod in bom.LocalModifications)
        {
            Node(mod.ModificationId, mod.ModifiedItem, "LocalMod", mod.ReviewStatus, mod.PromotionRecommendation);
            Edge(castleId, mod.ModificationId);
        }

        return new DiagramResult(bom.CastleRecordId, bom.CastleName, nodes, edges);

        void AddUnit(BomService.BomCastleUnit unit, string parentId)
        {
            Node(unit.Id, unit.Name, "CastleUnit", unit.Status);
            Edge(parentId, unit.Id);
            foreach (var svc in unit.CastleServices)
                AddService(svc, unit.Id);
        }

        void AddService(BomService.BomCastleService svc, string parentId)
        {
            Node(svc.Id, svc.Name, "CastleService", svc.Status, svc.Capability);
            Edge(parentId, svc.Id);
            foreach (var comp in svc.Composites) AddComposite(comp, svc.Id);
            foreach (var cpd in svc.Compounds) AddCompound(cpd, svc.Id);
            foreach (var aa in svc.AtomicAssets)
            {
                Node(aa.Id, aa.Name, "AtomicAsset", aa.Status, aa.AssetType);
                Edge(svc.Id, aa.Id);
            }
        }

        void AddComposite(BomService.BomComposite comp, string parentId)
        {
            Node(comp.Id, comp.Name, "Composite", comp.Status, comp.UiBackendScope);
            Edge(parentId, comp.Id);
            foreach (var cpd in comp.Compounds) AddCompound(cpd, comp.Id);
            foreach (var aa in comp.AtomicAssets)
            {
                Node(aa.Id, aa.Name, "AtomicAsset", aa.Status, aa.AssetType);
                Edge(comp.Id, aa.Id);
            }
        }

        void AddCompound(BomService.BomCompound cpd, string parentId)
        {
            Node(cpd.Id, cpd.Name, "Compound", cpd.Status);
            Edge(parentId, cpd.Id);
            foreach (var aa in cpd.AtomicAssets)
            {
                Node(aa.Id, aa.Name, "AtomicAsset", aa.Status, aa.AssetType);
                Edge(cpd.Id, aa.Id);
            }
        }
    }
}
