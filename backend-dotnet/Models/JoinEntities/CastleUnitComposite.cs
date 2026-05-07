namespace CastleInventoryAX.Models.JoinEntities;

public class CastleUnitComposite
{
    public string CastleUnitId { get; set; } = "";
    public string CompositeId { get; set; } = "";

    public CastleUnit CastleUnit { get; set; } = null!;
    public Composite Composite { get; set; } = null!;
}
