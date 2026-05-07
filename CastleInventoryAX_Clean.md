# CastleInventoryAX

CastleInventoryAX is the master inventory of Castle construction assets. It stores the building blocks, patterns, structures, definitions, and relationships needed to assemble applications consistently across the Castle ecosystem.

**Out of Scope:** CastleInventoryAX does not manage tenant ownership, user access, SSO, payment, contracting, or any commercial account information — those belong in separate systems.

---

## Inventory Layers

CastleInventoryAX organizes assets in a structured hierarchy:

```
Castle
  └── Castle Type
        └── Blueprint
              └── Castle Units
                    └── Castle Services
                          └── Composites
                                └── Compounds
                                      └── Atomic Assets
                                            └── Local Modifications
```

---

## 1. Castle

A **Castle** is the complete application or system structure. It is a finished or working application assembled from a Blueprint and smaller reusable parts.

**A Castle record stores:**
- Castle Record ID
- Castle name
- Castle Type
- Blueprint used
- Version and Status
- Included Castle Units and Castle Services
- Asset BOM
- Local Modifications
- Build notes and Review notes
- Reuse recommendations

---

## 2. Castle Type

A **Castle Type** classifies what kind of application the Castle is. It is used as the first filter when organizing and retrieving relevant assets.

**Examples of Castle Types:**
- Internal Inventory Castle
- Workflow Castle
- Reporting Castle
- Admin Console Castle
- Vendor Portal Castle
- Customer Portal Castle
- Marketplace Castle
- Document Management Castle
- Compliance Castle
- Communication Castle
- Learning Castle
- Scheduling Castle

**A Castle Type record stores:**
- Castle Type ID
- Name and Description
- Common purpose and typical use cases
- Compatible Blueprints
- Default Castle Units and Castle Services
- Recommended asset filters

---

## 3. Blueprint

A **Blueprint** is the approved starter structure used to initialize a Castle. It produces a working but minimal application shell — not the finished business logic.

**A Blueprint may define:**
- Front-end and back-end file structure
- App shell, navigation, login structure
- Base auth pattern and base permissions
- Default pages, layouts, drawers, menus
- Shared components and design system
- API conventions, logging standards, error handling patterns
- Context inventory filters and initialization rules
- Placeholder rules and required review steps

**A Blueprint record stores:**
- Blueprint ID
- Name, Category, Version, Status
- Purpose, what it is for, what it is not for
- Front-end and back-end structure
- Auth, user model, and navigation assumptions
- Default pages and components
- Context inventory filters and initialization rules

---

## 4. Castle Unit

A **Castle Unit** is a major section or domain area inside a Castle. Castle Units divide the Castle into meaningful application areas.

**A Castle Unit record stores:**
- Castle Unit ID
- Name and Description
- Related Castle Type and Blueprint
- Included Castle Services and Composites
- Permission scope and domain notes

---

## 5. Castle Service

A **Castle Service** is a governed functional capability inside a Castle or Castle Unit. It may include backend logic, API routes, database interactions, contracts, observability, configuration screens, admin controls, logs, health checks, validation rules, and frontend visibility.

**A Castle Service record stores:**
- Castle Service ID
- Name and Capability
- Related Castle Unit
- Backend modules, API contracts, database interactions
- Frontend visibility, admin controls
- Observability, logging, health checks
- Permission rules and related Composites

---

## 6. Composite

A **Composite** is a larger reusable feature block — visible or functional enough that a developer or user can recognize it as a distinct feature.

**A Composite record stores:**
- Composite ID
- Name, Description, Version
- UI/backend scope
- Related Castle Service
- Required Compounds and Atomic Assets
- Compatible Blueprints
- Usage references and Status

---

## 7. Compound

A **Compound** is a smaller reusable assembly made from multiple Atomic Assets. It typically represents grouped logic, validation, filtering, formatting, or behavior.

