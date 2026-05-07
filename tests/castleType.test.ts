import prisma from '../src/lib/prisma';
import {
  createCastleType,
  getCastleTypeById,
  listCastleTypes,
  updateCastleType,
  archiveCastleType,
  addBlueprintToCastleType,
  removeBlueprintFromCastleType,
  listBlueprintsForCastleType,
  listCastleTypesForBlueprint,
  addCastleUnitToCastleType,
  removeCastleUnitFromCastleType,
  listCastleUnitsForCastleType,
  listCastleTypesForCastleUnit,
  addCastleServiceToCastleType,
  removeCastleServiceFromCastleType,
  listCastleServicesForCastleType,
  listCastleTypesForCastleService,
} from '../src/entities/castleType';
import { createBlueprint } from '../src/entities/blueprint';
import { createCastleUnit } from '../src/entities/castleUnit';
import { createCastleService } from '../src/entities/castleService';

beforeEach(async () => {
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
});

afterAll(async () => {
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
  await prisma.$disconnect();
});

const BASE_CASTLE_TYPE = {
  castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
  name: 'Internal Inventory Castle',
  description: 'A castle type for internal inventory management applications',
  common_purpose: 'Manage warehouse stock, adjustments, and inventory reporting internally',
};

const BASE_BLUEPRINT = {
  blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001',
  name: 'Inventory Application - Internal Tenant',
  category: 'Inventory',
  version: '1.0.0',
  purpose: 'Starter structure for internal inventory castle applications',
};

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

// --- createCastleType ---

describe('createCastleType', () => {
  it('creates a castle type with required fields and defaults to Draft', async () => {
    const ct = await createCastleType(BASE_CASTLE_TYPE);
    expect(ct.castle_type_id).toBe('CT-INTERNAL-INVENTORY-V001');
    expect(ct.name).toBe('Internal Inventory Castle');
    expect(ct.status).toBe('Draft');
    expect(ct.typical_use_cases).toEqual([]);
  });

  it('creates a castle type with all optional fields', async () => {
    const ct = await createCastleType({
      ...BASE_CASTLE_TYPE,
      status: 'Active',
      typical_use_cases: ['Warehouse inventory', 'Stock management'],
      recommended_asset_filters: 'inventory,warehouse',
    });
    expect(ct.status).toBe('Active');
    expect(ct.typical_use_cases).toEqual(['Warehouse inventory', 'Stock management']);
    expect(ct.recommended_asset_filters).toBe('inventory,warehouse');
  });

  it('rejects an invalid castle_type_id format', async () => {
    await expect(
      createCastleType({ ...BASE_CASTLE_TYPE, castle_type_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid castle_type_id');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createCastleType({ ...BASE_CASTLE_TYPE, status: 'BOGUS' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects a duplicate castle_type_id', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await expect(createCastleType(BASE_CASTLE_TYPE)).rejects.toThrow();
  });
});

// --- getCastleTypeById ---

describe('getCastleTypeById', () => {
  it('returns null for an unknown ID', async () => {
    const result = await getCastleTypeById('CT-NONEXISTENT-V001');
    expect(result).toBeNull();
  });

  it('returns the castle type record for a known ID', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const ct = await getCastleTypeById('CT-INTERNAL-INVENTORY-V001');
    expect(ct).not.toBeNull();
    expect(ct!.name).toBe('Internal Inventory Castle');
  });
});

// --- listCastleTypes ---

describe('listCastleTypes', () => {
  it('returns an empty array when no castle types exist', async () => {
    const results = await listCastleTypes();
    expect(results).toEqual([]);
  });

  it('returns all castle types', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleType({
      ...BASE_CASTLE_TYPE,
      castle_type_id: 'CT-WORKFLOW-V001',
      name: 'Workflow Castle',
    });
    const results = await listCastleTypes();
    expect(results).toHaveLength(2);
  });

  it('filters by status', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleType({
      ...BASE_CASTLE_TYPE,
      castle_type_id: 'CT-WORKFLOW-V001',
      name: 'Workflow Castle',
      status: 'Active',
    });
    const drafts = await listCastleTypes({ status: 'Draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.castle_type_id).toBe('CT-INTERNAL-INVENTORY-V001');
  });

  it('rejects an invalid status filter', async () => {
    await expect(listCastleTypes({ status: 'JUNK' as never })).rejects.toThrow(
      'Invalid status filter',
    );
  });
});

// --- updateCastleType ---

describe('updateCastleType', () => {
  it('updates the name field', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const updated = await updateCastleType('CT-INTERNAL-INVENTORY-V001', {
      name: 'Updated Internal Inventory Castle',
    });
    expect(updated.name).toBe('Updated Internal Inventory Castle');
    expect(updated.common_purpose).toBe(BASE_CASTLE_TYPE.common_purpose);
  });

  it('updates status to a valid value', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const updated = await updateCastleType('CT-INTERNAL-INVENTORY-V001', { status: 'Active' });
    expect(updated.status).toBe('Active');
  });

  it('updates typical_use_cases', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const updated = await updateCastleType('CT-INTERNAL-INVENTORY-V001', {
      typical_use_cases: ['Stock tracking', 'Warehouse ops'],
    });
    expect(updated.typical_use_cases).toEqual(['Stock tracking', 'Warehouse ops']);
  });

  it('rejects an invalid status on update', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await expect(
      updateCastleType('CT-INTERNAL-INVENTORY-V001', { status: 'BAD' as never }),
    ).rejects.toThrow('Invalid status');
  });
});

