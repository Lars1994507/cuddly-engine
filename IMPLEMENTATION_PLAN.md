# CastleInventoryAX — Implementation Plan

---

## ▶ RESUME HERE

```
Phase:       COMPLETE
Status:      COMPLETE
Next task:   none
Notes:       CastleInventoryAX is fully implemented and documented. README.md written. 364/364 tests pass.
```

> Claude: read this block first. Execute "Next task". Work through the phase tasks in order,
> marking each [x] when done. Update this block before the session ends.

---

## Phase Completion Tracker

| Phase | Name | Status |
|-------|------|--------|
| 0 | Tech Stack Decision & Project Scaffold | `[x] Complete` |
| 1 | Atomic Asset Entity | `[x] Complete` |
| 2 | Compound Entity | `[x] Complete` |
| 3 | Composite Entity | `[x] Complete` |
| 4 | Castle Service Entity | `[x] Complete` |
| 5 | Castle Unit Entity | `[x] Complete` |
| 6 | Blueprint Entity | `[x] Complete` |
| 7 | Castle Type Entity | `[x] Complete` |
| 8 | Castle Entity + Local Modifications | `[x] Complete` |
| 9 | Asset BOM Engine | `[x] Complete` |
| 10 | AI Retrieval Filter System | `[x] Complete` |
| 11 | Reports & System Outputs | `[x] Complete` |
| 12 | Seed Data (Strut Company Example) | `[x] Complete` |
| 13 | Integration Review & Handoff | `[x] Complete` |

---

## Architecture Principles

Apply these in every phase without exception.

1. **Build bottom-up.** Atomic Assets → Compounds → Composites → Castle Services → Castle Units → Blueprints → Castle Types → Castles → Local Modifications.
2. **CRUD before relationships.** Get the entity right, then wire its associations.
3. **Bidirectional queries.** Every relationship must be traversable in both directions.
4. **BOM is computed, not stored.** `generateBOM` traverses relationships at query time.
5. **ID format.** Follow ecosystem pattern: `CSTL-STRUT-WAREHOUSE-INVENTORY-V001`.
6. **Status enum:** `Draft | Active | Deprecated | Archived | InReview | Reusable`
7. **Soft delete only.** Never hard-delete. Set status to `Archived`.

--- 

## Entity Build Order

```
1. Atomic Asset          — no upstream dependencies
2. Compound              — depends on: Atomic Assets
3. Composite             — depends on: Compounds, Atomic Assets
4. Castle Service        — depends on: Composites, Compounds
5. Castle Unit           — depends on: Castle Services, Composites
6. Blueprint             — depends on: Castle Units, Castle Services
7. Castle Type           — depends on: Blueprints, Castle Units, Castle Services
8. Castle                — depends on: all of the above
9. Local Modification    — depends on: Castle
10. Asset BOM Engine     — derived traversal over all relationships
11. AI Retrieval System  — filter layer over all entities
12. Reports & Outputs    — queries over all entities
```

---

## Phase 0 — Tech Stack Decision & Project Scaffold

**Goal:** Decide the stack, scaffold the project structure. Every later phase builds into this scaffold.

**Read before starting:** `CastleInventoryAX_Clean.md` (full file)

**Decisions to record in `STACK.md`:**

| Decision | Options |
|----------|---------|
| Language / runtime | Node/TS, Python, Go, other |
| Database | PostgreSQL, SQLite, MongoDB, other |
| API style | REST, GraphQL, tRPC, file-based |
| ORM / query layer | Prisma, Drizzle, SQLAlchemy, raw SQL |
| UI (if any) | Next.js, React, none (API only) |
| Package manager | npm, pnpm, yarn, pip, other |

**Tasks:**
- [x] Decide and document all stack choices in `STACK.md`
- [x] Initialize the project (run init commands)
- [x] Create base folder layout:
  ```
  /src
    /entities        ← one file per entity type
    /relations       ← join table logic
    /bom             ← Asset BOM engine
    /retrieval       ← AI context retrieval filters
    /reports         ← system output generators
    /seed            ← Strut Company example data
  /schema            ← database schema / migrations
  /tests
  ```
- [x] Confirm the project boots (hello world or empty server)
- [ ] Commit scaffold

