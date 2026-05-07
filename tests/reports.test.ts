import prisma from '../src/lib/prisma';
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
import { createAtomicAsset } from '../src/entities/atomicAsset';
import { createCompound, addAtomicAssetToCompound } from '../src/entities/compound';
import { createComposite, addCompoundToComposite } from '../src/entities/composite';
import { createCastleService, addCompositeToService } from '../src/entities/castleService';
import { createCastleUnit, addServiceToUnit } from '../src/entities/castleUnit';
import {
  createBlueprint,
  addCastleUnitToBlueprint,
  addCastleServiceToBlueprint,
} from '../src/entities/blueprint';
import {
  createCastleType,
  addBlueprintToCastleType,
  addCastleUnitToCastleType,
} from '../src/entities/castleType';
import {
  createCastle,
  addCastleUnitToCastle,
  addCastleServiceToCastle,
  createLocalModification,
} from '../src/entities/castle';

async function cleanAll() {
  await prisma.localModification.deleteMany({});
  await prisma.castleCastleService.deleteMany({});
  await prisma.castleCastleUnit.deleteMany({});
  await prisma.castle.deleteMany({});
  await prisma.castleTypeCastleService.deleteMany({});
  await prisma.castleTypeCastleUnit.deleteMany({});
  await prisma.castleTypeBlueprint.deleteMany({});
  await prisma.castleType.deleteMany({});
  await prisma.blueprintComposite.deleteMany({});
  await prisma.blueprintCastleService.deleteMany({});
  await prisma.blueprintCastleUnit.deleteMany({});
  await prisma.blueprint.deleteMany({});
  await prisma.castleUnitComposite.deleteMany({});
  await prisma.castleUnitService.deleteMany({});
  await prisma.castleUnit.deleteMany({});
  await prisma.castleServiceAtomicAsset.deleteMany({});
  await prisma.castleServiceCompound.deleteMany({});
  await prisma.castleServiceComposite.deleteMany({});
  await prisma.castleService.deleteMany({});
  await prisma.compositeAtomicAsset.deleteMany({});
  await prisma.compositeCompound.deleteMany({});
  await prisma.composite.deleteMany({});
  await prisma.compoundAtomicAsset.deleteMany({});
  await prisma.compound.deleteMany({});
  await prisma.atomicAsset.deleteMany({});
}

beforeEach(cleanAll);
afterAll(async () => {
  await cleanAll();
  await prisma.$disconnect();
});

// ─── Fixture ─────────────────────────────────────────────────────────────────

