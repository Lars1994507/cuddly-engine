/**
 * Tests that Prisma cascade deletes (onDelete: Cascade) work as configured in schema.prisma.
 * All join tables declare cascade on both sides. These tests verify the DB enforces that.
 *
 * Note: the application uses soft delete (status → Archived) and never hard-deletes entity
 * records. These tests use prisma.[model].delete() directly to exercise the DB cascade rules,
 * which matter if a cleanup operation or future hard-delete path ever runs.
 */

import prisma from '../src/lib/prisma';
import { createAtomicAsset } from '../src/entities/atomicAsset';
import { createCompound, addAtomicAssetToCompound } from '../src/entities/compound';
import { createComposite, addCompoundToComposite, addAtomicAssetToComposite } from '../src/entities/composite';
import { createCastleService, addCompositeToService } from '../src/entities/castleService';
import { createCastleUnit, addServiceToUnit, addCompositeToUnit } from '../src/entities/castleUnit';
import { createCastle, addCastleUnitToCastle, addCastleServiceToCastle, createLocalModification } from '../src/entities/castle';

beforeEach(async () => {
  await prisma.localModification.deleteMany({});
  await prisma.castleCastleService.deleteMany({});
  await prisma.castleCastleUnit.deleteMany({});
  await prisma.castle.deleteMany({});
  await prisma.castleTypeCastleService.deleteMany({});
  await prisma.castleTypeBlueprint.deleteMany({});
  await prisma.castleTypeCastleUnit.deleteMany({});
  await prisma.castleType.deleteMany({});
  await prisma.blueprintCastleService.deleteMany({});
  await prisma.blueprintCastleUnit.deleteMany({});
  await prisma.blueprintComposite.deleteMany({});
  await prisma.blueprint.deleteMany({});
  await prisma.castleUnitService.deleteMany({});
  await prisma.castleUnitComposite.deleteMany({});
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
});

afterAll(async () => {
  await prisma.localModification.deleteMany({});
  await prisma.castleCastleService.deleteMany({});
  await prisma.castleCastleUnit.deleteMany({});
  await prisma.castle.deleteMany({});
  await prisma.castleTypeCastleService.deleteMany({});
  await prisma.castleTypeBlueprint.deleteMany({});
  await prisma.castleTypeCastleUnit.deleteMany({});
  await prisma.castleType.deleteMany({});
  await prisma.blueprintCastleService.deleteMany({});
  await prisma.blueprintCastleUnit.deleteMany({});
  await prisma.blueprintComposite.deleteMany({});
  await prisma.blueprint.deleteMany({});
  await prisma.castleUnitService.deleteMany({});
  await prisma.castleUnitComposite.deleteMany({});
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
  await prisma.$disconnect();
});

// ─── CompoundAtomicAsset join table ──────────────────────────────────────────

describe('CompoundAtomicAsset cascade — Compound side', () => {
  it('deleting a Compound removes its CompoundAtomicAsset rows', async () => {
    const asset = await createAtomicAsset({
      atomic_asset_id: 'AA-UNIT-ENUM-V001',
      name: 'UnitEnum',
      asset_type: 'Enum',
      description: 'Unit of measure enum',
      code_location: 'src/lib/enums.ts',
      version: '1.0.0',
    });
    const compound = await createCompound({
      compound_id: 'CMPD-UNIT-SELECTOR-V001',
      name: 'Unit Selector',
      description: 'Compound for unit selection',
      version: '1.0.0',
    });
    await addAtomicAssetToCompound(compound.compound_id, asset.atomic_asset_id);

    const before = await prisma.compoundAtomicAsset.findMany({ where: { compound_id: compound.compound_id } });
    expect(before).toHaveLength(1);

    await prisma.compound.delete({ where: { compound_id: compound.compound_id } });

    const after = await prisma.compoundAtomicAsset.findMany({ where: { compound_id: compound.compound_id } });
    expect(after).toHaveLength(0);
  });

  it('deleting an AtomicAsset removes its CompoundAtomicAsset rows', async () => {
    const asset = await createAtomicAsset({
      atomic_asset_id: 'AA-UNIT-ENUM-V001',
      name: 'UnitEnum',
      asset_type: 'Enum',
      description: 'Unit of measure enum',
      code_location: 'src/lib/enums.ts',
      version: '1.0.0',
    });
    const compound = await createCompound({
      compound_id: 'CMPD-UNIT-SELECTOR-V001',
      name: 'Unit Selector',
      description: 'Compound for unit selection',
      version: '1.0.0',
    });
    await addAtomicAssetToCompound(compound.compound_id, asset.atomic_asset_id);

    await prisma.atomicAsset.delete({ where: { atomic_asset_id: asset.atomic_asset_id } });

    const after = await prisma.compoundAtomicAsset.findMany({ where: { atomic_asset_id: asset.atomic_asset_id } });
    expect(after).toHaveLength(0);

    const compoundStillExists = await prisma.compound.findUnique({ where: { compound_id: compound.compound_id } });
    expect(compoundStillExists).not.toBeNull();
  });
});

