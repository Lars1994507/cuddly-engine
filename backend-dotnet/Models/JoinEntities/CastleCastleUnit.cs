namespace CastleInventoryAX.Models.JoinEntities;

public class CastleCastleUnit
{
    public string CastleRecordId { get; set; } = "";
    public string CastleUnitId { get; set; } = "";

    public Castle Castle { get; set; } = null!;
    public CastleUnit CastleUnit { get; set; } = null!;
}