async function buildFixture() {
  const aa1 = await createAtomicAsset({
    atomic_asset_id: 'AA-VALIDATE-POSITIVE-NUMBER-V001',
    name: 'validatePositiveNumber()',
    asset_type: 'Validator',
    description: 'Validates positive numbers',
    code_location: 'src/validators/positive.ts',
    version: '1.0.0',
    status: 'Active',
  });
  const aa2 = await createAtomicAsset({
    atomic_asset_id: 'AA-FORMAT-QUANTITY-V001',
    name: 'formatQuantity()',
    asset_type: 'HelperFunction',
    description: 'Formats quantity display',
    code_location: 'src/helpers/quantity.ts',
    version: '1.0.0',
    status: 'Active',
  });

  const cpd = await createCompound({
    compound_id: 'CMPD-QUANTITY-VALIDATION-V001',
    name: 'Quantity Validation Compound',
    description: 'Validates quantities',
    version: '1.0.0',
    status: 'Active',
  });
  await addAtomicAssetToCompound(cpd.compound_id, aa1.atomic_asset_id);
  await addAtomicAssetToCompound(cpd.compound_id, aa2.atomic_asset_id);

  const cmp = await createComposite({
    composite_id: 'COMP-QUANTITY-DRAWER-V001',
    name: 'Quantity Adjustment Drawer Composite',
    description: 'Drawer for adjusting quantities',
    version: '1.0.0',
    ui_backend_scope: 'UI',
    status: 'Active',
  });
  await addCompoundToComposite(cmp.composite_id, cpd.compound_id);

  const svc = await createCastleService({
    castle_service_id: 'CS-STOCK-ADJUSTMENT-V001',
    name: 'Stock Adjustment Castle Service',
    capability: 'Handles stock adjustments',
    status: 'Active',
  });
  await addCompositeToService(svc.castle_service_id, cmp.composite_id);

  const unit = await createCastleUnit({
    castle_unit_id: 'CU-WAREHOUSING-INVENTORY-V001',
    name: 'Warehousing and Inventory Castle Unit',
    description: 'Core inventory operations',
    permission_scope: 'inventory:read inventory:write',
    status: 'Active',
  });
  await addServiceToUnit(unit.castle_unit_id, svc.castle_service_id);

  const bp = await createBlueprint({
    blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001',
    name: 'Inventory Application - Internal Tenant',
    category: 'Inventory',
    version: '1.0.0',
    purpose: 'Starter for internal inventory',
    status: 'Active',
  });
  await addCastleUnitToBlueprint(bp.blueprint_id, unit.castle_unit_id);
  await addCastleServiceToBlueprint(bp.blueprint_id, svc.castle_service_id);

  const ct = await createCastleType({
    castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
    name: 'Internal Inventory Castle',
    description: 'Castle type for internal inventory',
    common_purpose: 'Manage warehouse stock internally',
    status: 'Active',
  });
  await addBlueprintToCastleType(ct.castle_type_id, bp.blueprint_id);
  await addCastleUnitToCastleType(ct.castle_type_id, unit.castle_unit_id);

  const castle = await createCastle({
    castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
    castle_name: 'Strut Company Warehousing and Inventory Castle',
    version: '1.0.0',
    primary_purpose: 'Manage warehouse stock',
    status: 'Active',
    castle_type_id: ct.castle_type_id,
    blueprint_id: bp.blueprint_id,
  });
  await addCastleUnitToCastle(castle.castle_record_id, unit.castle_unit_id);
  await addCastleServiceToCastle(castle.castle_record_id, svc.castle_service_id);

  const lmod = await createLocalModification({
    modification_id: 'LMOD-STRUT-CUSTOM-NAMING-V001',
    castle_record_id: castle.castle_record_id,
    modified_item: 'Warehouse location naming scheme',
    change_description: 'Custom naming for Strut locations',
    reason: 'Business requirement',
    review_status: 'Approved',
    promotion_recommendation: 'RemainLocal',
  });

  return { aa1, aa2, cpd, cmp, svc, unit, bp, ct, castle, lmod };
}

// ─── Reports 1–4 ─────────────────────────────────────────────────────────────

