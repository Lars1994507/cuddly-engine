import db, { buildSetClause } from '../lib/db';
import { Status, isStatus } from '../lib/enums';
import { AtomicAssetRecord } from './atomicAsset';

// ID format: CMPD-WORD[-WORD...]-V###  e.g. CMPD-QUANTITY-VALIDATION-V001
const ID_PATTERN = /^CMPD-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

export interface CreateCompoundInput {
  compound_id: string;
  name: string;
  description: string;
  version: string;
  status?: Status;
  testing_notes?: string;
}

export interface UpdateCompoundInput {
  name?: string;
  description?: string;
  version?: string;
  status?: Status;
  testing_notes?: string;
}

export interface CompoundFilters {
  status?: Status;
}

export interface CompoundRecord {
  compound_id: string;
  name: string;
  description: string;
  version: string;
  status: string;
  testing_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function createCompound(data: CreateCompoundInput): Promise<CompoundRecord> {
  if (!ID_PATTERN.test(data.compound_id)) {
    throw new Error(
      `Invalid compound_id "${data.compound_id}". Expected format: CMPD-WORD-V001`,
    );
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<CompoundRecord>(
    `INSERT INTO "Compound" ("compound_id","name","description","version","status","testing_notes","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING *`,
    [
      data.compound_id,
      data.name,
      data.description,
      data.version,
      data.status ?? 'Draft',
      data.testing_notes ?? null,
    ],
  );
  return res.rows[0];
}

export async function getCompoundById(id: string): Promise<CompoundRecord | null> {
  const res = await db.query<CompoundRecord>(
    'SELECT * FROM "Compound" WHERE "compound_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listCompounds(filters?: CompoundFilters): Promise<CompoundRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<CompoundRecord>(`SELECT * FROM "Compound" ${where}`, values);
  return res.rows;
}

export async function updateCompound(
  id: string,
  data: UpdateCompoundInput,
): Promise<CompoundRecord> {
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<CompoundRecord>(
    `UPDATE "Compound" SET ${clause} WHERE "compound_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveCompound(id: string): Promise<CompoundRecord> {
  const res = await db.query<CompoundRecord>(
    `UPDATE "Compound" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "compound_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}

// --- Relationship: Compound ↔ Atomic Asset ---

export async function addAtomicAssetToCompound(
  compound_id: string,
  atomic_asset_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO compound_atomic_assets (compound_id, atomic_asset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [compound_id, atomic_asset_id],
  );
}

export async function removeAtomicAssetFromCompound(
  compound_id: string,
  atomic_asset_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM compound_atomic_assets WHERE compound_id = $1 AND atomic_asset_id = $2',
    [compound_id, atomic_asset_id],
  );
}

export async function listAtomicAssetsInCompound(compound_id: string): Promise<AtomicAssetRecord[]> {
  const res = await db.query<AtomicAssetRecord>(
    `SELECT aa.* FROM "AtomicAsset" aa
     JOIN compound_atomic_assets j ON j.atomic_asset_id = aa.atomic_asset_id
     WHERE j.compound_id = $1`,
    [compound_id],
  );
  return res.rows;
}

export async function listCompoundsForAtomicAsset(atomic_asset_id: string): Promise<CompoundRecord[]> {
  const res = await db.query<CompoundRecord>(
    `SELECT c.* FROM "Compound" c
     JOIN compound_atomic_assets j ON j.compound_id = c.compound_id
     WHERE j.atomic_asset_id = $1`,
    [atomic_asset_id],
  );
  return res.rows;
}