// --- archiveCastleType ---

describe('archiveCastleType', () => {
  it('sets status to Archived', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const archived = await archiveCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(archived.status).toBe('Archived');
  });
});

// --- Relationship: CastleType ↔ Blueprint ---

describe('CastleType ↔ Blueprint relationship', () => {
  it('adds a blueprint to a castle type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createBlueprint(BASE_BLUEPRINT);
    await addBlueprintToCastleType('CT-INTERNAL-INVENTORY-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
    const list = await listBlueprintsForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.blueprint_id).toBe('BP-INVENTORY-INTERNAL-TENANT-V001');
  });

  it('returns empty array when castle type has no blueprints', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const list = await listBlueprintsForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes a blueprint from a castle type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createBlueprint(BASE_BLUEPRINT);
    await addBlueprintToCastleType('CT-INTERNAL-INVENTORY-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
    await removeBlueprintFromCastleType('CT-INTERNAL-INVENTORY-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
    const list = await listBlueprintsForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listCastleTypesForBlueprint returns all castle types using a blueprint (back-ref)', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleType({
      ...BASE_CASTLE_TYPE,
      castle_type_id: 'CT-WORKFLOW-V001',
      name: 'Workflow Castle',
    });
    await createBlueprint(BASE_BLUEPRINT);
    await addBlueprintToCastleType('CT-INTERNAL-INVENTORY-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
    await addBlueprintToCastleType('CT-WORKFLOW-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
    const cts = await listCastleTypesForBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(cts).toHaveLength(2);
    const ids = cts.map((c) => c.castle_type_id);
    expect(ids).toContain('CT-INTERNAL-INVENTORY-V001');
    expect(ids).toContain('CT-WORKFLOW-V001');
  });

  it('listCastleTypesForBlueprint returns empty when no castle types use the blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const cts = await listCastleTypesForBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(cts).toEqual([]);
  });
});

// --- Relationship: CastleType ↔ CastleUnit ---

describe('CastleType ↔ CastleUnit relationship', () => {
  it('adds a castle unit to a castle type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    const list = await listCastleUnitsForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.castle_unit_id).toBe('CU-WAREHOUSING-INVENTORY-V001');
  });

  it('returns empty array when castle type has no castle units', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const list = await listCastleUnitsForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes a castle unit from a castle type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    await removeCastleUnitFromCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    const list = await listCastleUnitsForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listCastleTypesForCastleUnit returns all castle types using a unit (back-ref)', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleType({
      ...BASE_CASTLE_TYPE,
      castle_type_id: 'CT-WORKFLOW-V001',
      name: 'Workflow Castle',
    });
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToCastleType('CT-INTERNAL-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    await addCastleUnitToCastleType('CT-WORKFLOW-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    const cts = await listCastleTypesForCastleUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(cts).toHaveLength(2);
    const ids = cts.map((c) => c.castle_type_id);
    expect(ids).toContain('CT-INTERNAL-INVENTORY-V001');
    expect(ids).toContain('CT-WORKFLOW-V001');
  });

  it('listCastleTypesForCastleUnit returns empty when no castle types use the unit', async () => {
    await createCastleUnit(BASE_UNIT);
    const cts = await listCastleTypesForCastleUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(cts).toEqual([]);
  });
});

// --- Relationship: CastleType ↔ CastleService ---

describe('CastleType ↔ CastleService relationship', () => {
  it('adds a castle service to a castle type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-INVENTORY-V001');
    const list = await listCastleServicesForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.castle_service_id).toBe('CS-INVENTORY-V001');
  });

  it('returns empty array when castle type has no castle services', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    const list = await listCastleServicesForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes a castle service from a castle type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-INVENTORY-V001');
    await removeCastleServiceFromCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-INVENTORY-V001');
    const list = await listCastleServicesForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listCastleTypesForCastleService returns all castle types using a service (back-ref)', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastleType({
      ...BASE_CASTLE_TYPE,
      castle_type_id: 'CT-WORKFLOW-V001',
      name: 'Workflow Castle',
    });
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToCastleType('CT-INTERNAL-INVENTORY-V001', 'CS-INVENTORY-V001');
    await addCastleServiceToCastleType('CT-WORKFLOW-V001', 'CS-INVENTORY-V001');
    const cts = await listCastleTypesForCastleService('CS-INVENTORY-V001');
    expect(cts).toHaveLength(2);
    const ids = cts.map((c) => c.castle_type_id);
    expect(ids).toContain('CT-INTERNAL-INVENTORY-V001');
    expect(ids).toContain('CT-WORKFLOW-V001');
  });

  it('listCastleTypesForCastleService returns empty when no castle types use the service', async () => {
    await createCastleService(BASE_SERVICE);
    const cts = await listCastleTypesForCastleService('CS-INVENTORY-V001');
    expect(cts).toEqual([]);
  });
});
