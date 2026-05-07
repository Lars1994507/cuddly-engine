import db from '../lib/db';
import { generateBOM } from '../bom/bom';
import type { BOMNode } from '../bom/bom';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ReportNode {
  id: string;
  name: string;
  status: string;
  [key: string]: unknown;
}

// ─── Report 1: listCastles ────────────────────────────────────────────────────

export interface CastleReportFilters {
  status?: string;
  castle_type_id?: string;
  blueprint_id?: string;
}

export async function listCastles(filters?: CastleReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`c."status" = $${values.length}`);
  }
  if (filters?.castle_type_id) {
    values.push(filters.castle_type_id);
    conditions.push(`c."castle_type_id" = $${values.length}`);
  }
  if (filters?.blueprint_id) {
    values.push(filters.blueprint_id);
    conditions.push(`c."blueprint_id" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query(
    `SELECT c.*,
            ct.name AS castle_type_name,
            b.name  AS blueprint_name
     FROM "Castle" c
     LEFT JOIN "CastleType" ct ON ct.castle_type_id = c.castle_type_id
     LEFT JOIN "Blueprint"  b  ON b.blueprint_id    = c.blueprint_id
     ${where}
     ORDER BY c.castle_name`,
    values,
  );
  return res.rows.map((c: any) => ({
    castle_record_id: c.castle_record_id,
    castle_name: c.castle_name,
    version: c.version,
    status: c.status,
    primary_purpose: c.primary_purpose,
    castle_type: c.castle_type_id
      ? { id: c.castle_type_id, name: c.castle_type_name }
      : null,
    blueprint: c.blueprint_id
      ? { id: c.blueprint_id, name: c.blueprint_name }
      : null,
  }));
}

// ─── Report 2: listBlueprints ─────────────────────────────────────────────────

export interface BlueprintReportFilters {
  status?: string;
  category?: string;
}

export async function listBlueprints(filters?: BlueprintReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  if (filters?.category) {
    values.push(filters.category);
    conditions.push(`"category" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query(`SELECT * FROM "Blueprint" ${where} ORDER BY name`, values);
  return res.rows;
}

// ─── Report 3: listCastleTypes ────────────────────────────────────────────────

export interface CastleTypeReportFilters {
  status?: string;
}

export async function listCastleTypes(filters?: CastleTypeReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const ctRes = await db.query(
    `SELECT * FROM "CastleType" ${where} ORDER BY name`,
    values,
  );
  if (ctRes.rows.length === 0) return [];

  const ctIds = ctRes.rows.map((r: any) => r.castle_type_id);
  const bpRes = await db.query(
    `SELECT j.castle_type_id, b.blueprint_id, b.name, b.status
     FROM castle_type_blueprints j
     JOIN "Blueprint" b ON b.blueprint_id = j.blueprint_id
     WHERE j.castle_type_id = ANY($1::text[])`,
    [ctIds],
  );

  const bpMap = new Map<string, { id: string; name: string; status: string }[]>();
  for (const r of bpRes.rows) {
    if (!bpMap.has(r.castle_type_id)) bpMap.set(r.castle_type_id, []);
    bpMap.get(r.castle_type_id)!.push({ id: r.blueprint_id, name: r.name, status: r.status });
  }

  return ctRes.rows.map((ct: any) => ({
    castle_type_id: ct.castle_type_id,
    name: ct.name,
    description: ct.description,
    common_purpose: ct.common_purpose,
    status: ct.status,
    compatible_blueprints: bpMap.get(ct.castle_type_id) ?? [],
  }));
}

// ─── Report 4: listCastleUnits ────────────────────────────────────────────────

export interface CastleUnitReportFilters {
  status?: string;
}

export async function listCastleUnits(filters?: CastleUnitReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query(`SELECT * FROM "CastleUnit" ${where} ORDER BY name`, values);
  return res.rows;
}

// ─── Report 5: listCastleServices ────────────────────────────────────────────

export interface CastleServiceReportFilters {
  status?: string;
}

export async function listCastleServices(filters?: CastleServiceReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query(`SELECT * FROM "CastleService" ${where} ORDER BY name`, values);
  return res.rows;
}

// ─── Report 6: listComposites ─────────────────────────────────────────────────

export interface CompositeReportFilters {
  status?: string;
  ui_backend_scope?: string;
}

export async function listComposites(filters?: CompositeReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  if (filters?.ui_backend_scope) {
    values.push(filters.ui_backend_scope);
    conditions.push(`"ui_backend_scope" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query(`SELECT * FROM "Composite" ${where} ORDER BY name`, values);
  return res.rows;
}

// ─── Report 7: listCompounds ──────────────────────────────────────────────────

export interface CompoundReportFilters {
  status?: string;
}

export async function listCompounds(filters?: CompoundReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query(`SELECT * FROM "Compound" ${where} ORDER BY name`, values);
  return res.rows;
}

// ─── Report 8: listAtomicAssets ───────────────────────────────────────────────

export interface AtomicAssetReportFilters {
  status?: string;
  asset_type?: string;
}

export async function listAtomicAssets(filters?: AtomicAssetReportFilters) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  if (filters?.asset_type) {
    values.push(filters.asset_type);
    conditions.push(`"asset_type" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query(`SELECT * FROM "AtomicAsset" ${where} ORDER BY name`, values);
  return res.rows;
}

// ─── Report 9: getDependencyMap ───────────────────────────────────────────────

export type DependencyEntityType =
  | 'AtomicAsset'
  | 'Compound'
  | 'Composite'
  | 'CastleService'
  | 'CastleUnit'
  | 'Blueprint'
  | 'CastleType'
  | 'Castle';

export interface DownstreamResult {
  bom?: import('../bom/bom').BOMResult;
  blueprints?: BOMNode[];
  castle_units?: BOMNode[];
  castle_services?: BOMNode[];
  composites?: BOMNode[];
  compounds?: BOMNode[];
  atomic_assets?: BOMNode[];
}

function toBOMNode(
  id: string,
  name: string,
  status: string,
  version?: string,
): BOMNode {
  return { id, name, status, version };
}

async function getDownstream(
  entity_id: string,
  entity_type: DependencyEntityType,
): Promise<DownstreamResult> {
  const result: DownstreamResult = {};

  if (entity_type === 'CastleType') {
    const [bpRes, unitRes, svcRes] = await Promise.all([
      db.query(
        `SELECT b.* FROM "Blueprint" b JOIN castle_type_blueprints j ON j.blueprint_id = b.blueprint_id WHERE j.castle_type_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT u.* FROM "CastleUnit" u JOIN castle_type_castle_units j ON j.castle_unit_id = u.castle_unit_id WHERE j.castle_type_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT s.* FROM "CastleService" s JOIN castle_type_castle_services j ON j.castle_service_id = s.castle_service_id WHERE j.castle_type_id = $1`,
        [entity_id],
      ),
    ]);
    result.blueprints = bpRes.rows.map((r: any) =>
      toBOMNode(r.blueprint_id, r.name, r.status, r.version),
    );
    result.castle_units = unitRes.rows.map((r: any) =>
      toBOMNode(r.castle_unit_id, r.name, r.status),
    );
    result.castle_services = svcRes.rows.map((r: any) =>
      toBOMNode(r.castle_service_id, r.name, r.status),
    );
  }

  if (entity_type === 'Blueprint') {
    const [unitRes, svcRes, compRes] = await Promise.all([
      db.query(
        `SELECT u.* FROM "CastleUnit" u JOIN blueprint_castle_units j ON j.castle_unit_id = u.castle_unit_id WHERE j.blueprint_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT s.* FROM "CastleService" s JOIN blueprint_castle_services j ON j.castle_service_id = s.castle_service_id WHERE j.blueprint_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT c.* FROM "Composite" c JOIN blueprint_composites j ON j.composite_id = c.composite_id WHERE j.blueprint_id = $1`,
        [entity_id],
      ),
    ]);
    result.castle_units = unitRes.rows.map((r: any) =>
      toBOMNode(r.castle_unit_id, r.name, r.status),
    );
    result.castle_services = svcRes.rows.map((r: any) =>
      toBOMNode(r.castle_service_id, r.name, r.status),
    );
    result.composites = compRes.rows.map((r: any) =>
      toBOMNode(r.composite_id, r.name, r.status, r.version),
    );
  }

  if (entity_type === 'CastleUnit') {
    const [svcRes, compRes] = await Promise.all([
      db.query(
        `SELECT s.* FROM "CastleService" s JOIN castle_unit_services j ON j.castle_service_id = s.castle_service_id WHERE j.castle_unit_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT c.* FROM "Composite" c JOIN castle_unit_composites j ON j.composite_id = c.composite_id WHERE j.castle_unit_id = $1`,
        [entity_id],
      ),
    ]);
    result.castle_services = svcRes.rows.map((r: any) =>
      toBOMNode(r.castle_service_id, r.name, r.status),
    );
    result.composites = compRes.rows.map((r: any) =>
      toBOMNode(r.composite_id, r.name, r.status, r.version),
    );
  }

  if (entity_type === 'CastleService') {
    const [compRes, cpdRes, aaRes] = await Promise.all([
      db.query(
        `SELECT c.* FROM "Composite" c JOIN castle_service_composites j ON j.composite_id = c.composite_id WHERE j.castle_service_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT c.* FROM "Compound" c JOIN castle_service_compounds j ON j.compound_id = c.compound_id WHERE j.castle_service_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT aa.* FROM "AtomicAsset" aa JOIN castle_service_atomic_assets j ON j.atomic_asset_id = aa.atomic_asset_id WHERE j.castle_service_id = $1`,
        [entity_id],
      ),
    ]);
    result.composites = compRes.rows.map((r: any) =>
      toBOMNode(r.composite_id, r.name, r.status, r.version),
    );
    result.compounds = cpdRes.rows.map((r: any) =>
      toBOMNode(r.compound_id, r.name, r.status, r.version),
    );
    result.atomic_assets = aaRes.rows.map((r: any) =>
      toBOMNode(r.atomic_asset_id, r.name, r.status, r.version),
    );
  }

  if (entity_type === 'Composite') {
    const [cpdRes, aaRes] = await Promise.all([
      db.query(
        `SELECT c.* FROM "Compound" c JOIN composite_compounds j ON j.compound_id = c.compound_id WHERE j.composite_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT aa.* FROM "AtomicAsset" aa JOIN composite_atomic_assets j ON j.atomic_asset_id = aa.atomic_asset_id WHERE j.composite_id = $1`,
        [entity_id],
      ),
    ]);
    result.compounds = cpdRes.rows.map((r: any) =>
      toBOMNode(r.compound_id, r.name, r.status, r.version),
    );
    result.atomic_assets = aaRes.rows.map((r: any) =>
      toBOMNode(r.atomic_asset_id, r.name, r.status, r.version),
    );
  }

  if (entity_type === 'Compound') {
    const aaRes = await db.query(
      `SELECT aa.* FROM "AtomicAsset" aa JOIN compound_atomic_assets j ON j.atomic_asset_id = aa.atomic_asset_id WHERE j.compound_id = $1`,
      [entity_id],
    );
    result.atomic_assets = aaRes.rows.map((r: any) =>
      toBOMNode(r.atomic_asset_id, r.name, r.status, r.version),
    );
  }

  return result;
}

async function getUpstream(entity_id: string, entity_type: DependencyEntityType) {
  const result: {
    compounds?: BOMNode[];
    composites?: BOMNode[];
    castle_services?: BOMNode[];
    castle_units?: BOMNode[];
    castle_types?: BOMNode[];
    castles: BOMNode[];
  } = { castles: [] };

  if (entity_type === 'AtomicAsset') {
    const [cpdRes, compRes, svcRes] = await Promise.all([
      db.query(
        `SELECT c.* FROM "Compound" c JOIN compound_atomic_assets j ON j.compound_id = c.compound_id WHERE j.atomic_asset_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT c.* FROM "Composite" c JOIN composite_atomic_assets j ON j.composite_id = c.composite_id WHERE j.atomic_asset_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT s.* FROM "CastleService" s JOIN castle_service_atomic_assets j ON j.castle_service_id = s.castle_service_id WHERE j.atomic_asset_id = $1`,
        [entity_id],
      ),
    ]);
    result.compounds = cpdRes.rows.map((r: any) =>
      toBOMNode(r.compound_id, r.name, r.status, r.version),
    );
    result.composites = compRes.rows.map((r: any) =>
      toBOMNode(r.composite_id, r.name, r.status, r.version),
    );
    result.castle_services = svcRes.rows.map((r: any) =>
      toBOMNode(r.castle_service_id, r.name, r.status),
    );
    const serviceIds = svcRes.rows.map((r: any) => r.castle_service_id);
    if (serviceIds.length > 0) {
      const castleRes = await db.query(
        `SELECT DISTINCT c.* FROM "Castle" c
         JOIN castle_castle_services j ON j.castle_record_id = c.castle_record_id
         WHERE j.castle_service_id = ANY($1::text[])`,
        [serviceIds],
      );
      result.castles = castleRes.rows.map((r: any) =>
        toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version),
      );
    }
  }

  if (entity_type === 'Compound') {
    const [compRes, svcRes] = await Promise.all([
      db.query(
        `SELECT c.* FROM "Composite" c JOIN composite_compounds j ON j.composite_id = c.composite_id WHERE j.compound_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT s.* FROM "CastleService" s JOIN castle_service_compounds j ON j.castle_service_id = s.castle_service_id WHERE j.compound_id = $1`,
        [entity_id],
      ),
    ]);
    result.composites = compRes.rows.map((r: any) =>
      toBOMNode(r.composite_id, r.name, r.status, r.version),
    );
    result.castle_services = svcRes.rows.map((r: any) =>
      toBOMNode(r.castle_service_id, r.name, r.status),
    );
    const serviceIds = svcRes.rows.map((r: any) => r.castle_service_id);
    if (serviceIds.length > 0) {
      const castleRes = await db.query(
        `SELECT DISTINCT c.* FROM "Castle" c
         JOIN castle_castle_services j ON j.castle_record_id = c.castle_record_id
         WHERE j.castle_service_id = ANY($1::text[])`,
        [serviceIds],
      );
      result.castles = castleRes.rows.map((r: any) =>
        toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version),
      );
    }
  }

  if (entity_type === 'Composite') {
    const [unitRes, svcRes] = await Promise.all([
      db.query(
        `SELECT u.* FROM "CastleUnit" u JOIN castle_unit_composites j ON j.castle_unit_id = u.castle_unit_id WHERE j.composite_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT s.* FROM "CastleService" s JOIN castle_service_composites j ON j.castle_service_id = s.castle_service_id WHERE j.composite_id = $1`,
        [entity_id],
      ),
    ]);
    result.castle_units = unitRes.rows.map((r: any) =>
      toBOMNode(r.castle_unit_id, r.name, r.status),
    );
    result.castle_services = svcRes.rows.map((r: any) =>
      toBOMNode(r.castle_service_id, r.name, r.status),
    );
    const unitIds = unitRes.rows.map((r: any) => r.castle_unit_id);
    const serviceIds = svcRes.rows.map((r: any) => r.castle_service_id);
    const seen = new Set<string>();
    const castleNodes: BOMNode[] = [];
    if (unitIds.length > 0) {
      const rows = await db.query(
        `SELECT DISTINCT c.* FROM "Castle" c
         JOIN castle_castle_units j ON j.castle_record_id = c.castle_record_id
         WHERE j.castle_unit_id = ANY($1::text[])`,
        [unitIds],
      );
      for (const r of rows.rows) {
        if (!seen.has(r.castle_record_id)) {
          seen.add(r.castle_record_id);
          castleNodes.push(toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version));
        }
      }
    }
    if (serviceIds.length > 0) {
      const rows = await db.query(
        `SELECT DISTINCT c.* FROM "Castle" c
         JOIN castle_castle_services j ON j.castle_record_id = c.castle_record_id
         WHERE j.castle_service_id = ANY($1::text[])`,
        [serviceIds],
      );
      for (const r of rows.rows) {
        if (!seen.has(r.castle_record_id)) {
          seen.add(r.castle_record_id);
          castleNodes.push(toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version));
        }
      }
    }
    result.castles = castleNodes;
  }

  if (entity_type === 'CastleService') {
    const [unitRes, castleRes] = await Promise.all([
      db.query(
        `SELECT u.* FROM "CastleUnit" u JOIN castle_unit_services j ON j.castle_unit_id = u.castle_unit_id WHERE j.castle_service_id = $1`,
        [entity_id],
      ),
      db.query(
        `SELECT c.* FROM "Castle" c JOIN castle_castle_services j ON j.castle_record_id = c.castle_record_id WHERE j.castle_service_id = $1`,
        [entity_id],
      ),
    ]);
    result.castle_units = unitRes.rows.map((r: any) =>
      toBOMNode(r.castle_unit_id, r.name, r.status),
    );
    result.castles = castleRes.rows.map((r: any) =>
      toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version),
    );
  }

  if (entity_type === 'CastleUnit') {
    const castleRes = await db.query(
      `SELECT c.* FROM "Castle" c JOIN castle_castle_units j ON j.castle_record_id = c.castle_record_id WHERE j.castle_unit_id = $1`,
      [entity_id],
    );
    result.castles = castleRes.rows.map((r: any) =>
      toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version),
    );
  }

  if (entity_type === 'Blueprint') {
    const [castleRes, ctRes] = await Promise.all([
      db.query(`SELECT * FROM "Castle" WHERE "blueprint_id" = $1`, [entity_id]),
      db.query(
        `SELECT ct.* FROM "CastleType" ct JOIN castle_type_blueprints j ON j.castle_type_id = ct.castle_type_id WHERE j.blueprint_id = $1`,
        [entity_id],
      ),
    ]);
    result.castles = castleRes.rows.map((r: any) =>
      toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version),
    );
    result.castle_types = ctRes.rows.map((r: any) =>
      toBOMNode(r.castle_type_id, r.name, r.status),
    );
  }

  if (entity_type === 'CastleType') {
    const castleRes = await db.query(
      `SELECT * FROM "Castle" WHERE "castle_type_id" = $1`,
      [entity_id],
    );
    result.castles = castleRes.rows.map((r: any) =>
      toBOMNode(r.castle_record_id, r.castle_name, r.status, r.version),
    );
  }

  return result;
}

