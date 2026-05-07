namespace CastleInventoryAX.Models.JoinEntities;

public class BlueprintComposite
{
    public string BlueprintId { get; set; } = "";
    public string CompositeId { get; set; } = "";

    public Blueprint Blueprint { get; set; } = null!;
    public Composite Composite { get; set; } = null!;
}