**Definition of Done:** Project boots. Folder structure exists. `STACK.md` has all decisions.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       1 — Atomic Asset Entity
Status:      IN PROGRESS
Next task:   Create Atomic Asset schema / model
Read first:  CastleInventoryAX_Clean.md § 8 (Atomic Asset)
Notes:       Stack decisions recorded in STACK.md
```

---

## Phase 1 — Atomic Asset Entity

**Goal:** Full CRUD for Atomic Assets. Foundation for everything above.

**Read before starting:** `CastleInventoryAX_Clean.md` § 8 (Atomic Asset)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `atomic_asset_id` | string | e.g. `AA-FORMAT-QUANTITY-V001` |
| `name` | string | e.g. `formatQuantity()` |
| `asset_type` | enum | `HelperFunction \| Validator \| Constant \| Type \| Enum \| UIElement \| FormattingFunction \| QueryHelper \| PermissionCheck \| LogicBlock` |
| `description` | string | |
| `code_location` | string | file path or package reference |
| `version` | string | semver |
| `status` | enum | shared status enum |
| `dependencies` | string[] | IDs of other Atomic Assets this depends on |
| `validation_notes` | string | optional |
| `approved_pattern_notes` | string | optional |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Relationship stubs** (columns only — logic wired in later phases):
- `used_by_compound_ids` → Phase 2
- `used_by_composite_ids` → Phase 3
- `used_by_castle_service_ids` → Phase 4
- `used_by_castle_ids` → Phase 8

**Tasks:**
- [x] Create Atomic Asset schema / model
- [x] Implement Create (validate ID format on create)
- [x] Implement Read (by ID, list all, filter by `asset_type`, filter by `status`)
- [x] Implement Update
- [x] Implement soft-delete (set status to `Archived`)
- [x] Write unit tests for all CRUD operations

**Definition of Done:** CRUD works. Filters by type and status work. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       2 — Compound Entity
Status:      IN PROGRESS
Next task:   Create Compound schema / model
Read first:  CastleInventoryAX_Clean.md § 7 (Compound)
Notes:       none
```

---

## Phase 2 — Compound Entity

**Goal:** Full CRUD for Compounds and wire the Compound ↔ Atomic Asset relationship.

**Read before starting:** `CastleInventoryAX_Clean.md` § 7 (Compound)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `compound_id` | string | e.g. `CMPD-QUANTITY-VALIDATION-V001` |
| `name` | string | e.g. `Quantity Validation Compound` |
| `description` | string | |
| `version` | string | semver |
| `status` | enum | shared status enum |
| `testing_notes` | string | optional |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Relationships:**

| Relationship | Join table |
|-------------|-----------|
| Compound → many Atomic Assets | `compound_atomic_assets` |
| Atomic Asset → many Compounds (back-reference) | via same join table |

**Tasks:**
- [x] Create Compound schema / model
- [x] Implement Create / Read / Update / soft-delete
- [x] Create `compound_atomic_assets` join table
- [x] Implement: add Atomic Asset to Compound
- [x] Implement: remove Atomic Asset from Compound
- [x] Implement: list all Atomic Assets in a Compound
- [x] Implement: given an Atomic Asset ID → return all Compounds that use it
- [x] Filter Compounds by status
- [x] Tests for CRUD and all relationship operations

**Definition of Done:** CRUD works. Associations work. Back-reference works. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       3 — Composite Entity
Status:      IN PROGRESS
Next task:   Create Composite schema / model
Read first:  CastleInventoryAX_Clean.md § 6 (Composite)
Notes:       none
```

---

## Phase 3 — Composite Entity

**Goal:** Full CRUD for Composites and wire Composite ↔ Compound and Composite ↔ Atomic Asset relationships.

**Read before starting:** `CastleInventoryAX_Clean.md` § 6 (Composite)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `composite_id` | string | e.g. `COMP-INVENTORY-TABLE-V001` |
| `name` | string | |
| `description` | string | |
| `version` | string | |
| `ui_backend_scope` | enum | `UI \| Backend \| Both` |
| `status` | enum | shared status enum |
| `usage_references` | string[] | where this composite is used |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Relationships:**

| Relationship | Join table | Notes |
|-------------|-----------|-------|
| Composite → Compounds | `composite_compounds` | back-ref from Compound |
| Composite → Atomic Assets (direct) | `composite_atomic_assets` | back-ref from Atomic Asset |
| Composite ↔ Blueprints | `composite_blueprints` | stub — wired in Phase 6 |
| Composite ↔ Castle Services | `composite_castle_services` | stub — wired in Phase 4 |

**Tasks:**
- [x] Create Composite schema / model
- [x] Implement CRUD
- [x] Wire `composite_compounds` + back-reference from Compound
- [x] Wire `composite_atomic_assets` + back-reference from Atomic Asset
- [x] Implement: given a Compound ID → list all Composites using it
- [x] Implement: given an Atomic Asset ID → list all Composites using it directly
- [x] Filter by status and `ui_backend_scope`
- [x] Tests

**Definition of Done:** CRUD works. Both join tables and their back-references work. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       4 — Castle Service Entity
Status:      IN PROGRESS
Next task:   Create Castle Service schema / model
Read first:  CastleInventoryAX_Clean.md § 5 (Castle Service)
Notes:       none
```

