using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class Compound
{
    public string CompoundId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Version { get; set; } = "";
    public string Status { get; set; } = "Draft";
    public string? TestingNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CompoundAtomicAsset> AtomicAssets { get; set; } = [];
    public ICollection<CompositeCompound> Composites { get; set; } = [];
    public ICollection<CastleServiceCompound> CastleServices { get; set; } = [];
}
