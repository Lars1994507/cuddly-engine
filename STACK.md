# CastleInventoryAX — Stack Decisions

## Backend

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language / runtime | Node.js + TypeScript | Strong typing for complex entity hierarchies; excellent test ecosystem |
| Database | PostgreSQL (Docker) | Production-grade relational DB; schemas, joins, and array columns fit the entity model well |
| Query layer | pg (node-postgres, raw SQL) | Lightweight driver; parameterized queries; no schema generation step required; full control over query shape |
| API style | REST (Express) | Simple, testable, well-understood |
| Test framework | Jest + supertest | Standard for Node REST APIs; fast in-process testing |
| Package manager | npm | Standard; no monorepo complexity that would warrant pnpm/yarn |

## Frontend

| Decision | Choice | Rationale |
|----------|--------|-----------|
| UI framework | React 18 | Component model fits the config-driven, data-driven page architecture |
| Build tool | Vite 5 | Fast HMR; native ESM; simple proxy config for the `/api` rewrite |
| Routing | React Router v6 | Declarative nested routes; good URL param support for entity detail pages |
| Diagram rendering | Mermaid.js | Declarative flowchart DSL; dark-theme support; renders UML-like hierarchy diagrams without a canvas |
| State management | React built-ins (useState, useEffect) | Scope is narrow enough that a global store adds no value |
| Styling | Plain CSS (index.css) | Dark GitHub-inspired design system; no build-time CSS tooling needed |

---

## Key Files

### Backend

| Path | Purpose |
|------|---------|
| `db/schema.sql` | Single source of truth for all entity schemas and join tables |
| `src/lib/db.ts` | pg Pool instance and query helpers (`buildSetClause`, `buildWhereClause`) |
| `src/lib/enums.ts` | Shared status enum and entity-type constants |
| `src/index.ts` | Express app entry point; registers all routers |
| `src/entities/` | Route + service logic per entity type (one file pair each) |
| `src/bom/bom.ts` | Asset BOM engine (`generateBOM`, `traceImpact`) |
| `src/bom/bomRouter.ts` | `/bom` route handler |
| `src/retrieval/retrieval.ts` | AI context retrieval filters (`getRelevantContext`, `getContextForCastle`) |
| `src/reports/reports.ts` | All 16 system report functions |
| `src/diagram/diagramRouter.ts` | `/diagram/castle/:id` — converts BOM to nodes + edges for diagram rendering |
| `src/seed/seed.ts` | Strut Company example data (`clearAll`, `seed`) |
| `tests/` | Jest test suites (364 tests across 12 suites) |

### Frontend (`client/`)

| Path | Purpose |
|------|---------|
| `client/src/App.tsx` | Route definitions; maps `ENTITY_CONFIGS` to list/detail/form routes |
| `client/src/config.ts` | `ENTITY_CONFIGS` — drives all 8 entity pages (columns, fields, form fields, relationships, filters) |
| `client/src/api.ts` | Typed wrappers around `fetch` for all backend endpoints |
| `client/src/components/Layout.tsx` | Sidebar navigation + `<Outlet>` shell |
| `client/src/components/StatusBadge.tsx` | Coloured status pill component |
| `client/src/pages/ListPage.tsx` | Generic searchable/filterable entity list (config-driven) |
| `client/src/pages/DetailPage.tsx` | Generic entity detail + relationship management (config-driven) |
| `client/src/pages/EntityFormPage.tsx` | Generic create/edit form (config-driven) |
| `client/src/pages/BOMPage.tsx` | Collapsible BOM tree viewer |
| `client/src/pages/BOMImpactPage.tsx` | Impact trace view — upstream consumers of any entity |
| `client/src/pages/DiagramPage.tsx` | Mermaid.js relationship diagram with castle selector and depth control |
| `client/src/pages/RetrievalPage.tsx` | AI context filter UI |
| `client/src/pages/ReportsPage.tsx` | Tabbed reports UI (16 reports across 6 tabs) |
| `client/vite.config.ts` | Vite config; proxies `/api` → `http://localhost:3000` |
| `client/src/index.css` | Global dark-theme styles |