---

## Phase 4 — Castle Service Entity

**Goal:** Full CRUD for Castle Services and wire all Castle Service relationships.

**Read before starting:** `CastleInventoryAX_Clean.md` § 5 (Castle Service)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `castle_service_id` | string | e.g. `CS-STOCK-ADJUSTMENT-V001` |
| `name` | string | |
| `capability` | string | one-sentence description |
| `backend_modules` | string[] | |
| `api_contracts` | string | reference or description |
| `database_interactions` | string | |
| `frontend_visibility` | string | optional |
| `admin_controls` | string | optional |
| `observability` | string | optional |
| `logging` | string | optional |
| `health_checks` | string | optional |
| `permission_rules` | string | optional |
| `status` | enum | shared status enum |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Relationships:**

| Relationship | Join table | Notes |
|-------------|-----------|-------|
| Castle Service → Composites | `castle_service_composites` | back-fills Composite stub from Phase 3 |
| Castle Service → Compounds (direct) | `castle_service_compounds` | back-ref from Compound |
| Castle Service → Atomic Assets (direct) | `castle_service_atomic_assets` | back-ref from Atomic Asset |
| Castle Service ↔ Castle Unit | | stub — wired in Phase 5 |

**Tasks:**
- [x] Create Castle Service schema / model
- [x] Implement CRUD
- [x] Wire `castle_service_composites` + back-reference from Composite (back-fills Phase 3 stub)
- [x] Wire `castle_service_compounds` + back-reference from Compound
- [x] Wire `castle_service_atomic_assets` + back-reference from Atomic Asset
- [x] Implement: given a Composite ID → list all Castle Services using it
- [x] Filter by status
- [x] Tests

**Definition of Done:** CRUD works. All three association types work. Back-references work. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       5 — Castle Unit Entity
Status:      IN PROGRESS
Next task:   Create Castle Unit schema / model
Read first:  CastleInventoryAX_Clean.md § 4 (Castle Unit)
Notes:       none
```

---

## Phase 5 — Castle Unit Entity

**Goal:** Full CRUD for Castle Units and wire Castle Unit ↔ Castle Service / Composite relationships.

**Read before starting:** `CastleInventoryAX_Clean.md` § 4 (Castle Unit)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `castle_unit_id` | string | e.g. `CU-WAREHOUSING-INVENTORY-V001` |
| `name` | string | |
| `description` | string | |
| `permission_scope` | string | |
| `domain_notes` | string | optional |
| `status` | enum | shared status enum |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Relationships:**

| Relationship | Join table | Notes |
|-------------|-----------|-------|
| Castle Unit → Castle Services | `castle_unit_services` | back-ref from Castle Service |
| Castle Unit → Composites | `castle_unit_composites` | back-ref from Composite |
| Castle Unit ↔ Castle Type | | stub — wired in Phase 7 |
| Castle Unit ↔ Blueprint | | stub — wired in Phase 6 |

**Tasks:**
- [x] Create Castle Unit schema / model
- [x] Implement CRUD
- [x] Wire `castle_unit_services` + back-reference from Castle Service
- [x] Wire `castle_unit_composites` + back-reference from Composite
- [x] Filter by status
- [x] Tests

**Definition of Done:** CRUD works. Both join tables and back-references work. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       6 — Blueprint Entity
Status:      IN PROGRESS
Next task:   Create Blueprint schema / model
Read first:  CastleInventoryAX_Clean.md § 3 (Blueprint)
Notes:       none
```

---

## Phase 6 — Blueprint Entity

**Goal:** Full CRUD for Blueprints and wire Blueprint → default Castle Unit / Castle Service / Composite sets.

**Read before starting:** `CastleInventoryAX_Clean.md` § 3 (Blueprint)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `blueprint_id` | string | e.g. `BP-INVENTORY-INTERNAL-TENANT-V001` |
| `name` | string | |
| `category` | string | |
| `version` | string | |
| `status` | enum | |
| `purpose` | string | |
| `frontend_structure` | string | description or JSON |
| `backend_structure` | string | description or JSON |
| `auth_assumptions` | string | |
| `user_model_assumptions` | string | |
| `navigation_assumptions` | string | |
| `default_pages` | string[] | |
| `default_components` | string[] | |
| `context_inventory_filters` | string | |
| `initialization_rules` | string | |
| `placeholder_rules` | string | |
| `required_review_steps` | string[] | |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Relationships:**