export async function getDependencyMap(entity_id: string, entity_type: DependencyEntityType) {
  const [upstream, downstream] = await Promise.all([
    getUpstream(entity_id, entity_type),
    entity_type === 'Castle'
      ? generateBOM(entity_id).then((bom): DownstreamResult => ({ bom }))
      : getDownstream(entity_id, entity_type),
  ]);
  return { entity_id, entity_type, upstream, downstream };
}

// ─── Report 10: getReuseReport ────────────────────────────────────────────────

function aggregateCounts(
  groups: { id: string; count: number }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const g of groups) {
    map.set(g.id, (map.get(g.id) ?? 0) + g.count);
  }
  return map;
}

export async function getReuseReport() {
  const [cuRes, csRes, compSvcRes, compUnitRes, compBpRes, cpdCompRes, cpdSvcRes, aaCompRes, aaCompositeRes, aaSvcRes] =
    await Promise.all([
      db.query(`SELECT castle_unit_id, COUNT(castle_record_id)::int AS count FROM castle_castle_units GROUP BY castle_unit_id`),
      db.query(`SELECT castle_service_id, COUNT(castle_record_id)::int AS count FROM castle_castle_services GROUP BY castle_service_id`),
      db.query(`SELECT composite_id, COUNT(castle_service_id)::int AS count FROM castle_service_composites GROUP BY composite_id`),
      db.query(`SELECT composite_id, COUNT(castle_unit_id)::int AS count FROM castle_unit_composites GROUP BY composite_id`),
      db.query(`SELECT composite_id, COUNT(blueprint_id)::int AS count FROM blueprint_composites GROUP BY composite_id`),
      db.query(`SELECT compound_id, COUNT(composite_id)::int AS count FROM composite_compounds GROUP BY compound_id`),
      db.query(`SELECT compound_id, COUNT(castle_service_id)::int AS count FROM castle_service_compounds GROUP BY compound_id`),
      db.query(`SELECT atomic_asset_id, COUNT(compound_id)::int AS count FROM compound_atomic_assets GROUP BY atomic_asset_id`),
      db.query(`SELECT atomic_asset_id, COUNT(composite_id)::int AS count FROM composite_atomic_assets GROUP BY atomic_asset_id`),
      db.query(`SELECT atomic_asset_id, COUNT(castle_service_id)::int AS count FROM castle_service_atomic_assets GROUP BY atomic_asset_id`),
    ]);

  const compositeCountMap = aggregateCounts([
    ...compSvcRes.rows.map((r: any) => ({ id: r.composite_id, count: r.count })),
    ...compUnitRes.rows.map((r: any) => ({ id: r.composite_id, count: r.count })),
    ...compBpRes.rows.map((r: any) => ({ id: r.composite_id, count: r.count })),
  ]);

  const compoundCountMap = aggregateCounts([
    ...cpdCompRes.rows.map((r: any) => ({ id: r.compound_id, count: r.count })),
    ...cpdSvcRes.rows.map((r: any) => ({ id: r.compound_id, count: r.count })),
  ]);

  const aaCountMap = aggregateCounts([
    ...aaCompRes.rows.map((r: any) => ({ id: r.atomic_asset_id, count: r.count })),
    ...aaCompositeRes.rows.map((r: any) => ({ id: r.atomic_asset_id, count: r.count })),
    ...aaSvcRes.rows.map((r: any) => ({ id: r.atomic_asset_id, count: r.count })),
  ]);

  const reusedCuIds = cuRes.rows.filter((r: any) => r.count >= 2).map((r: any) => r.castle_unit_id);
  const reusedCsIds = csRes.rows.filter((r: any) => r.count >= 2).map((r: any) => r.castle_service_id);
  const reusedCompIds = [...compositeCountMap.entries()].filter(([, c]) => c >= 2).map(([id]) => id);
  const reusedCpdIds = [...compoundCountMap.entries()].filter(([, c]) => c >= 2).map(([id]) => id);
  const reusedAaIds = [...aaCountMap.entries()].filter(([, c]) => c >= 2).map(([id]) => id);

  const [castleUnits, castleServices, composites, compounds, atomicAssets] = await Promise.all([
    reusedCuIds.length > 0
      ? db.query(`SELECT * FROM "CastleUnit" WHERE "castle_unit_id" = ANY($1::text[])`, [reusedCuIds])
      : Promise.resolve({ rows: [] as any[] }),
    reusedCsIds.length > 0
      ? db.query(`SELECT * FROM "CastleService" WHERE "castle_service_id" = ANY($1::text[])`, [reusedCsIds])
      : Promise.resolve({ rows: [] as any[] }),
    reusedCompIds.length > 0
      ? db.query(`SELECT * FROM "Composite" WHERE "composite_id" = ANY($1::text[])`, [reusedCompIds])
      : Promise.resolve({ rows: [] as any[] }),
    reusedCpdIds.length > 0
      ? db.query(`SELECT * FROM "Compound" WHERE "compound_id" = ANY($1::text[])`, [reusedCpdIds])
      : Promise.resolve({ rows: [] as any[] }),
    reusedAaIds.length > 0
      ? db.query(`SELECT * FROM "AtomicAsset" WHERE "atomic_asset_id" = ANY($1::text[])`, [reusedAaIds])
      : Promise.resolve({ rows: [] as any[] }),
  ]);

  return {
    castle_units: castleUnits.rows.map((u: any) => ({
      id: u.castle_unit_id,
      name: u.name,
      status: u.status,
      castle_count: cuRes.rows.find((r: any) => r.castle_unit_id === u.castle_unit_id)?.count ?? 0,
    })),
    castle_services: castleServices.rows.map((s: any) => ({
      id: s.castle_service_id,
      name: s.name,
      status: s.status,
      castle_count:
        csRes.rows.find((r: any) => r.castle_service_id === s.castle_service_id)?.count ?? 0,
    })),
    composites: composites.rows.map((c: any) => ({
      id: c.composite_id,
      name: c.name,
      status: c.status,
      parent_count: compositeCountMap.get(c.composite_id) ?? 0,
    })),
    compounds: compounds.rows.map((c: any) => ({
      id: c.compound_id,
      name: c.name,
      status: c.status,
      parent_count: compoundCountMap.get(c.compound_id) ?? 0,
    })),
    atomic_assets: atomicAssets.rows.map((a: any) => ({
      id: a.atomic_asset_id,
      name: a.name,
      asset_type: a.asset_type,
      status: a.status,
      parent_count: aaCountMap.get(a.atomic_asset_id) ?? 0,
    })),
  };
}

