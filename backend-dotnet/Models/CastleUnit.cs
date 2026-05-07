using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class CastleUnit
{
    public string CastleUnitId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string PermissionScope { get; set; } = "";
    public string? DomainNotes { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CastleUnitService> CastleServices { get; set; } = [];
    public ICollection<CastleUnitComposite> Composites { get; set; } = [];
    public ICollection<BlueprintCastleUnit> Blueprints { get; set; } = [];
    public ICollection<CastleTypeCastleUnit> CastleTypes { get; set; } = [];
    public ICollection<CastleCastleUnit> Castles { get; set; } = [];
}
