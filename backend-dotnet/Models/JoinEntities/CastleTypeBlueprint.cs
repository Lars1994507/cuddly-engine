namespace CastleInventoryAX.Models.JoinEntities;

public class CastleTypeBlueprint
{
    public string CastleTypeId { get; set; } = "";
    public string BlueprintId { get; set; } = "";

    public CastleType CastleType { get; set; } = null!;
    public Blueprint Blueprint { get; set; } = null!;
}
