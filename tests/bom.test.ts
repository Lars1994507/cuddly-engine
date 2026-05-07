import prisma from '../src/lib/prisma';
import { generateBOM, traceImpact } from '../src/bom/bom';
import { createAtomicAsset } from '../src/entities/atomicAsset';
import { createCompound, addAtomicAssetToCompound } from '../src/entities/compound';
import { createComposite, addCompoundToComposite, addAtomicAssetToComposite } from '../src/entities/composite';
import {
  createCastleService,
  addCompositeToService,
} from '../src/entities/castleService';
import {
  createCastleUnit,
  addServiceToUnit,
} from '../src/entities/castleUnit';
import { createBlueprint } from '../src/entities/blueprint';
import { createCastleType } from '../src/entities/castleType';
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

// ─── Seed helpers ────────────────────────────────────────────────────────────

async function buildMinimalHierarchy() {
  // Atomic Assets
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

  // Compound
  const cpd = await createCompound({
    compound_id: 'CMPD-QUANTITY-VALIDATION-V001',
    name: 'Quantity Validation Compound',
    description: 'Validates and formats quantities',
    version: '1.0.0',
    status: 'Active',
  });
  await addAtomicAssetToCompound(cpd.compound_id, aa1.atomic_asset_id);
  await addAtomicAssetToCompound(cpd.compound_id, aa2.atomic_asset_id);

  // Composite
  const cmp = await createComposite({
    composite_id: 'COMP-QUANTITY-DRAWER-V001',
    name: 'Quantity Adjustment Drawer Composite',
    description: 'Drawer for adjusting quantities',
    version: '1.0.0',
    ui_backend_scope: 'UI',
    status: 'Active',
  });
  await addCompoundToComposite(cmp.composite_id, cpd.compound_id);

  // Castle Service
  const svc = await createCastleService({
    castle_service_id: 'CS-STOCK-ADJUSTMENT-V001',
    name: 'Stock Adjustment Castle Service',
    capability: 'Handles stock quantity adjustments',
    status: 'Active',
  });
  await addCompositeToService(svc.castle_service_id, cmp.composite_id);

  // Castle Unit
  const unit = await createCastleUnit({
    castle_unit_id: 'CU-WAREHOUSING-INVENTORY-V001',
    name: 'Warehousing and Inventory Castle Unit',
    description: 'Core inventory operations',
    permission_scope: 'inventory:read inventory:write',
    status: 'Active',
  });
  await addServiceToUnit(unit.castle_unit_id, svc.castle_service_id);

  // Blueprint + Castle Type
  const bp = await createBlueprint({
    blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001',
    name: 'Inventory Application - Internal Tenant',
    category: 'Inventory',
    version: '1.0.0',
    purpose: 'Starter structure for internal inventory castles',
    status: 'Active',
  });
  const ct = await createCastleType({
    castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
    name: 'Internal Inventory Castle',
    description: 'Castle type for internal inventory management',
    common_purpose: 'Manage warehouse stock internally',
    status: 'Active',
  });

  // Castle
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

  // Local Modification
  await createLocalModification({
    modification_id: 'LMOD-STRUT-CUSTOM-NAMING-V001',
    castle_record_id: castle.castle_record_id,
    modified_item: 'Warehouse location naming scheme',
    change_description: 'Custom naming for Strut warehouse locations',
    reason: 'Business requirement',
  });

  return { castle, unit, svc, cmp, cpd, aa1, aa2, bp, ct };
}

// ─── generateBOM tests ────────────────────────────────────────────────────────

