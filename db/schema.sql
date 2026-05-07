-- CastleInventoryAX — PostgreSQL Schema
-- Database: castleinventoryax  Port: 5433
-- This file is the authoritative schema record. Edit this first, then update the
-- EF Core models/DbContext to match. Never let EF Core generate or migrate tables.

-- ── Atomic Asset ────────────────────────────────────────────────────────────────

CREATE TABLE "AtomicAsset" (
    "atomic_asset_id"       TEXT        NOT NULL,
    "name"                  TEXT        NOT NULL,
    "asset_type"            TEXT        NOT NULL,
    "description"           TEXT        NOT NULL,
    "code_location"         TEXT        NOT NULL,
    "version"               TEXT        NOT NULL,
    "status"                TEXT        NOT NULL DEFAULT 'Draft',
    "dependencies"          TEXT[]               DEFAULT ARRAY[]::TEXT[],
    "validation_notes"      TEXT,
    "approved_pattern_notes" TEXT,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AtomicAsset_pkey" PRIMARY KEY ("atomic_asset_id")
);

-- ── Compound ────────────────────────────────────────────────────────────────────

CREATE TABLE "Compound" (
    "compound_id"   TEXT        NOT NULL,
    "name"          TEXT        NOT NULL,
    "description"   TEXT        NOT NULL,
    "version"       TEXT        NOT NULL,
    "status"        TEXT        NOT NULL DEFAULT 'Draft',
    "testing_notes" TEXT,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Compound_pkey" PRIMARY KEY ("compound_id")
);

