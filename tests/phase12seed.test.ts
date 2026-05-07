import prisma from '../src/lib/prisma';
import { seed } from '../src/seed/seed';
import { generateBOM, traceImpact } from '../src/bom/bom';
import { getRelevantContext } from '../src/retrieval/retrieval';
import {
  listCastles,
  listBlueprints,
  listCastleTypes,
  listCastleUnits,
  listCastleServices,
  listComposites,
  listCompounds,
  listAtomicAssets,
  getDependencyMap,
  getReuseReport,
  getDeprecatedAssets,
  findDuplicates,
  getLocalModifications,
  getPromotionCandidates,
  getBuildReadiness,
  getApprovalStatus,
} from '../src/reports/reports';

beforeAll(async () => {
  await seed();
}, 60_000);

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CASTLE_ID = 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001';
const CT_ID = 'CT-INTERNAL-INVENTORY-V001';
const BP_ID = 'BP-INVENTORY-INTERNAL-TENANT-V001';

function uniqueIds<T extends { id: string }>(arr: T[]): Set<string> {
  return new Set(arr.map((x) => x.id));
}

/**
 * Walk the nested BOM tree and collect unique IDs at each level.
 */
function flattenBOM(bom: Awaited<ReturnType<typeof generateBOM>>) {
  const unitIds = new Set<string>();
  const serviceIds = new Set<string>();
  const compositeIds = new Set<string>();
  const compoundIds = new Set<string>();
  const atomicAssetIds = new Set<string>();

  for (const unit of bom.castle_units) {
    unitIds.add(unit.id);
    for (const svc of unit.castle_services) {
      serviceIds.add(svc.id);
      for (const comp of svc.composites) {
        compositeIds.add(comp.id);
        for (const cpd of comp.compounds) {
          compoundIds.add(cpd.id);
          for (const aa of cpd.atomic_assets) {
            atomicAssetIds.add(aa.id);
          }
        }
        for (const aa of comp.atomic_assets) {
          atomicAssetIds.add(aa.id);
        }
      }
      for (const cpd of svc.compounds) {
        compoundIds.add(cpd.id);
        for (const aa of cpd.atomic_assets) {
          atomicAssetIds.add(aa.id);
        }
      }
      for (const aa of svc.atomic_assets) {
        atomicAssetIds.add(aa.id);
      }
    }
  }

  return { unitIds, serviceIds, compositeIds, compoundIds, atomicAssetIds };
}

// ─── Validation 1: generateBOM counts ─────────────────────────────────────────

