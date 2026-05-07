using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class CastleService
{
    public string CastleServiceId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Capability { get; set; } = "";
    public string[] BackendModules { get; set; } = [];
    public string? ApiContracts { get; set; }
    public string? DatabaseInteractions { get; set; }
    public string? FrontendVisibility { get; set; }
    public string? AdminControls { get; set; }
    public string? Observability { get; set; }
    public string? Logging { get; set; }
    public string? HealthChecks { get; set; }
    public string? PermissionRules { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<CastleServiceComposite> Composites { get; set; } = [];
    public ICollection<CastleServiceCompound> Compounds { get; set; } = [];
    public ICollection<CastleServiceAtomicAsset> AtomicAssets { get; set; } = [];
    public ICollection<CastleUnitService> CastleUnits { get; set; } = [];
    public ICollection<BlueprintCastleService> Blueprints { get; set; } = [];
    public ICollection<CastleTypeCastleService> CastleTypes { get; set; } = [];
    public ICollection<CastleCastleService> Castles { get; set; } = [];
}
