namespace CastleInventoryAX.Models.JoinEntities;

public class CastleTypeCastleUnit
{
    public string CastleTypeId { get; set; } = "";
    public string CastleUnitId { get; set; } = "";

    public CastleType CastleType { get; set; } = null!;
    public CastleUnit CastleUnit { get; set; } = null!;
}
