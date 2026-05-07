namespace CastleInventoryAX.Models.JoinEntities;

public class BlueprintCastleUnit
{
    public string BlueprintId { get; set; } = "";
    public string CastleUnitId { get; set; } = "";

    public Blueprint Blueprint { get; set; } = null!;
    public CastleUnit CastleUnit { get; set; } = null!;
}
