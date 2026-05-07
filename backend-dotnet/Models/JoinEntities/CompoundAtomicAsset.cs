namespace CastleInventoryAX.Models.JoinEntities;

public class CompoundAtomicAsset
{
    public string CompoundId { get; set; } = "";
    public string AtomicAssetId { get; set; } = "";

    public Compound Compound { get; set; } = null!;
    public AtomicAsset AtomicAsset { get; set; } = null!;
}