describe('generateBOM — Strut Company Castle', () => {
  it('returns the correct castle metadata', async () => {
    const bom = await generateBOM(CASTLE_ID);
    expect(bom.castle_record_id).toBe(CASTLE_ID);
    expect(bom.castle_name).toBe('Strut Company Warehousing and Inventory Castle');
    expect(bom.status).toBe('Active');
    expect(bom.castle_type).not.toBeNull();
    expect(bom.blueprint).not.toBeNull();
  });

  it('contains exactly 4 unique Castle Units', async () => {
    const bom = await generateBOM(CASTLE_ID);
    const { unitIds } = flattenBOM(bom);
    expect(unitIds.size).toBe(4);
    expect(unitIds.has('CU-WAREHOUSING-INVENTORY-V001')).toBe(true);
    expect(unitIds.has('CU-ADMIN-V001')).toBe(true);
    expect(unitIds.has('CU-REPORTING-V001')).toBe(true);
    expect(unitIds.has('CU-USER-MANAGEMENT-V001')).toBe(true);
  });

  it('contains exactly 7 unique Castle Services', async () => {
    const bom = await generateBOM(CASTLE_ID);
    const { serviceIds } = flattenBOM(bom);
    expect(serviceIds.size).toBe(7);
    expect(serviceIds.has('CS-AUTH-V001')).toBe(true);
    expect(serviceIds.has('CS-PERMISSION-V001')).toBe(true);
    expect(serviceIds.has('CS-AUDIT-LOG-V001')).toBe(true);
    expect(serviceIds.has('CS-INVENTORY-V001')).toBe(true);
    expect(serviceIds.has('CS-WAREHOUSE-LOCATION-V001')).toBe(true);
    expect(serviceIds.has('CS-STOCK-ADJUSTMENT-V001')).toBe(true);
    expect(serviceIds.has('CS-REPORTING-V001')).toBe(true);
  });

  it('contains exactly 5 unique Composites', async () => {
    const bom = await generateBOM(CASTLE_ID);
    const { compositeIds } = flattenBOM(bom);
    expect(compositeIds.size).toBe(5);
    expect(compositeIds.has('COMP-INVENTORY-TABLE-V001')).toBe(true);
    expect(compositeIds.has('COMP-ITEM-DETAIL-PAGE-V001')).toBe(true);
    expect(compositeIds.has('COMP-WAREHOUSE-LOCATION-SELECTOR-V001')).toBe(true);
    expect(compositeIds.has('COMP-QUANTITY-ADJUSTMENT-DRAWER-V001')).toBe(true);
    expect(compositeIds.has('COMP-INVENTORY-DASHBOARD-WIDGET-V001')).toBe(true);
  });

  it('contains exactly 5 unique Compounds', async () => {
    const bom = await generateBOM(CASTLE_ID);
    const { compoundIds } = flattenBOM(bom);
    expect(compoundIds.size).toBe(5);
    expect(compoundIds.has('CMPD-DATE-RANGE-FILTER-V001')).toBe(true);
    expect(compoundIds.has('CMPD-ROLE-CHECK-V001')).toBe(true);
    expect(compoundIds.has('CMPD-QUANTITY-VALIDATION-V001')).toBe(true);
    expect(compoundIds.has('CMPD-PAGINATION-V001')).toBe(true);
    expect(compoundIds.has('CMPD-STOCK-STATUS-FILTER-V001')).toBe(true);
  });

  it('contains exactly 7 unique Atomic Assets', async () => {
    const bom = await generateBOM(CASTLE_ID);
    const { atomicAssetIds } = flattenBOM(bom);
    expect(atomicAssetIds.size).toBe(7);
    expect(atomicAssetIds.has('AA-INVENTORY-STATUS-ENUM-V001')).toBe(true);
    expect(atomicAssetIds.has('AA-WAREHOUSE-LOCATION-TYPE-V001')).toBe(true);
    expect(atomicAssetIds.has('AA-FORMAT-QUANTITY-V001')).toBe(true);
    expect(atomicAssetIds.has('AA-VALIDATE-POSITIVE-NUMBER-V001')).toBe(true);
    expect(atomicAssetIds.has('AA-CAN-ADJUST-INVENTORY-V001')).toBe(true);
    expect(atomicAssetIds.has('AA-STOCK-STATUS-BADGE-V001')).toBe(true);
    expect(atomicAssetIds.has('AA-INVENTORY-PERMISSION-CONSTANT-V001')).toBe(true);
  });

  it('contains exactly 5 Local Modifications', async () => {
    const bom = await generateBOM(CASTLE_ID);
    expect(bom.local_modifications).toHaveLength(5);
    const modIds = new Set(bom.local_modifications.map((m) => m.modification_id));
    expect(modIds.has('LMOD-CUSTOM-WAREHOUSE-NAMING-V001')).toBe(true);
    expect(modIds.has('LMOD-WAREHOUSE-SUPERVISOR-ROLE-V001')).toBe(true);
    expect(modIds.has('LMOD-QUANTITY-APPROVAL-THRESHOLD-V001')).toBe(true);
    expect(modIds.has('LMOD-MATERIAL-TRACKING-V001')).toBe(true);
    expect(modIds.has('LMOD-MONTHLY-RECONCILIATION-REPORT-V001')).toBe(true);
  });
});

// ─── Validation 2: traceImpact ────────────────────────────────────────────────

describe('traceImpact — validatePositiveNumber()', () => {
  it('traces up to Quantity Validation Compound', async () => {
    const result = await traceImpact('AA-VALIDATE-POSITIVE-NUMBER-V001', 'AtomicAsset');
    const compoundIds = new Set((result.compounds ?? []).map((c) => c.id));
    expect(compoundIds.has('CMPD-QUANTITY-VALIDATION-V001')).toBe(true);
  });

  it('traces up to Quantity Adjustment Drawer Composite', async () => {
    const result = await traceImpact('AA-VALIDATE-POSITIVE-NUMBER-V001', 'AtomicAsset');
    const compositeIds = new Set((result.composites ?? []).map((c) => c.id));
    expect(compositeIds.has('COMP-QUANTITY-ADJUSTMENT-DRAWER-V001')).toBe(true);
  });

  it('traces up to Stock Adjustment Castle Service', async () => {
    const result = await traceImpact('AA-VALIDATE-POSITIVE-NUMBER-V001', 'AtomicAsset');
    const serviceIds = new Set((result.castle_services ?? []).map((s) => s.id));
    expect(serviceIds.has('CS-STOCK-ADJUSTMENT-V001')).toBe(true);
  });

  it('traces up to the Strut Company Castle', async () => {
    const result = await traceImpact('AA-VALIDATE-POSITIVE-NUMBER-V001', 'AtomicAsset');
    const castleIds = new Set(result.castles.map((c) => c.id));
    expect(castleIds.has(CASTLE_ID)).toBe(true);
  });
});