// ─── Report 11: getDeprecatedAssets ──────────────────────────────────────────

export async function getDeprecatedAssets() {
  const [aaRes, cpdRes, compRes, csRes, cuRes, bpRes, ctRes, castleRes] = await Promise.all([
    db.query(`SELECT * FROM "AtomicAsset" WHERE "status" = 'Deprecated'`),
    db.query(`SELECT * FROM "Compound" WHERE "status" = 'Deprecated'`),
    db.query(`SELECT * FROM "Composite" WHERE "status" = 'Deprecated'`),
    db.query(`SELECT * FROM "CastleService" WHERE "status" = 'Deprecated'`),
    db.query(`SELECT * FROM "CastleUnit" WHERE "status" = 'Deprecated'`),
    db.query(`SELECT * FROM "Blueprint" WHERE "status" = 'Deprecated'`),
    db.query(`SELECT * FROM "CastleType" WHERE "status" = 'Deprecated'`),
    db.query(`SELECT * FROM "Castle" WHERE "status" = 'Deprecated'`),
  ]);

  return {
    atomic_assets: aaRes.rows.map((a: any) => ({ id: a.atomic_asset_id, name: a.name, asset_type: a.asset_type })),
    compounds: cpdRes.rows.map((c: any) => ({ id: c.compound_id, name: c.name })),
    composites: compRes.rows.map((c: any) => ({ id: c.composite_id, name: c.name })),
    castle_services: csRes.rows.map((s: any) => ({ id: s.castle_service_id, name: s.name })),
    castle_units: cuRes.rows.map((u: any) => ({ id: u.castle_unit_id, name: u.name })),
    blueprints: bpRes.rows.map((b: any) => ({ id: b.blueprint_id, name: b.name })),
    castle_types: ctRes.rows.map((ct: any) => ({ id: ct.castle_type_id, name: ct.name })),
    castles: castleRes.rows.map((c: any) => ({ id: c.castle_record_id, name: c.castle_name })),
  };
}

