# CastleInventoryAX

CastleInventoryAX is the master inventory system for the Castle ecosystem. It stores every reusable building block — from the smallest Atomic Asset up through Compounds, Composites, Castle Services, Castle Units, Blueprints, Castle Types, and full Castles — along with the relationships between them.

**Out of scope:** CastleInventoryAX does not manage tenants, user access, SSO, payments, or billing. Those belong in separate systems.

---

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js + TypeScript |
| Database | PostgreSQL (Docker) |
| Query layer | pg (raw parameterized SQL — no ORM) |
| API | Express REST |
| Frontend | React 18 + Vite 5 + React Router v6 |
| Diagram rendering | Mermaid.js |
| Tests | Jest + ts-jest + Supertest |
| Package manager | npm |

See `STACK.md` for full decision rationale.

---

## Setup

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)

### Install dependencies

```bash
# Backend
npm install

# Frontend
npm --prefix client install
```

### Start PostgreSQL

```bash
docker compose up -d postgres
```

Wait for it to be ready, then apply the schema:

```bash
docker compose exec -T postgres psql -U postgres -d castleinventoryax < db/schema.sql
```

### Environment

The backend reads `DATABASE_URL` from the environment (or a `.env` file):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/castleinventoryax
PORT=3000
```

---

## Running

### Backend only

```bash
npm run dev          # ts-node dev server on :3000
```

### Frontend only

```bash
npm --prefix client run dev    # Vite dev server on :5173
```

The Vite dev server proxies `/api/*` → `http://localhost:3000/*` automatically, so the frontend talks to the backend without CORS configuration.

### Both together

```bash
bash start.sh
```

This frees ports 3000 and 5173, starts PostgreSQL if not running, applies the schema, then starts both servers.

After startup:
- **API** → `http://localhost:3000`
- **Web UI** → `http://localhost:5173`

Health check:

```
GET /health  →  { "status": "ok", "system": "CastleInventoryAX" }
```

---

## Seed Data

The seed loads the complete **Strut Company Warehousing and Inventory Castle** — the canonical end-to-end example for the system.

```bash
npm run db:seed
```

This inserts, in dependency order:
1. 7 Atomic Assets
2. 5 Compounds (wired to their Atomic Assets)
3. 5 Composites (wired to Compounds and Atomic Assets)
4. 7 Castle Services (wired to Composites)
5. 4 Castle Units (wired to Castle Services)
6. 1 Blueprint (wired to Castle Units and Castle Services)
7. 1 Castle Type (wired to Blueprint)
8. 1 Castle — `CSTL-STRUT-WAREHOUSE-INVENTORY-V001`
9. 5 Local Modifications (attached to the Castle)

---

## Tests

```bash
npm test
```

364 tests across 12 suites covering all entities, relationships, BOM engine, retrieval system, reports, and full seed validation.

---

## Web Interface

The React frontend at `http://localhost:5173` provides a full GUI for the system. It has a dark GitHub-inspired theme and a sidebar that organises all pages into two sections.

### Catalogue pages (one per entity type)

Each entity type has three auto-generated views driven by `client/src/config.ts`:

| View | Route | Description |
|------|-------|-------------|
| List | `/:entities` | Searchable, filterable table. Click a row to open detail. |
| Detail | `/:entities/:id` | All fields + relationship panels. Manage M:M links inline. |
| Create / Edit | `/:entities/new`, `/:entities/:id/edit` | Form with validation. |

Entity types: `castles`, `castle-types`, `blueprints`, `castle-units`, `castle-services`, `composites`, `compounds`, `atomic-assets`.

### Tool pages

| Page | Route | Description |
|------|-------|-------------|
| **BOM Viewer** | `/bom/:castle_record_id` | Full Asset Bill of Materials for a Castle. Collapsible tree: Units → Services → Composites → Compounds → Atomic Assets. Deprecated/Archived nodes shown with warning badges. |
| **BOM Impact** | `/bom-impact/:entityType/:entityId` | Given any entity, shows every upstream consumer at all levels up to the Castle. |
| **Diagram** | `/diagram/:castle_record_id` | UML-like relationship flowchart rendered by Mermaid.js, pulled from live database data. Castle selector dropdown + depth selector (Level 1–5). Node types colour-coded by entity layer. |
| **AI Retrieval** | `/retrieval` | Runs `getRelevantContext` for a Castle Type + Blueprint combination. Returns the filtered, deduplicated asset set for AI-assisted Castle construction. |
| **Reports** | `/reports` | All 16 system reports across tabbed sections: lists, reuse, deprecated assets, duplicates, local modifications, promotion candidates, build readiness, approval status. |

---

## Primary Entry Points

### 1. `generateBOM(castle_record_id)`

Returns the full Asset Bill of Materials for a Castle — the complete structured hierarchy of every part used to assemble it.

**HTTP:**
```
GET /bom/:castle_record_id
```

**Programmatic:**
```ts
import { generateBOM } from './src/bom/bom';
const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
```

**Returns:**
```
Castle
  castle_type
  blueprint
  castle_units[]
    castle_services[]
      composites[]
        compounds[]
          atomic_assets[]
        atomic_assets[]       ← direct AA links on composite
      compounds[]             ← direct compound links on service
      atomic_assets[]         ← direct AA links on service
  local_modifications[]
```

Nodes with status `Deprecated` or `Archived` are included but carry a `warning` field.

---

### 2. `traceImpact(entity_id, entity_type)`

Given any entity ID and type, returns all upstream consumers — tracing the impact of a change to that entity all the way to the Castle level.

**HTTP:**
```
GET /bom/impact/:entity_type/:entity_id
```

**Programmatic:**
```ts
import { traceImpact } from './src/bom/bom';
const impact = await traceImpact('AA-VALIDATE-POSITIVE-NUMBER-V001', 'AtomicAsset');
```

**Supported entity types:** `AtomicAsset` | `Compound` | `Composite` | `CastleService` | `CastleUnit`

Example trace for `validatePositiveNumber()`:
```
→ Compounds:       Quantity Validation Compound
→ Composites:      Quantity Adjustment Drawer Composite
→ Castle Services: Stock Adjustment Castle Service
→ Castle Units:    Warehousing and Inventory Castle Unit
→ Castles:         CSTL-STRUT-WAREHOUSE-INVENTORY-V001
```

---

### 3. `getRelevantContext(castle_type_id, blueprint_id)`

Returns a filtered, deduplicated, compact set of assets relevant to a given Castle Type and Blueprint combination. Used to feed AI-assisted Castle construction — only the assets that apply are returned, with `Deprecated` and `Archived` items excluded.

**HTTP:**
```
GET /retrieval/context?castle_type_id=CT-INTERNAL-INVENTORY-V001&blueprint_id=BP-INVENTORY-INTERNAL-TENANT-V001
```

**Programmatic:**
```ts
import { getRelevantContext } from './src/retrieval/retrieval';
const ctx = await getRelevantContext('CT-INTERNAL-INVENTORY-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
```

**Filter pipeline:**
1. Castle Type → default Castle Units and Castle Services
2. Blueprint → default Castle Units, Castle Services, compatible Composites
3. Collected Castle Services → their Composites
4. Collected Composites → their Compounds
5. Collected Compounds → their Atomic Assets
6. Deduplicate and exclude `Deprecated` / `Archived`

**Returns:**
```ts
{
  castle_units:    [{ id, name, status }],
  castle_services: [{ id, name, capability, status }],
  composites:      [{ id, name, ui_backend_scope, status }],
  compounds:       [{ id, name, status }],
  atomic_assets:   [{ id, name, asset_type, status }],
}
```

**Variant — derive context from an existing Castle:**
```
GET /retrieval/castle/:castle_record_id
```

---

## REST API Overview

| Resource | Base path |
|----------|-----------|
| Atomic Assets | `/atomic-assets` |
| Compounds | `/compounds` |
| Composites | `/composites` |
| Castle Services | `/castle-services` |
| Castle Units | `/castle-units` |
| Blueprints | `/blueprints` |
| Castle Types | `/castle-types` |
| Castles | `/castles` |
| Asset BOM + Impact | `/bom` |
| AI Retrieval | `/retrieval` |
| Reports | `/reports` |
| Relationship Diagram | `/diagram` |

All list endpoints accept optional query filters (`status`, `castle_type_id`, `blueprint_id`, `asset_type`, `ui_backend_scope` where applicable).

Soft delete only — `DELETE` sets `status` to `Archived`, never removes the record.

---

## Entity Hierarchy

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

**ID format examples:**
- `CSTL-STRUT-WAREHOUSE-INVENTORY-V001` (Castle)
- `CT-INTERNAL-INVENTORY-V001` (Castle Type)
- `BP-INVENTORY-INTERNAL-TENANT-V001` (Blueprint)
- `CU-WAREHOUSING-INVENTORY-V001` (Castle Unit)
- `CS-STOCK-ADJUSTMENT-V001` (Castle Service)
- `COMP-INVENTORY-TABLE-V001` (Composite)
- `CMPD-QUANTITY-VALIDATION-V001` (Compound)
- `AA-FORMAT-QUANTITY-V001` (Atomic Asset)
- `LMOD-STRUT-SUPERVISOR-APPROVAL-V001` (Local Modification)

**Status values:** `Draft | Active | Deprecated | Archived | InReview | Reusable`
#   c u d d l y - e n g i n e  
 