// ─── Validation 3: getRelevantContext ─────────────────────────────────────────

describe('getRelevantContext — CT + BP', () => {
  it('returns all 4 Castle Units', async () => {
    const ctx = await getRelevantContext(CT_ID, BP_ID);
    expect(ctx.castle_units).toHaveLength(4);
    const ids = uniqueIds(ctx.castle_units);
    expect(ids.has('CU-WAREHOUSING-INVENTORY-V001')).toBe(true);
    expect(ids.has('CU-ADMIN-V001')).toBe(true);
    expect(ids.has('CU-REPORTING-V001')).toBe(true);
    expect(ids.has('CU-USER-MANAGEMENT-V001')).toBe(true);
  });

  it('returns all 7 Castle Services', async () => {
    const ctx = await getRelevantContext(CT_ID, BP_ID);
    expect(ctx.castle_services).toHaveLength(7);
    const ids = uniqueIds(ctx.castle_services);
    expect(ids.has('CS-AUTH-V001')).toBe(true);
    expect(ids.has('CS-PERMISSION-V001')).toBe(true);
    expect(ids.has('CS-AUDIT-LOG-V001')).toBe(true);
    expect(ids.has('CS-INVENTORY-V001')).toBe(true);
    expect(ids.has('CS-WAREHOUSE-LOCATION-V001')).toBe(true);
    expect(ids.has('CS-STOCK-ADJUSTMENT-V001')).toBe(true);
    expect(ids.has('CS-REPORTING-V001')).toBe(true);
  });

  it('returns all 5 Composites', async () => {
    const ctx = await getRelevantContext(CT_ID, BP_ID);
    expect(ctx.composites).toHaveLength(5);
    const ids = uniqueIds(ctx.composites);
    expect(ids.has('COMP-INVENTORY-TABLE-V001')).toBe(true);
    expect(ids.has('COMP-ITEM-DETAIL-PAGE-V001')).toBe(true);
    expect(ids.has('COMP-WAREHOUSE-LOCATION-SELECTOR-V001')).toBe(true);
    expect(ids.has('COMP-QUANTITY-ADJUSTMENT-DRAWER-V001')).toBe(true);
    expect(ids.has('COMP-INVENTORY-DASHBOARD-WIDGET-V001')).toBe(true);
  });

  it('returns all 5 Compounds', async () => {
    const ctx = await getRelevantContext(CT_ID, BP_ID);
    expect(ctx.compounds).toHaveLength(5);
  });

  it('returns all 7 Atomic Assets', async () => {
    const ctx = await getRelevantContext(CT_ID, BP_ID);
    expect(ctx.atomic_assets).toHaveLength(7);
  });

  it('excludes Deprecated and Archived entities', async () => {
    const ctx = await getRelevantContext(CT_ID, BP_ID);
    const allStatuses = [
      ...ctx.castle_units.map((x) => x.status),
      ...ctx.castle_services.map((x) => x.status),
      ...ctx.composites.map((x) => x.status),
      ...ctx.compounds.map((x) => x.status),
      ...ctx.atomic_assets.map((x) => x.status),
    ];
    for (const s of allStatuses) {
      expect(s).not.toBe('Deprecated');
      expect(s).not.toBe('Archived');
    }
  });
});

// ─── Validation 4: All 16 report functions ────────────────────────────────────