**A Compound record stores:**
- Compound ID
- Name and Description
- Included Atomic Assets
- Used by Composites and Castle Services
- Version, Status, Testing notes

---

## 8. Atomic Asset

An **Atomic Asset** is the smallest reusable building block in the Castle ecosystem.

**Types of Atomic Assets:**
- Helper functions
- Validators
- Constants
- Types and Enums
- Small UI elements
- Formatting functions
- Query helpers
- Permission checks
- Small reusable logic blocks

**An Atomic Asset record stores:**
- Atomic Asset ID
- Name and Type
- Description and Code location
- Version and Status
- Dependencies
- Used by Compounds, Composites, Castle Services, and Castles
- Validation notes and Approved pattern notes

---

## 9. Local Modifications

**Local Modifications** are changes made to a specific Castle record that differ from the standard Blueprint, Castle Service, Composite, Compound, or Atomic Asset configuration. They are tracked from a construction and inventory perspective.

**A Local Modification record stores:**
- Modification ID
- Castle Record ID
- Modified item and Change description
- Reason for change
- Related asset
- Review status
- Promotion recommendation (whether to remain local or be promoted into a reusable asset)
- Testing notes

---

## Asset BOM (Bill of Materials)

The **Asset BOM** is the full list of parts used to assemble a Castle. It is one of the most important outputs of CastleInventoryAX.

An Asset BOM includes:
- Castle Type and Blueprint
- Castle Units and Castle Services
- Composites, Compounds, and Atomic Assets
- Local Modifications
- Versions, Statuses, Dependencies
- Reuse notes

The Asset BOM enables full impact tracing — a single Atomic Asset can be traced up through Compounds, Composites, and Castle Services all the way to the Castle level.

---

## AI Development Flow

CastleInventoryAX provides structured context for AI-assisted building:

```
New Castle Request
  → Select Castle Type
  → Select Blueprint
  → Load Blueprint Rules
  → Filter CastleInventoryAX
  → Retrieve Relevant Castle Units
  → Retrieve Relevant Castle Services
  → Retrieve Relevant Composites
  → Retrieve Relevant Compounds
  → Retrieve Relevant Atomic Assets
  → Initialize Castle Structure
  → Identify Gaps
  → Generate Only Missing Pieces
  → Record New Assets Back Into CastleInventoryAX
```

---

## System Outputs

CastleInventoryAX produces:
- Castle inventory list
- Blueprint library
- Castle Type library
- Castle Unit, Castle Service, Composite, Compound, and Atomic Asset libraries
- Asset BOM for each Castle
- Asset dependency map
- Reuse reports
- Deprecated asset reports
- Duplicate asset detection
- Local modification reports
- AI retrieval filters
- Build readiness and approval status reports

---

## Use Case: Strut Company Warehousing and Inventory Castle

**Castle Record ID:** `CSTL-STRUT-WAREHOUSE-INVENTORY-V001`
**Castle Type:** Internal Inventory Castle
**Blueprint:** Inventory Application - Internal Tenant

### Castle Units
| Unit | Description |
|------|-------------|
| Warehousing and Inventory Castle Unit | Core inventory operations |
| Admin Castle Unit | User management, role settings, system configuration |
| Reporting Castle Unit | Inventory dashboard, stock reports, export views |
| User Management Castle Unit | User list, roles, permission assignments |

### Castle Services
| Service | Responsibilities |
|---------|-----------------|
| Auth Castle Service | Authentication logic |
| Permission Castle Service | Role-based access |
| Audit Log Castle Service | Event logging |
| Inventory Castle Service | Item records, API routes, schema, validation |
| Warehouse Location Castle Service | Location records, area structure, bin/shelf/zone logic |
| Stock Adjustment Castle Service | Quantity rules, approval thresholds, adjustment history |
| Reporting Castle Service | Stock reports, reconciliation, export views |