// ─── Report 12: findDuplicates ────────────────────────────────────────────────

const STRIP_SUFFIXES = [
  ' castle service',
  ' castle unit',
  ' castle type',
  ' atomic asset',
  ' composite',
  ' compound',
  ' blueprint',
  ' castle',
  ' service',
  ' unit',
  ' type',
];

function normalizeName(name: string): string {
  let n = name.toLowerCase().trim();
  n = n.replace(/\s+v\d+$/, '');
  for (const suffix of STRIP_SUFFIXES) {
    if (n.endsWith(suffix)) {
      n = n.slice(0, n.length - suffix.length).trim();
      break;
    }
  }
  return n;
}

interface DuplicateEntry {
  id: string;
  name: string;
  entity_type: string;
  status: string;
}

export async function findDuplicates() {
  const [aaRes, cpdRes, compRes, csRes, cuRes, bpRes, ctRes] = await Promise.all([
    db.query(`SELECT atomic_asset_id AS id, name, status FROM "AtomicAsset"`),
    db.query(`SELECT compound_id AS id, name, status FROM "Compound"`),
    db.query(`SELECT composite_id AS id, name, status FROM "Composite"`),
    db.query(`SELECT castle_service_id AS id, name, status FROM "CastleService"`),
    db.query(`SELECT castle_unit_id AS id, name, status FROM "CastleUnit"`),
    db.query(`SELECT blueprint_id AS id, name, status FROM "Blueprint"`),
    db.query(`SELECT castle_type_id AS id, name, status FROM "CastleType"`),
  ]);

  const all: DuplicateEntry[] = [
    ...aaRes.rows.map((r: any) => ({ ...r, entity_type: 'AtomicAsset' })),
    ...cpdRes.rows.map((r: any) => ({ ...r, entity_type: 'Compound' })),
    ...compRes.rows.map((r: any) => ({ ...r, entity_type: 'Composite' })),
    ...csRes.rows.map((r: any) => ({ ...r, entity_type: 'CastleService' })),
    ...cuRes.rows.map((r: any) => ({ ...r, entity_type: 'CastleUnit' })),
    ...bpRes.rows.map((r: any) => ({ ...r, entity_type: 'Blueprint' })),
    ...ctRes.rows.map((r: any) => ({ ...r, entity_type: 'CastleType' })),
  ];

  const groups = new Map<string, DuplicateEntry[]>();
  for (const entry of all) {
    const key = normalizeName(entry.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  const duplicates: { normalized_name: string; entries: DuplicateEntry[] }[] = [];
  for (const [normalized_name, entries] of groups.entries()) {
    if (entries.length >= 2) duplicates.push({ normalized_name, entries });
  }

  duplicates.sort((a, b) => a.normalized_name.localeCompare(b.normalized_name));
  return duplicates;
}

// ─── Report 13: getLocalModifications ────────────────────────────────────────

export async function getLocalModifications(castle_record_id?: string) {
  if (castle_record_id) {
    const res = await db.query(
      `SELECT * FROM "LocalModification" WHERE "castle_record_id" = $1 ORDER BY created_at ASC`,
      [castle_record_id],
    );
    return res.rows;
  }
  const res = await db.query(
    `SELECT * FROM "LocalModification" ORDER BY created_at ASC`,
  );
  return res.rows;
}

// ─── Report 14: getPromotionCandidates ────────────────────────────────────────

export async function getPromotionCandidates() {
  const res = await db.query(
    `SELECT * FROM "LocalModification"
     WHERE "promotion_recommendation" != 'RemainLocal'
     ORDER BY "promotion_recommendation"`,
  );
  return res.rows;
}

// ─── Report 15: getBuildReadiness ─────────────────────────────────────────────

interface BuildIssue {
  entity_id: string;
  entity_name: string;
  entity_type: string;
  warning: string;
}

export async function getBuildReadiness(castle_record_id: string) {
  const bom = await generateBOM(castle_record_id);
  const issues: BuildIssue[] = [];

  if (bom.warning) {
    issues.push({ entity_id: bom.castle_record_id, entity_name: bom.castle_name, entity_type: 'Castle', warning: bom.warning });
  }
  if (bom.castle_type?.warning) {
    issues.push({ entity_id: bom.castle_type.id, entity_name: bom.castle_type.name, entity_type: 'CastleType', warning: bom.castle_type.warning });
  }
  if (bom.blueprint?.warning) {
    issues.push({ entity_id: bom.blueprint.id, entity_name: bom.blueprint.name, entity_type: 'Blueprint', warning: bom.blueprint.warning });
  }

  for (const unit of bom.castle_units) {
    if (unit.warning)
      issues.push({ entity_id: unit.id, entity_name: unit.name, entity_type: 'CastleUnit', warning: unit.warning });
    for (const svc of unit.castle_services) {
      if (svc.warning)
        issues.push({ entity_id: svc.id, entity_name: svc.name, entity_type: 'CastleService', warning: svc.warning });
      for (const comp of svc.composites) {
        if (comp.warning)
          issues.push({ entity_id: comp.id, entity_name: comp.name, entity_type: 'Composite', warning: comp.warning });
        for (const cpd of comp.compounds) {
          if (cpd.warning)
            issues.push({ entity_id: cpd.id, entity_name: cpd.name, entity_type: 'Compound', warning: cpd.warning });
          for (const aa of cpd.atomic_assets) {
            if (aa.warning)
              issues.push({ entity_id: aa.id, entity_name: aa.name, entity_type: 'AtomicAsset', warning: aa.warning });
          }
        }
        for (const aa of comp.atomic_assets) {
          if (aa.warning)
            issues.push({ entity_id: aa.id, entity_name: aa.name, entity_type: 'AtomicAsset', warning: aa.warning });
        }
      }
      for (const cpd of svc.compounds) {
        if (cpd.warning)
          issues.push({ entity_id: cpd.id, entity_name: cpd.name, entity_type: 'Compound', warning: cpd.warning });
        for (const aa of cpd.atomic_assets) {
          if (aa.warning)
            issues.push({ entity_id: aa.id, entity_name: aa.name, entity_type: 'AtomicAsset', warning: aa.warning });
        }
      }
      for (const aa of svc.atomic_assets) {
        if (aa.warning)
          issues.push({ entity_id: aa.id, entity_name: aa.name, entity_type: 'AtomicAsset', warning: aa.warning });
      }
    }
  }

  return {
    castle_record_id: bom.castle_record_id,
    castle_name: bom.castle_name,
    ready: issues.length === 0,
    issue_count: issues.length,
    issues,
  };
}

// ─── Report 16: getApprovalStatus ────────────────────────────────────────────

export async function getApprovalStatus() {
  const [aaRes, cpdRes, compRes, csRes, cuRes, bpRes, ctRes, castleRes] = await Promise.all([
    db.query(`SELECT * FROM "AtomicAsset" WHERE "status" = 'InReview'`),
    db.query(`SELECT * FROM "Compound" WHERE "status" = 'InReview'`),
    db.query(`SELECT * FROM "Composite" WHERE "status" = 'InReview'`),
    db.query(`SELECT * FROM "CastleService" WHERE "status" = 'InReview'`),
    db.query(`SELECT * FROM "CastleUnit" WHERE "status" = 'InReview'`),
    db.query(`SELECT * FROM "Blueprint" WHERE "status" = 'InReview'`),
    db.query(`SELECT * FROM "CastleType" WHERE "status" = 'InReview'`),
    db.query(`SELECT * FROM "Castle" WHERE "status" = 'InReview'`),
  ]);

  return {
    atomic_assets: aaRes.rows.map((a: any) => ({ id: a.atomic_asset_id, name: a.name, asset_type: a.asset_type })),
    compounds: cpdRes.rows.map((c: any) => ({ id: c.compound_id, name: c.name })),
    composites: compRes.rows.map((c: any) => ({ id: c.composite_id, name: c.name })),
    castle_services: csRes.rows.map((s: any) => ({ id: s.castle_service_id, name: s.name })),
    castle_units: cuRes.rows.map((u: any) => ({ id: u.castle_unit_id, name: u.name })),
    blueprints: bpRes.rows.map((b: any) => ({ id: b.blueprint_id, name: b.name })),
    castle_types: ctRes.rows.map((ct: any) => ({ id: ct.castle_type_id, name: ct.name })),
    castles: castleRes.rows.map((c: any) => ({ id: c.castle_record_id, name: c.castle_name })),
    total:
      aaRes.rows.length + cpdRes.rows.length + compRes.rows.length + csRes.rows.length +
      cuRes.rows.length + bpRes.rows.length + ctRes.rows.length + castleRes.rows.length,
  };
}
