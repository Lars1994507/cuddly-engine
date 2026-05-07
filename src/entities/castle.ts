import db, { buildSetClause } from '../lib/db';
import { Status, isStatus } from '../lib/enums';
import { CastleServiceRecord } from './castleService';
import { CastleUnitRecord } from './castleUnit';

// ID format: CSTL-WORD[-WORD...]-V###  e.g. CSTL-STRUT-WAREHOUSE-INVENTORY-V001
const CASTLE_ID_PATTERN = /^CSTL-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;
// ID format: LMOD-WORD[-WORD...]-V###  e.g. LMOD-STRUT-SUPERVISOR-APPROVAL-V001
const LMOD_ID_PATTERN = /^LMOD-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

const REVIEW_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const PROMOTION_RECOMMENDATIONS = [
  'RemainLocal',
  'PromoteToCompound',
  'PromoteToComposite',
  'PromoteToService',
  'PromoteToBlueprint',
] as const;
type PromotionRecommendation = (typeof PROMOTION_RECOMMENDATIONS)[number];

function isReviewStatus(v: unknown): v is ReviewStatus {
  return REVIEW_STATUSES.includes(v as ReviewStatus);
}

function isPromotionRecommendation(v: unknown): v is PromotionRecommendation {
  return PROMOTION_RECOMMENDATIONS.includes(v as PromotionRecommendation);
}

