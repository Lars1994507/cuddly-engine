# CastleInventoryAX — Session Problem & Change Log

This file tracks every problem identified and every change made across Claude sessions.
Update this file at the end of every Claude response that changes code or data.

---

## Problems Identified & Resolved

### 1. Atomic Assets had no "Used In" relationships visible
**Problem:** The `atomic-assets` config had `rels: []` — no relationship sections at all. There was no way to see which Compounds, Composites, or Castle Services referenced a given Atomic Asset.

**Root cause:** Reverse-lookup endpoints (`GET /atomic-assets/{id}/compounds` etc.) did not exist. The config had no rels configured.

**Fix:**
- Added `GET /atomic-assets/{id}/compounds`, `/composites`, `/castle-services` endpoints to `AtomicAssetsController.cs`
- Modified `GET /atomic-assets` list endpoint to return `usage_count` and `usage_summary` (e.g. `"2 Cmpd · 1 Svc"`) per asset
- Added `"Used In"` column and three rels to `atomic-assets` in `config.ts`

**Files changed:** `backend-dotnet/Controllers/AtomicAssetsController.cs`, `client/src/config.ts`

---

### 2. Demo CSV missing `[CastleServiceAtomicAsset]` section
**Problem:** The demo CSV had no direct Castle Service → Atomic Asset links, so the "Used in Castle Services" section of the Atomic Asset inline detail always showed "None."

**Root cause:** The `[CastleServiceAtomicAsset]` CSV section and its DemoController loader both did not exist.

**Fix:**
- Added `[CastleServiceAtomicAsset]` section to `db/demo/demo-data.csv` with 4 rows
- Added loader block for `CastleServiceAtomicAsset` in `DemoController.cs`
- Added more `[CompositeAtomicAsset]` rows to cover more assets in composites

**Files changed:** `db/demo/demo-data.csv`, `backend-dotnet/Controllers/DemoController.cs`

---

### 3. Demo CSV missing `[CastleServiceCompound]` and `[CastleUnitComposite]` sections
**Problem:** Two join table types were missing from both the CSV and the DemoController loader. Castle Services showed nothing under "Compounds." Castle Units showed nothing under "Composites."

**Root cause:** The CSV never had `[CastleServiceCompound]` or `[CastleUnitComposite]` sections. The DemoController had no handlers for them either, so even if added to CSV, they would be silently ignored.

**Fix:**
- Added `[CastleServiceCompound]` to CSV (5 rows linking Menu and Order services to compounds)
- Added `[CastleUnitComposite]` to CSV (3 rows linking each unit to its composite)
- Added `CastleServiceCompound` loader in `DemoController.cs`
- Added `CastleUnitComposite` loader in `DemoController.cs`

**Files changed:** `db/demo/demo-data.csv`, `backend-dotnet/Controllers/DemoController.cs`

---

### 4. ALL relationship dropdowns showed "None" — circular JSON serialization
**Problem:** Every inline detail panel and detail page showed "None" for every relationship section, across all entity types.

**Root cause:** EF Core's change tracker back-filled navigation properties on included entities. For example, `GET /compounds/{id}/atomic-assets` used `.Include(r => r.AtomicAsset)`, which caused the `AtomicAsset` entity's `Compounds` collection to be filled with the tracked join entities, which referenced the `AtomicAsset` back — a cycle. System.Text.Json hit its 64-level recursion limit mid-serialization and aborted the HTTP response, sending malformed JSON. The frontend's `res.json()` threw a parse error, which `InlineDetail`'s `.catch(() => [rel.label, []])` swallowed silently and rendered as "None."

**Verified with:** `curl http://localhost:3000/compounds/CMPD-PRICE-FORMAT-DEMO-V001/atomic-assets` returned 63.5KB of circular JSON.

**Fix:** Added `ReferenceHandler.IgnoreCycles` to the JSON options in `Program.cs`. This tells System.Text.Json to write `null` when it encounters an already-serialized object reference instead of recursing infinitely, producing clean compact responses.

```csharp
// Program.cs
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; // ← added
});
```

**Files changed:** `backend-dotnet/Program.cs`

**Action required after this fix:** Go to Settings → **Reload Demo Data** to load all the new relationship rows into the database.

---

## Complete Join Table Coverage Checklist

All 16 join tables are now covered in both the CSV and the DemoController loader:

