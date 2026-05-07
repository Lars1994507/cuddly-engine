using CastleInventoryAX.Models.JoinEntities;

namespace CastleInventoryAX.Models;

public class Castle
{
    public string CastleRecordId { get; set; } = "";
    public string CastleName { get; set; } = "";
    public string Version { get; set; } = "";
    public string Status { get; set; } = "Draft";
    public string PrimaryPurpose { get; set; } = "";
    public string? Description { get; set; }
    public string? BuildNotes { get; set; }
    public string? ReviewNotes { get; set; }
    public string? ReuseRecommendations { get; set; }
    public string? CastleTypeId { get; set; }
    public string? BlueprintId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public CastleType? CastleType { get; set; }
    public Blueprint? Blueprint { get; set; }
    public ICollection<CastleCastleUnit> CastleUnits { get; set; } = [];
    public ICollection<CastleCastleService> CastleServices { get; set; } = [];
    public ICollection<LocalModification> LocalModifications { get; set; } = [];
}
