/**
 * Tests for getDependencyMap — AtomicAsset and Composite entity types.
 *
 * These two entity types are absent from reports.test.ts (which uses a
 * minimal hand-rolled fixture). This suite runs against the full Strut
 * Company seed so the relationship counts are authoritative.
 */
import { seed, clearAll } from '../src/seed/seed';
import { getDependencyMap } from '../src/reports/reports';

beforeAll(async () => {
  await seed();
}, 60_000);

afterAll(async () => {
  await clearAll();
});

// ─── AtomicAsset ─────────────────────────────────────────────────────────────

describe('getDependencyMap — AtomicAsset', () => {
  // validatePositiveNumber() is used by CMPD-QUANTITY-VALIDATION-V001 only
  const AA_ID = 'AA-VALIDATE-POSITIVE-NUMBER-V001';

  it('returns entity_id and entity_type correctly', async () => {
    const map = await getDependencyMap(AA_ID, 'AtomicAsset');
    expect(map.entity_id).toBe(AA_ID);
    expect(map.entity_type).toBe('AtomicAsset');
  });

  it('upstream.compounds contains the one compound that uses it', async () => {
    const map = await getDependencyMap(AA_ID, 'AtomicAsset');
    expect(map.upstream.compounds).toHaveLength(1);
    expect(map.upstream.compounds![0].id).toBe('CMPD-QUANTITY-VALIDATION-V001');
  });

  it('upstream.composites is empty — AA is not linked directly to any composite', async () => {
    const map = await getDependencyMap(AA_ID, 'AtomicAsset');
    expect(map.upstream.composites).toHaveLength(0);
  });

  it('upstream.castle_services is empty — AA is not linked directly to any service', async () => {
    const map = await getDependencyMap(AA_ID, 'AtomicAsset');
    expect(map.upstream.castle_services).toHaveLength(0);
  });

  it('upstream.castles is empty — no direct service link means no castle', async () => {
    const map = await getDependencyMap(AA_ID, 'AtomicAsset');
    expect(map.upstream.castles).toHaveLength(0);
  });

  it('downstream is empty — AtomicAssets have no children', async () => {
    const map = await getDependencyMap(AA_ID, 'AtomicAsset');
    expect(map.downstream).toEqual({});
  });
});

describe('getDependencyMap — AtomicAsset (InventoryStatusEnum — shared across 3 compounds)', () => {
  // InventoryStatusEnum is in DATE-RANGE-FILTER, QUANTITY-VALIDATION, and STOCK-STATUS-FILTER
  const ENUM_ID = 'AA-INVENTORY-STATUS-ENUM-V001';

  it('upstream.compounds has exactly 3 entries', async () => {
    const map = await getDependencyMap(ENUM_ID, 'AtomicAsset');
    expect(map.upstream.compounds).toHaveLength(3);
  });

  it('upstream.compounds includes all three compounds that use it', async () => {
    const map = await getDependencyMap(ENUM_ID, 'AtomicAsset');
    const ids = map.upstream.compounds!.map((c) => c.id);
    expect(ids).toContain('CMPD-DATE-RANGE-FILTER-V001');
    expect(ids).toContain('CMPD-QUANTITY-VALIDATION-V001');
    expect(ids).toContain('CMPD-STOCK-STATUS-FILTER-V001');
  });
});

// ─── Composite ───────────────────────────────────────────────────────────────

describe('getDependencyMap — Composite', () => {
  // COMP-INVENTORY-TABLE-V001 contains 3 compounds and 1 direct AA;
  // it is used by CS-INVENTORY-V001, which in turn is in CSTL-STRUT-WAREHOUSE-INVENTORY-V001
  const COMP_ID = 'COMP-INVENTORY-TABLE-V001';

  it('returns entity_id and entity_type correctly', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    expect(map.entity_id).toBe(COMP_ID);
    expect(map.entity_type).toBe('Composite');
  });

  it('downstream.compounds has exactly 3 entries', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    expect(map.downstream.compounds).toHaveLength(3);
  });

  it('downstream.compounds contains the correct compound IDs', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    const ids = map.downstream.compounds!.map((c) => c.id);
    expect(ids).toContain('CMPD-DATE-RANGE-FILTER-V001');
    expect(ids).toContain('CMPD-STOCK-STATUS-FILTER-V001');
    expect(ids).toContain('CMPD-PAGINATION-V001');
  });

  it('downstream.atomic_assets has exactly 1 direct entry (StockStatusBadge)', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    expect(map.downstream.atomic_assets).toHaveLength(1);
    expect(map.downstream.atomic_assets![0].id).toBe('AA-STOCK-STATUS-BADGE-V001');
  });

  it('upstream.castle_services contains CS-INVENTORY-V001', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    expect(map.upstream.castle_services).toBeDefined();
    const ids = map.upstream.castle_services!.map((s) => s.id);
    expect(ids).toContain('CS-INVENTORY-V001');
  });

  it('upstream.castles has exactly 1 entry — the Strut Company castle', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    expect(map.upstream.castles).toHaveLength(1);
    expect(map.upstream.castles[0].id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });
});

describe('getDependencyMap — Composite (Quantity Adjustment Drawer)', () => {
  // COMP-QUANTITY-ADJUSTMENT-DRAWER-V001 has 2 compounds, 1 direct AA, and is used by CS-STOCK-ADJUSTMENT-V001
  const COMP_ID = 'COMP-QUANTITY-ADJUSTMENT-DRAWER-V001';

  it('downstream.compounds has exactly 2 entries', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    expect(map.downstream.compounds).toHaveLength(2);
  });

  it('downstream.compounds includes CMPD-QUANTITY-VALIDATION-V001 and CMPD-ROLE-CHECK-V001', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    const ids = map.downstream.compounds!.map((c) => c.id);
    expect(ids).toContain('CMPD-QUANTITY-VALIDATION-V001');
    expect(ids).toContain('CMPD-ROLE-CHECK-V001');
  });

  it('downstream.atomic_assets has exactly 1 direct entry (canAdjustInventory)', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    expect(map.downstream.atomic_assets).toHaveLength(1);
    expect(map.downstream.atomic_assets![0].id).toBe('AA-CAN-ADJUST-INVENTORY-V001');
  });

  it('upstream.castle_services contains CS-STOCK-ADJUSTMENT-V001', async () => {
    const map = await getDependencyMap(COMP_ID, 'Composite');
    const ids = map.upstream.castle_services!.map((s) => s.id);
    expect(ids).toContain('CS-STOCK-ADJUSTMENT-V001');
  });
});