| Relationship | Join table | Notes |
|-------------|-----------|-------|
| Blueprint → default Castle Units | `blueprint_castle_units` | back-fills Castle Unit stub |
| Blueprint → default Castle Services | `blueprint_castle_services` | back-ref from Castle Service |
| Blueprint → compatible Composites | `blueprint_composites` | back-fills Composite stub from Phase 3 |

**Tasks:**
- [x] Create Blueprint schema / model
- [x] Implement CRUD
- [x] Wire `blueprint_castle_units` + back-reference (back-fills Phase 5 stub)
- [x] Wire `blueprint_castle_services` + back-reference
- [x] Wire `blueprint_composites` + back-reference (back-fills Phase 3 stub)
- [x] Filter by category, status
- [x] Tests

**Definition of Done:** CRUD works. All join tables and back-references work. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       7 — Castle Type Entity
Status:      IN PROGRESS
Next task:   Create Castle Type schema / model
Read first:  CastleInventoryAX_Clean.md § 2 (Castle Type)
Notes:       none
```

---

## Phase 7 — Castle Type Entity

**Goal:** Full CRUD for Castle Types and wire Castle Type → Blueprint / Castle Unit / Castle Service relationships.

**Read before starting:** `CastleInventoryAX_Clean.md` § 2 (Castle Type)

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `castle_type_id` | string | e.g. `CT-INTERNAL-INVENTORY-V001` |
| `name` | string | e.g. `Internal Inventory Castle` |
| `description` | string | |
| `common_purpose` | string | |
| `typical_use_cases` | string[] | |
| `recommended_asset_filters` | string | JSON or description |
| `status` | enum | |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Relationships:**

| Relationship | Join table | Notes |
|-------------|-----------|-------|
| Castle Type → compatible Blueprints | `castle_type_blueprints` | back-ref from Blueprint |
| Castle Type → default Castle Units | `castle_type_castle_units` | back-fills Castle Unit stub from Phase 5 |
| Castle Type → default Castle Services | `castle_type_castle_services` | back-ref from Castle Service |

**Tasks:**
- [x] Create Castle Type schema / model
- [x] Implement CRUD
- [x] Wire all three join tables + back-references
- [x] Back-fill Castle Unit stub from Phase 5 and Blueprint stub from Phase 6
- [x] Filter by status
- [x] Tests

**Definition of Done:** CRUD works. All associations and back-references work. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       8 — Castle Entity + Local Modifications
Status:      IN PROGRESS
Next task:   Create Castle schema / model
Read first:  CastleInventoryAX_Clean.md § 1 (Castle) and § 9 (Local Modifications)
Notes:       All lower-layer entities must be complete before this phase
```

---

## Phase 8 — Castle Entity + Local Modifications

**Goal:** Full CRUD for Castles (top-level record) and Local Modifications. All lower phases must be complete first.

**Read before starting:** `CastleInventoryAX_Clean.md` § 1 (Castle) and § 9 (Local Modifications)

**Castle fields:**

| Field | Type | Notes |
|-------|------|-------|
| `castle_record_id` | string | e.g. `CSTL-STRUT-WAREHOUSE-INVENTORY-V001` |
| `castle_name` | string | |
| `version` | string | |
| `status` | enum | |
| `primary_purpose` | string | |
| `build_notes` | string | |
| `review_notes` | string | |
| `reuse_recommendations` | string | |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Castle relationships:**

| Relationship | Notes |
|-------------|-------|
| Castle → Castle Type | many-to-one |
| Castle → Blueprint | many-to-one |
| Castle → Castle Units | `castle_castle_units` join table |
| Castle → Castle Services | `castle_castle_services` join table |

**Local Modification fields:**

| Field | Type | Notes |
|-------|------|-------|
| `modification_id` | string | e.g. `LMOD-STRUT-SUPERVISOR-APPROVAL-V001` |
| `castle_record_id` | string | FK to Castle |
| `modified_item` | string | name of the thing changed |
| `change_description` | string | |
| `reason` | string | |
| `related_asset_id` | string | optional — FK to any entity |
| `related_asset_type` | string | which entity type `related_asset_id` points to |
| `review_status` | enum | `Pending \| Approved \| Rejected` |
| `promotion_recommendation` | enum | `RemainLocal \| PromoteToCompound \| PromoteToComposite \| PromoteToService \| PromoteToBlueprint` |
| `testing_notes` | string | optional |
| `created_at` | datetime | |
| `updated_at` | datetime | |

