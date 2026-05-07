import db from '../lib/db';

const EXCLUDED_STATUSES = new Set(['Deprecated', 'Archived']);

function isActive(status: string): boolean {
  return !EXCLUDED_STATUSES.has(status);
}

// ── Compact types (existing /context behaviour) ───────────────────────────────

export interface CompactCastleUnit {
  id: string;
  name: string;
  status: string;
}

export interface CompactCastleService {
  id: string;
  name: string;
  capability: string;
  status: string;
}

export interface CompactComposite {
  id: string;
  name: string;
  ui_backend_scope: string;
  status: string;
}

export interface CompactCompound {
  id: string;
  name: string;
  status: string;
}

export interface CompactAtomicAsset {
  id: string;
  name: string;
  asset_type: string;
  status: string;
}

export interface RelevantContext {
  castle_units: CompactCastleUnit[];
  castle_services: CompactCastleService[];
  composites: CompactComposite[];
  compounds: CompactCompound[];
  atomic_assets: CompactAtomicAsset[];
}

// ── Full context types (?full=true / /scan) ───────────────────────────────────

export interface FullRelevantContext {
  castle_units: any[];
  castle_services: any[];
  composites: any[];
  compounds: any[];
  atomic_assets: any[];
}

export interface FullInventory {
  castle_types: any[];
  blueprints: any[];
  castle_units: any[];
  castle_services: any[];
  composites: any[];
  compounds: any[];
  atomic_assets: any[];
  _meta: {
    scanned_at: string;
    counts: Record<string, number>;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);

interface RawContextRows {
  castleUnits: any[];
  castleServices: any[];
  composites: any[];
  compounds: any[];
  atomicAssets: any[];
}

async function runContextQueries(
  castle_type_id: string,
  blueprint_id: string,
): Promise<RawContextRows> {
  const [ctUnitsRes, ctSvcRes, bpUnitsRes, bpSvcRes, bpCompRes] = await Promise.all([
    db.query(
      `SELECT u.* FROM "CastleUnit" u
       JOIN castle_type_castle_units j ON j.castle_unit_id = u.castle_unit_id
       WHERE j.castle_type_id = $1`,
      [castle_type_id],
    ),
    db.query(
      `SELECT s.* FROM "CastleService" s
       JOIN castle_type_castle_services j ON j.castle_service_id = s.castle_service_id
       WHERE j.castle_type_id = $1`,
      [castle_type_id],
    ),
    db.query(
      `SELECT u.* FROM "CastleUnit" u
       JOIN blueprint_castle_units j ON j.castle_unit_id = u.castle_unit_id
       WHERE j.blueprint_id = $1`,
      [blueprint_id],
    ),
    db.query(
      `SELECT s.* FROM "CastleService" s
       JOIN blueprint_castle_services j ON j.castle_service_id = s.castle_service_id
       WHERE j.blueprint_id = $1`,
      [blueprint_id],
    ),
    db.query(
      `SELECT c.* FROM "Composite" c
       JOIN blueprint_composites j ON j.composite_id = c.composite_id
       WHERE j.blueprint_id = $1`,
      [blueprint_id],
    ),
  ]);

  // Deduplicated Castle Units
  const castleUnitMap = new Map<string, any>();
  for (const u of [...ctUnitsRes.rows, ...bpUnitsRes.rows]) {
    if (isActive(u.status) && !castleUnitMap.has(u.castle_unit_id)) {
      castleUnitMap.set(u.castle_unit_id, u);
    }
  }

  // Deduplicated Castle Services
  const castleServiceMap = new Map<string, any>();
  for (const s of [...ctSvcRes.rows, ...bpSvcRes.rows]) {
    if (isActive(s.status) && !castleServiceMap.has(s.castle_service_id)) {
      castleServiceMap.set(s.castle_service_id, s);
    }
  }

  // Composites from Castle Services
  const serviceIds = [...castleServiceMap.keys()];
  let svcCompositeRows: any[] = [];
  if (serviceIds.length > 0) {
    const res = await db.query(
      `SELECT c.* FROM "Composite" c
       JOIN castle_service_composites j ON j.composite_id = c.composite_id
       WHERE j.castle_service_id = ANY($1::text[])`,
      [serviceIds],
    );
    svcCompositeRows = res.rows;
  }

  const compositeMap = new Map<string, any>();
  for (const c of [...bpCompRes.rows, ...svcCompositeRows]) {
    if (isActive(c.status) && !compositeMap.has(c.composite_id)) {
      compositeMap.set(c.composite_id, c);
    }
  }

  // Compounds from Composites
  const compositeIds = [...compositeMap.keys()];
  let compositeCompoundRows: any[] = [];
  if (compositeIds.length > 0) {
    const res = await db.query(
      `SELECT c.* FROM "Compound" c
       JOIN composite_compounds j ON j.compound_id = c.compound_id
       WHERE j.composite_id = ANY($1::text[])`,
      [compositeIds],
    );
    compositeCompoundRows = res.rows;
  }

  const compoundMap = new Map<string, any>();
  for (const c of compositeCompoundRows) {
    if (isActive(c.status) && !compoundMap.has(c.compound_id)) {
      compoundMap.set(c.compound_id, c);
    }
  }

  // Atomic Assets from Compounds
  const compoundIds = [...compoundMap.keys()];
  let compoundAssetRows: any[] = [];
  if (compoundIds.length > 0) {
    const res = await db.query(
      `SELECT aa.* FROM "AtomicAsset" aa
       JOIN compound_atomic_assets j ON j.atomic_asset_id = aa.atomic_asset_id
       WHERE j.compound_id = ANY($1::text[])`,
      [compoundIds],
    );
    compoundAssetRows = res.rows;
  }

  const atomicAssetMap = new Map<string, any>();
  for (const a of compoundAssetRows) {
    if (isActive(a.status) && !atomicAssetMap.has(a.atomic_asset_id)) {
      atomicAssetMap.set(a.atomic_asset_id, a);
    }
  }

  return {
    castleUnits: [...castleUnitMap.values()].sort(byName),
    castleServices: [...castleServiceMap.values()].sort(byName),
    composites: [...compositeMap.values()].sort(byName),
    compounds: [...compoundMap.values()].sort(byName),
    atomicAssets: [...atomicAssetMap.values()].sort(byName),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compact filtered context for a Castle Type + Blueprint combination.
 * Returns id/name/key-field/status only — use ?full=true for all fields.
 */
export async function getRelevantContext(
  castle_type_id: string,
  blueprint_id: string,
): Promise<RelevantContext> {
  const rows = await runContextQueries(castle_type_id, blueprint_id);
  return {
    castle_units: rows.castleUnits.map((u) => ({
      id: u.castle_unit_id,
      name: u.name,
      status: u.status,
    })),
    castle_services: rows.castleServices.map((s) => ({
      id: s.castle_service_id,
      name: s.name,
      capability: s.capability,
      status: s.status,
    })),
    composites: rows.composites.map((c) => ({
      id: c.composite_id,
      name: c.name,
      ui_backend_scope: c.ui_backend_scope,
      status: c.status,
    })),
    compounds: rows.compounds.map((c) => ({
      id: c.compound_id,
      name: c.name,
      status: c.status,
    })),
    atomic_assets: rows.atomicAssets.map((a) => ({
      id: a.atomic_asset_id,
      name: a.name,
      asset_type: a.asset_type,
      status: a.status,
    })),
  };
}

/**
 * Full-record filtered context — same filter pipeline as getRelevantContext
 * but returns all DB fields so an AI agent can reason over descriptions,
 * code locations, notes, etc. without additional round-trips.
 */
export async function getFullContext(
  castle_type_id: string,
  blueprint_id: string,
): Promise<FullRelevantContext> {
  const rows = await runContextQueries(castle_type_id, blueprint_id);
  return {
    castle_units: rows.castleUnits,
    castle_services: rows.castleServices,
    composites: rows.composites,
    compounds: rows.compounds,
    atomic_assets: rows.atomicAssets,
  };
}

/**
 * Compact context derived from an existing Castle record.
 */
export async function getContextForCastle(
  castle_record_id: string,
): Promise<RelevantContext> {
  const castle = await resolveCastle(castle_record_id);
  return getRelevantContext(castle.castle_type_id, castle.blueprint_id);
}

/**
 * Full-record context derived from an existing Castle record.
 */
export async function getFullContextForCastle(
  castle_record_id: string,
): Promise<FullRelevantContext> {
  const castle = await resolveCastle(castle_record_id);
  return getFullContext(castle.castle_type_id, castle.blueprint_id);
}

async function resolveCastle(castle_record_id: string) {
  const res = await db.query(
    `SELECT "castle_type_id", "blueprint_id" FROM "Castle" WHERE "castle_record_id" = $1`,
    [castle_record_id],
  );
  const castle = res.rows[0];
  if (!castle) throw new Error(`Castle "${castle_record_id}" not found`);
  if (!castle.castle_type_id || !castle.blueprint_id) {
    throw new Error(
      `Castle "${castle_record_id}" must have both castle_type_id and blueprint_id set`,
    );
  }
  return castle;
}

/**
 * Full inventory scan — returns all active assets across every entity type
 * with every DB field included. Deprecated and Archived assets are excluded.
 * Intended for AI agents that need to understand the full asset landscape
 * before deciding what to reuse vs. create.
 */
export async function getFullInventory(): Promise<FullInventory> {
  const [
    castleTypesRes,
    blueprintsRes,
    castleUnitsRes,
    castleServicesRes,
    compositesRes,
    compoundsRes,
    atomicAssetsRes,
  ] = await Promise.all([
    db.query(
      `SELECT * FROM "CastleType"
       WHERE status NOT IN ('Deprecated', 'Archived')
       ORDER BY name`,
    ),
    db.query(
      `SELECT * FROM "Blueprint"
       WHERE status NOT IN ('Deprecated', 'Archived')
       ORDER BY name`,
    ),
    db.query(
      `SELECT * FROM "CastleUnit"
       WHERE status NOT IN ('Deprecated', 'Archived')
       ORDER BY name`,
    ),
    db.query(
      `SELECT * FROM "CastleService"
       WHERE status NOT IN ('Deprecated', 'Archived')
       ORDER BY name`,
    ),
    db.query(
      `SELECT * FROM "Composite"
       WHERE status NOT IN ('Deprecated', 'Archived')
       ORDER BY name`,
    ),
    db.query(
      `SELECT * FROM "Compound"
       WHERE status NOT IN ('Deprecated', 'Archived')
       ORDER BY name`,
    ),
    db.query(
      `SELECT * FROM "AtomicAsset"
       WHERE status NOT IN ('Deprecated', 'Archived')
       ORDER BY name`,
    ),
  ]);

  const castle_types = castleTypesRes.rows;
  const blueprints = blueprintsRes.rows;
  const castle_units = castleUnitsRes.rows;
  const castle_services = castleServicesRes.rows;
  const composites = compositesRes.rows;
  const compounds = compoundsRes.rows;
  const atomic_assets = atomicAssetsRes.rows;

  return {
    castle_types,
    blueprints,
    castle_units,
    castle_services,
    composites,
    compounds,
    atomic_assets,
    _meta: {
      scanned_at: new Date().toISOString(),
      counts: {
        castle_types: castle_types.length,
        blueprints: blueprints.length,
        castle_units: castle_units.length,
        castle_services: castle_services.length,
        composites: composites.length,
        compounds: compounds.length,
        atomic_assets: atomic_assets.length,
      },
    },
  };
}