describe('Reports — all 16 functions return non-empty correct results', () => {
  it('listCastles — returns the Strut Castle', async () => {
    const result = await listCastles();
    expect(result.length).toBeGreaterThanOrEqual(1);
    const found = result.find((c) => c.castle_record_id === CASTLE_ID);
    expect(found).toBeDefined();
    expect(found!.castle_type).not.toBeNull();
    expect(found!.blueprint).not.toBeNull();
  });

  it('listBlueprints — returns the Inventory blueprint', async () => {
    const result = await listBlueprints();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((b) => b.blueprint_id === BP_ID)).toBe(true);
  });

  it('listCastleTypes — returns the Internal Inventory Castle type', async () => {
    const result = await listCastleTypes();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((ct) => ct.castle_type_id === CT_ID)).toBe(true);
  });

  it('listCastleUnits — returns all 4 Castle Units', async () => {
    const result = await listCastleUnits();
    expect(result.length).toBe(4);
  });

  it('listCastleServices — returns all 7 Castle Services', async () => {
    const result = await listCastleServices();
    expect(result.length).toBe(7);
  });

  it('listComposites — returns all 5 Composites', async () => {
    const result = await listComposites();
    expect(result.length).toBe(5);
  });

  it('listCompounds — returns all 5 Compounds', async () => {
    const result = await listCompounds();
    expect(result.length).toBe(5);
  });

  it('listAtomicAssets — returns all 7 Atomic Assets', async () => {
    const result = await listAtomicAssets();
    expect(result.length).toBe(7);
  });

  it('getDependencyMap — returns up+down tree for Stock Adjustment Service', async () => {
    const result = await getDependencyMap('CS-STOCK-ADJUSTMENT-V001', 'CastleService');
    expect(result.entity_id).toBe('CS-STOCK-ADJUSTMENT-V001');
    expect(result.entity_type).toBe('CastleService');
    // downstream: composites
    expect(result.downstream.composites).toBeDefined();
    expect(result.downstream.composites!.length).toBeGreaterThanOrEqual(1);
    // upstream: castle units and castles
    expect(result.upstream.castle_units).toBeDefined();
    expect(result.upstream.castles.length).toBeGreaterThanOrEqual(1);
  });

  it('getReuseReport — returns object with reuse data across all entity types', async () => {
    const result = await getReuseReport();
    expect(result).toBeDefined();
    expect(result.castle_units).toBeDefined();
    expect(result.castle_services).toBeDefined();
    expect(result.composites).toBeDefined();
    expect(result.compounds).toBeDefined();
    expect(result.atomic_assets).toBeDefined();
    // InventoryStatusEnum appears in multiple compounds — should be in reuse report
    const aaIds = result.atomic_assets.map((a) => a.id);
    expect(aaIds).toContain('AA-INVENTORY-STATUS-ENUM-V001');
  });

  it('getDeprecatedAssets — returns object with empty arrays (no deprecated assets in seed)', async () => {
    const result = await getDeprecatedAssets();
    expect(result).toBeDefined();
    expect(result.atomic_assets).toHaveLength(0);
    expect(result.compounds).toHaveLength(0);
    expect(result.composites).toHaveLength(0);
    expect(result.castle_services).toHaveLength(0);
    expect(result.castles).toHaveLength(0);
  });

  it('findDuplicates — returns array result without throwing', async () => {
    const result = await findDuplicates();
    expect(Array.isArray(result)).toBe(true);
  });

  it('getLocalModifications — returns all 5 mods for the Castle', async () => {
    const result = await getLocalModifications(CASTLE_ID);
    expect(result.length).toBe(5);
  });

  it('getLocalModifications (no arg) — returns all modifications', async () => {
    const result = await getLocalModifications();
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it('getPromotionCandidates — returns mods with non-RemainLocal recommendations', async () => {
    const result = await getPromotionCandidates();
    expect(result.length).toBeGreaterThanOrEqual(1);
    for (const mod of result) {
      expect(mod.promotion_recommendation).not.toBe('RemainLocal');
    }
  });

  it('getBuildReadiness — returns ready=true for Strut Castle (all Active assets)', async () => {
    const result = await getBuildReadiness(CASTLE_ID);
    expect(result.castle_record_id).toBe(CASTLE_ID);
    expect(result.ready).toBe(true);
    expect(result.issue_count).toBe(0);
    expect(result.issues).toHaveLength(0);
  });

  it('getApprovalStatus — returns object with empty arrays (no InReview assets in seed)', async () => {
    const result = await getApprovalStatus();
    expect(result).toBeDefined();
    expect(result.total).toBe(0);
    expect(result.atomic_assets).toHaveLength(0);
    expect(result.castles).toHaveLength(0);
  });
});
