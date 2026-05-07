# CastleInventoryAX — Claude Session Instructions

This is the CastleInventoryAX project: the master inventory system for the Castle ecosystem.

## When the user says "continue"

1. Read `IMPLEMENTATION_PLAN.md` — find the `▶ RESUME HERE` block at the top.
2. Read the section of `CastleInventoryAX_Clean.md` listed under "Read before starting" for the current phase.
3. Execute the exact task listed under "Next task". Do not skip ahead. Do not start a new phase until all checkboxes in the current phase are marked `[x]`.
4. Work through the current phase tasks top to bottom, marking each `[x]` as you complete it.
5. When all tasks in the phase are `[x]`, update the `▶ RESUME HERE` block to point to the next phase and append a session entry to the `## Session Log` at the bottom of `IMPLEMENTATION_PLAN.md`.

## At the end of every session

Update the `▶ RESUME HERE` block in `IMPLEMENTATION_PLAN.md` so it reflects:
- The current phase and the exact next unchecked task
- Any notes the next session needs (blocker, decision made, partial state)

Do this even if the session ends mid-phase. The next Claude session should be able to pick up at the exact task, not just the phase.

## Architecture rules (always apply)

- Build bottom-up: Atomic Assets → Compounds → Composites → Castle Services → Castle Units → Blueprints → Castle Types → Castles → Local Modifications
- Relationships are bidirectional in queries
- The Asset BOM is computed at query time, never stored
- Status enum: `Draft | Active | Deprecated | Archived | InReview | Reusable`
- ID format example: `CSTL-STRUT-WAREHOUSE-INVENTORY-V001`
- Soft delete only — set status to `Archived`, never hard delete

## Frontend facts (always apply)

- Frontend lives in `client/` — React 18 + Vite 5 + React Router v6
- Vite dev server runs on `:5173`; proxies `/api/*` → `http://localhost:3000/*`
- All eight entity types share three generic page components: `ListPage`, `DetailPage`, `EntityFormPage` — driven by `client/src/config.ts` (`ENTITY_CONFIGS`)
- Tool pages: `BOMPage` (`/bom`), `BOMImpactPage` (`/bom-impact`), `DiagramPage` (`/diagram`), `RetrievalPage` (`/retrieval`), `ReportsPage` (`/reports`)
- `DiagramPage` uses Mermaid.js to render UML-like flowcharts from live DB data via `GET /diagram/castle/:id`
- Backend diagram endpoint lives in `src/diagram/diagramRouter.ts` — it calls `generateBOM` and converts the result to `{ nodes[], edges[] }`
