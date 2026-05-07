import db, { buildSetClause } from '../lib/db';
import { Status, UiBackendScope, isStatus, isUiBackendScope } from '../lib/enums';
import { AtomicAssetRecord } from './atomicAsset';
import { CompoundRecord } from './compound';

// ID format: COMP-WORD[-WORD...]-V###  e.g. COMP-INVENTORY-TABLE-V001
const ID_PATTERN = /^COMP-[A-Z0-9]+(-[A-Z0-9]+)*-V\d+$/i;

export interface CreateCompositeInput {
  composite_id: string;
  name: string;
  description: string;
  version: string;
  ui_backend_scope: UiBackendScope;
  status?: Status;
  usage_references?: string[];
}

export interface UpdateCompositeInput {
  name?: string;
  description?: string;
  version?: string;
  ui_backend_scope?: UiBackendScope;
  status?: Status;
  usage_references?: string[];
}

export interface CompositeFilters {
  status?: Status;
  ui_backend_scope?: UiBackendScope;
}

export interface CompositeRecord {
  composite_id: string;
  name: string;
  description: string;
  version: string;
  ui_backend_scope: string;
  status: string;
  usage_references: string[];
  created_at: Date;
  updated_at: Date;
}

export async function createComposite(data: CreateCompositeInput): Promise<CompositeRecord> {
  if (!ID_PATTERN.test(data.composite_id)) {
    throw new Error(
      `Invalid composite_id "${data.composite_id}". Expected format: COMP-WORD-V001`,
    );
  }
  if (!isUiBackendScope(data.ui_backend_scope)) {
    throw new Error(
      `Invalid ui_backend_scope "${data.ui_backend_scope}". Expected: UI | Backend | Both`,
    );
  }
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  const res = await db.query<CompositeRecord>(
    `INSERT INTO "Composite"
       ("composite_id","name","description","version","ui_backend_scope","status","usage_references","updated_at")
     VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
    [
      data.composite_id,
      data.name,
      data.description,
      data.version,
      data.ui_backend_scope,
      data.status ?? 'Draft',
      data.usage_references ?? [],
    ],
  );
  return res.rows[0];
}

export async function getCompositeById(id: string): Promise<CompositeRecord | null> {
  const res = await db.query<CompositeRecord>(
    'SELECT * FROM "Composite" WHERE "composite_id" = $1',
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listComposites(filters?: CompositeFilters): Promise<CompositeRecord[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters?.status) {
    if (!isStatus(filters.status))
      throw new Error(`Invalid status filter "${filters.status}"`);
    values.push(filters.status);
    conditions.push(`"status" = $${values.length}`);
  }
  if (filters?.ui_backend_scope) {
    if (!isUiBackendScope(filters.ui_backend_scope))
      throw new Error(`Invalid ui_backend_scope filter "${filters.ui_backend_scope}"`);
    values.push(filters.ui_backend_scope);
    conditions.push(`"ui_backend_scope" = $${values.length}`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const res = await db.query<CompositeRecord>(`SELECT * FROM "Composite" ${where}`, values);
  return res.rows;
}

export async function updateComposite(
  id: string,
  data: UpdateCompositeInput,
): Promise<CompositeRecord> {
  if (data.status !== undefined && !isStatus(data.status)) {
    throw new Error(`Invalid status "${data.status}"`);
  }
  if (data.ui_backend_scope !== undefined && !isUiBackendScope(data.ui_backend_scope)) {
    throw new Error(`Invalid ui_backend_scope "${data.ui_backend_scope}"`);
  }
  const { clause, values } = buildSetClause(data as Record<string, unknown>);
  values.push(id);
  const res = await db.query<CompositeRecord>(
    `UPDATE "Composite" SET ${clause} WHERE "composite_id" = $${values.length} RETURNING *`,
    values,
  );
  return res.rows[0];
}

export async function archiveComposite(id: string): Promise<CompositeRecord> {
  const res = await db.query<CompositeRecord>(
    `UPDATE "Composite" SET "status" = 'Archived', "updated_at" = NOW()
     WHERE "composite_id" = $1 RETURNING *`,
    [id],
  );
  return res.rows[0];
}

// --- Relationship: Composite ↔ Compound ---

export async function addCompoundToComposite(
  composite_id: string,
  compound_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO composite_compounds (composite_id, compound_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [composite_id, compound_id],
  );
}

export async function removeCompoundFromComposite(
  composite_id: string,
  compound_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM composite_compounds WHERE composite_id = $1 AND compound_id = $2',
    [composite_id, compound_id],
  );
}

export async function listCompoundsInComposite(composite_id: string): Promise<CompoundRecord[]> {
  const res = await db.query<CompoundRecord>(
    `SELECT c.* FROM "Compound" c
     JOIN composite_compounds j ON j.compound_id = c.compound_id
     WHERE j.composite_id = $1`,
    [composite_id],
  );
  return res.rows;
}

export async function listCompositesForCompound(compound_id: string): Promise<CompositeRecord[]> {
  const res = await db.query<CompositeRecord>(
    `SELECT c.* FROM "Composite" c
     JOIN composite_compounds j ON j.composite_id = c.composite_id
     WHERE j.compound_id = $1`,
    [compound_id],
  );
  return res.rows;
}

// --- Relationship: Composite ↔ Atomic Asset (direct) ---

export async function addAtomicAssetToComposite(
  composite_id: string,
  atomic_asset_id: string,
): Promise<void> {
  await db.query(
    'INSERT INTO composite_atomic_assets (composite_id, atomic_asset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [composite_id, atomic_asset_id],
  );
}

export async function removeAtomicAssetFromComposite(
  composite_id: string,
  atomic_asset_id: string,
): Promise<void> {
  await db.query(
    'DELETE FROM composite_atomic_assets WHERE composite_id = $1 AND atomic_asset_id = $2',
    [composite_id, atomic_asset_id],
  );
}

export async function listAtomicAssetsInComposite(
  composite_id: string,
): Promise<AtomicAssetRecord[]> {
  const res = await db.query<AtomicAssetRecord>(
    `SELECT aa.* FROM "AtomicAsset" aa
     JOIN composite_atomic_assets j ON j.atomic_asset_id = aa.atomic_asset_id
     WHERE j.composite_id = $1`,
    [composite_id],
  );
  return res.rows;
}

export async function listCompositesForAtomicAsset(
  atomic_asset_id: string,
): Promise<CompositeRecord[]> {
  const res = await db.query<CompositeRecord>(
    `SELECT c.* FROM "Composite" c
     JOIN composite_atomic_assets j ON j.composite_id = c.composite_id
     WHERE j.atomic_asset_id = $1`,
    [atomic_asset_id],
  );
  return res.rows;
}