**Tasks:**
- [x] Create Castle schema / model
- [x] Implement Castle CRUD
- [x] Wire Castle → Castle Type (many-to-one)
- [x] Wire Castle → Blueprint (many-to-one)
- [x] Wire `castle_castle_units` join table
- [x] Wire `castle_castle_services` join table
- [x] Filter Castles by Castle Type, Blueprint, status
- [x] Create Local Modification schema / model
- [x] Implement Local Modification CRUD (always scoped to a `castle_record_id`)
- [x] Implement: list all Local Modifications for a given Castle
- [x] Tests for Castle and Local Modification

**Definition of Done:** Castle CRUD works. Local Modifications CRUD works scoped to a Castle. All associations work. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       9 — Asset BOM Engine
Status:      IN PROGRESS
Next task:   Implement generateBOM(castle_record_id)
Read first:  CastleInventoryAX_Clean.md § Asset BOM
Notes:       none
```

---

## Phase 9 — Asset BOM Engine

**Goal:** Build the two core traversals: top-down BOM generation and bottom-up impact tracing.

**Read before starting:** `CastleInventoryAX_Clean.md` § Asset BOM

**Traversal A — Top-Down (`generateBOM`)**
Given a `castle_record_id`, walk the full hierarchy and return:
```
Castle
  Castle Type
  Blueprint
  Castle Units[]
    Castle Services[]
      Composites[]
        Compounds[]
          Atomic Assets[]
  Local Modifications[]
```
Each node includes: id, name, version, status. Flag `Deprecated` or `Archived` nodes.

**Traversal B — Bottom-Up (`traceImpact`)**
Given any entity ID + entity type, return all upstream consumers:
```
{entity} is used by:
  → Compounds: [...]
  → Composites: [...]
  → Castle Services: [...]
  → Castle Units: [...]
  → Castles: [...]
```

**Tasks:**
- [x] Implement `generateBOM(castle_record_id)` — full structured hierarchy
- [x] BOM flags any `Deprecated` or `Archived` nodes with a warning
- [x] Implement `traceImpact(entity_id, entity_type)` — all upstream consumers at all levels
- [x] Tests: run `generateBOM` against seed-like data, verify completeness
- [x] Tests: run `traceImpact` on an Atomic Asset, verify all upstream entities returned

**Definition of Done:** Both traversals are correct and complete. Deprecated assets are flagged. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       10 — AI Retrieval Filter System
Status:      IN PROGRESS
Next task:   Implement getRelevantContext(castle_type_id, blueprint_id)
Read first:  CastleInventoryAX_Clean.md § AI Development Flow
Notes:       none
```

---

## Phase 10 — AI Retrieval Filter System

**Goal:** Build the context filter that returns only the relevant assets for a given Castle Type + Blueprint combination.

**Read before starting:** `CastleInventoryAX_Clean.md` § AI Development Flow

**Function signature:**
```
getRelevantContext(castle_type_id, blueprint_id) → {
  castle_units:    [{ id, name, status }],
  castle_services: [{ id, name, capability, status }],
  composites:      [{ id, name, ui_backend_scope, status }],
  compounds:       [{ id, name, status }],
  atomic_assets:   [{ id, name, asset_type, status }],
}
```

**Filter rules:**
1. Start from Castle Type → get default Castle Units and Castle Services
2. From Blueprint → add default Castle Units, Castle Services, compatible Composites
3. From those Castle Services → pull associated Composites
4. From those Composites → pull associated Compounds
5. From those Compounds → pull associated Atomic Assets
6. Deduplicate across all joins
7. Exclude any entity with status `Deprecated` or `Archived`

**Tasks:**
- [x] Implement `getRelevantContext(castle_type_id, blueprint_id)`
- [x] Implement `getContextForCastle(castle_record_id)` — same output derived from an existing Castle
- [x] Output sorted: Castle Units → Castle Services → Composites → Compounds → Atomic Assets
- [x] Return compact records only (id, name, key field, status) — not full records
- [x] Tests: correct asset set returned for known Castle Type + Blueprint
- [x] Tests: deprecated/archived assets excluded

