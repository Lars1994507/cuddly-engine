import db, { buildSetClause } from '../lib/db';
import { Status, isStatus } from '../lib/enums';
import { CastleServiceRecord } from './castleService';
import { CastleUnitRecord } from './castleUnit';
import { CompositeRecord } from './composite';

// ID format: BP-WORD[-WORD...]-V###  e.g. BP-INVENTORY-INTERNAL-TENANT-V001
const ID_PATTERN = /^BP-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

export interface BlueprintRecord {
  blueprint_id: string;
  name: string;
  category: string;
  version: string;
  status: string;
  purpose: string;
  frontend_structure: string | null;
  backend_structure: string | null;
  auth_assumptions: string | null;
  user_model_assumptions: string | null;
  navigation_assumptions: string | null;
  default_pages: string[];
  default_components: string[];
  context_inventory_filters: string | null;
  initialization_rules: string | null;
  placeholder_rules: string | null;
  required_review_steps: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateBlueprintInput {
  blueprint_id: string;
  name: string;
  category: string;
  version: string;
  purpose: string;
  status?: Status;
  frontend_structure?: string;
  backend_structure?: string;
  auth_assumptions?: string;
  user_model_assumptions?: string;
  navigation_assumptions?: string;
  default_pages?: string[];
  default_components?: string[];
  context_inventory_filters?: string;
  initialization_rules?: string;
  placeholder_rules?: string;
  required_review_steps?: string[];
}

export interface UpdateBlueprintInput {
  name?: string;
  category?: string;
  version?: string;
  purpose?: string;
  status?: Status;
  frontend_structure?: string;
  backend_structure?: string;
  auth_assumptions?: string;
  user_model_assumptions?: string;
  navigation_assumptions?: string;
  default_pages?: string[];
  default_components?: string[];
  context_inventory_filters?: string;
  initialization_rules?: string;
  placeholder_rules?: string;
  required_review_steps?: string[];
}

export interface BlueprintFilters {
  category?: string;
  status?: Status;
}

export async function createBlueprint(data: CreateBlueprintInput): Promise<BlueprintRecord> {
  if (!ID_PATTERN.test(data.blueprint_id)) {
    throw new Error(
      `Invalid blueprint_id "${data.blueprint_id}". Expected format: BP-WORD-V001`,
    );
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<BlueprintRecord>(
    `INSERT INTO "Blueprint"
       ("blueprint_id","name","category","version","purpose","status",
        "frontend_structure","backend_structure","auth_assumptions","user_model_assumptions",
        "navigation_assumptions","default_pages","default_components",
        "context_inventory_filters","initialization_rules","placeholder_rules",
        "required_review_steps","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW()) RETURNING *`,
    [
      data.blueprint_id,
      data.name,
      data.category,
      data.version,
      data.purpose,
      data.status ?? 'Draft',
      data.frontend_structure ?? null,
      data.backend_structure ?? null,
      data.auth_assumptions ?? null,
      data.user_model_assumptions ?? null,
      data.navigation_assumptions ?? null,
      data.default_pages ?? [],
      data.default_components ?? [],
      data.context_inventory_filters ?? null,
      data.initialization_rules ?? null,
      data.placeholder_rules ?? null,
      data.required_review_steps ?? [],
    ],
  );
  return res.rows[0];
}

export async function getBlueprintById(id: string): Promise<BlueprintRecord | null> {
  const res = await db.query<BlueprintRecord>(
    'SELECT * FROM "Blueprint" WHERE "blueprint_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listBlueprints(filters?: BlueprintFilters): Promise<BlueprintRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  if (filters?.category) {
    values.push(filters.category);
    conditions.push(`"category" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<BlueprintRecord>(`SELECT * FROM "Blueprint" ${where}`, values);
  return res.rows;
}

export async function updateBlueprint(
  id: string,
  data: UpdateBlueprintInput,
): Promise<BlueprintRecord> {
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<BlueprintRecord>(
    `UPDATE "Blueprint" SET ${clause} WHERE "blueprint_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveBlueprint(id: string): Promise<BlueprintRecord> {
  const res = await db.query<BlueprintRecord>(
    `UPDATE "Blueprint" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "blueprint_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}

// --- Relationship: Blueprint ↔ CastleUnit ---

export async function addCastleUnitToBlueprint(
  blueprint_id: string,
  castle_unit_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO blueprint_castle_units (blueprint_id, castle_unit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [blueprint_id, castle_unit_id],
  );
}

export async function removeCastleUnitFromBlueprint(
  blueprint_id: string,
  castle_unit_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM blueprint_castle_units WHERE blueprint_id = $1 AND castle_unit_id = $2',
    [blueprint_id, castle_unit_id],
  );
}

export async function listCastleUnitsInBlueprint(
  blueprint_id: string,
): Promise<CastleUnitRecord[]> {
  const res = await db.query<CastleUnitRecord>(
    `SELECT u.* FROM "CastleUnit" u
     JOIN blueprint_castle_units j ON j.castle_unit_id = u.castle_unit_id
     WHERE j.blueprint_id = $1`,
    [blueprint_id],
  );
  return res.rows;
}

export async function listBlueprintsForCastleUnit(
  castle_unit_id: string,
): Promise<BlueprintRecord[]> {
  const res = await db.query<BlueprintRecord>(
    `SELECT b.* FROM "Blueprint" b
     JOIN blueprint_castle_units j ON j.blueprint_id = b.blueprint_id
     WHERE j.castle_unit_id = $1`,
    [castle_unit_id],
  );
  return res.rows;
}

// --- Relationship: Blueprint ↔ CastleService ---

export async function addCastleServiceToBlueprint(
  blueprint_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO blueprint_castle_services (blueprint_id, castle_service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [blueprint_id, castle_service_id],
  );
}

export async function removeCastleServiceFromBlueprint(
  blueprint_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM blueprint_castle_services WHERE blueprint_id = $1 AND castle_service_id = $2',
    [blueprint_id, castle_service_id],
  );
}

export async function listCastleServicesInBlueprint(
  blueprint_id: string,
): Promise<CastleServiceRecord[]> {
  const res = await db.query<CastleServiceRecord>(
    `SELECT s.* FROM "CastleService" s
     JOIN blueprint_castle_services j ON j.castle_service_id = s.castle_service_id
     WHERE j.blueprint_id = $1`,
    [blueprint_id],
  );
  return res.rows;
}

export async function listBlueprintsForCastleService(
  castle_service_id: string,
): Promise<BlueprintRecord[]> {
  const res = await db.query<BlueprintRecord>(
    `SELECT b.* FROM "Blueprint" b
     JOIN blueprint_castle_services j ON j.blueprint_id = b.blueprint_id
     WHERE j.castle_service_id = $1`,
    [castle_service_id],
  );
  return res.rows;
}

// --- Relationship: Blueprint ↔ Composite ---

export async function addCompositeToBlueprint(
  blueprint_id: string,
  composite_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO blueprint_composites (blueprint_id, composite_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [blueprint_id, composite_id],
  );
}

export async function removeCompositeFromBlueprint(
  blueprint_id: string,
  composite_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM blueprint_composites WHERE blueprint_id = $1 AND composite_id = $2',
    [blueprint_id, composite_id],
  );
}

export async function listCompositesInBlueprint(
  blueprint_id: string,
): Promise<CompositeRecord[]> {
  const res = await db.query<CompositeRecord>(
    `SELECT c.* FROM "Composite" c
     JOIN blueprint_composites j ON j.composite_id = c.composite_id
     WHERE j.blueprint_id = $1`,
    [blueprint_id],
  );
  return res.rows;
}

export async function listBlueprintsForComposite(
  composite_id: string,
): Promise<BlueprintRecord[]> {
  const res = await db.query<BlueprintRecord>(
    `SELECT b.* FROM "Blueprint" b
     JOIN blueprint_composites j ON j.blueprint_id = b.blueprint_id
     WHERE j.composite_id = $1`,
    [composite_id],
  );
  return res.rows;
}
