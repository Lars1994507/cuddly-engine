import db, { buildSetClause } from '../lib/db';
import { Status, isStatus } from '../lib/enums';
import { AtomicAssetRecord } from './atomicAsset';
import { CompoundRecord } from './compound';
import { CompositeRecord } from './composite';

// ID format: CS-WORD[-WORD...]-V###  e.g. CS-STOCK-ADJUSTMENT-V001
const ID_PATTERN = /^CS-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

export interface CastleServiceRecord {
  castle_service_id: string;
  name: string;
  capability: string;
  backend_modules: string[];
  api_contracts: string | null;
  database_interactions: string | null;
  frontend_visibility: string | null;
  admin_controls: string | null;
  observability: string | null;
  logging: string | null;
  health_checks: string | null;
  permission_rules: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCastleServiceInput {
  castle_service_id: string;
  name: string;
  capability: string;
  backend_modules?: string[];
  api_contracts?: string;
  database_interactions?: string;
  frontend_visibility?: string;
  admin_controls?: string;
  observability?: string;
  logging?: string;
  health_checks?: string;
  permission_rules?: string;
  status?: Status;
}

export interface UpdateCastleServiceInput {
  name?: string;
  capability?: string;
  backend_modules?: string[];
  api_contracts?: string;
  database_interactions?: string;
  frontend_visibility?: string;
  admin_controls?: string;
  observability?: string;
  logging?: string;
  health_checks?: string;
  permission_rules?: string;
  status?: Status;
}

export interface CastleServiceFilters {
  status?: Status;
}

export async function createCastleService(
  data: CreateCastleServiceInput,
): Promise<CastleServiceRecord> {
  if (!ID_PATTERN.test(data.castle_service_id)) {
    throw new Error(
      `Invalid castle_service_id "${data.castle_service_id}". Expected format: CS-WORD-V001`,
    );
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<CastleServiceRecord>(
    `INSERT INTO "CastleService"
       ("castle_service_id","name","capability","backend_modules","api_contracts",
        "database_interactions","frontend_visibility","admin_controls","observability",
        "logging","health_checks","permission_rules","status","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()) RETURNING *`,
    [
      data.castle_service_id,
      data.name,
      data.capability,
      data.backend_modules ?? [],
      data.api_contracts ?? null,
      data.database_interactions ?? null,
      data.frontend_visibility ?? null,
      data.admin_controls ?? null,
      data.observability ?? null,
      data.logging ?? null,
      data.health_checks ?? null,
      data.permission_rules ?? null,
      data.status ?? 'Draft',
    ],
  );
  return res.rows[0];
}

export async function getCastleServiceById(id: string): Promise<CastleServiceRecord | null> {
  const res = await db.query<CastleServiceRecord>(
    'SELECT * FROM "CastleService" WHERE "castle_service_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listCastleServices(
  filters?: CastleServiceFilters,
): Promise<CastleServiceRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<CastleServiceRecord>(
    `SELECT * FROM "CastleService" ${where}`,
    values,
  );
  return res.rows;
}

export async function updateCastleService(
  id: string,
  data: UpdateCastleServiceInput,
): Promise<CastleServiceRecord> {
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<CastleServiceRecord>(
    `UPDATE "CastleService" SET ${clause} WHERE "castle_service_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveCastleService(id: string): Promise<CastleServiceRecord> {
  const res = await db.query<CastleServiceRecord>(
    `UPDATE "CastleService" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "castle_service_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}

// --- Relationship: CastleService ↔ Composite ---

export async function addCompositeToService(
  castle_service_id: string,
  composite_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_service_composites (castle_service_id, composite_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_service_id, composite_id],
  );
}

export async function removeCompositeFromService(
  castle_service_id: string,
  composite_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_service_composites WHERE castle_service_id = $1 AND composite_id = $2',
    [castle_service_id, composite_id],
  );
}

export async function listCompositesInService(
  castle_service_id: string,
): Promise<CompositeRecord[]> {
  const res = await db.query<CompositeRecord>(
    `SELECT c.* FROM "Composite" c
     JOIN castle_service_composites j ON j.composite_id = c.composite_id
     WHERE j.castle_service_id = $1`,
    [castle_service_id],
  );
  return res.rows;
}

export async function listServicesForComposite(
  composite_id: string,
): Promise<CastleServiceRecord[]> {
  const res = await db.query<CastleServiceRecord>(
    `SELECT s.* FROM "CastleService" s
     JOIN castle_service_composites j ON j.castle_service_id = s.castle_service_id
     WHERE j.composite_id = $1`,
    [composite_id],
  );
  return res.rows;
}

// --- Relationship: CastleService ↔ Compound (direct) ---

export async function addCompoundToService(
  castle_service_id: string,
  compound_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_service_compounds (castle_service_id, compound_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_service_id, compound_id],
  );
}

export async function removeCompoundFromService(
  castle_service_id: string,
  compound_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_service_compounds WHERE castle_service_id = $1 AND compound_id = $2',
    [castle_service_id, compound_id],
  );
}

export async function listCompoundsInService(
  castle_service_id: string,
): Promise<CompoundRecord[]> {
  const res = await db.query<CompoundRecord>(
    `SELECT c.* FROM "Compound" c
     JOIN castle_service_compounds j ON j.compound_id = c.compound_id
     WHERE j.castle_service_id = $1`,
    [castle_service_id],
  );
  return res.rows;
}

export async function listServicesForCompound(
  compound_id: string,
): Promise<CastleServiceRecord[]> {
  const res = await db.query<CastleServiceRecord>(
    `SELECT s.* FROM "CastleService" s
     JOIN castle_service_compounds j ON j.castle_service_id = s.castle_service_id
     WHERE j.compound_id = $1`,
    [compound_id],
  );
  return res.rows;
}

// --- Relationship: CastleService ↔ Atomic Asset (direct) ---

export async function addAtomicAssetToService(
  castle_service_id: string,
  atomic_asset_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_service_atomic_assets (castle_service_id, atomic_asset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_service_id, atomic_asset_id],
  );
}

export async function removeAtomicAssetFromService(
  castle_service_id: string,
  atomic_asset_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_service_atomic_assets WHERE castle_service_id = $1 AND atomic_asset_id = $2',
    [castle_service_id, atomic_asset_id],
  );
}

export async function listAtomicAssetsInService(
  castle_service_id: string,
): Promise<AtomicAssetRecord[]> {
  const res = await db.query<AtomicAssetRecord>(
    `SELECT aa.* FROM "AtomicAsset" aa
     JOIN castle_service_atomic_assets j ON j.atomic_asset_id = aa.atomic_asset_id
     WHERE j.castle_service_id = $1`,
    [castle_service_id],
  );
  return res.rows;
}

export async function listServicesForAtomicAsset(
  atomic_asset_id: string,
): Promise<CastleServiceRecord[]> {
  const res = await db.query<CastleServiceRecord>(
    `SELECT s.* FROM "CastleService" s
     JOIN castle_service_atomic_assets j ON j.castle_service_id = s.castle_service_id
     WHERE j.atomic_asset_id = $1`,
    [atomic_asset_id],
  );
  return res.rows;
}