**Definition of Done:** Both functions return correct, deduplicated, compact, sorted results. Deprecated assets excluded. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       11 — Reports & System Outputs
Status:      IN PROGRESS
Next task:   Implement listCastles(filters?)
Read first:  CastleInventoryAX_Clean.md § System Outputs
Notes:       none
```

---

## Phase 11 — Reports & System Outputs

**Goal:** Implement all 16 system report functions.

**Read before starting:** `CastleInventoryAX_Clean.md` § System Outputs

**Reports:**

| # | Function | Returns |
|---|----------|---------|
| 1 | `listCastles(filters?)` | All Castles with type, blueprint, status |
| 2 | `listBlueprints(filters?)` | All Blueprints |
| 3 | `listCastleTypes()` | All Castle Types with compatible blueprints |
| 4 | `listCastleUnits(filters?)` | All Castle Units |
| 5 | `listCastleServices(filters?)` | All Castle Services |
| 6 | `listComposites(filters?)` | All Composites |
| 7 | `listCompounds(filters?)` | All Compounds |
| 8 | `listAtomicAssets(filters?)` | All Atomic Assets |
| 9 | `getDependencyMap(entity_id, entity_type)` | Full up+down dependency tree |
| 10 | `getReuseReport()` | Assets used in 2+ Castles |
| 11 | `getDeprecatedAssets()` | All entities with status `Deprecated` |
| 12 | `findDuplicates()` | Assets with similar names (normalized, case-insensitive) |
| 13 | `getLocalModifications(castle_record_id?)` | All mods, optionally per Castle |
| 14 | `getPromotionCandidates()` | Local mods flagged for promotion |
| 15 | `getBuildReadiness(castle_record_id)` | Flags Deprecated/missing assets in BOM |
| 16 | `getApprovalStatus()` | All entities with status `InReview` |

**Tasks:**
- [x] Implement reports 1–4
- [x] Implement reports 5–8
- [x] Implement reports 9–12
- [x] Implement reports 13–16
- [x] All list functions support optional filters (status, castle_type_id, blueprint_id as applicable)
- [x] `findDuplicates` normalizes names: lowercase, strip suffixes like "Compound", "Composite", "Castle Service"
- [x] Tests for all 16 reports using seed-like data

**Definition of Done:** All 16 functions return correct data. Tests pass.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       12 — Seed Data
Status:      IN PROGRESS
Next task:   Create seed file and insert 7 Atomic Assets
Read first:  CastleInventoryAX_Clean.md § Use Case: Strut Company Warehousing and Inventory Castle
Notes:       Seed must be inserted bottom-up in the exact order listed in the phase
```

---

## Phase 12 — Seed Data (Strut Company Example)

**Goal:** Load the complete Strut Company Warehousing and Inventory Castle. This is the end-to-end integration test for the entire system.

**Read before starting:** `CastleInventoryAX_Clean.md` § Use Case: Strut Company Warehousing and Inventory Castle

**Insert in this exact order:**

1. **Atomic Assets** (7): `InventoryStatusEnum`, `WarehouseLocationType`, `formatQuantity()`, `validatePositiveNumber()`, `canAdjustInventory`, `StockStatusBadge`, `InventoryPermissionConstant`
2. **Compounds** (5): Date Range Filter, Role Check, Quantity Validation, Pagination, Stock Status Filter — wired to their Atomic Assets
3. **Composites** (5): Inventory Table, Item Detail Page, Warehouse Location Selector, Quantity Adjustment Drawer, Inventory Dashboard Widget — wired to their Compounds and Atomic Assets
4. **Castle Services** (7): Auth, Permission, Audit Log, Inventory, Warehouse Location, Stock Adjustment, Reporting — wired to Composites
5. **Castle Units** (4): Warehousing and Inventory, Admin, Reporting, User Management — wired to Castle Services
6. **Blueprint**: `Inventory Application - Internal Tenant` — wired to Castle Units and Castle Services
7. **Castle Type**: `Internal Inventory Castle` — wired to Blueprint
8. **Castle**: `CSTL-STRUT-WAREHOUSE-INVENTORY-V001` — wired to all above
9. **Local Modifications** (5): all 5 from spec — attached to the Castle

**Tasks:**
- [x] Create seed file / script
- [x] Insert Atomic Assets (step 1)
- [x] Insert Compounds + wire Atomic Assets (step 2)
- [x] Insert Composites + wire Compounds and Atomic Assets (step 3)
- [x] Insert Castle Services + wire Composites (step 4)
- [x] Insert Castle Units + wire Castle Services (step 5)
- [x] Insert Blueprint + wire Castle Units and Castle Services (step 6)
- [x] Insert Castle Type + wire Blueprint (step 7)
- [x] Insert Castle + wire all (step 8)
- [x] Insert Local Modifications (step 9)
- [x] Validate: `generateBOM("CSTL-STRUT-WAREHOUSE-INVENTORY-V001")` → 4 Castle Units, 7 Castle Services, 5 Composites, 5 Compounds, 7 Atomic Assets, 5 Local Modifications
- [x] Validate: `traceImpact("AA-VALIDATE-POSITIVE-NUMBER-V001", "AtomicAsset")` → Quantity Validation Compound → Quantity Adjustment Drawer Composite → Stock Adjustment Castle Service → CSTL-STRUT-WAREHOUSE-INVENTORY-V001
- [x] Validate: `getRelevantContext("CT-INTERNAL-INVENTORY-V001", "BP-INVENTORY-INTERNAL-TENANT-V001")` → correct filtered set
- [x] Validate: all 16 report functions return non-empty correct results