describe('generateBOM', () => {
  it('throws if castle does not exist', async () => {
    await expect(generateBOM('CSTL-NONEXISTENT-V001')).rejects.toThrow('not found');
  });

  it('returns full structured hierarchy', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    expect(bom.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(bom.castle_name).toBe('Strut Company Warehousing and Inventory Castle');
    expect(bom.status).toBe('Active');
    expect(bom.warning).toBeUndefined();
  });

  it('includes castle_type and blueprint', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    expect(bom.castle_type).not.toBeNull();
    expect(bom.castle_type?.id).toBe('CT-INTERNAL-INVENTORY-V001');
    expect(bom.castle_type?.name).toBe('Internal Inventory Castle');

    expect(bom.blueprint).not.toBeNull();
    expect(bom.blueprint?.id).toBe('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(bom.blueprint?.name).toBe('Inventory Application - Internal Tenant');
  });

  it('includes castle units', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    expect(bom.castle_units).toHaveLength(1);
    expect(bom.castle_units[0].id).toBe('CU-WAREHOUSING-INVENTORY-V001');
  });

  it('includes castle services nested under castle units', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    const unit = bom.castle_units[0];
    expect(unit.castle_services).toHaveLength(1);
    expect(unit.castle_services[0].id).toBe('CS-STOCK-ADJUSTMENT-V001');
    expect(unit.castle_services[0].capability).toBe('Handles stock quantity adjustments');
  });

  it('includes composites nested under castle services', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    const svc = bom.castle_units[0].castle_services[0];
    expect(svc.composites).toHaveLength(1);
    expect(svc.composites[0].id).toBe('COMP-QUANTITY-DRAWER-V001');
    expect(svc.composites[0].ui_backend_scope).toBe('UI');
  });

  it('includes compounds nested under composites', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    const composite = bom.castle_units[0].castle_services[0].composites[0];
    expect(composite.compounds).toHaveLength(1);
    expect(composite.compounds[0].id).toBe('CMPD-QUANTITY-VALIDATION-V001');
  });

  it('includes atomic assets nested under compounds', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    const compound = bom.castle_units[0].castle_services[0].composites[0].compounds[0];
    expect(compound.atomic_assets).toHaveLength(2);
    const aaIds = compound.atomic_assets.map((a) => a.id);
    expect(aaIds).toContain('AA-VALIDATE-POSITIVE-NUMBER-V001');
    expect(aaIds).toContain('AA-FORMAT-QUANTITY-V001');
  });

  it('includes local modifications', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');

    expect(bom.local_modifications).toHaveLength(1);
    expect(bom.local_modifications[0].modification_id).toBe('LMOD-STRUT-CUSTOM-NAMING-V001');
    expect(bom.local_modifications[0].review_status).toBe('Pending');
  });

  it('returns null castle_type and blueprint when not set', async () => {
    await createCastle({
      castle_record_id: 'CSTL-BARE-V001',
      castle_name: 'Bare Castle',
      version: '1.0.0',
      primary_purpose: 'Testing',
    });
    const bom = await generateBOM('CSTL-BARE-V001');
    expect(bom.castle_type).toBeNull();
    expect(bom.blueprint).toBeNull();
    expect(bom.castle_units).toHaveLength(0);
    expect(bom.local_modifications).toHaveLength(0);
  });

  it('flags Deprecated nodes with a warning', async () => {
    await buildMinimalHierarchy();
    // Deprecate the compound
    await prisma.compound.update({
      where: { compound_id: 'CMPD-QUANTITY-VALIDATION-V001' },
      data: { status: 'Deprecated' },
    });
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    const compound = bom.castle_units[0].castle_services[0].composites[0].compounds[0];
    expect(compound.warning).toBe('Status is Deprecated');
  });

  it('flags Archived nodes with a warning', async () => {
    await buildMinimalHierarchy();
    await prisma.castleService.update({
      where: { castle_service_id: 'CS-STOCK-ADJUSTMENT-V001' },
      data: { status: 'Archived' },
    });
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    const svc = bom.castle_units[0].castle_services[0];
    expect(svc.warning).toBe('Status is Archived');
  });

  it('does not set warning for Active nodes', async () => {
    await buildMinimalHierarchy();
    const bom = await generateBOM('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    const unit = bom.castle_units[0];
    expect(unit.warning).toBeUndefined();
    expect(unit.castle_services[0].warning).toBeUndefined();
  });
});

