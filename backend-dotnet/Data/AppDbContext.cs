using CastleInventoryAX.Models;
using CastleInventoryAX.Models.JoinEntities;
using Microsoft.EntityFrameworkCore;

namespace CastleInventoryAX.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AtomicAsset> AtomicAssets => Set<AtomicAsset>();
    public DbSet<Compound> Compounds => Set<Compound>();
    public DbSet<Composite> Composites => Set<Composite>();
    public DbSet<CastleService> CastleServices => Set<CastleService>();
    public DbSet<CastleUnit> CastleUnits => Set<CastleUnit>();
    public DbSet<Blueprint> Blueprints => Set<Blueprint>();
    public DbSet<CastleType> CastleTypes => Set<CastleType>();
    public DbSet<Castle> Castles => Set<Castle>();
    public DbSet<LocalModification> LocalModifications => Set<LocalModification>();

    public DbSet<CompoundAtomicAsset> CompoundAtomicAssets => Set<CompoundAtomicAsset>();
    public DbSet<CompositeCompound> CompositeCompounds => Set<CompositeCompound>();
    public DbSet<CompositeAtomicAsset> CompositeAtomicAssets => Set<CompositeAtomicAsset>();
    public DbSet<CastleServiceComposite> CastleServiceComposites => Set<CastleServiceComposite>();
    public DbSet<CastleServiceCompound> CastleServiceCompounds => Set<CastleServiceCompound>();
    public DbSet<CastleServiceAtomicAsset> CastleServiceAtomicAssets => Set<CastleServiceAtomicAsset>();
    public DbSet<CastleUnitService> CastleUnitServices => Set<CastleUnitService>();
    public DbSet<CastleUnitComposite> CastleUnitComposites => Set<CastleUnitComposite>();
    public DbSet<BlueprintCastleUnit> BlueprintCastleUnits => Set<BlueprintCastleUnit>();
    public DbSet<BlueprintCastleService> BlueprintCastleServices => Set<BlueprintCastleService>();
    public DbSet<BlueprintComposite> BlueprintComposites => Set<BlueprintComposite>();
    public DbSet<CastleTypeBlueprint> CastleTypeBlueprints => Set<CastleTypeBlueprint>();
    public DbSet<CastleTypeCastleUnit> CastleTypeCastleUnits => Set<CastleTypeCastleUnit>();
    public DbSet<CastleTypeCastleService> CastleTypeCastleServices => Set<CastleTypeCastleService>();
    public DbSet<CastleCastleUnit> CastleCastleUnits => Set<CastleCastleUnit>();
    public DbSet<CastleCastleService> CastleCastleServices => Set<CastleCastleService>();

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "CreatedAt"))
                    entry.Property("CreatedAt").CurrentValue = now;
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                if (entry.Properties.Any(p => p.Metadata.Name == "UpdatedAt"))
                    entry.Property("UpdatedAt").CurrentValue = now;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── AtomicAsset ──────────────────────────────────────────────────────
        modelBuilder.Entity<AtomicAsset>(b =>
        {
            b.ToTable("AtomicAsset");
            b.HasKey(e => e.AtomicAssetId);
            b.Property(e => e.AtomicAssetId).HasColumnName("atomic_asset_id");
            b.Property(e => e.Name).HasColumnName("name");
            b.Property(e => e.AssetType).HasColumnName("asset_type");
            b.Property(e => e.Description).HasColumnName("description");
            b.Property(e => e.CodeLocation).HasColumnName("code_location");
            b.Property(e => e.Version).HasColumnName("version");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.Dependencies).HasColumnName("dependencies");
            b.Property(e => e.ValidationNotes).HasColumnName("validation_notes");
            b.Property(e => e.ApprovedPatternNotes).HasColumnName("approved_pattern_notes");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // ── Compound ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Compound>(b =>
        {
            b.ToTable("Compound");
            b.HasKey(e => e.CompoundId);
            b.Property(e => e.CompoundId).HasColumnName("compound_id");
            b.Property(e => e.Name).HasColumnName("name");
            b.Property(e => e.Description).HasColumnName("description");
            b.Property(e => e.Version).HasColumnName("version");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.TestingNotes).HasColumnName("testing_notes");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // ── Composite ────────────────────────────────────────────────────────
        modelBuilder.Entity<Composite>(b =>
        {
            b.ToTable("Composite");
            b.HasKey(e => e.CompositeId);
            b.Property(e => e.CompositeId).HasColumnName("composite_id");
            b.Property(e => e.Name).HasColumnName("name");
            b.Property(e => e.Description).HasColumnName("description");
            b.Property(e => e.Version).HasColumnName("version");
            b.Property(e => e.UiBackendScope).HasColumnName("ui_backend_scope");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.UsageReferences).HasColumnName("usage_references");
            b.Property(e => e.ApprovalStatus).HasColumnName("approval_status");
            b.Property(e => e.ReuseNotes).HasColumnName("reuse_notes");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // ── CastleService ────────────────────────────────────────────────────
        modelBuilder.Entity<CastleService>(b =>
        {
            b.ToTable("CastleService");
            b.HasKey(e => e.CastleServiceId);
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.Property(e => e.Name).HasColumnName("name");
            b.Property(e => e.Capability).HasColumnName("capability");
            b.Property(e => e.BackendModules).HasColumnName("backend_modules");
            b.Property(e => e.ApiContracts).HasColumnName("api_contracts");
            b.Property(e => e.DatabaseInteractions).HasColumnName("database_interactions");
            b.Property(e => e.FrontendVisibility).HasColumnName("frontend_visibility");
            b.Property(e => e.AdminControls).HasColumnName("admin_controls");
            b.Property(e => e.Observability).HasColumnName("observability");
            b.Property(e => e.Logging).HasColumnName("logging");
            b.Property(e => e.HealthChecks).HasColumnName("health_checks");
            b.Property(e => e.PermissionRules).HasColumnName("permission_rules");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // ── CastleUnit ───────────────────────────────────────────────────────
        modelBuilder.Entity<CastleUnit>(b =>
        {
            b.ToTable("CastleUnit");
            b.HasKey(e => e.CastleUnitId);
            b.Property(e => e.CastleUnitId).HasColumnName("castle_unit_id");
            b.Property(e => e.Name).HasColumnName("name");
            b.Property(e => e.Description).HasColumnName("description");
            b.Property(e => e.PermissionScope).HasColumnName("permission_scope");
            b.Property(e => e.DomainNotes).HasColumnName("domain_notes");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // ── Blueprint ────────────────────────────────────────────────────────
        modelBuilder.Entity<Blueprint>(b =>
        {
            b.ToTable("Blueprint");
            b.HasKey(e => e.BlueprintId);
            b.Property(e => e.BlueprintId).HasColumnName("blueprint_id");
            b.Property(e => e.Name).HasColumnName("name");
            b.Property(e => e.Category).HasColumnName("category");
            b.Property(e => e.Version).HasColumnName("version");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.Purpose).HasColumnName("purpose");
            b.Property(e => e.WhatItIsFor).HasColumnName("what_it_is_for");
            b.Property(e => e.WhatItIsNotFor).HasColumnName("what_it_is_not_for");
            b.Property(e => e.FrontendStructure).HasColumnName("frontend_structure");
            b.Property(e => e.BackendStructure).HasColumnName("backend_structure");
            b.Property(e => e.AuthAssumptions).HasColumnName("auth_assumptions");
            b.Property(e => e.UserModelAssumptions).HasColumnName("user_model_assumptions");
            b.Property(e => e.NavigationAssumptions).HasColumnName("navigation_assumptions");
            b.Property(e => e.DefaultPages).HasColumnName("default_pages");
            b.Property(e => e.DefaultComponents).HasColumnName("default_components");
            b.Property(e => e.ContextInventoryFilters).HasColumnName("context_inventory_filters");
            b.Property(e => e.InitializationRules).HasColumnName("initialization_rules");
            b.Property(e => e.PlaceholderRules).HasColumnName("placeholder_rules");
            b.Property(e => e.RequiredReviewSteps).HasColumnName("required_review_steps");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // ── CastleType ───────────────────────────────────────────────────────
        modelBuilder.Entity<CastleType>(b =>
        {
            b.ToTable("CastleType");
            b.HasKey(e => e.CastleTypeId);
            b.Property(e => e.CastleTypeId).HasColumnName("castle_type_id");
            b.Property(e => e.Name).HasColumnName("name");
            b.Property(e => e.Description).HasColumnName("description");
            b.Property(e => e.CommonPurpose).HasColumnName("common_purpose");
            b.Property(e => e.TypicalUseCases).HasColumnName("typical_use_cases");
            b.Property(e => e.RecommendedAssetFilters).HasColumnName("recommended_asset_filters");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        });

        // ── Castle ───────────────────────────────────────────────────────────
        modelBuilder.Entity<Castle>(b =>
        {
            b.ToTable("Castle");
            b.HasKey(e => e.CastleRecordId);
            b.Property(e => e.CastleRecordId).HasColumnName("castle_record_id");
            b.Property(e => e.CastleName).HasColumnName("castle_name");
            b.Property(e => e.Version).HasColumnName("version");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Draft");
            b.Property(e => e.PrimaryPurpose).HasColumnName("primary_purpose");
            b.Property(e => e.Description).HasColumnName("description");
            b.Property(e => e.BuildNotes).HasColumnName("build_notes");
            b.Property(e => e.ReviewNotes).HasColumnName("review_notes");
            b.Property(e => e.ReuseRecommendations).HasColumnName("reuse_recommendations");
            b.Property(e => e.CastleTypeId).HasColumnName("castle_type_id");
            b.Property(e => e.BlueprintId).HasColumnName("blueprint_id");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            b.HasOne(e => e.CastleType).WithMany(e => e.Castles).HasForeignKey(e => e.CastleTypeId).OnDelete(DeleteBehavior.SetNull);
            b.HasOne(e => e.Blueprint).WithMany(e => e.Castles).HasForeignKey(e => e.BlueprintId).OnDelete(DeleteBehavior.SetNull);
        });

        // ── LocalModification ────────────────────────────────────────────────
        modelBuilder.Entity<LocalModification>(b =>
        {
            b.ToTable("LocalModification");
            b.HasKey(e => e.ModificationId);
            b.Property(e => e.ModificationId).HasColumnName("modification_id");
            b.Property(e => e.CastleRecordId).HasColumnName("castle_record_id");
            b.Property(e => e.ModifiedItem).HasColumnName("modified_item");
            b.Property(e => e.ChangeDescription).HasColumnName("change_description");
            b.Property(e => e.Reason).HasColumnName("reason");
            b.Property(e => e.RelatedAssetId).HasColumnName("related_asset_id");
            b.Property(e => e.RelatedAssetType).HasColumnName("related_asset_type");
            b.Property(e => e.RelatedBlueprintId).HasColumnName("related_blueprint_id");
            b.Property(e => e.RelatedCastleServiceId).HasColumnName("related_castle_service_id");
            b.Property(e => e.VersionNotes).HasColumnName("version_notes");
            b.Property(e => e.Status).HasColumnName("status").HasDefaultValue("Active");
            b.Property(e => e.ReviewStatus).HasColumnName("review_status").HasDefaultValue("Pending");
            b.Property(e => e.PromotionRecommendation).HasColumnName("promotion_recommendation").HasDefaultValue("RemainLocal");
            b.Property(e => e.TestingNotes).HasColumnName("testing_notes");
            b.Property(e => e.CreatedAt).HasColumnName("created_at");
            b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            b.HasOne(e => e.Castle).WithMany(e => e.LocalModifications).HasForeignKey(e => e.CastleRecordId).OnDelete(DeleteBehavior.Cascade);
        });

        // ── Join Tables ──────────────────────────────────────────────────────

        modelBuilder.Entity<CompoundAtomicAsset>(b =>
        {
            b.ToTable("compound_atomic_assets");
            b.HasKey(e => new { e.CompoundId, e.AtomicAssetId });
            b.Property(e => e.CompoundId).HasColumnName("compound_id");
            b.Property(e => e.AtomicAssetId).HasColumnName("atomic_asset_id");
            b.HasOne(e => e.Compound).WithMany(e => e.AtomicAssets).HasForeignKey(e => e.CompoundId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.AtomicAsset).WithMany(e => e.Compounds).HasForeignKey(e => e.AtomicAssetId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CompositeCompound>(b =>
        {
            b.ToTable("composite_compounds");
            b.HasKey(e => new { e.CompositeId, e.CompoundId });
            b.Property(e => e.CompositeId).HasColumnName("composite_id");
            b.Property(e => e.CompoundId).HasColumnName("compound_id");
            b.HasOne(e => e.Composite).WithMany(e => e.Compounds).HasForeignKey(e => e.CompositeId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.Compound).WithMany(e => e.Composites).HasForeignKey(e => e.CompoundId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CompositeAtomicAsset>(b =>
        {
            b.ToTable("composite_atomic_assets");
            b.HasKey(e => new { e.CompositeId, e.AtomicAssetId });
            b.Property(e => e.CompositeId).HasColumnName("composite_id");
            b.Property(e => e.AtomicAssetId).HasColumnName("atomic_asset_id");
            b.HasOne(e => e.Composite).WithMany(e => e.AtomicAssets).HasForeignKey(e => e.CompositeId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.AtomicAsset).WithMany(e => e.Composites).HasForeignKey(e => e.AtomicAssetId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleServiceComposite>(b =>
        {
            b.ToTable("castle_service_composites");
            b.HasKey(e => new { e.CastleServiceId, e.CompositeId });
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.Property(e => e.CompositeId).HasColumnName("composite_id");
            b.HasOne(e => e.CastleService).WithMany(e => e.Composites).HasForeignKey(e => e.CastleServiceId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.Composite).WithMany(e => e.CastleServices).HasForeignKey(e => e.CompositeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleServiceCompound>(b =>
        {
            b.ToTable("castle_service_compounds");
            b.HasKey(e => new { e.CastleServiceId, e.CompoundId });
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.Property(e => e.CompoundId).HasColumnName("compound_id");
            b.HasOne(e => e.CastleService).WithMany(e => e.Compounds).HasForeignKey(e => e.CastleServiceId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.Compound).WithMany(e => e.CastleServices).HasForeignKey(e => e.CompoundId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleServiceAtomicAsset>(b =>
        {
            b.ToTable("castle_service_atomic_assets");
            b.HasKey(e => new { e.CastleServiceId, e.AtomicAssetId });
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.Property(e => e.AtomicAssetId).HasColumnName("atomic_asset_id");
            b.HasOne(e => e.CastleService).WithMany(e => e.AtomicAssets).HasForeignKey(e => e.CastleServiceId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.AtomicAsset).WithMany(e => e.CastleServices).HasForeignKey(e => e.AtomicAssetId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleUnitService>(b =>
        {
            b.ToTable("castle_unit_services");
            b.HasKey(e => new { e.CastleUnitId, e.CastleServiceId });
            b.Property(e => e.CastleUnitId).HasColumnName("castle_unit_id");
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.HasOne(e => e.CastleUnit).WithMany(e => e.CastleServices).HasForeignKey(e => e.CastleUnitId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.CastleService).WithMany(e => e.CastleUnits).HasForeignKey(e => e.CastleServiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleUnitComposite>(b =>
        {
            b.ToTable("castle_unit_composites");
            b.HasKey(e => new { e.CastleUnitId, e.CompositeId });
            b.Property(e => e.CastleUnitId).HasColumnName("castle_unit_id");
            b.Property(e => e.CompositeId).HasColumnName("composite_id");
            b.HasOne(e => e.CastleUnit).WithMany(e => e.Composites).HasForeignKey(e => e.CastleUnitId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.Composite).WithMany(e => e.CastleUnits).HasForeignKey(e => e.CompositeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BlueprintCastleUnit>(b =>
        {
            b.ToTable("blueprint_castle_units");
            b.HasKey(e => new { e.BlueprintId, e.CastleUnitId });
            b.Property(e => e.BlueprintId).HasColumnName("blueprint_id");
            b.Property(e => e.CastleUnitId).HasColumnName("castle_unit_id");
            b.HasOne(e => e.Blueprint).WithMany(e => e.CastleUnits).HasForeignKey(e => e.BlueprintId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.CastleUnit).WithMany(e => e.Blueprints).HasForeignKey(e => e.CastleUnitId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BlueprintCastleService>(b =>
        {
            b.ToTable("blueprint_castle_services");
            b.HasKey(e => new { e.BlueprintId, e.CastleServiceId });
            b.Property(e => e.BlueprintId).HasColumnName("blueprint_id");
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.HasOne(e => e.Blueprint).WithMany(e => e.CastleServices).HasForeignKey(e => e.BlueprintId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.CastleService).WithMany(e => e.Blueprints).HasForeignKey(e => e.CastleServiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BlueprintComposite>(b =>
        {
            b.ToTable("blueprint_composites");
            b.HasKey(e => new { e.BlueprintId, e.CompositeId });
            b.Property(e => e.BlueprintId).HasColumnName("blueprint_id");
            b.Property(e => e.CompositeId).HasColumnName("composite_id");
            b.HasOne(e => e.Blueprint).WithMany(e => e.Composites).HasForeignKey(e => e.BlueprintId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.Composite).WithMany(e => e.Blueprints).HasForeignKey(e => e.CompositeId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleTypeBlueprint>(b =>
        {
            b.ToTable("castle_type_blueprints");
            b.HasKey(e => new { e.CastleTypeId, e.BlueprintId });
            b.Property(e => e.CastleTypeId).HasColumnName("castle_type_id");
            b.Property(e => e.BlueprintId).HasColumnName("blueprint_id");
            b.HasOne(e => e.CastleType).WithMany(e => e.Blueprints).HasForeignKey(e => e.CastleTypeId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.Blueprint).WithMany(e => e.CastleTypes).HasForeignKey(e => e.BlueprintId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleTypeCastleUnit>(b =>
        {
            b.ToTable("castle_type_castle_units");
            b.HasKey(e => new { e.CastleTypeId, e.CastleUnitId });
            b.Property(e => e.CastleTypeId).HasColumnName("castle_type_id");
            b.Property(e => e.CastleUnitId).HasColumnName("castle_unit_id");
            b.HasOne(e => e.CastleType).WithMany(e => e.CastleUnits).HasForeignKey(e => e.CastleTypeId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.CastleUnit).WithMany(e => e.CastleTypes).HasForeignKey(e => e.CastleUnitId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleTypeCastleService>(b =>
        {
            b.ToTable("castle_type_castle_services");
            b.HasKey(e => new { e.CastleTypeId, e.CastleServiceId });
            b.Property(e => e.CastleTypeId).HasColumnName("castle_type_id");
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.HasOne(e => e.CastleType).WithMany(e => e.CastleServices).HasForeignKey(e => e.CastleTypeId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.CastleService).WithMany(e => e.CastleTypes).HasForeignKey(e => e.CastleServiceId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleCastleUnit>(b =>
        {
            b.ToTable("castle_castle_units");
            b.HasKey(e => new { e.CastleRecordId, e.CastleUnitId });
            b.Property(e => e.CastleRecordId).HasColumnName("castle_record_id");
            b.Property(e => e.CastleUnitId).HasColumnName("castle_unit_id");
            b.HasOne(e => e.Castle).WithMany(e => e.CastleUnits).HasForeignKey(e => e.CastleRecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.CastleUnit).WithMany(e => e.Castles).HasForeignKey(e => e.CastleUnitId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CastleCastleService>(b =>
        {
            b.ToTable("castle_castle_services");
            b.HasKey(e => new { e.CastleRecordId, e.CastleServiceId });
            b.Property(e => e.CastleRecordId).HasColumnName("castle_record_id");
            b.Property(e => e.CastleServiceId).HasColumnName("castle_service_id");
            b.HasOne(e => e.Castle).WithMany(e => e.CastleServices).HasForeignKey(e => e.CastleRecordId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne(e => e.CastleService).WithMany(e => e.Castles).HasForeignKey(e => e.CastleServiceId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
