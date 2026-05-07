import db, { buildSetClause } from '../lib/db';
import { Status, isStatus } from '../lib/enums';
import { CastleServiceRecord } from './castleService';
import { CompositeRecord } from './composite';

// ID format: CU-WORD[-WORD...]-V###  e.g. CU-WAREHOUSING-INVENTORY-V001
const ID_PATTERN = /^CU-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

export interface CastleUnitRecord {
  castle_unit_id: string;
  name: string;
  description: string;
  permission_scope: string;
  domain_notes: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCastleUnitInput {
  castle_unit_id: string;
  name: string;
  description: string;
  permission_scope: string;
  domain_notes?: string;
  status?: Status;
}

export interface UpdateCastleUnitInput {
  name?: string;
  description?: string;
  permission_scope?: string;
  domain_notes?: string;
  status?: Status;
}

export interface CastleUnitFilters {
  status?: Status;
}

export async function createCastleUnit(data: CreateCastleUnitInput): Promise<CastleUnitRecord> {
  if (!ID_PATTERN.test(data.castle_unit_id)) {
    throw new Error(
      `Invalid castle_unit_id "${data.castle_unit_id}". Expected format: CU-WORD-V001`,
    );
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<CastleUnitRecord>(
    `INSERT INTO "CastleUnit"
       ("castle_unit_id","name","description","permission_scope","domain_notes","status","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
    [
      data.castle_unit_id,
      data.name,
      data.description,
      data.permission_scope,
      data.domain_notes ?? null,
      data.status ?? 'Draft',
    ],
  );
  return res.rows[0];
}

export async function getCastleUnitById(id: string): Promise<CastleUnitRecord | null> {
  const res = await db.query<CastleUnitRecord>(
    'SELECT * FROM "CastleUnit" WHERE "castle_unit_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listCastleUnits(filters?: CastleUnitFilters): Promise<CastleUnitRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<CastleUnitRecord>(`SELECT * FROM "CastleUnit" ${where}`, values);
  return res.rows;
}

export async function updateCastleUnit(
  id: string,
  data: UpdateCastleUnitInput,
): Promise<CastleUnitRecord> {
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<CastleUnitRecord>(
    `UPDATE "CastleUnit" SET ${clause} WHERE "castle_unit_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveCastleUnit(id: string): Promise<CastleUnitRecord> {
  const res = await db.query<CastleUnitRecord>(
    `UPDATE "CastleUnit" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "castle_unit_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}

// --- Relationship: CastleUnit ↔ CastleService ---

export async function addServiceToUnit(
  castle_unit_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_unit_services (castle_unit_id, castle_service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_unit_id, castle_service_id],
  );
}

export async function removeServiceFromUnit(
  castle_unit_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_unit_services WHERE castle_unit_id = $1 AND castle_service_id = $2',
    [castle_unit_id, castle_service_id],
  );
}

export async function listServicesInUnit(
  castle_unit_id: string,
): Promise<CastleServiceRecord[]> {
  const res = await db.query<CastleServiceRecord>(
    `SELECT s.* FROM "CastleService" s
     JOIN castle_unit_services j ON j.castle_service_id = s.castle_service_id
     WHERE j.castle_unit_id = $1`,
    [castle_unit_id],
  );
  return res.rows;
}

export async function listUnitsForService(castle_service_id: string): Promise<CastleUnitRecord[]> {
  const res = await db.query<CastleUnitRecord>(
    `SELECT u.* FROM "CastleUnit" u
     JOIN castle_unit_services j ON j.castle_unit_id = u.castle_unit_id
     WHERE j.castle_service_id = $1`,
    [castle_service_id],
  );
  return res.rows;
}

// --- Relationship: CastleUnit ↔ Composite ---

export async function addCompositeToUnit(
  castle_unit_id: string,
  composite_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_unit_composites (castle_unit_id, composite_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_unit_id, composite_id],
  );
}

export async function removeCompositeFromUnit(
  castle_unit_id: string,
  composite_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_unit_composites WHERE castle_unit_id = $1 AND composite_id = $2',
    [castle_unit_id, composite_id],
  );
}

export async function listCompositesInUnit(castle_unit_id: string): Promise<CompositeRecord[]> {
  const res = await db.query<CompositeRecord>(
    `SELECT c.* FROM "Composite" c
     JOIN castle_unit_composites j ON j.composite_id = c.composite_id
     WHERE j.castle_unit_id = $1`,
    [castle_unit_id],
  );
  return res.rows;
}

export async function listUnitsForComposite(composite_id: string): Promise<CastleUnitRecord[]> {
  const res = await db.query<CastleUnitRecord>(
    `SELECT u.* FROM "CastleUnit" u
     JOIN castle_unit_composites j ON j.castle_unit_id = u.castle_unit_id
     WHERE j.composite_id = $1`,
    [composite_id],
  );
  return res.rows;
}