// ─── traceImpact tests ────────────────────────────────────────────────────────

describe('traceImpact — AtomicAsset', () => {
  it('returns all upstream consumers from AtomicAsset up to Castle', async () => {
    await buildMinimalHierarchy();
    const impact = await traceImpact('AA-VALIDATE-POSITIVE-NUMBER-V001', 'AtomicAsset');

    expect(impact.entity_id).toBe('AA-VALIDATE-POSITIVE-NUMBER-V001');
    expect(impact.entity_type).toBe('AtomicAsset');

    // Compound directly contains AA
    expect(impact.compounds).toHaveLength(1);
    expect(impact.compounds![0].id).toBe('CMPD-QUANTITY-VALIDATION-V001');

    // Composite uses that compound
    expect(impact.composites).toHaveLength(1);
    expect(impact.composites![0].id).toBe('COMP-QUANTITY-DRAWER-V001');

    // Castle Service uses that composite
    expect(impact.castle_services).toHaveLength(1);
    expect(impact.castle_services![0].id).toBe('CS-STOCK-ADJUSTMENT-V001');

    // Castle Unit uses that service
    expect(impact.castle_units).toHaveLength(1);
    expect(impact.castle_units![0].id).toBe('CU-WAREHOUSING-INVENTORY-V001');

    // Castle uses that unit
    expect(impact.castles).toHaveLength(1);
    expect(impact.castles[0].id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns empty arrays when AtomicAsset is unused', async () => {
    await createAtomicAsset({
      atomic_asset_id: 'AA-ORPHAN-V001',
      name: 'Orphan Asset',
      asset_type: 'Constant',
      description: 'Not used anywhere',
      code_location: 'src/orphan.ts',
      version: '1.0.0',
    });
    const impact = await traceImpact('AA-ORPHAN-V001', 'AtomicAsset');
    expect(impact.compounds).toEqual([]);
    expect(impact.castles).toHaveLength(0);
  });
});

describe('traceImpact — Compound', () => {
  it('returns composites, services, units, castles from a Compound', async () => {
    await buildMinimalHierarchy();
    const impact = await traceImpact('CMPD-QUANTITY-VALIDATION-V001', 'Compound');

    expect(impact.compounds).toBeUndefined();
    expect(impact.composites).toHaveLength(1);
    expect(impact.composites![0].id).toBe('COMP-QUANTITY-DRAWER-V001');
    expect(impact.castle_services).toHaveLength(1);
    expect(impact.castle_services![0].id).toBe('CS-STOCK-ADJUSTMENT-V001');
    expect(impact.castle_units).toHaveLength(1);
    expect(impact.castles).toHaveLength(1);
    expect(impact.castles[0].id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });
});

describe('traceImpact — Composite', () => {
  it('returns services, units, castles from a Composite', async () => {
    await buildMinimalHierarchy();
    const impact = await traceImpact('COMP-QUANTITY-DRAWER-V001', 'Composite');

    expect(impact.compounds).toBeUndefined();
    expect(impact.composites).toBeUndefined();
    expect(impact.castle_services).toHaveLength(1);
    expect(impact.castle_services![0].id).toBe('CS-STOCK-ADJUSTMENT-V001');
    expect(impact.castle_units).toHaveLength(1);
    expect(impact.castles).toHaveLength(1);
  });
});

describe('traceImpact — CastleService', () => {
  it('returns units and castles from a CastleService', async () => {
    await buildMinimalHierarchy();
    const impact = await traceImpact('CS-STOCK-ADJUSTMENT-V001', 'CastleService');

    expect(impact.compounds).toBeUndefined();
    expect(impact.composites).toBeUndefined();
    expect(impact.castle_services).toBeUndefined();
    expect(impact.castle_units).toHaveLength(1);
    expect(impact.castle_units![0].id).toBe('CU-WAREHOUSING-INVENTORY-V001');
    expect(impact.castles).toHaveLength(1);
    expect(impact.castles[0].id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('finds castle directly linked to service even without a unit', async () => {
    // Castle directly linked to service (via castle_castle_services) without a unit
    await createCastleService({
      castle_service_id: 'CS-DIRECT-V001',
      name: 'Direct Service',
      capability: 'Directly attached to castle',
    });
    await createCastle({
      castle_record_id: 'CSTL-DIRECT-V001',
      castle_name: 'Direct Castle',
      version: '1.0.0',
      primary_purpose: 'Test direct service link',
    });
    await addCastleServiceToCastle('CSTL-DIRECT-V001', 'CS-DIRECT-V001');

    const impact = await traceImpact('CS-DIRECT-V001', 'CastleService');
    expect(impact.castles).toHaveLength(1);
    expect(impact.castles[0].id).toBe('CSTL-DIRECT-V001');
    // No units linked
    expect(impact.castle_units).toEqual([]);
  });
});

describe('traceImpact — CastleUnit', () => {
  it('returns castles from a CastleUnit', async () => {
    await buildMinimalHierarchy();
    const impact = await traceImpact('CU-WAREHOUSING-INVENTORY-V001', 'CastleUnit');

    expect(impact.compounds).toBeUndefined();
    expect(impact.composites).toBeUndefined();
    expect(impact.castle_services).toBeUndefined();
    expect(impact.castle_units).toBeUndefined();
    expect(impact.castles).toHaveLength(1);
    expect(impact.castles[0].id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('returns empty castles when unit is not attached to any castle', async () => {
    await createCastleUnit({
      castle_unit_id: 'CU-UNUSED-V001',
      name: 'Unused Unit',
      description: 'Not attached to any castle',
      permission_scope: 'none',
    });
    const impact = await traceImpact('CU-UNUSED-V001', 'CastleUnit');
    expect(impact.castles).toHaveLength(0);
  });
});

describe('generateBOM — direct castle_service not via unit', () => {
  it('service attached directly to castle without a unit is invisible in the BOM tree', async () => {
    const svc = await createCastleService({
      castle_service_id: 'CS-DIRECT-BOM-V001',
      name: 'Direct BOM Service',
      capability: 'Attached directly to castle, not via a unit',
      status: 'Active',
    });
    const castle = await createCastle({
      castle_record_id: 'CSTL-DIRECT-BOM-V001',
      castle_name: 'Direct BOM Castle',
      version: '1.0.0',
      primary_purpose: 'Test direct service BOM visibility',
    });
    await addCastleServiceToCastle(castle.castle_record_id, svc.castle_service_id);

    const bom = await generateBOM('CSTL-DIRECT-BOM-V001');
    // No units attached — BOM castle_units is empty
    expect(bom.castle_units).toHaveLength(0);
    // The service is in the DB but unreachable via the unit→service traversal path
    // This is the documented behaviour: direct castle_services bypass BOM visibility
  });
});

describe('traceImpact — direct AtomicAsset on Composite', () => {
  it('traces direct composite link (not via compound)', async () => {
    const aa = await createAtomicAsset({
      atomic_asset_id: 'AA-DIRECT-COMPOSITE-V001',
      name: 'Direct to Composite Asset',
      asset_type: 'Enum',
      description: 'Directly on a composite',
      code_location: 'src/enums/direct.ts',
      version: '1.0.0',
    });
    const cmp = await createComposite({
      composite_id: 'COMP-DIRECT-V001',
      name: 'Direct Composite',
      description: 'Directly contains AA',
      version: '1.0.0',
      ui_backend_scope: 'Backend',
    });
    await addAtomicAssetToComposite(cmp.composite_id, aa.atomic_asset_id);

    const impact = await traceImpact('AA-DIRECT-COMPOSITE-V001', 'AtomicAsset');
    // No compounds (direct link to composite)
    expect(impact.compounds).toEqual([]);
    // Composite is found
    expect(impact.composites).toHaveLength(1);
    expect(impact.composites![0].id).toBe('COMP-DIRECT-V001');
  });
});
