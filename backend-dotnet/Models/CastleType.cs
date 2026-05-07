using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class CastleType
{
    public string CastleTypeId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string CommonPurpose { get; set; } = "";
    public string[] TypicalUseCases { get; set; } = [];
    public string? RecommendedAssetFilters { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CastleTypeBlueprint> Blueprints { get; set; } = [];
    public ICollection<CastleTypeCastleUnit> CastleUnits { get; set; } = [];
    public ICollection<CastleTypeCastleService> CastleServices { get; set; } = [];
    public ICollection<Castle> Castles { get; set; } = [];
}