describe('listCastles', () => {
  it('returns all castles with type and blueprint info', async () => {
    await buildFixture();
    const result = await listCastles();
    expect(result).toHaveLength(1);
    const c = result[0];
    expect(c.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(c.castle_type?.name).toBe('Internal Inventory Castle');
    expect(c.blueprint?.name).toBe('Inventory Application - Internal Tenant');
    expect(c.status).toBe('Active');
  });

  it('filters by status', async () => {
    await buildFixture();
    const active = await listCastles({ status: 'Active' });
    const draft = await listCastles({ status: 'Draft' });
    expect(active).toHaveLength(1);
    expect(draft).toHaveLength(0);
  });

  it('filters by castle_type_id', async () => {
    await buildFixture();
    const found = await listCastles({ castle_type_id: 'CT-INTERNAL-INVENTORY-V001' });
    const notFound = await listCastles({ castle_type_id: 'CT-NONEXISTENT-V001' });
    expect(found).toHaveLength(1);
    expect(notFound).toHaveLength(0);
  });

  it('filters by blueprint_id', async () => {
    await buildFixture();
    const found = await listCastles({ blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001' });
    const notFound = await listCastles({ blueprint_id: 'BP-NONEXISTENT-V001' });
    expect(found).toHaveLength(1);
    expect(notFound).toHaveLength(0);
  });
});

describe('listBlueprints', () => {
  it('returns all blueprints', async () => {
    await buildFixture();
    const result = await listBlueprints();
    expect(result).toHaveLength(1);
    expect(result[0].blueprint_id).toBe('BP-INVENTORY-INTERNAL-TENANT-V001');
  });

  it('filters by category', async () => {
    await buildFixture();
    const found = await listBlueprints({ category: 'Inventory' });
    const notFound = await listBlueprints({ category: 'HR' });
    expect(found).toHaveLength(1);
    expect(notFound).toHaveLength(0);
  });

  it('filters by status', async () => {
    await buildFixture();
    expect(await listBlueprints({ status: 'Active' })).toHaveLength(1);
    expect(await listBlueprints({ status: 'Draft' })).toHaveLength(0);
  });
});

describe('listCastleTypes', () => {
  it('returns all castle types with compatible blueprints', async () => {
    await buildFixture();
    const result = await listCastleTypes();
    expect(result).toHaveLength(1);
    const ct = result[0];
    expect(ct.castle_type_id).toBe('CT-INTERNAL-INVENTORY-V001');
    expect(ct.compatible_blueprints).toHaveLength(1);
    expect(ct.compatible_blueprints[0].name).toBe('Inventory Application - Internal Tenant');
  });

  it('filters by status', async () => {
    await buildFixture();
    expect(await listCastleTypes({ status: 'Active' })).toHaveLength(1);
    expect(await listCastleTypes({ status: 'Draft' })).toHaveLength(0);
  });
});

describe('listCastleUnits', () => {
  it('returns all castle units', async () => {
    await buildFixture();
    const result = await listCastleUnits();
    expect(result).toHaveLength(1);
    expect(result[0].castle_unit_id).toBe('CU-WAREHOUSING-INVENTORY-V001');
  });

  it('filters by status', async () => {
    await buildFixture();
    expect(await listCastleUnits({ status: 'Active' })).toHaveLength(1);
    expect(await listCastleUnits({ status: 'Archived' })).toHaveLength(0);
  });
});

// ─── Reports 5–8 ─────────────────────────────────────────────────────────────

describe('listCastleServices', () => {
  it('returns all castle services', async () => {
    await buildFixture();
    const result = await listCastleServices();
    expect(result).toHaveLength(1);
    expect(result[0].castle_service_id).toBe('CS-STOCK-ADJUSTMENT-V001');
  });

  it('filters by status', async () => {
    await buildFixture();
    expect(await listCastleServices({ status: 'Active' })).toHaveLength(1);
    expect(await listCastleServices({ status: 'Deprecated' })).toHaveLength(0);
  });
});

describe('listComposites', () => {
  it('returns all composites', async () => {
    await buildFixture();
    const result = await listComposites();
    expect(result).toHaveLength(1);
    expect(result[0].composite_id).toBe('COMP-QUANTITY-DRAWER-V001');
  });

  it('filters by ui_backend_scope', async () => {
    await buildFixture();
    expect(await listComposites({ ui_backend_scope: 'UI' })).toHaveLength(1);
    expect(await listComposites({ ui_backend_scope: 'Backend' })).toHaveLength(0);
  });
});

describe('listCompounds', () => {
  it('returns all compounds', async () => {
    await buildFixture();
    const result = await listCompounds();
    expect(result).toHaveLength(1);
    expect(result[0].compound_id).toBe('CMPD-QUANTITY-VALIDATION-V001');
  });

  it('filters by status', async () => {
    await buildFixture();
    expect(await listCompounds({ status: 'Active' })).toHaveLength(1);
    expect(await listCompounds({ status: 'InReview' })).toHaveLength(0);
  });
});

describe('listAtomicAssets', () => {
  it('returns all atomic assets', async () => {
    await buildFixture();
    const result = await listAtomicAssets();
    expect(result).toHaveLength(2);
  });

  it('filters by asset_type', async () => {
    await buildFixture();
    expect(await listAtomicAssets({ asset_type: 'Validator' })).toHaveLength(1);
    expect(await listAtomicAssets({ asset_type: 'Constant' })).toHaveLength(0);
  });

  it('filters by status', async () => {
    await buildFixture();
    expect(await listAtomicAssets({ status: 'Active' })).toHaveLength(2);
    expect(await listAtomicAssets({ status: 'Deprecated' })).toHaveLength(0);
  });
});

// ─── Report 9: getDependencyMap ───────────────────────────────────────────────

describe('getDependencyMap', () => {
  it('returns downstream for Compound (atomic assets)', async () => {
    await buildFixture();
    const map = await getDependencyMap('CMPD-QUANTITY-VALIDATION-V001', 'Compound');
    expect(map.entity_id).toBe('CMPD-QUANTITY-VALIDATION-V001');
    expect(map.entity_type).toBe('Compound');
    expect(map.downstream.atomic_assets).toHaveLength(2);
  });

  it('returns upstream for Compound (composites → services → units)', async () => {
    await buildFixture();
    const map = await getDependencyMap('CMPD-QUANTITY-VALIDATION-V001', 'Compound');
    expect(map.upstream.composites).toHaveLength(1);
  });

  it('returns downstream for CastleService (composites)', async () => {
    await buildFixture();
    const map = await getDependencyMap('CS-STOCK-ADJUSTMENT-V001', 'CastleService');
    expect(map.downstream.composites).toHaveLength(1);
    expect(map.downstream.composites![0].id).toBe('COMP-QUANTITY-DRAWER-V001');
  });

  it('returns upstream for CastleUnit (castles)', async () => {
    await buildFixture();
    const map = await getDependencyMap('CU-WAREHOUSING-INVENTORY-V001', 'CastleUnit');
    expect(map.upstream.castles).toHaveLength(1);
    expect(map.upstream.castles[0].id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns BOM as downstream for Castle', async () => {
    await buildFixture();
    const map = await getDependencyMap('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'Castle');
    expect(map.downstream).toHaveProperty('bom');
    expect(map.downstream.bom?.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns downstream for Blueprint (castle units + castle services)', async () => {
    await buildFixture();
    const map = await getDependencyMap('BP-INVENTORY-INTERNAL-TENANT-V001', 'Blueprint');
    expect(map.downstream.castle_units).toHaveLength(1);
    expect(map.downstream.castle_services).toHaveLength(1);
  });

  it('returns upstream castles for Blueprint', async () => {
    await buildFixture();
    const map = await getDependencyMap('BP-INVENTORY-INTERNAL-TENANT-V001', 'Blueprint');
    expect(map.upstream.castles).toHaveLength(1);
  });

  it('returns downstream for CastleType (blueprints + castle units)', async () => {
    await buildFixture();
    const map = await getDependencyMap('CT-INTERNAL-INVENTORY-V001', 'CastleType');
    expect(map.downstream.blueprints).toHaveLength(1);
    expect(map.downstream.castle_units).toHaveLength(1);
  });

  it('returns upstream castles for CastleType', async () => {
    await buildFixture();
    const map = await getDependencyMap('CT-INTERNAL-INVENTORY-V001', 'CastleType');
    expect(map.upstream.castles).toHaveLength(1);
  });
});

// ─── Report 10: getReuseReport ────────────────────────────────────────────────

describe('getReuseReport', () => {
  it('returns empty lists when no entities are reused', async () => {
    await buildFixture();
    const result = await getReuseReport();
    expect(result.castle_units).toHaveLength(0);
    expect(result.castle_services).toHaveLength(0);
    expect(result.compounds).toHaveLength(0);
    expect(result.atomic_assets).toHaveLength(0);
  });

  it('detects reused castle unit (shared across 2 castles)', async () => {
    await buildFixture();

    // second castle using same castle unit
    const ct2 = await createCastleType({
      castle_type_id: 'CT-EXTERNAL-V001',
      name: 'External Castle',
      description: 'External',
      common_purpose: 'External ops',
      status: 'Active',
    });
    const bp2 = await createBlueprint({
      blueprint_id: 'BP-EXTERNAL-V001',
      name: 'External Blueprint',
      category: 'External',
      version: '1.0.0',
      purpose: 'External',
      status: 'Active',
    });
    const castle2 = await createCastle({
      castle_record_id: 'CSTL-SECOND-V001',
      castle_name: 'Second Castle',
      version: '1.0.0',
      primary_purpose: 'Secondary ops',
      status: 'Active',
      castle_type_id: ct2.castle_type_id,
      blueprint_id: bp2.blueprint_id,
    });
    await addCastleUnitToCastle(castle2.castle_record_id, 'CU-WAREHOUSING-INVENTORY-V001');

    const result = await getReuseReport();
    expect(result.castle_units).toHaveLength(1);
    expect(result.castle_units[0].id).toBe('CU-WAREHOUSING-INVENTORY-V001');
    expect(result.castle_units[0].castle_count).toBe(2);
  });
});

// ─── Report 11: getDeprecatedAssets ──────────────────────────────────────────

describe('getDeprecatedAssets', () => {
  it('returns empty when no deprecated entities exist', async () => {
    await buildFixture();
    const result = await getDeprecatedAssets();
    expect(result.atomic_assets).toHaveLength(0);
    expect(result.compounds).toHaveLength(0);
    expect(result.castles).toHaveLength(0);
  });

  it('returns deprecated entities across types', async () => {
    await buildFixture();
    await createAtomicAsset({
      atomic_asset_id: 'AA-OLD-HELPER-V001',
      name: 'oldHelper()',
      asset_type: 'HelperFunction',
      description: 'Deprecated helper',
      code_location: 'src/old.ts',
      version: '0.9.0',
      status: 'Deprecated',
    });
    await createCompound({
      compound_id: 'CMPD-OLD-FILTER-V001',
      name: 'Old Filter Compound',
      description: 'Old filter',
      version: '0.9.0',
      status: 'Deprecated',
    });

    const result = await getDeprecatedAssets();
    expect(result.atomic_assets).toHaveLength(1);
    expect(result.atomic_assets[0].id).toBe('AA-OLD-HELPER-V001');
    expect(result.compounds).toHaveLength(1);
    expect(result.compounds[0].id).toBe('CMPD-OLD-FILTER-V001');
  });

  it('returns deprecated composite, castle_service, castle_unit, blueprint, castle_type, castle', async () => {
    await createComposite({
      composite_id: 'COMP-DEPR-TEST-V001',
      name: 'Deprecated Composite',
      description: 'Deprecated',
      version: '1.0.0',
      ui_backend_scope: 'UI',
      status: 'Deprecated',
    });
    await createCastleService({
      castle_service_id: 'CS-DEPR-TEST-V001',
      name: 'Deprecated Service',
      capability: 'Deprecated',
      status: 'Deprecated',
    });
    await createCastleUnit({
      castle_unit_id: 'CU-DEPR-TEST-V001',
      name: 'Deprecated Unit',
      description: 'Deprecated',
      permission_scope: 'none',
      status: 'Deprecated',
    });
    await createBlueprint({
      blueprint_id: 'BP-DEPR-TEST-V001',
      name: 'Deprecated Blueprint',
      category: 'Test',
      version: '1.0.0',
      purpose: 'Deprecated',
      status: 'Deprecated',
    });
    await createCastleType({
      castle_type_id: 'CT-DEPR-TEST-V001',
      name: 'Deprecated Castle Type',
      description: 'Deprecated',
      common_purpose: 'Deprecated',
      status: 'Deprecated',
    });
    await createCastle({
      castle_record_id: 'CSTL-DEPR-TEST-V001',
      castle_name: 'Deprecated Castle',
      version: '1.0.0',
      primary_purpose: 'Deprecated',
      status: 'Deprecated',
    });

    const result = await getDeprecatedAssets();
    expect(result.composites).toHaveLength(1);
    expect(result.composites[0].id).toBe('COMP-DEPR-TEST-V001');
    expect(result.castle_services).toHaveLength(1);
    expect(result.castle_services[0].id).toBe('CS-DEPR-TEST-V001');
    expect(result.castle_units).toHaveLength(1);
    expect(result.castle_units[0].id).toBe('CU-DEPR-TEST-V001');
    expect(result.blueprints).toHaveLength(1);
    expect(result.blueprints[0].id).toBe('BP-DEPR-TEST-V001');
    expect(result.castle_types).toHaveLength(1);
    expect(result.castle_types[0].id).toBe('CT-DEPR-TEST-V001');
    expect(result.castles).toHaveLength(1);
    expect(result.castles[0].id).toBe('CSTL-DEPR-TEST-V001');
  });
});

// ─── Report 12: findDuplicates ────────────────────────────────────────────────

describe('findDuplicates', () => {
  it('returns empty array when no duplicates', async () => {
    await buildFixture();
    const result = await findDuplicates();
    expect(result).toHaveLength(0);
  });

  it('detects duplicate names across entity types after normalization', async () => {
    await buildFixture();
    // "Quantity Validation" appears in compound already.
    // Add a composite with the same normalized name.
    await createComposite({
      composite_id: 'COMP-QUANTITY-VALIDATION-V001',
      name: 'Quantity Validation Composite',
      description: 'Quantity validation UI',
      version: '1.0.0',
      ui_backend_scope: 'UI',
      status: 'Active',
    });

    const result = await findDuplicates();
    const group = result.find((g) => g.normalized_name === 'quantity validation');
    expect(group).toBeDefined();
    expect(group!.entries).toHaveLength(2);
    const types = group!.entries.map((e) => e.entity_type).sort();
    expect(types).toEqual(['Composite', 'Compound']);
  });

  it('strips version suffix during normalization', async () => {
    await buildFixture();
    await createCompound({
      compound_id: 'CMPD-PAGINATION-V001',
      name: 'Pagination Compound v001',
      description: 'Pagination',
      version: '1.0.0',
      status: 'Active',
    });
    await createComposite({
      composite_id: 'COMP-PAGINATION-V001',
      name: 'Pagination Composite',
      description: 'Pagination UI',
      version: '1.0.0',
      ui_backend_scope: 'UI',
      status: 'Active',
    });

    const result = await findDuplicates();
    const group = result.find((g) => g.normalized_name === 'pagination');
    expect(group).toBeDefined();
    expect(group!.entries).toHaveLength(2);
  });
});

// ─── Report 13: getLocalModifications ────────────────────────────────────────

describe('getLocalModifications', () => {
  it('returns all local modifications when no castle_record_id given', async () => {
    await buildFixture();
    const result = await getLocalModifications();
    expect(result).toHaveLength(1);
    expect(result[0].modification_id).toBe('LMOD-STRUT-CUSTOM-NAMING-V001');
  });

  it('returns modifications for a specific castle', async () => {
    await buildFixture();
    const forCastle = await getLocalModifications('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    const forOther = await getLocalModifications('CSTL-NONEXISTENT-V001');
    expect(forCastle).toHaveLength(1);
    expect(forOther).toHaveLength(0);
  });
});

// ─── Report 14: getPromotionCandidates ───────────────────────────────────────

describe('getPromotionCandidates', () => {
  it('returns empty when all mods are RemainLocal', async () => {
    await buildFixture();
    const result = await getPromotionCandidates();
    expect(result).toHaveLength(0);
  });

  it('returns mods flagged for promotion', async () => {
    await buildFixture();
    await createLocalModification({
      modification_id: 'LMOD-STRUT-SUPERVISOR-ROLE-V001',
      castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
      modified_item: 'WarehouseSupervisor role',
      change_description: 'Custom role for supervisors',
      reason: 'Permission scope requirement',
      promotion_recommendation: 'PromoteToService',
    });

    const result = await getPromotionCandidates();
    expect(result).toHaveLength(1);
    expect(result[0].modification_id).toBe('LMOD-STRUT-SUPERVISOR-ROLE-V001');
    expect(result[0].promotion_recommendation).toBe('PromoteToService');
  });
});

// ─── Report 15: getBuildReadiness ────────────────────────────────────────────

describe('getBuildReadiness', () => {
  it('returns ready:true when no deprecated/archived nodes', async () => {
    await buildFixture();
    const result = await getBuildReadiness('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(result.ready).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns ready:false and lists issues when deprecated nodes exist', async () => {
    await buildFixture();

    // Deprecate the compound
    await prisma.compound.update({
      where: { compound_id: 'CMPD-QUANTITY-VALIDATION-V001' },
      data: { status: 'Deprecated' },
    });

    const result = await getBuildReadiness('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(result.ready).toBe(false);
    expect(result.issue_count).toBeGreaterThan(0);
    const issueIds = result.issues.map((i) => i.entity_id);
    expect(issueIds).toContain('CMPD-QUANTITY-VALIDATION-V001');
  });
});

// ─── Report 16: getApprovalStatus ────────────────────────────────────────────

describe('getApprovalStatus', () => {
  it('returns empty when no entities are InReview', async () => {
    await buildFixture();
    const result = await getApprovalStatus();
    expect(result.total).toBe(0);
    expect(result.atomic_assets).toHaveLength(0);
    expect(result.castles).toHaveLength(0);
  });

  it('returns entities with InReview status across types', async () => {
    await buildFixture();
    await createAtomicAsset({
      atomic_asset_id: 'AA-NEW-HELPER-V001',
      name: 'newHelper()',
      asset_type: 'HelperFunction',
      description: 'New helper under review',
      code_location: 'src/new.ts',
      version: '1.0.0',
      status: 'InReview',
    });
    await createCompound({
      compound_id: 'CMPD-NEW-FILTER-V001',
      name: 'New Filter Compound',
      description: 'New filter under review',
      version: '1.0.0',
      status: 'InReview',
    });

    const result = await getApprovalStatus();
    expect(result.total).toBe(2);
    expect(result.atomic_assets).toHaveLength(1);
    expect(result.atomic_assets[0].id).toBe('AA-NEW-HELPER-V001');
    expect(result.compounds).toHaveLength(1);
    expect(result.compounds[0].id).toBe('CMPD-NEW-FILTER-V001');
  });

  it('covers composite, castle_service, castle_unit, blueprint, castle_type, castle with InReview', async () => {
    await createComposite({
      composite_id: 'COMP-REVIEW-TEST-V001',
      name: 'InReview Composite',
      description: 'Under review',
      version: '1.0.0',
      ui_backend_scope: 'UI',
      status: 'InReview',
    });
    await createCastleService({
      castle_service_id: 'CS-REVIEW-TEST-V001',
      name: 'InReview Service',
      capability: 'Under review',
      status: 'InReview',
    });
    await createCastleUnit({
      castle_unit_id: 'CU-REVIEW-TEST-V001',
      name: 'InReview Unit',
      description: 'Under review',
      permission_scope: 'none',
      status: 'InReview',
    });
    await createBlueprint({
      blueprint_id: 'BP-REVIEW-TEST-V001',
      name: 'InReview Blueprint',
      category: 'Test',
      version: '1.0.0',
      purpose: 'Under review',
      status: 'InReview',
    });
    await createCastleType({
      castle_type_id: 'CT-REVIEW-TEST-V001',
      name: 'InReview Castle Type',
      description: 'Under review',
      common_purpose: 'Under review',
      status: 'InReview',
    });
    await createCastle({
      castle_record_id: 'CSTL-REVIEW-TEST-V001',
      castle_name: 'InReview Castle',
      version: '1.0.0',
      primary_purpose: 'Under review',
      status: 'InReview',
    });

    const result = await getApprovalStatus();
    expect(result.total).toBe(6);
    expect(result.composites).toHaveLength(1);
    expect(result.composites[0].id).toBe('COMP-REVIEW-TEST-V001');
    expect(result.castle_services).toHaveLength(1);
    expect(result.castle_services[0].id).toBe('CS-REVIEW-TEST-V001');
    expect(result.castle_units).toHaveLength(1);
    expect(result.castle_units[0].id).toBe('CU-REVIEW-TEST-V001');
    expect(result.blueprints).toHaveLength(1);
    expect(result.blueprints[0].id).toBe('BP-REVIEW-TEST-V001');
    expect(result.castle_types).toHaveLength(1);
    expect(result.castle_types[0].id).toBe('CT-REVIEW-TEST-V001');
    expect(result.castles).toHaveLength(1);
    expect(result.castles[0].id).toBe('CSTL-REVIEW-TEST-V001');
  });
});
