namespace CastleInventoryAX.Models.JoinEntities;

public class BlueprintCastleService
{
    public string BlueprintId { get; set; } = "";
    public string CastleServiceId { get; set; } = "";

    public Blueprint Blueprint { get; set; } = null!;
    public CastleService CastleService { get; set; } = null!;
}
