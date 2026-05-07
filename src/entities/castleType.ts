import db, { buildSetClause } from '../lib/db';
import { Status, isStatus } from '../lib/enums';
import { BlueprintRecord } from './blueprint';
import { CastleServiceRecord } from './castleService';
import { CastleUnitRecord } from './castleUnit';

// ID format: CT-WORD[-WORD...]-V###  e.g. CT-INTERNAL-INVENTORY-V001
const ID_PATTERN = /^CT-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

export interface CastleTypeRecord {
  castle_type_id: string;
  name: string;
  description: string;
  common_purpose: string;
  typical_use_cases: string[];
  recommended_asset_filters: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCastleTypeInput {
  castle_type_id: string;
  name: string;
  description: string;
  common_purpose: string;
  typical_use_cases?: string[];
  recommended_asset_filters?: string;
  status?: Status;
}

export interface UpdateCastleTypeInput {
  name?: string;
  description?: string;
  common_purpose?: string;
  typical_use_cases?: string[];
  recommended_asset_filters?: string;
  status?: Status;
}

export interface CastleTypeFilters {
  status?: Status;
}

export async function createCastleType(data: CreateCastleTypeInput): Promise<CastleTypeRecord> {
  if (!ID_PATTERN.test(data.castle_type_id)) {
    throw new Error(
      `Invalid castle_type_id "${data.castle_type_id}". Expected format: CT-WORD-V001`,
    );
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<CastleTypeRecord>(
    `INSERT INTO "CastleType"
       ("castle_type_id","name","description","common_purpose","typical_use_cases",
        "recommended_asset_filters","status","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
    [
      data.castle_type_id,
      data.name,
      data.description,
      data.common_purpose,
      data.typical_use_cases ?? [],
      data.recommended_asset_filters ?? null,
      data.status ?? 'Draft',
    ],
  );
  return res.rows[0];
}

export async function getCastleTypeById(id: string): Promise<CastleTypeRecord | null> {
  const res = await db.query<CastleTypeRecord>(
    'SELECT * FROM "CastleType" WHERE "castle_type_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listCastleTypes(
  filters?: CastleTypeFilters,
): Promise<CastleTypeRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<CastleTypeRecord>(`SELECT * FROM "CastleType" ${where}`, values);
  return res.rows;
}

export async function updateCastleType(
  id: string,
  data: UpdateCastleTypeInput,
): Promise<CastleTypeRecord> {
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<CastleTypeRecord>(
    `UPDATE "CastleType" SET ${clause} WHERE "castle_type_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveCastleType(id: string): Promise<CastleTypeRecord> {
  const res = await db.query<CastleTypeRecord>(
    `UPDATE "CastleType" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "castle_type_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}

// --- Relationship: CastleType ↔ Blueprint ---

export async function addBlueprintToCastleType(
  castle_type_id: string,
  blueprint_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_type_blueprints (castle_type_id, blueprint_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_type_id, blueprint_id],
  );
}

export async function removeBlueprintFromCastleType(
  castle_type_id: string,
  blueprint_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_type_blueprints WHERE castle_type_id = $1 AND blueprint_id = $2',
    [castle_type_id, blueprint_id],
  );
}

export async function listBlueprintsForCastleType(
  castle_type_id: string,
): Promise<BlueprintRecord[]> {
  const res = await db.query<BlueprintRecord>(
    `SELECT b.* FROM "Blueprint" b
     JOIN castle_type_blueprints j ON j.blueprint_id = b.blueprint_id
     WHERE j.castle_type_id = $1`,
    [castle_type_id],
  );
  return res.rows;
}

export async function listCastleTypesForBlueprint(
  blueprint_id: string,
): Promise<CastleTypeRecord[]> {
  const res = await db.query<CastleTypeRecord>(
    `SELECT ct.* FROM "CastleType" ct
     JOIN castle_type_blueprints j ON j.castle_type_id = ct.castle_type_id
     WHERE j.blueprint_id = $1`,
    [blueprint_id],
  );
  return res.rows;
}

// --- Relationship: CastleType ↔ CastleUnit ---

export async function addCastleUnitToCastleType(
  castle_type_id: string,
  castle_unit_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_type_castle_units (castle_type_id, castle_unit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_type_id, castle_unit_id],
  );
}

export async function removeCastleUnitFromCastleType(
  castle_type_id: string,
  castle_unit_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_type_castle_units WHERE castle_type_id = $1 AND castle_unit_id = $2',
    [castle_type_id, castle_unit_id],
  );
}

export async function listCastleUnitsForCastleType(
  castle_type_id: string,
): Promise<CastleUnitRecord[]> {
  const res = await db.query<CastleUnitRecord>(
    `SELECT u.* FROM "CastleUnit" u
     JOIN castle_type_castle_units j ON j.castle_unit_id = u.castle_unit_id
     WHERE j.castle_type_id = $1`,
    [castle_type_id],
  );
  return res.rows;
}

export async function listCastleTypesForCastleUnit(
  castle_unit_id: string,
): Promise<CastleTypeRecord[]> {
  const res = await db.query<CastleTypeRecord>(
    `SELECT ct.* FROM "CastleType" ct
     JOIN castle_type_castle_units j ON j.castle_type_id = ct.castle_type_id
     WHERE j.castle_unit_id = $1`,
    [castle_unit_id],
  );
  return res.rows;
}

// --- Relationship: CastleType ↔ CastleService ---

export async function addCastleServiceToCastleType(
  castle_type_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_type_castle_services (castle_type_id, castle_service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_type_id, castle_service_id],
  );
}

export async function removeCastleServiceFromCastleType(
  castle_type_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_type_castle_services WHERE castle_type_id = $1 AND castle_service_id = $2',
    [castle_type_id, castle_service_id],
  );
}

export async function listCastleServicesForCastleType(
  castle_type_id: string,
): Promise<CastleServiceRecord[]> {
  const res = await db.query<CastleServiceRecord>(
    `SELECT s.* FROM "CastleService" s
     JOIN castle_type_castle_services j ON j.castle_service_id = s.castle_service_id
     WHERE j.castle_type_id = $1`,
    [castle_type_id],
  );
  return res.rows;
}

export async function listCastleTypesForCastleService(
  castle_service_id: string,
): Promise<CastleTypeRecord[]> {
  const res = await db.query<CastleTypeRecord>(
    `SELECT ct.* FROM "CastleType" ct
     JOIN castle_type_castle_services j ON j.castle_type_id = ct.castle_type_id
     WHERE j.castle_service_id = $1`,
    [castle_service_id],
  );
  return res.rows;
}
