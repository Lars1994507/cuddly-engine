namespace CastleInventoryAX.Models.JoinEntities;

public class CastleServiceAtomicAsset
{
    public string CastleServiceId { get; set; } = "";
    public string AtomicAssetId { get; set; } = "";

    public CastleService CastleService { get; set; } = null!;
    public AtomicAsset AtomicAsset { get; set; } = null!;
}