### Composites
- Inventory Table Composite *(data table, search, filters, pagination, badges, row actions)*
- Item Detail Page Composite
- Warehouse Location Selector Composite
- Quantity Adjustment Drawer Composite *(drawer layout, quantity input, reason selector, audit log trigger)*
- Inventory Dashboard Widget Composite

### Compounds
- Date Range Filter Compound
- Role Check Compound *(permission constant, role lookup, access decision helper)*
- Quantity Validation Compound *(positive number validation, decimal handling, error messages)*
- Pagination Compound
- Stock Status Filter Compound

### Atomic Assets
| Asset | Type |
|-------|------|
| `InventoryStatusEnum` | Enum |
| `WarehouseLocationType` | Type |
| `formatQuantity()` | Helper function |
| `validatePositiveNumber()` | Validator |
| `canAdjustInventory` | Permission check |
| `StockStatusBadge` | Small UI element |
| `InventoryPermissionConstant` | Constant |

### Local Modifications
- Custom warehouse location naming scheme
- Custom role: `WarehouseSupervisor`
- Quantity adjustment approval required above defined threshold
- Separate tracking for raw materials, work-in-progress, and finished goods
- Custom monthly warehouse reconciliation report

### Sample Asset BOM Trace
```
Castle Service:  Stock Adjustment Castle Service
Composite:       Quantity Adjustment Drawer Composite
Compound:        Quantity Validation Compound
Atomic Assets:   validatePositiveNumber(), formatQuantity(), InventoryStatusEnum
Local Mod:       WarehouseSupervisor approval required above defined threshold
```

If `validatePositiveNumber()` has a defect, CastleInventoryAX traces the impact:
1. Quantity Validation Compound
2. Quantity Adjustment Drawer Composite
3. Stock Adjustment Castle Service
4. Strut Company Warehousing and Inventory Castle

---

## Web Interface

CastleInventoryAX ships a React 18 web UI (Vite 5, React Router v6) at `http://localhost:5173`. It communicates with the Express API through a Vite dev-server proxy (`/api` → `:3000`).

### Catalogue

Every entity type has auto-generated **List**, **Detail**, and **Create/Edit** pages. All pages are config-driven — the same three page components serve all eight entity types.

| Entity | List route | Detail route |
|--------|-----------|--------------|
| Castles | `/castles` | `/castles/:id` |
| Castle Types | `/castle-types` | `/castle-types/:id` |
| Blueprints | `/blueprints` | `/blueprints/:id` |
| Castle Units | `/castle-units` | `/castle-units/:id` |
| Castle Services | `/castle-services` | `/castle-services/:id` |
| Composites | `/composites` | `/composites/:id` |
| Compounds | `/compounds` | `/compounds/:id` |
| Atomic Assets | `/atomic-assets` | `/atomic-assets/:id` |

The Detail page includes inline relationship management panels for all M:M associations (add / remove linked entities without leaving the page).

### Tools

| Tool | Route | What it does |
|------|-------|--------------|
| BOM Viewer | `/bom/:castle_record_id` | Collapsible tree of the full Asset BOM — Units → Services → Composites → Compounds → Atomic Assets. Deprecated/Archived nodes shown with warning badges. |
| BOM Impact | `/bom-impact/:entityType/:entityId` | Traces a given entity upstream to every Castle that depends on it. |
| Diagram | `/diagram/:castle_record_id` | UML-like flowchart rendered by Mermaid.js from live database data. Castle selector + depth control (Level 1 = Castle + Type + Blueprint only; Level 5 = full hierarchy including Atomic Assets). Node types colour-coded by entity layer. |
| AI Retrieval | `/retrieval` | Runs `getRelevantContext` — the filtered, deduplicated asset set for a given Castle Type + Blueprint combination, ready for AI-assisted Castle construction. |
| Reports | `/reports` | All 16 system reports in tabbed sections: entity lists, reuse, deprecated assets, duplicates, local modifications, promotion candidates, build readiness, approval status. |
