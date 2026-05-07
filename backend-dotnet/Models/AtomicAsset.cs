using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class AtomicAsset
{
    public string AtomicAssetId { get; set; } = "";
    public string Name { get; set; } = "";
    public string AssetType { get; set; } = "";
    public string Description { get; set; } = "";
    public string CodeLocation { get; set; } = "";
    public string Version { get; set; } = "";
    public string Status { get; set; } = "Draft";
    public string[] Dependencies { get; set; } = [];
    public string? ValidationNotes { get; set; }
    public string? ApprovedPatternNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CompoundAtomicAsset> Compounds { get; set; } = [];
    public ICollection<CompositeAtomicAsset> Composites { get; set; } = [];
    public ICollection<CastleServiceAtomicAsset> CastleServices { get; set; } = [];
}
