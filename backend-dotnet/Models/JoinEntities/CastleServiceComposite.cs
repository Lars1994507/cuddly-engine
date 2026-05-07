namespace CastleInventoryAX.Models.JoinEntities;

public class CastleServiceComposite
{
    public string CastleServiceId { get; set; } = "";
    public string CompositeId { get; set; } = "";

    public CastleService CastleService { get; set; } = null!;
    public Composite Composite { get; set; } = null!;
}