// ─── CompositeCompound and CompositeAtomicAsset join tables ──────────────────

describe('CompositeCompound cascade', () => {
  it('deleting a Composite removes its CompositeCompound rows', async () => {
    const compound = await createCompound({
      compound_id: 'CMPD-UNIT-SELECTOR-V001',
      name: 'Unit Selector',
      description: 'Compound for unit selection',
      version: '1.0.0',
    });
    const composite = await createComposite({
      composite_id: 'COMP-UNIT-PICKER-V001',
      name: 'Unit Picker',
      description: 'UI for selecting units',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addCompoundToComposite(composite.composite_id, compound.compound_id);

    await prisma.composite.delete({ where: { composite_id: composite.composite_id } });

    const after = await prisma.compositeCompound.findMany({ where: { composite_id: composite.composite_id } });
    expect(after).toHaveLength(0);
  });

  it('deleting a Compound removes its CompositeCompound rows but leaves the Composite', async () => {
    const compound = await createCompound({
      compound_id: 'CMPD-UNIT-SELECTOR-V001',
      name: 'Unit Selector',
      description: 'Compound for unit selection',
      version: '1.0.0',
    });
    const composite = await createComposite({
      composite_id: 'COMP-UNIT-PICKER-V001',
      name: 'Unit Picker',
      description: 'UI for selecting units',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addCompoundToComposite(composite.composite_id, compound.compound_id);

    await prisma.compound.delete({ where: { compound_id: compound.compound_id } });

    const after = await prisma.compositeCompound.findMany({ where: { compound_id: compound.compound_id } });
    expect(after).toHaveLength(0);

    const compositeStillExists = await prisma.composite.findUnique({ where: { composite_id: composite.composite_id } });
    expect(compositeStillExists).not.toBeNull();
  });
});

describe('CompositeAtomicAsset cascade', () => {
  it('deleting a Composite removes its CompositeAtomicAsset rows', async () => {
    const asset = await createAtomicAsset({
      atomic_asset_id: 'AA-UNIT-ENUM-V001',
      name: 'UnitEnum',
      asset_type: 'Enum',
      description: 'Unit of measure enum',
      code_location: 'src/lib/enums.ts',
      version: '1.0.0',
    });
    const composite = await createComposite({
      composite_id: 'COMP-UNIT-PICKER-V001',
      name: 'Unit Picker',
      description: 'UI for selecting units',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addAtomicAssetToComposite(composite.composite_id, asset.atomic_asset_id);

    await prisma.composite.delete({ where: { composite_id: composite.composite_id } });

    const after = await prisma.compositeAtomicAsset.findMany({ where: { composite_id: composite.composite_id } });
    expect(after).toHaveLength(0);
  });
});

// ─── CastleServiceComposite join table ───────────────────────────────────────

describe('CastleServiceComposite cascade', () => {
  it('deleting a CastleService removes its CastleServiceComposite rows', async () => {
    const svc = await createCastleService({
      castle_service_id: 'CS-QUANTITY-V001',
      name: 'Quantity Service',
      capability: 'Manages quantity conversions',
    });
    const composite = await createComposite({
      composite_id: 'COMP-UNIT-PICKER-V001',
      name: 'Unit Picker',
      description: 'UI for selecting units',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addCompositeToService(svc.castle_service_id, composite.composite_id);

    await prisma.castleService.delete({ where: { castle_service_id: svc.castle_service_id } });

    const after = await prisma.castleServiceComposite.findMany({ where: { castle_service_id: svc.castle_service_id } });
    expect(after).toHaveLength(0);
  });

  it('deleting a Composite removes its CastleServiceComposite rows but leaves the CastleService', async () => {
    const svc = await createCastleService({
      castle_service_id: 'CS-QUANTITY-V001',
      name: 'Quantity Service',
      capability: 'Manages quantity conversions',
    });
    const composite = await createComposite({
      composite_id: 'COMP-UNIT-PICKER-V001',
      name: 'Unit Picker',
      description: 'UI for selecting units',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addCompositeToService(svc.castle_service_id, composite.composite_id);

    await prisma.composite.delete({ where: { composite_id: composite.composite_id } });

    const after = await prisma.castleServiceComposite.findMany({ where: { composite_id: composite.composite_id } });
    expect(after).toHaveLength(0);

    const svcStillExists = await prisma.castleService.findUnique({ where: { castle_service_id: svc.castle_service_id } });
    expect(svcStillExists).not.toBeNull();
  });
});

// ─── CastleUnitService join table ────────────────────────────────────────────

describe('CastleUnitService cascade', () => {
  it('deleting a CastleUnit removes its CastleUnitService rows but leaves the CastleService', async () => {
    const svc = await createCastleService({
      castle_service_id: 'CS-QUANTITY-V001',
      name: 'Quantity Service',
      capability: 'Manages quantity conversions',
    });
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-QUANTITY-MANAGEMENT-V001',
      name: 'Quantity Management',
      description: 'Manages quantities',
      permission_scope: 'inventory:write',
    });
    await addServiceToUnit(unit.castle_unit_id, svc.castle_service_id);

    await prisma.castleUnit.delete({ where: { castle_unit_id: unit.castle_unit_id } });

    const after = await prisma.castleUnitService.findMany({ where: { castle_unit_id: unit.castle_unit_id } });
    expect(after).toHaveLength(0);

    const svcStillExists = await prisma.castleService.findUnique({ where: { castle_service_id: svc.castle_service_id } });
    expect(svcStillExists).not.toBeNull();
  });
});

// ─── CastleUnitComposite join table ──────────────────────────────────────────

describe('CastleUnitComposite cascade', () => {
  it('deleting a CastleUnit removes its CastleUnitComposite rows but leaves the Composite', async () => {
    const composite = await createComposite({
      composite_id: 'COMP-UNIT-PICKER-V001',
      name: 'Unit Picker',
      description: 'UI for selecting units',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-QUANTITY-MANAGEMENT-V001',
      name: 'Quantity Management',
      description: 'Manages quantities',
      permission_scope: 'inventory:write',
    });
    await addCompositeToUnit(unit.castle_unit_id, composite.composite_id);

    await prisma.castleUnit.delete({ where: { castle_unit_id: unit.castle_unit_id } });

    const after = await prisma.castleUnitComposite.findMany({ where: { castle_unit_id: unit.castle_unit_id } });
    expect(after).toHaveLength(0);

    const compositeStillExists = await prisma.composite.findUnique({ where: { composite_id: composite.composite_id } });
    expect(compositeStillExists).not.toBeNull();
  });
});

// ─── Castle join tables and LocalModification ────────────────────────────────

describe('Castle cascade — CastleCastleUnit, CastleCastleService, LocalModification', () => {
  it('deleting a Castle removes its CastleCastleUnit join rows but leaves the CastleUnit', async () => {
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-QUANTITY-MANAGEMENT-V001',
      name: 'Quantity Management',
      description: 'Manages quantities',
      permission_scope: 'inventory:write',
    });
    const castle = await createCastle({
      castle_record_id: 'CSTL-QUANTITY-INTERNAL-V001',
      castle_name: 'Quantity Castle',
      version: '1.0.0',
      primary_purpose: 'Quantity management',
    });
    await addCastleUnitToCastle(castle.castle_record_id, unit.castle_unit_id);

    await prisma.castle.delete({ where: { castle_record_id: castle.castle_record_id } });

    const after = await prisma.castleCastleUnit.findMany({ where: { castle_record_id: castle.castle_record_id } });
    expect(after).toHaveLength(0);

    const unitStillExists = await prisma.castleUnit.findUnique({ where: { castle_unit_id: unit.castle_unit_id } });
    expect(unitStillExists).not.toBeNull();
  });

  it('deleting a Castle removes its CastleCastleService join rows but leaves the CastleService', async () => {
    const svc = await createCastleService({
      castle_service_id: 'CS-QUANTITY-V001',
      name: 'Quantity Service',
      capability: 'Manages quantity conversions',
    });
    const castle = await createCastle({
      castle_record_id: 'CSTL-QUANTITY-INTERNAL-V001',
      castle_name: 'Quantity Castle',
      version: '1.0.0',
      primary_purpose: 'Quantity management',
    });
    await addCastleServiceToCastle(castle.castle_record_id, svc.castle_service_id);

    await prisma.castle.delete({ where: { castle_record_id: castle.castle_record_id } });

    const after = await prisma.castleCastleService.findMany({ where: { castle_record_id: castle.castle_record_id } });
    expect(after).toHaveLength(0);

    const svcStillExists = await prisma.castleService.findUnique({ where: { castle_service_id: svc.castle_service_id } });
    expect(svcStillExists).not.toBeNull();
  });

  it('deleting a Castle hard-deletes all of its LocalModification records', async () => {
    const castle = await createCastle({
      castle_record_id: 'CSTL-QUANTITY-INTERNAL-V001',
      castle_name: 'Quantity Castle',
      version: '1.0.0',
      primary_purpose: 'Quantity management',
    });
    await createLocalModification({
      modification_id: 'LMOD-OVERRIDE-UNIT-DISPLAY-V001',
      castle_record_id: castle.castle_record_id,
      modified_item: 'UnitDisplay',
      change_description: 'Changed unit display format',
      reason: 'Client requested imperial units',
    });
    await createLocalModification({
      modification_id: 'LMOD-CUSTOM-QUANTITY-LABEL-V001',
      castle_record_id: castle.castle_record_id,
      modified_item: 'QuantityLabel',
      change_description: 'Added custom label prefix',
      reason: 'Branding requirement',
    });

    const before = await prisma.localModification.findMany({ where: { castle_record_id: castle.castle_record_id } });
    expect(before).toHaveLength(2);

    await prisma.castle.delete({ where: { castle_record_id: castle.castle_record_id } });

    const after = await prisma.localModification.findMany({ where: { castle_record_id: castle.castle_record_id } });
    expect(after).toHaveLength(0);
  });

  it('deleting a Castle cascades all three types simultaneously (units, services, mods)', async () => {
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-QUANTITY-MANAGEMENT-V001',
      name: 'Quantity Management',
      description: 'Manages quantities',
      permission_scope: 'inventory:write',
    });
    const svc = await createCastleService({
      castle_service_id: 'CS-QUANTITY-V001',
      name: 'Quantity Service',
      capability: 'Manages quantity conversions',
    });
    const castle = await createCastle({
      castle_record_id: 'CSTL-QUANTITY-INTERNAL-V001',
      castle_name: 'Quantity Castle',
      version: '1.0.0',
      primary_purpose: 'Quantity management',
    });
    await addCastleUnitToCastle(castle.castle_record_id, unit.castle_unit_id);
    await addCastleServiceToCastle(castle.castle_record_id, svc.castle_service_id);
    await createLocalModification({
      modification_id: 'LMOD-OVERRIDE-UNIT-DISPLAY-V001',
      castle_record_id: castle.castle_record_id,
      modified_item: 'UnitDisplay',
      change_description: 'Changed unit display format',
      reason: 'Client requested imperial units',
    });

    await prisma.castle.delete({ where: { castle_record_id: castle.castle_record_id } });

    const [units, services, mods] = await Promise.all([
      prisma.castleCastleUnit.findMany({ where: { castle_record_id: castle.castle_record_id } }),
      prisma.castleCastleService.findMany({ where: { castle_record_id: castle.castle_record_id } }),
      prisma.localModification.findMany({ where: { castle_record_id: castle.castle_record_id } }),
    ]);

    expect(units).toHaveLength(0);
    expect(services).toHaveLength(0);
    expect(mods).toHaveLength(0);

    const unitStillExists = await prisma.castleUnit.findUnique({ where: { castle_unit_id: unit.castle_unit_id } });
    const svcStillExists = await prisma.castleService.findUnique({ where: { castle_service_id: svc.castle_service_id } });
    expect(unitStillExists).not.toBeNull();
    expect(svcStillExists).not.toBeNull();
  });
});
