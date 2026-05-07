namespace CastleInventoryAX.Models.JoinEntities;

public class CastleCastleService
{
    public string CastleRecordId { get; set; } = "";
    public string CastleServiceId { get; set; } = "";

    public Castle Castle { get; set; } = null!;
    public CastleService CastleService { get; set; } = null!;
}