CREATE TABLE "compound_atomic_assets" (
    "compound_id"     TEXT NOT NULL,
    "atomic_asset_id" TEXT NOT NULL,
    CONSTRAINT "compound_atomic_assets_pkey" PRIMARY KEY ("compound_id", "atomic_asset_id"),
    CONSTRAINT "compound_atomic_assets_compound_id_fkey"
        FOREIGN KEY ("compound_id") REFERENCES "Compound"("compound_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "compound_atomic_assets_atomic_asset_id_fkey"
        FOREIGN KEY ("atomic_asset_id") REFERENCES "AtomicAsset"("atomic_asset_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Composite ───────────────────────────────────────────────────────────────────

CREATE TABLE "Composite" (
    "composite_id"    TEXT        NOT NULL,
    "name"            TEXT        NOT NULL,
    "description"     TEXT        NOT NULL,
    "version"         TEXT        NOT NULL,
    "ui_backend_scope" TEXT       NOT NULL,
    "status"          TEXT        NOT NULL DEFAULT 'Draft',
    "usage_references" TEXT[]              DEFAULT ARRAY[]::TEXT[],
    "approval_status" TEXT,
    "reuse_notes"     TEXT,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Composite_pkey" PRIMARY KEY ("composite_id")
);

CREATE TABLE "composite_compounds" (
    "composite_id" TEXT NOT NULL,
    "compound_id"  TEXT NOT NULL,
    CONSTRAINT "composite_compounds_pkey" PRIMARY KEY ("composite_id", "compound_id"),
    CONSTRAINT "composite_compounds_composite_id_fkey"
        FOREIGN KEY ("composite_id") REFERENCES "Composite"("composite_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "composite_compounds_compound_id_fkey"
        FOREIGN KEY ("compound_id") REFERENCES "Compound"("compound_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "composite_atomic_assets" (
    "composite_id"    TEXT NOT NULL,
    "atomic_asset_id" TEXT NOT NULL,
    CONSTRAINT "composite_atomic_assets_pkey" PRIMARY KEY ("composite_id", "atomic_asset_id"),
    CONSTRAINT "composite_atomic_assets_composite_id_fkey"
        FOREIGN KEY ("composite_id") REFERENCES "Composite"("composite_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "composite_atomic_assets_atomic_asset_id_fkey"
        FOREIGN KEY ("atomic_asset_id") REFERENCES "AtomicAsset"("atomic_asset_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Castle Service ──────────────────────────────────────────────────────────────

CREATE TABLE "CastleService" (
    "castle_service_id"    TEXT        NOT NULL,
    "name"                 TEXT        NOT NULL,
    "capability"           TEXT        NOT NULL,
    "backend_modules"      TEXT[]               DEFAULT ARRAY[]::TEXT[],
    "api_contracts"        TEXT,
    "database_interactions" TEXT,
    "frontend_visibility"  TEXT,
    "admin_controls"       TEXT,
    "observability"        TEXT,
    "logging"              TEXT,
    "health_checks"        TEXT,
    "permission_rules"     TEXT,
    "status"               TEXT        NOT NULL DEFAULT 'Draft',
    "created_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CastleService_pkey" PRIMARY KEY ("castle_service_id")
);

CREATE TABLE "castle_service_composites" (
    "castle_service_id" TEXT NOT NULL,
    "composite_id"      TEXT NOT NULL,
    CONSTRAINT "castle_service_composites_pkey" PRIMARY KEY ("castle_service_id", "composite_id"),
    CONSTRAINT "castle_service_composites_castle_service_id_fkey"
        FOREIGN KEY ("castle_service_id") REFERENCES "CastleService"("castle_service_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_service_composites_composite_id_fkey"
        FOREIGN KEY ("composite_id") REFERENCES "Composite"("composite_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "castle_service_compounds" (
    "castle_service_id" TEXT NOT NULL,
    "compound_id"       TEXT NOT NULL,
    CONSTRAINT "castle_service_compounds_pkey" PRIMARY KEY ("castle_service_id", "compound_id"),
    CONSTRAINT "castle_service_compounds_castle_service_id_fkey"
        FOREIGN KEY ("castle_service_id") REFERENCES "CastleService"("castle_service_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_service_compounds_compound_id_fkey"
        FOREIGN KEY ("compound_id") REFERENCES "Compound"("compound_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "castle_service_atomic_assets" (
    "castle_service_id" TEXT NOT NULL,
    "atomic_asset_id"   TEXT NOT NULL,
    CONSTRAINT "castle_service_atomic_assets_pkey" PRIMARY KEY ("castle_service_id", "atomic_asset_id"),
    CONSTRAINT "castle_service_atomic_assets_castle_service_id_fkey"
        FOREIGN KEY ("castle_service_id") REFERENCES "CastleService"("castle_service_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_service_atomic_assets_atomic_asset_id_fkey"
        FOREIGN KEY ("atomic_asset_id") REFERENCES "AtomicAsset"("atomic_asset_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Castle Unit ─────────────────────────────────────────────────────────────────

CREATE TABLE "CastleUnit" (
    "castle_unit_id"  TEXT        NOT NULL,
    "name"            TEXT        NOT NULL,
    "description"     TEXT        NOT NULL,
    "permission_scope" TEXT       NOT NULL,
    "domain_notes"    TEXT,
    "status"          TEXT        NOT NULL DEFAULT 'Draft',
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CastleUnit_pkey" PRIMARY KEY ("castle_unit_id")
);

CREATE TABLE "castle_unit_services" (
    "castle_unit_id"    TEXT NOT NULL,
    "castle_service_id" TEXT NOT NULL,
    CONSTRAINT "castle_unit_services_pkey" PRIMARY KEY ("castle_unit_id", "castle_service_id"),
    CONSTRAINT "castle_unit_services_castle_unit_id_fkey"
        FOREIGN KEY ("castle_unit_id") REFERENCES "CastleUnit"("castle_unit_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_unit_services_castle_service_id_fkey"
        FOREIGN KEY ("castle_service_id") REFERENCES "CastleService"("castle_service_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "castle_unit_composites" (
    "castle_unit_id" TEXT NOT NULL,
    "composite_id"   TEXT NOT NULL,
    CONSTRAINT "castle_unit_composites_pkey" PRIMARY KEY ("castle_unit_id", "composite_id"),
    CONSTRAINT "castle_unit_composites_castle_unit_id_fkey"
        FOREIGN KEY ("castle_unit_id") REFERENCES "CastleUnit"("castle_unit_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_unit_composites_composite_id_fkey"
        FOREIGN KEY ("composite_id") REFERENCES "Composite"("composite_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Blueprint ───────────────────────────────────────────────────────────────────

CREATE TABLE "Blueprint" (
    "blueprint_id"              TEXT        NOT NULL,
    "name"                      TEXT        NOT NULL,
    "category"                  TEXT        NOT NULL,
    "version"                   TEXT        NOT NULL,
    "status"                    TEXT        NOT NULL DEFAULT 'Draft',
    "purpose"                   TEXT        NOT NULL,
    "what_it_is_for"            TEXT,
    "what_it_is_not_for"        TEXT,
    "frontend_structure"        TEXT,
    "backend_structure"         TEXT,
    "auth_assumptions"          TEXT,
    "user_model_assumptions"    TEXT,
    "navigation_assumptions"    TEXT,
    "default_pages"             TEXT[]               DEFAULT ARRAY[]::TEXT[],
    "default_components"        TEXT[]               DEFAULT ARRAY[]::TEXT[],
    "context_inventory_filters" TEXT,
    "initialization_rules"      TEXT,
    "placeholder_rules"         TEXT,
    "required_review_steps"     TEXT[]               DEFAULT ARRAY[]::TEXT[],
    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Blueprint_pkey" PRIMARY KEY ("blueprint_id")
);

CREATE TABLE "blueprint_castle_units" (
    "blueprint_id"  TEXT NOT NULL,
    "castle_unit_id" TEXT NOT NULL,
    CONSTRAINT "blueprint_castle_units_pkey" PRIMARY KEY ("blueprint_id", "castle_unit_id"),
    CONSTRAINT "blueprint_castle_units_blueprint_id_fkey"
        FOREIGN KEY ("blueprint_id") REFERENCES "Blueprint"("blueprint_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blueprint_castle_units_castle_unit_id_fkey"
        FOREIGN KEY ("castle_unit_id") REFERENCES "CastleUnit"("castle_unit_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "blueprint_castle_services" (
    "blueprint_id"      TEXT NOT NULL,
    "castle_service_id" TEXT NOT NULL,
    CONSTRAINT "blueprint_castle_services_pkey" PRIMARY KEY ("blueprint_id", "castle_service_id"),
    CONSTRAINT "blueprint_castle_services_blueprint_id_fkey"
        FOREIGN KEY ("blueprint_id") REFERENCES "Blueprint"("blueprint_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blueprint_castle_services_castle_service_id_fkey"
        FOREIGN KEY ("castle_service_id") REFERENCES "CastleService"("castle_service_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "blueprint_composites" (
    "blueprint_id" TEXT NOT NULL,
    "composite_id" TEXT NOT NULL,
    CONSTRAINT "blueprint_composites_pkey" PRIMARY KEY ("blueprint_id", "composite_id"),
    CONSTRAINT "blueprint_composites_blueprint_id_fkey"
        FOREIGN KEY ("blueprint_id") REFERENCES "Blueprint"("blueprint_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blueprint_composites_composite_id_fkey"
        FOREIGN KEY ("composite_id") REFERENCES "Composite"("composite_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Castle Type ─────────────────────────────────────────────────────────────────

CREATE TABLE "CastleType" (
    "castle_type_id"            TEXT        NOT NULL,
    "name"                      TEXT        NOT NULL,
    "description"               TEXT        NOT NULL,
    "common_purpose"            TEXT        NOT NULL,
    "typical_use_cases"         TEXT[]               DEFAULT ARRAY[]::TEXT[],
    "recommended_asset_filters" TEXT,
    "status"                    TEXT        NOT NULL DEFAULT 'Draft',
    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CastleType_pkey" PRIMARY KEY ("castle_type_id")
);

CREATE TABLE "castle_type_blueprints" (
    "castle_type_id" TEXT NOT NULL,
    "blueprint_id"   TEXT NOT NULL,
    CONSTRAINT "castle_type_blueprints_pkey" PRIMARY KEY ("castle_type_id", "blueprint_id"),
    CONSTRAINT "castle_type_blueprints_castle_type_id_fkey"
        FOREIGN KEY ("castle_type_id") REFERENCES "CastleType"("castle_type_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_type_blueprints_blueprint_id_fkey"
        FOREIGN KEY ("blueprint_id") REFERENCES "Blueprint"("blueprint_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "castle_type_castle_units" (
    "castle_type_id" TEXT NOT NULL,
    "castle_unit_id" TEXT NOT NULL,
    CONSTRAINT "castle_type_castle_units_pkey" PRIMARY KEY ("castle_type_id", "castle_unit_id"),
    CONSTRAINT "castle_type_castle_units_castle_type_id_fkey"
        FOREIGN KEY ("castle_type_id") REFERENCES "CastleType"("castle_type_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_type_castle_units_castle_unit_id_fkey"
        FOREIGN KEY ("castle_unit_id") REFERENCES "CastleUnit"("castle_unit_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "castle_type_castle_services" (
    "castle_type_id"    TEXT NOT NULL,
    "castle_service_id" TEXT NOT NULL,
    CONSTRAINT "castle_type_castle_services_pkey" PRIMARY KEY ("castle_type_id", "castle_service_id"),
    CONSTRAINT "castle_type_castle_services_castle_type_id_fkey"
        FOREIGN KEY ("castle_type_id") REFERENCES "CastleType"("castle_type_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_type_castle_services_castle_service_id_fkey"
        FOREIGN KEY ("castle_service_id") REFERENCES "CastleService"("castle_service_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Castle ──────────────────────────────────────────────────────────────────────

CREATE TABLE "Castle" (
    "castle_record_id"    TEXT        NOT NULL,
    "castle_name"         TEXT        NOT NULL,
    "version"             TEXT        NOT NULL,
    "status"              TEXT        NOT NULL DEFAULT 'Draft',
    "primary_purpose"     TEXT        NOT NULL,
    "description"         TEXT,
    "build_notes"         TEXT,
    "review_notes"        TEXT,
    "reuse_recommendations" TEXT,
    "castle_type_id"      TEXT,                          -- SET NULL on CastleType delete
    "blueprint_id"        TEXT,                          -- SET NULL on Blueprint delete
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Castle_pkey" PRIMARY KEY ("castle_record_id"),
    CONSTRAINT "Castle_castle_type_id_fkey"
        FOREIGN KEY ("castle_type_id") REFERENCES "CastleType"("castle_type_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Castle_blueprint_id_fkey"
        FOREIGN KEY ("blueprint_id") REFERENCES "Blueprint"("blueprint_id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "castle_castle_units" (
    "castle_record_id" TEXT NOT NULL,
    "castle_unit_id"   TEXT NOT NULL,
    CONSTRAINT "castle_castle_units_pkey" PRIMARY KEY ("castle_record_id", "castle_unit_id"),
    CONSTRAINT "castle_castle_units_castle_record_id_fkey"
        FOREIGN KEY ("castle_record_id") REFERENCES "Castle"("castle_record_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_castle_units_castle_unit_id_fkey"
        FOREIGN KEY ("castle_unit_id") REFERENCES "CastleUnit"("castle_unit_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "castle_castle_services" (
    "castle_record_id"  TEXT NOT NULL,
    "castle_service_id" TEXT NOT NULL,
    CONSTRAINT "castle_castle_services_pkey" PRIMARY KEY ("castle_record_id", "castle_service_id"),
    CONSTRAINT "castle_castle_services_castle_record_id_fkey"
        FOREIGN KEY ("castle_record_id") REFERENCES "Castle"("castle_record_id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "castle_castle_services_castle_service_id_fkey"
        FOREIGN KEY ("castle_service_id") REFERENCES "CastleService"("castle_service_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Local Modification ──────────────────────────────────────────────────────────

CREATE TABLE "LocalModification" (
    "modification_id"         TEXT        NOT NULL,
    "castle_record_id"        TEXT        NOT NULL,
    "modified_item"           TEXT        NOT NULL,
    "change_description"      TEXT        NOT NULL,
    "reason"                  TEXT        NOT NULL,
    "related_asset_id"          TEXT,
    "related_asset_type"        TEXT,
    "related_blueprint_id"      TEXT,
    "related_castle_service_id" TEXT,
    "version_notes"             TEXT,
    "status"                    TEXT        NOT NULL DEFAULT 'Active',
    "review_status"             TEXT        NOT NULL DEFAULT 'Pending',
    "promotion_recommendation"  TEXT        NOT NULL DEFAULT 'RemainLocal',
    "testing_notes"             TEXT,
    "created_at"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LocalModification_pkey" PRIMARY KEY ("modification_id"),
    CONSTRAINT "LocalModification_castle_record_id_fkey"
        FOREIGN KEY ("castle_record_id") REFERENCES "Castle"("castle_record_id") ON DELETE CASCADE ON UPDATE CASCADE
);
