/**
 * Tests for multi-param filter combinations on list endpoints.
 *
 * The existing http.test.ts verifies single-filter params in isolation
 * using a hand-rolled fixture. These tests use the full Strut Company
 * seed and exercise the AND-intersection behaviour when two (or three)
 * query params are supplied simultaneously.
 *
 * Endpoints covered:
 *   GET /atomic-assets  — asset_type + status
 *   GET /composites     — ui_backend_scope + status
 *   GET /castles        — castle_type_id + status, blueprint_id + castle_type_id
 */
import express from 'express';
import request from 'supertest';
import { seed, clearAll } from '../src/seed/seed';
import atomicAssetRouter from '../src/entities/atomicAssetRouter';
import compositeRouter from '../src/entities/compositeRouter';
import castleRouter from '../src/entities/castleRouter';

const app = express();
app.use(express.json());
app.use('/atomic-assets', atomicAssetRouter);
app.use('/composites', compositeRouter);
app.use('/castles', castleRouter);

beforeAll(async () => {
  await seed();
}, 60_000);

afterAll(async () => {
  await clearAll();
});

// ─── /atomic-assets — asset_type + status ────────────────────────────────────

describe('GET /atomic-assets — combined asset_type + status', () => {
  it('returns the single Validator that is Active', async () => {
    const res = await request(app).get('/atomic-assets?asset_type=Validator&status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].atomic_asset_id).toBe('AA-VALIDATE-POSITIVE-NUMBER-V001');
  });

  it('returns the single Enum that is Active', async () => {
    const res = await request(app).get('/atomic-assets?asset_type=Enum&status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].atomic_asset_id).toBe('AA-INVENTORY-STATUS-ENUM-V001');
  });

  it('returns empty when asset_type matches but status does not', async () => {
    // All seed AAs are Active; Draft should yield nothing
    const res = await request(app).get('/atomic-assets?asset_type=Enum&status=Draft');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns empty when status matches but asset_type has no records', async () => {
    // No QueryHelper AAs exist in seed
    const res = await request(app).get('/atomic-assets?asset_type=QueryHelper&status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns 400 for an invalid asset_type even when status is valid', async () => {
    const res = await request(app).get('/atomic-assets?asset_type=NotAType&status=Active');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── /composites — ui_backend_scope + status ─────────────────────────────────

describe('GET /composites — combined ui_backend_scope + status', () => {
  it('returns 2 UI composites that are Active', async () => {
    // Seed has: WarehouseLocationSelector (UI) and InventoryDashboardWidget (UI)
    const res = await request(app).get('/composites?ui_backend_scope=UI&status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const ids = res.body.map((c: { composite_id: string }) => c.composite_id);
    expect(ids).toContain('COMP-WAREHOUSE-LOCATION-SELECTOR-V001');
    expect(ids).toContain('COMP-INVENTORY-DASHBOARD-WIDGET-V001');
  });

  it('returns 3 Both-scope composites that are Active', async () => {
    // Seed has: InventoryTable, ItemDetailPage, QuantityAdjustmentDrawer (all Both)
    const res = await request(app).get('/composites?ui_backend_scope=Both&status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    const ids = res.body.map((c: { composite_id: string }) => c.composite_id);
    expect(ids).toContain('COMP-INVENTORY-TABLE-V001');
    expect(ids).toContain('COMP-ITEM-DETAIL-PAGE-V001');
    expect(ids).toContain('COMP-QUANTITY-ADJUSTMENT-DRAWER-V001');
  });

  it('returns empty for Backend scope — no seed composites have Backend scope', async () => {
    const res = await request(app).get('/composites?ui_backend_scope=Backend&status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns empty when scope matches but status yields nothing', async () => {
    // All seed composites are Active; InReview should yield nothing
    const res = await request(app).get('/composites?ui_backend_scope=Both&status=InReview');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

// ─── /castles — castle_type_id + status, blueprint_id + castle_type_id ───────

describe('GET /castles — combined filters', () => {
  const CASTLE_TYPE = 'CT-INTERNAL-INVENTORY-V001';
  const BLUEPRINT = 'BP-INVENTORY-INTERNAL-TENANT-V001';

  it('returns the Strut castle when filtering by castle_type_id + status=Active', async () => {
    const res = await request(app).get(
      `/castles?castle_type_id=${CASTLE_TYPE}&status=Active`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns empty when castle_type_id matches but status is Draft', async () => {
    const res = await request(app).get(
      `/castles?castle_type_id=${CASTLE_TYPE}&status=Draft`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns the Strut castle when filtering by blueprint_id + castle_type_id', async () => {
    const res = await request(app).get(
      `/castles?blueprint_id=${BLUEPRINT}&castle_type_id=${CASTLE_TYPE}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns the Strut castle when filtering by blueprint_id + status=Active', async () => {
    const res = await request(app).get(
      `/castles?blueprint_id=${BLUEPRINT}&status=Active`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns empty when blueprint_id matches but castle_type_id does not exist', async () => {
    const res = await request(app).get(
      `/castles?blueprint_id=${BLUEPRINT}&castle_type_id=CT-DOES-NOT-EXIST-V001`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns empty when all three filters are given but status mismatches', async () => {
    const res = await request(app).get(
      `/castles?castle_type_id=${CASTLE_TYPE}&blueprint_id=${BLUEPRINT}&status=Deprecated`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it('returns the Strut castle when all three filters match', async () => {
    const res = await request(app).get(
      `/castles?castle_type_id=${CASTLE_TYPE}&blueprint_id=${BLUEPRINT}&status=Active`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });
});