**Definition of Done:** Seed loads without errors. All 4 validation checks pass. System is fully functional end-to-end.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       13 — Integration Review & Handoff
Status:      IN PROGRESS
Next task:   Review all entity schemas against CastleInventoryAX_Clean.md
Read first:  CastleInventoryAX_Clean.md (full file)
Notes:       none
```

---

## Phase 13 — Integration Review & Handoff

**Goal:** Final pass — confirm everything is correct, coherent, and documented.

**Read before starting:** `CastleInventoryAX_Clean.md` (full file)

**Tasks:**
- [x] Review all entity schemas against spec — no missing fields
- [x] Confirm all back-references work in both directions at every relationship
- [x] Confirm `generateBOM` and `traceImpact` are accurate on seed data
- [x] Confirm all 16 reports return accurate results
- [x] Confirm status filtering (Deprecated/Archived excluded from retrieval) works
- [x] Run full test suite — all tests pass
- [x] Write `README.md` covering: what CastleInventoryAX is, how to run, how to seed, and the 3 primary entry points (`generateBOM`, `traceImpact`, `getRelevantContext`)

**Definition of Done:** All tests pass. README exists. System is complete.

**When done — update `▶ RESUME HERE` to:**
```
Phase:       COMPLETE
Status:      COMPLETE
Next task:   none
Notes:       CastleInventoryAX is fully implemented and documented.
```

---

## Session Log

> Each session appends one entry here. Newest at top.

| # | Date | Phase worked | Tasks completed | Notes |
|---|------|-------------|-----------------|-------|
| 16 | 2026-05-06 | Diagram feature + doc updates + test gap fill | (1) src/diagram/diagramRouter.ts: GET /diagram/castle/:id — reuses generateBOM, converts to {nodes[], edges[]} with dedup for both nodes AND edges; (2) DiagramPage.tsx (Mermaid.js, castle selector, depth 1–5 control, node-type legend); (3) api.ts fetchDiagram(); (4) App.tsx + Layout.tsx wired; (5) README/STACK/CastleInventoryAX_Clean/CLAUDE.md updated to document frontend; (6) tests/diagram.test.ts (30+ tests: shape, node counts, edge validity, dedup, bare castle); (7) tests/depmap-aa-composite.test.ts (getDependencyMap gaps: AtomicAsset + Composite); (8) tests/combined-filters.test.ts (multi-param AND-intersection for atomic-assets, composites, castles); (9) tests/globalSetup.js fixed (was calling npx prisma db push --skip-generate which is not valid — now uses pg directly to DROP/CREATE schema + apply db/schema.sql) | Docker not running during session so tests not executed; run docker compose up -d postgres then npm test |
| 15 | 2026-05-01 | React Frontend | React 18 + Vite 5 + React Router v6 frontend in client/; config-driven architecture (ENTITY_CONFIGS drives all 8 entity list+detail pages); BOMPage tree viewer with expand/collapse; ReportsPage with 6 tabs; dark GitHub-inspired theme; Vite proxy /api→:3000; both servers confirmed running; start.sh supports --all flag for backend+frontend together | Frontend complete |
| 14 | 2026-05-01 | Phase 13 — Integration Review & Handoff | Schema review: all 9 entity schemas verified against spec (all fields present, all 16 join tables wired, all relationships bidirectional); generateBOM + traceImpact logic reviewed; all 16 reports verified; status filtering (Deprecated/Archived excluded) confirmed; 364/364 tests pass; README.md written (what CastleInventoryAX is, setup, seed, generateBOM, traceImpact, getRelevantContext, full REST API overview, entity hierarchy) | Project complete |
| 13 | 2026-05-01 | Phase 12 — Seed Data (Strut Company Example) | src/seed/seed.ts: clearAll() + seed() exporting all 9 steps; 7 Atomic Assets, 5 Compounds, 5 Composites, 7 Castle Services, 4 Castle Units, 1 Blueprint, 1 Castle Type, 1 Castle, 5 Local Mods; tests/phase12seed.test.ts: 34 tests (generateBOM counts, traceImpact path, getRelevantContext, all 16 reports); added "types":["node"] to tsconfig.json + require.main guard on seed; 364 total tests pass | Phase 13 next: Integration Review & Handoff |
| 12 | 2026-05-01 | Phase 11 — Reports & System Outputs | All 16 report functions: listCastles/Blueprints/CastleTypes/CastleUnits/CastleServices/Composites/Compounds/AtomicAssets (with filters); getDependencyMap (up+down); getReuseReport (groupBy parent counts); getDeprecatedAssets; findDuplicates (normalized names); getLocalModifications; getPromotionCandidates; getBuildReadiness; getApprovalStatus; /reports router; 44 new tests; 330 total pass | Phase 12 next: Seed Data |
| 11 | 2026-05-01 | Phase 10 — AI Retrieval Filter System | getRelevantContext (CT + BP → Castle Units, Castle Services, Composites, Compounds, Atomic Assets; dedup; exclude Deprecated/Archived); getContextForCastle (derived from existing Castle); /retrieval router; 18 new tests; 286 total pass | Phase 11 next: Reports & System Outputs |
| 10 | 2026-05-01 | Phase 9 — Asset BOM Engine | generateBOM (deep nested Prisma include: Castle→Units→Services→Composites→Compounds→AtomicAssets + LocalMods; Deprecated/Archived nodes flagged); traceImpact for all 5 entity types (transitive upward traversal to Castles); /bom router; 22 new tests; 268 total pass | Phase 10 next: AI Retrieval Filter System |
| 9 | 2026-05-01 | Phase 8 — Castle Entity + Local Modifications | Prisma schema: Castle + CastleCastleUnit + CastleCastleService join tables + back-refs on CastleType/Blueprint/CastleUnit/CastleService; LocalModification with review_status + promotion_recommendation enums; CRUD service + REST router; 49 new tests; 246 total pass | Phase 9 next: Asset BOM Engine |
| 8 | 2026-05-01 | Phase 7 — Castle Type Entity | Prisma schema: CastleType + CastleTypeBlueprint + CastleTypeCastleUnit + CastleTypeCastleService join tables + back-refs on Blueprint/CastleUnit/CastleService; CRUD service + REST router; 31 new tests; 197 total pass | Phase 8 next: Castle Entity + Local Modifications |
| 7 | 2026-05-01 | Phase 6 — Blueprint Entity | Prisma schema: Blueprint + BlueprintCastleUnit + BlueprintCastleService + BlueprintComposite join tables + back-refs on CastleUnit/CastleService/Composite; CRUD service + REST router; 32 new tests; 166 total pass | Phase 7 next: Castle Type |
| 6 | 2026-05-01 | Phase 5 — Castle Unit Entity | Prisma schema: CastleUnit + CastleUnitService + CastleUnitComposite join tables + back-refs on CastleService/Composite; CRUD service + REST router; 25 new tests; 134 total pass | Phase 6 next: Blueprint |
| 5 | 2026-05-01 | Phase 4 — Castle Service Entity | Prisma schema: CastleService + CastleServiceComposite + CastleServiceCompound + CastleServiceAtomicAsset join tables + back-refs on Composite/Compound/AtomicAsset; CRUD service + REST router; 30 new tests; 109 total pass; fixed SQLite data race by adding maxWorkers:1 to jest.config.js | Phase 5 next: Castle Unit |
| 4 | 2026-05-01 | Phase 3 — Composite Entity | Prisma schema: Composite + CompositeCompound + CompositeAtomicAsset join tables + back-refs; UiBackendScope enum; CRUD service + REST router; 38 new tests; 79 total pass | Phase 4 next: Castle Service |
| 3 | 2026-05-01 | Phase 2 — Compound Entity | Prisma schema: Compound + CompoundAtomicAsset join table + AtomicAsset back-ref; CRUD service + REST router; 23 new tests; 41 total pass | Phase 3 next: Composite |
| 2 | 2026-05-01 | Phase 1 — Atomic Asset Entity | Prisma schema (String fields, enum validation in service layer); CRUD service + REST router; 18 tests all pass | Phase 2 next: Compound |
| 1 | 2026-05-01 | Phase 0 — Tech Stack Decision & Project Scaffold | STACK.md written; npm + TypeScript + Prisma + Express + Jest installed; folder scaffold created; `GET /health` confirmed working | Phase 1 is next: Atomic Asset schema |
