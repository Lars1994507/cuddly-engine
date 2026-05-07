using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class Composite
{
    public string CompositeId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Version { get; set; } = "";
    public string UiBackendScope { get; set; } = "";
    public string Status { get; set; } = "Draft";
    public string[] UsageReferences { get; set; } = [];
    public string? ApprovalStatus { get; set; }
    public string? ReuseNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CompositeCompound> Compounds { get; set; } = [];
    public ICollection<CompositeAtomicAsset> AtomicAssets { get; set; } = [];
    public ICollection<CastleServiceComposite> CastleServices { get; set; } = [];
    public ICollection<CastleUnitComposite> CastleUnits { get; set; } = [];
    public ICollection<BlueprintComposite> Blueprints { get; set; } = [];
}
