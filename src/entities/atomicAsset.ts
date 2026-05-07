import db, { buildSetClause } from '../lib/db';
import { AssetType, Status, isAssetType, isStatus } from '../lib/enums';

// ID format: AA-WORD[-WORD...]-V###  e.g. AA-FORMAT-QUANTITY-V001
const ID_PATTERN = /^AA-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

export interface CreateAtomicAssetInput {
  atomic_asset_id: string;
  name: string;
  asset_type: AssetType;
  description: string;
  code_location: string;
  version: string;
  status?: Status;
  dependencies?: string[];
  validation_notes?: string;
  approved_pattern_notes?: string;
}

export interface UpdateAtomicAssetInput {
  name?: string;
  asset_type?: AssetType;
  description?: string;
  code_location?: string;
  version?: string;
  status?: Status;
  dependencies?: string[];
  validation_notes?: string;
  approved_pattern_notes?: string;
}

export interface AtomicAssetFilters {
  asset_type?: AssetType;
  status?: Status;
}

export interface AtomicAssetRecord {
  atomic_asset_id: string;
  name: string;
  asset_type: string;
  description: string;
  code_location: string;
  version: string;
  status: string;
  dependencies: string[];
  validation_notes: string | null;
  approved_pattern_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createAtomicAsset(
  data: CreateAtomicAssetInput,
): Promise<AtomicAssetRecord> {
  if (!ID_PATTERN.test(data.atomic_asset_id)) {
    throw new Error(
      `Invalid atomic_asset_id "${data.atomic_asset_id}". Expected format: AA-WORD-V001`,
    );
  }
  if (!isAssetType(data.asset_type)) {
    throw new Error(`Invalid asset_type "${data.asset_type}"`);
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<AtomicAssetRecord>(
    `INSERT INTO "AtomicAsset"
       ("atomic_asset_id","name","asset_type","description","code_location","version",
        "status","dependencies","validation_notes","approved_pattern_notes","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
     RETURNING *`,
    [
      data.atomic_asset_id,
      data.name,
      data.asset_type,
      data.description,
      data.code_location,
      data.version,
      data.status ?? 'Draft',
      data.dependencies ?? [],
      data.validation_notes ?? null,
      data.approved_pattern_notes ?? null,
    ],
  );
  return res.rows[0];
}

export async function getAtomicAssetById(id: string): Promise<AtomicAssetRecord | null> {
  const res = await db.query<AtomicAssetRecord>(
    'SELECT * FROM "AtomicAsset" WHERE "atomic_asset_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listAtomicAssets(
  filters?: AtomicAssetFilters,
): Promise<AtomicAssetRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.asset_type) {
    if (!isAssetType(filters.asset_type))
      throw new Error(`Invalid asset_type filter "${filters.asset_type}"`);
    values.push(filters.asset_type);
    conditions.push(`"asset_type" = $${values.length}`);
  }
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<AtomicAssetRecord>(
    `SELECT * FROM "AtomicAsset" ${where}`,
    values,
  );
  return res.rows;
}

export async function updateAtomicAsset(
  id: string,
  data: UpdateAtomicAssetInput,
): Promise<AtomicAssetRecord> {
  if (data.asset_type !== undefined && !isAssetType(data.asset_type)) {
    throw new Error(`Invalid asset_type "${data.asset_type}"`);
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<AtomicAssetRecord>(
    `UPDATE "AtomicAsset" SET ${clause} WHERE "atomic_asset_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveAtomicAsset(id: string): Promise<AtomicAssetRecord> {
  const res = await db.query<AtomicAssetRecord>(
    `UPDATE "AtomicAsset" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "atomic_asset_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}