| Join Table | CSV Section | Loader | Notes |
|------------|-------------|--------|-------|
| `compound_atomic_assets` | `[CompoundAtomicAsset]` | ✓ | Original |
| `composite_compounds` | `[CompositeCompound]` | ✓ | Original |
| `composite_atomic_assets` | `[CompositeAtomicAsset]` | ✓ | Expanded in session |
| `castle_service_atomic_assets` | `[CastleServiceAtomicAsset]` | ✓ | Added in session |
| `castle_service_composites` | `[CastleServiceComposite]` | ✓ | Original |
| `castle_service_compounds` | `[CastleServiceCompound]` | ✓ | Added in session |
| `castle_unit_services` | `[CastleUnitService]` | ✓ | Original |
| `castle_unit_composites` | `[CastleUnitComposite]` | ✓ | Added in session |
| `blueprint_castle_units` | `[BlueprintCastleUnit]` | ✓ | Original |
| `blueprint_castle_services` | `[BlueprintCastleService]` | ✓ | Original |
| `blueprint_composites` | `[BlueprintComposite]` | ✓ | Original |
| `castle_type_blueprints` | `[CastleTypeBlueprint]` | ✓ | Original |
| `castle_type_castle_units` | `[CastleTypeCastleUnit]` | ✓ | Original |
| `castle_type_castle_services` | `[CastleTypeCastleService]` | ✓ | Original |
| `castle_castle_units` | `[CastleCastleUnit]` | ✓ | Original |
| `castle_castle_services` | `[CastleCastleService]` | ✓ | Original |

---

---

### 5. Relationship chips navigated away from the page on click
**Problem:** Clicking any relationship chip (e.g. "Auth Castle Service" in a Castle Unit's inline detail) navigated the browser to the target entity's full-page route, leaving the current list/detail context.

**Root cause:** All relationship items in `InlineDetail.tsx` and `DetailPage.tsx` were rendered as `<Link to={...}>` elements — standard React Router links that trigger a full navigation.

**Fix:**
- Created `client/src/components/ChipDetail.tsx` — a shared nested panel component that fetches and renders an entity's fields + relationships (read-only, no further drill-down) with a "Full page ↗" link for optional deep navigation.
- Updated `InlineDetail.tsx`:
  - Added `expandedChipKey: string | null` state.
  - Replaced `<Link>` chip names with `<button className="chip-expand-btn">` that toggles the chip detail panel.
  - Kept a small `↗` link for direct navigation.
  - `ChipDetail` renders below the chips row for the active chip.
- Updated `DetailPage.tsx`:
  - Added `expandedRelKey: string | null` state.
  - Replaced `<Link className="rel-name">` with `<button className="inline-rel-name-btn">` + small `↗` link.
  - `ChipDetail` renders as `.rel-item-detail` below each expanded rel item using `<Fragment key={relId}>`.
- Added CSS classes: `.chip-expand-btn`, `.chip-nav-link`, `.chip-active`, `.chip-detail*`, `.rel-name-row`, `.inline-rel-name-btn`, `.rel-nav-link`, `.rel-item-detail`.

**Files changed:** `client/src/components/ChipDetail.tsx` (new), `client/src/components/InlineDetail.tsx`, `client/src/pages/DetailPage.tsx`, `client/src/index.css`

---

## Architecture Notes (Do Not Forget)

- Database: **PostgreSQL** on port `5433` via Docker (`docker-compose.yml`)
- Schema is managed **manually** via `db/schema.sql` — EF Core does NOT auto-migrate
- `docker/init.sql` only creates the test DB; the main schema must be applied manually
- `AppDbContext.SaveChangesAsync()` auto-sets `created_at` and `updated_at` for all entities
- Join entities have no timestamps — they only have composite PKs
- The `updated_at` column is `NOT NULL` with no DB default — EF Core must always set it
- Soft delete only: archive = set `status = 'Archived'`, never hard delete

## Frontend Notes (Do Not Forget)

- Vite dev server: port `5173`, proxies `/api/*` → `http://localhost:3000/*`
- `InlineDetail.tsx` silently swallows API errors (`.catch(() => [])`) — always verify with `curl` before blaming the frontend
- `ListPage.tsx` uses `config.idField` to get the row ID for expand — must match what the API returns
- `config.ts` `rels` array drives both `InlineDetail` and `DetailPage` relationship panels
- The `atomic-assets` list endpoint returns an anonymous type (not the entity directly) to include `usage_summary`
