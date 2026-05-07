namespace CastleInventoryAX.Models.JoinEntities;

public class CastleUnitService
{
    public string CastleUnitId { get; set; } = "";
    public string CastleServiceId { get; set; } = "";

    public CastleUnit CastleUnit { get; set; } = null!;
    public CastleService CastleService { get; set; } = null!;
}