export interface CastleRecord {
  castle_record_id: string;
  castle_name: string;
  version: string;
  status: string;
  primary_purpose: string;
  build_notes: string | null;
  review_notes: string | null;
  reuse_recommendations: string | null;
  castle_type_id: string | null;
  blueprint_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface LocalModificationRecord {
  modification_id: string;
  castle_record_id: string;
  modified_item: string;
  change_description: string;
  reason: string;
  related_asset_id: string | null;
  related_asset_type: string | null;
  review_status: string;
  promotion_recommendation: string;
  testing_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCastleInput {
  castle_record_id: string;
  castle_name: string;
  version: string;
  primary_purpose: string;
  status?: Status;
  build_notes?: string;
  review_notes?: string;
  reuse_recommendations?: string;
  castle_type_id?: string;
  blueprint_id?: string;
}

export interface UpdateCastleInput {
  castle_name?: string;
  version?: string;
  primary_purpose?: string;
  status?: Status;
  build_notes?: string;
  review_notes?: string;
  reuse_recommendations?: string;
  castle_type_id?: string;
  blueprint_id?: string;
}

export interface CastleFilters {
  status?: Status;
  castle_type_id?: string;
  blueprint_id?: string;
}

export interface CreateLocalModificationInput {
  modification_id: string;
  castle_record_id: string;
  modified_item: string;
  change_description: string;
  reason: string;
  related_asset_id?: string;
  related_asset_type?: string;
  review_status?: ReviewStatus;
  promotion_recommendation?: PromotionRecommendation;
  testing_notes?: string;
}

export interface UpdateLocalModificationInput {
  modified_item?: string;
  change_description?: string;
  reason?: string;
  related_asset_id?: string;
  related_asset_type?: string;
  review_status?: ReviewStatus;
  promotion_recommendation?: PromotionRecommendation;
  testing_notes?: string;
}

// --- Castle CRUD ---

export async function createCastle(data: CreateCastleInput): Promise<CastleRecord> {
  if (!CASTLE_ID_PATTERN.test(data.castle_record_id)) {
    throw new Error(
      `Invalid castle_record_id "${data.castle_record_id}". Expected format: CSTL-WORD-V001`,
    );
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<CastleRecord>(
    `INSERT INTO "Castle"
       ("castle_record_id","castle_name","version","primary_purpose","status",
        "build_notes","review_notes","reuse_recommendations","castle_type_id","blueprint_id","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
    [
      data.castle_record_id,
      data.castle_name,
      data.version,
      data.primary_purpose,
      data.status ?? 'Draft',
      data.build_notes ?? null,
      data.review_notes ?? null,
      data.reuse_recommendations ?? null,
      data.castle_type_id ?? null,
      data.blueprint_id ?? null,
    ],
  );
  return res.rows[0];
}

export async function getCastleById(id: string): Promise<CastleRecord | null> {
  const res = await db.query<CastleRecord>(
    'SELECT * FROM "Castle" WHERE "castle_record_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listCastles(filters?: CastleFilters): Promise<CastleRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  if (filters?.castle_type_id) {
    values.push(filters.castle_type_id);
    conditions.push(`"castle_type_id" = $${values.length}`);
  }
  if (filters?.blueprint_id) {
    values.push(filters.blueprint_id);
    conditions.push(`"blueprint_id" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<CastleRecord>(`SELECT * FROM "Castle" ${where}`, values);
  return res.rows;
}

export async function updateCastle(id: string, data: UpdateCastleInput): Promise<CastleRecord> {
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<CastleRecord>(
    `UPDATE "Castle" SET ${clause} WHERE "castle_record_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveCastle(id: string): Promise<CastleRecord> {
  const res = await db.query<CastleRecord>(
    `UPDATE "Castle" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "castle_record_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}

// --- Relationship: Castle → Castle Type ---

export async function setCastleType(
  castle_record_id: string,
  castle_type_id: string | null,
): Promise<CastleRecord> {
  const res = await db.query<CastleRecord>(
    `UPDATE "Castle" SET "castle_type_id" = $1, "updated_at" = NOW()
     WHERE "castle_record_id" = $2 RETURNING *`,
    [castle_type_id, castle_record_id],
  );
  return res.rows[0];
}

export async function listCastlesForCastleType(castle_type_id: string): Promise<CastleRecord[]> {
  const res = await db.query<CastleRecord>(
    'SELECT * FROM "Castle" WHERE "castle_type_id" = $1',
    [castle_type_id],
  );
  return res.rows;
}

// --- Relationship: Castle → Blueprint ---

export async function setBlueprint(
  castle_record_id: string,
  blueprint_id: string | null,
): Promise<CastleRecord> {
  const res = await db.query<CastleRecord>(
    `UPDATE "Castle" SET "blueprint_id" = $1, "updated_at" = NOW()
     WHERE "castle_record_id" = $2 RETURNING *`,
    [blueprint_id, castle_record_id],
  );
  return res.rows[0];
}

export async function listCastlesForBlueprint(blueprint_id: string): Promise<CastleRecord[]> {
  const res = await db.query<CastleRecord>(
    'SELECT * FROM "Castle" WHERE "blueprint_id" = $1',
    [blueprint_id],
  );
  return res.rows;
}

// --- Relationship: Castle ↔ CastleUnit ---

export async function addCastleUnitToCastle(
  castle_record_id: string,
  castle_unit_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_castle_units (castle_record_id, castle_unit_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_record_id, castle_unit_id],
  );
}

export async function removeCastleUnitFromCastle(
  castle_record_id: string,
  castle_unit_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_castle_units WHERE castle_record_id = $1 AND castle_unit_id = $2',
    [castle_record_id, castle_unit_id],
  );
}

export async function listCastleUnitsForCastle(
  castle_record_id: string,
): Promise<CastleUnitRecord[]> {
  const res = await db.query<CastleUnitRecord>(
    `SELECT u.* FROM "CastleUnit" u
     JOIN castle_castle_units j ON j.castle_unit_id = u.castle_unit_id
     WHERE j.castle_record_id = $1`,
    [castle_record_id],
  );
  return res.rows;
}

export async function listCastlesForCastleUnit(
  castle_unit_id: string,
): Promise<CastleRecord[]> {
  const res = await db.query<CastleRecord>(
    `SELECT c.* FROM "Castle" c
     JOIN castle_castle_units j ON j.castle_record_id = c.castle_record_id
     WHERE j.castle_unit_id = $1`,
    [castle_unit_id],
  );
  return res.rows;
}

// --- Relationship: Castle ↔ CastleService ---

export async function addCastleServiceToCastle(
  castle_record_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO castle_castle_services (castle_record_id, castle_service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [castle_record_id, castle_service_id],
  );
}

export async function removeCastleServiceFromCastle(
  castle_record_id: string,
  castle_service_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM castle_castle_services WHERE castle_record_id = $1 AND castle_service_id = $2',
    [castle_record_id, castle_service_id],
  );
}

export async function listCastleServicesForCastle(
  castle_record_id: string,
): Promise<CastleServiceRecord[]> {
  const res = await db.query<CastleServiceRecord>(
    `SELECT s.* FROM "CastleService" s
     JOIN castle_castle_services j ON j.castle_service_id = s.castle_service_id
     WHERE j.castle_record_id = $1`,
    [castle_record_id],
  );
  return res.rows;
}

export async function listCastlesForCastleService(
  castle_service_id: string,
): Promise<CastleRecord[]> {
  const res = await db.query<CastleRecord>(
    `SELECT c.* FROM "Castle" c
     JOIN castle_castle_services j ON j.castle_record_id = c.castle_record_id
     WHERE j.castle_service_id = $1`,
    [castle_service_id],
  );
  return res.rows;
}

// --- Local Modification CRUD ---

export async function createLocalModification(
  data: CreateLocalModificationInput,
): Promise<LocalModificationRecord> {
  if (!LMOD_ID_PATTERN.test(data.modification_id)) {
    throw new Error(
      `Invalid modification_id "${data.modification_id}". Expected format: LMOD-WORD-V001`,
    );
  }
  if (data.review_status !== undefined && !isReviewStatus(data.review_status)) {
    throw new Error(`Invalid review_status "${data.review_status}"`);
  }
  if (
    data.promotion_recommendation !== undefined &&
    !isPromotionRecommendation(data.promotion_recommendation)
  ) {
    throw new Error(`Invalid promotion_recommendation "${data.promotion_recommendation}"`);
  }
  const res = await db.query<LocalModificationRecord>(
    `INSERT INTO "LocalModification"
       ("modification_id","castle_record_id","modified_item","change_description","reason",
        "related_asset_id","related_asset_type","review_status","promotion_recommendation",
        "testing_notes","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
    [
      data.modification_id,
      data.castle_record_id,
      data.modified_item,
      data.change_description,
      data.reason,
      data.related_asset_id ?? null,
      data.related_asset_type ?? null,
      data.review_status ?? 'Pending',
      data.promotion_recommendation ?? 'RemainLocal',
      data.testing_notes ?? null,
    ],
  );
  return res.rows[0];
}

export async function getLocalModificationById(
  id: string,
): Promise<LocalModificationRecord | null> {
  const res = await db.query<LocalModificationRecord>(
    'SELECT * FROM "LocalModification" WHERE "modification_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listLocalModificationsForCastle(
  castle_record_id: string,
): Promise<LocalModificationRecord[]> {
  const res = await db.query<LocalModificationRecord>(
    'SELECT * FROM "LocalModification" WHERE "castle_record_id" = $1',
    [castle_record_id],
  );
  return res.rows;
}

export async function updateLocalModification(
  id: string,
  data: UpdateLocalModificationInput,
): Promise<LocalModificationRecord> {
  if (data.review_status !== undefined && !isReviewStatus(data.review_status)) {
    throw new Error(`Invalid review_status "${data.review_status}"`);
  }
  if (
    data.promotion_recommendation !== undefined &&
    !isPromotionRecommendation(data.promotion_recommendation)
  ) {
    throw new Error(`Invalid promotion_recommendation "${data.promotion_recommendation}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<LocalModificationRecord>(
    `UPDATE "LocalModification" SET ${clause} WHERE "modification_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function deleteLocalModification(id: string): Promise<LocalModificationRecord> {
  const res = await db.query<LocalModificationRecord>(
    'DELETE FROM "LocalModification" WHERE "modification_id" = $1 RETURNING *',
    [id],
  );
  return res.rows[0];
}
