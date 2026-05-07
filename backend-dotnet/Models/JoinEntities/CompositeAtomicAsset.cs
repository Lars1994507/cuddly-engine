namespace CastleInventoryAX.Models.JoinEntities;

public class CompositeAtomicAsset
{
    public string CompositeId { get; set; } = "";
    public string AtomicAssetId { get; set; } = "";

    public Composite Composite { get; set; } = null!;
    public AtomicAsset AtomicAsset { get; set; } = null!;
}
