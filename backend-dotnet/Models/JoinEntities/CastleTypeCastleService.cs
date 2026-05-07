namespace CastleInventoryAX.Models.JoinEntities;

public class CastleTypeCastleService
{
    public string CastleTypeId { get; set; } = "";
    public string CastleServiceId { get; set; } = "";

    public CastleType CastleType { get; set; } = null!;
    public CastleService CastleService { get; set; } = null!;
}
