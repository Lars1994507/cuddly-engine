namespace CastleInventoryAX.Models.JoinEntities;

public class CastleServiceCompound
{
    public string CastleServiceId { get; set; } = "";
    public string CompoundId { get; set; } = "";

    public CastleService CastleService { get; set; } = null!;
    public Compound Compound { get; set; } = null!;
}
