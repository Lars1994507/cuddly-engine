import prisma from '../src/lib/prisma';
import {
  createCastleUnit,
  getCastleUnitById,
  listCastleUnits,
  updateCastleUnit,
  archiveCastleUnit,
  addServiceToUnit,
  removeServiceFromUnit,
  listServicesInUnit,
  listUnitsForService,
  addCompositeToUnit,
  removeCompositeFromUnit,
  listCompositesInUnit,
  listUnitsForComposite,
} from '../src/entities/castleUnit';
import { createCastleService } from '../src/entities/castleService';
import { createComposite } from '../src/entities/composite';

beforeEach(async () => {
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
});

afterAll(async () => {
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
  await prisma.$disconnect();
});

const BASE_UNIT = {
  castle_unit_id: 'CU-WAREHOUSING-INVENTORY-V001',
  name: 'Warehousing and Inventory Castle Unit',
  description: 'Core inventory operations',
  permission_scope: 'inventory:read inventory:write',
};

const BASE_SERVICE = {
  castle_service_id: 'CS-INVENTORY-V001',
  name: 'Inventory Service',
  capability: 'Manages inventory records including stock levels and adjustments',
};

const BASE_COMPOSITE = {
  composite_id: 'COMP-INVENTORY-TABLE-V001',
  name: 'Inventory Table',
  description: 'Displays inventory items in a paginated table',
  version: '1.0.0',
  ui_backend_scope: 'UI' as const,
};

// --- createCastleUnit ---

