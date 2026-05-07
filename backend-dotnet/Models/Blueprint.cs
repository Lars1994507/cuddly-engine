using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class Blueprint
{
    public string BlueprintId { get; set; } = "";
    public string Name { get; set; } = "";
    public string Category { get; set; } = "";
    public string Version { get; set; } = "";
    public string Status { get; set; } = "Draft";
    public string Purpose { get; set; } = "";
    public string? WhatItIsFor { get; set; }
    public string? WhatItIsNotFor { get; set; }
    public string? FrontendStructure { get; set; }
    public string? BackendStructure { get; set; }
    public string? AuthAssumptions { get; set; }
    public string? UserModelAssumptions { get; set; }
    public string? NavigationAssumptions { get; set; }
    public string[] DefaultPages { get; set; } = [];
    public string[] DefaultComponents { get; set; } = [];
    public string? ContextInventoryFilters { get; set; }
    public string? InitializationRules { get; set; }
    public string? PlaceholderRules { get; set; }
    public string[] RequiredReviewSteps { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<BlueprintCastleUnit> CastleUnits { get; set; } = [];
    public ICollection<BlueprintCastleService> CastleServices { get; set; } = [];
    public ICollection<BlueprintComposite> Composites { get; set; } = [];
    public ICollection<CastleTypeBlueprint> CastleTypes { get; set; } = [];
    public ICollection<Castle> Castles { get; set; } = [];
}
