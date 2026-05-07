namespace CastleInventoryAX.Models.JoinEntities;

public class CompositeCompound
{
    public string CompositeId { get; set; } = "";
    public string CompoundId { get; set; } = "";

    public Composite Composite { get; set; } = null!;
    public Compound Compound { get; set; } = null!;
}
