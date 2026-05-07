namespace CastleInventoryAX.Models;

public class LocalModification
{
    public string ModificationId { get; set; } = "";
    public string CastleRecordId { get; set; } = "";
    public string ModifiedItem { get; set; } = "";
    public string ChangeDescription { get; set; } = "";
    public string Reason { get; set; } = "";
    public string? RelatedAssetId { get; set; }
    public string? RelatedAssetType { get; set; }
    public string? RelatedBlueprintId { get; set; }
    public string? RelatedCastleServiceId { get; set; }
    public string? VersionNotes { get; set; }
    public string Status { get; set; } = "Active";
    public string ReviewStatus { get; set; } = "Pending";
    public string PromotionRecommendation { get; set; } = "RemainLocal";
    public string? TestingNotes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Castle Castle { get; set; } = null!;
}
