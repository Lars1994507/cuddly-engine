# Project: CastleInventoryAX — AI Construction Agent

## Overview
This agent assists with AI-driven Castle construction using the CastleInventoryAX inventory system.
CastleInventoryAX is a master inventory of reusable asset layers (Atomic Assets → Compounds → Composites → Castle Services → Castle Units → Blueprints → Castle Types → Castles).

Your job: given a Castle Type + Blueprint, retrieve the existing asset context, reason over it, identify what's missing, and construct or propose the new Castle using only what already exists where possible.

## CastleInventoryAX API

Base URL: `http://192.168.15.247:3000`

### Primary entry points

**Full inventory scan (use this first to understand what already exists):**
```
GET /retrieval/scan
```
Returns every active asset in the database — all entity types, all DB fields (descriptions,
code locations, notes, version, etc.). Deprecated and Archived assets excluded.
Includes `_meta.counts` so you know the size of each layer before reasoning.

**Retrieve filtered context for a new Castle (by Castle Type + Blueprint):**
```
GET /retrieval/context?castle_type_id=<id>&blueprint_id=<id>
GET /retrieval/context?castle_type_id=<id>&blueprint_id=<id>&full=true   ← all DB fields
```
Returns the deduplicated, active asset set relevant to this CT+BP combination.
Default response is compact (id/name/key-field/status). Add `?full=true` for every field.

**Retrieve context from an existing Castle:**
```
GET /retrieval/castle/<castle_record_id>
GET /retrieval/castle/<castle_record_id>?full=true   ← all DB fields
```

**Full Asset BOM for a Castle:**
```
GET /bom/<castle_record_id>
```

**Impact trace (what depends on a given asset):**
```
GET /bom/impact/<entity_type>/<entity_id>
```
entity_type: `AtomicAsset | Compound | Composite | CastleService | CastleUnit`

### Entity CRUD (all support GET list + GET by ID + POST + PATCH + DELETE)
- `/atomic-assets`
- `/compounds`
- `/composites`
- `/castle-services`
- `/castle-units`
- `/blueprints`
- `/castle-types`
- `/castles`

### Reports
- `/reports/castles` — all Castles
- `/reports/reuse` — assets used in 2+ Castles
- `/reports/deprecated` — all Deprecated assets
- `/reports/duplicates` — assets with similar names
- `/reports/build-readiness/<castle_record_id>` — flags missing/deprecated assets

### Health check
```
GET /health  →  { "status": "ok", "system": "CastleInventoryAX" }
```

## AI Development Flow

Follow this sequence for every new Castle construction request:

1. Ask: what Castle Type and Blueprint?
2. `GET /retrieval/scan` — scan the full inventory to understand what already exists
3. `GET /retrieval/context?castle_type_id=X&blueprint_id=Y&full=true` — get the filtered, relevant context with all details
4. Compare the Castle requirements against the scan results — identify reusable assets
5. Identify gaps (what the Castle needs that doesn't exist in the inventory)
6. For gaps: propose new Atomic Assets → Compounds → Composites → Castle Services → Castle Units (bottom-up)
7. `POST` each new asset to its endpoint before referencing it
8. `POST /castles` to create the Castle record with the assembled units and services
9. Record any Castle-specific tweaks as Local Modifications via `POST /castles/:id/local-modifications`

## ID format
`CSTL-STRUT-WAREHOUSE-INVENTORY-V001` — pattern: `<PREFIX>-<DOMAIN>-<NAME>-V<NNN>`

Prefixes by layer:
- Atomic Asset: `AA-`
- Compound: `CMPD-`
- Composite: `COMP-`
- Castle Service: `CS-`
- Castle Unit: `CU-`
- Blueprint: `BP-`
- Castle Type: `CT-`
- Castle: `CSTL-`

## Status rules
- New assets start as `Draft`
- Active assets are live and reusable
- Never use `Deprecated` or `Archived` assets in new Castles
- Never hard-delete — set status to `Archived` instead

## Example IDs (seed data — use for testing calls)
- Castle Type: `CT-INTERNAL-INVENTORY-V001`
- Blueprint: `BP-INVENTORY-INTERNAL-TENANT-V001`
- Castle: `CSTL-STRUT-WAREHOUSE-INVENTORY-V001`
- Atomic Asset: `AA-FORMAT-QUANTITY-V001`

## Notes for the agent
- Always call `/health` first to confirm the API is reachable
- Start every Castle task with `GET /retrieval/scan` — understand the full inventory before reasoning
- Use `GET /retrieval/context?...&full=true` for the filtered view with all fields
- Build bottom-up: create Atomic Assets before Compounds, Compounds before Composites, etc.
- Deduplicate: if an asset covering the same concern already exists, reuse it — do not create a duplicate
- `/retrieval/scan` returns `_meta.counts` — use it to gauge inventory size before deciding how deeply to reason