describe('createCastleUnit', () => {
  it('creates a unit with required fields and defaults to Draft', async () => {
    const unit = await createCastleUnit(BASE_UNIT);
    expect(unit.castle_unit_id).toBe('CU-WAREHOUSING-INVENTORY-V001');
    expect(unit.name).toBe('Warehousing and Inventory Castle Unit');
    expect(unit.status).toBe('Draft');
    expect(unit.domain_notes).toBeNull();
  });

  it('creates a unit with all optional fields', async () => {
    const unit = await createCastleUnit({
      ...BASE_UNIT,
      domain_notes: 'Core warehousing domain',
      status: 'Active',
    });
    expect(unit.domain_notes).toBe('Core warehousing domain');
    expect(unit.status).toBe('Active');
  });

  it('rejects an invalid castle_unit_id format', async () => {
    await expect(
      createCastleUnit({ ...BASE_UNIT, castle_unit_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid castle_unit_id');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createCastleUnit({ ...BASE_UNIT, status: 'BOGUS' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects a duplicate castle_unit_id', async () => {
    await createCastleUnit(BASE_UNIT);
    await expect(createCastleUnit(BASE_UNIT)).rejects.toThrow();
  });
});

// --- getCastleUnitById ---

describe('getCastleUnitById', () => {
  it('returns null for an unknown ID', async () => {
    const result = await getCastleUnitById('CU-NONEXISTENT-V001');
    expect(result).toBeNull();
  });

  it('returns the unit record for a known ID', async () => {
    await createCastleUnit(BASE_UNIT);
    const unit = await getCastleUnitById('CU-WAREHOUSING-INVENTORY-V001');
    expect(unit).not.toBeNull();
    expect(unit!.name).toBe('Warehousing and Inventory Castle Unit');
  });
});

// --- listCastleUnits ---

describe('listCastleUnits', () => {
  it('returns an empty array when no units exist', async () => {
    const results = await listCastleUnits();
    expect(results).toEqual([]);
  });

  it('returns all units', async () => {
    await createCastleUnit(BASE_UNIT);
    await createCastleUnit({
      ...BASE_UNIT,
      castle_unit_id: 'CU-ADMIN-V001',
      name: 'Admin Castle Unit',
    });
    const results = await listCastleUnits();
    expect(results).toHaveLength(2);
  });

  it('filters by status', async () => {
    await createCastleUnit(BASE_UNIT);
    await createCastleUnit({
      ...BASE_UNIT,
      castle_unit_id: 'CU-ADMIN-V001',
      name: 'Admin Castle Unit',
      status: 'Active',
    });
    const drafts = await listCastleUnits({ status: 'Draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.castle_unit_id).toBe('CU-WAREHOUSING-INVENTORY-V001');
  });

  it('rejects an invalid status filter', async () => {
    await expect(listCastleUnits({ status: 'JUNK' as never })).rejects.toThrow(
      'Invalid status filter',
    );
  });
});

// --- updateCastleUnit ---

describe('updateCastleUnit', () => {
  it('updates the name field', async () => {
    await createCastleUnit(BASE_UNIT);
    const updated = await updateCastleUnit('CU-WAREHOUSING-INVENTORY-V001', {
      name: 'Updated Warehousing Unit',
    });
    expect(updated.name).toBe('Updated Warehousing Unit');
    expect(updated.description).toBe(BASE_UNIT.description);
  });

  it('updates status to a valid value', async () => {
    await createCastleUnit(BASE_UNIT);
    const updated = await updateCastleUnit('CU-WAREHOUSING-INVENTORY-V001', {
      status: 'Active',
    });
    expect(updated.status).toBe('Active');
  });

  it('rejects an invalid status on update', async () => {
    await createCastleUnit(BASE_UNIT);
    await expect(
      updateCastleUnit('CU-WAREHOUSING-INVENTORY-V001', { status: 'BAD' as never }),
    ).rejects.toThrow('Invalid status');
  });
});

// --- archiveCastleUnit ---

describe('archiveCastleUnit', () => {
  it('sets status to Archived', async () => {
    await createCastleUnit(BASE_UNIT);
    const archived = await archiveCastleUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(archived.status).toBe('Archived');
  });
});

// --- Relationship: CastleUnit ↔ CastleService ---

describe('CastleUnit ↔ CastleService relationship', () => {
  it('adds a service to a unit', async () => {
    await createCastleUnit(BASE_UNIT);
    await createCastleService(BASE_SERVICE);
    await addServiceToUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-INVENTORY-V001');
    const list = await listServicesInUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.castle_service_id).toBe('CS-INVENTORY-V001');
  });

  it('returns empty array when unit has no services', async () => {
    await createCastleUnit(BASE_UNIT);
    const list = await listServicesInUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes a service from a unit', async () => {
    await createCastleUnit(BASE_UNIT);
    await createCastleService(BASE_SERVICE);
    await addServiceToUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-INVENTORY-V001');
    await removeServiceFromUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-INVENTORY-V001');
    const list = await listServicesInUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listUnitsForService returns all units using a service (back-ref)', async () => {
    await createCastleUnit(BASE_UNIT);
    await createCastleUnit({
      ...BASE_UNIT,
      castle_unit_id: 'CU-REPORTING-V001',
      name: 'Reporting Castle Unit',
    });
    await createCastleService(BASE_SERVICE);
    await addServiceToUnit('CU-WAREHOUSING-INVENTORY-V001', 'CS-INVENTORY-V001');
    await addServiceToUnit('CU-REPORTING-V001', 'CS-INVENTORY-V001');
    const units = await listUnitsForService('CS-INVENTORY-V001');
    expect(units).toHaveLength(2);
    const ids = units.map((u) => u.castle_unit_id);
    expect(ids).toContain('CU-WAREHOUSING-INVENTORY-V001');
    expect(ids).toContain('CU-REPORTING-V001');
  });

  it('listUnitsForService returns empty when no units use the service', async () => {
    await createCastleService(BASE_SERVICE);
    const units = await listUnitsForService('CS-INVENTORY-V001');
    expect(units).toEqual([]);
  });
});

// --- Relationship: CastleUnit ↔ Composite ---

describe('CastleUnit ↔ Composite relationship', () => {
  it('adds a composite to a unit', async () => {
    await createCastleUnit(BASE_UNIT);
    await createComposite(BASE_COMPOSITE);
    await addCompositeToUnit('CU-WAREHOUSING-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
    const list = await listCompositesInUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.composite_id).toBe('COMP-INVENTORY-TABLE-V001');
  });

  it('returns empty array when unit has no composites', async () => {
    await createCastleUnit(BASE_UNIT);
    const list = await listCompositesInUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes a composite from a unit', async () => {
    await createCastleUnit(BASE_UNIT);
    await createComposite(BASE_COMPOSITE);
    await addCompositeToUnit('CU-WAREHOUSING-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
    await removeCompositeFromUnit(
      'CU-WAREHOUSING-INVENTORY-V001',
      'COMP-INVENTORY-TABLE-V001',
    );
    const list = await listCompositesInUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listUnitsForComposite returns all units using a composite (back-ref)', async () => {
    await createCastleUnit(BASE_UNIT);
    await createCastleUnit({
      ...BASE_UNIT,
      castle_unit_id: 'CU-REPORTING-V001',
      name: 'Reporting Castle Unit',
    });
    await createComposite(BASE_COMPOSITE);
    await addCompositeToUnit('CU-WAREHOUSING-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
    await addCompositeToUnit('CU-REPORTING-V001', 'COMP-INVENTORY-TABLE-V001');
    const units = await listUnitsForComposite('COMP-INVENTORY-TABLE-V001');
    expect(units).toHaveLength(2);
    const ids = units.map((u) => u.castle_unit_id);
    expect(ids).toContain('CU-WAREHOUSING-INVENTORY-V001');
    expect(ids).toContain('CU-REPORTING-V001');
  });

  it('listUnitsForComposite returns empty when no units use the composite', async () => {
    await createComposite(BASE_COMPOSITE);
    const units = await listUnitsForComposite('COMP-INVENTORY-TABLE-V001');
    expect(units).toEqual([]);
  });
});
