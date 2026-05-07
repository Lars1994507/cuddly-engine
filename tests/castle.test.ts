import prisma from '../src/lib/prisma';
import {
  createCastle,
  getCastleById,
  listCastles,
  updateCastle,
  archiveCastle,
  setCastleType,
  listCastlesForCastleType,
  setBlueprint,
  listCastlesForBlueprint,
  addCastleUnitToCastle,
  removeCastleUnitFromCastle,
  listCastleUnitsForCastle,
  listCastlesForCastleUnit,
  addCastleServiceToCastle,
  removeCastleServiceFromCastle,
  listCastleServicesForCastle,
  listCastlesForCastleService,
  createLocalModification,
  getLocalModificationById,
  listLocalModificationsForCastle,
  updateLocalModification,
  deleteLocalModification,
} from '../src/entities/castle';
import { createCastleType } from '../src/entities/castleType';
import { createBlueprint } from '../src/entities/blueprint';
import { createCastleUnit } from '../src/entities/castleUnit';
import { createCastleService } from '../src/entities/castleService';

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

const BASE_CASTLE = {
  castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
  castle_name: 'Strut Company Warehousing and Inventory Castle',
  version: '1.0.0',
  primary_purpose: 'Manage warehouse stock, adjustments, and inventory reporting for Strut',
};

const BASE_CASTLE_TYPE = {
  castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
  name: 'Internal Inventory Castle',
  description: 'A castle type for internal inventory management applications',
  common_purpose: 'Manage warehouse stock internally',
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

const BASE_LMOD = {
  modification_id: 'LMOD-STRUT-SUPERVISOR-APPROVAL-V001',
  castle_record_id: 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001',
  modified_item: 'Stock Adjustment Approval',
  change_description: 'Quantity adjustment approval required above defined threshold',
  reason: 'Business policy for financial controls',
};

// --- createCastle ---

describe('createCastle', () => {
  it('creates a castle with required fields and defaults to Draft', async () => {
    const castle = await createCastle(BASE_CASTLE);
    expect(castle.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(castle.castle_name).toBe('Strut Company Warehousing and Inventory Castle');
    expect(castle.status).toBe('Draft');
    expect(castle.castle_type_id).toBeNull();
    expect(castle.blueprint_id).toBeNull();
  });

  it('creates a castle with all optional fields', async () => {
    const castle = await createCastle({
      ...BASE_CASTLE,
      status: 'Active',
      build_notes: 'Initial build',
      review_notes: 'Reviewed by team',
      reuse_recommendations: 'Can be reused for similar inventory castles',
    });
    expect(castle.status).toBe('Active');
    expect(castle.build_notes).toBe('Initial build');
    expect(castle.review_notes).toBe('Reviewed by team');
  });

  it('creates a castle with castle_type_id and blueprint_id', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createBlueprint(BASE_BLUEPRINT);
    const castle = await createCastle({
      ...BASE_CASTLE,
      castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
      blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001',
    });
    expect(castle.castle_type_id).toBe('CT-INTERNAL-INVENTORY-V001');
    expect(castle.blueprint_id).toBe('BP-INVENTORY-INTERNAL-TENANT-V001');
  });

  it('rejects an invalid castle_record_id format', async () => {
    await expect(
      createCastle({ ...BASE_CASTLE, castle_record_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid castle_record_id');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createCastle({ ...BASE_CASTLE, status: 'BOGUS' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects a duplicate castle_record_id', async () => {
    await createCastle(BASE_CASTLE);
    await expect(createCastle(BASE_CASTLE)).rejects.toThrow();
  });
});

// --- getCastleById ---

describe('getCastleById', () => {
  it('returns null for an unknown ID', async () => {
    const result = await getCastleById('CSTL-NONEXISTENT-V001');
    expect(result).toBeNull();
  });

  it('returns the castle record for a known ID', async () => {
    await createCastle(BASE_CASTLE);
    const castle = await getCastleById('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(castle).not.toBeNull();
    expect(castle!.castle_name).toBe('Strut Company Warehousing and Inventory Castle');
  });
});

// --- listCastles ---

describe('listCastles', () => {
  it('returns an empty array when no castles exist', async () => {
    expect(await listCastles()).toEqual([]);
  });

  it('returns all castles', async () => {
    await createCastle(BASE_CASTLE);
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin Castle' });
    expect(await listCastles()).toHaveLength(2);
  });

  it('filters by status', async () => {
    await createCastle(BASE_CASTLE);
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin Castle', status: 'Active' });
    const drafts = await listCastles({ status: 'Draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('filters by castle_type_id', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastle({ ...BASE_CASTLE, castle_type_id: 'CT-INTERNAL-INVENTORY-V001' });
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin' });
    const filtered = await listCastles({ castle_type_id: 'CT-INTERNAL-INVENTORY-V001' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('filters by blueprint_id', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createCastle({ ...BASE_CASTLE, blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001' });
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin' });
    const filtered = await listCastles({ blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('rejects an invalid status filter', async () => {
    await expect(listCastles({ status: 'JUNK' as never })).rejects.toThrow('Invalid status filter');
  });
});

// --- updateCastle ---

describe('updateCastle', () => {
  it('updates the castle_name field', async () => {
    await createCastle(BASE_CASTLE);
    const updated = await updateCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', { castle_name: 'Updated Castle' });
    expect(updated.castle_name).toBe('Updated Castle');
    expect(updated.version).toBe('1.0.0');
  });

  it('updates status to a valid value', async () => {
    await createCastle(BASE_CASTLE);
    const updated = await updateCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', { status: 'Active' });
    expect(updated.status).toBe('Active');
  });

  it('rejects an invalid status on update', async () => {
    await createCastle(BASE_CASTLE);
    await expect(
      updateCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', { status: 'BAD' as never }),
    ).rejects.toThrow('Invalid status');
  });
});

// --- archiveCastle ---

describe('archiveCastle', () => {
  it('sets status to Archived', async () => {
    await createCastle(BASE_CASTLE);
    const archived = await archiveCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(archived.status).toBe('Archived');
  });
});

// --- Relationship: Castle → Castle Type ---

describe('Castle → Castle Type relationship', () => {
  it('sets and reads castle_type_id via setCastleType', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastle(BASE_CASTLE);
    await setCastleType('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CT-INTERNAL-INVENTORY-V001');
    const castle = await getCastleById('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(castle!.castle_type_id).toBe('CT-INTERNAL-INVENTORY-V001');
  });

  it('listCastlesForCastleType returns all castles for a type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    await createCastle({ ...BASE_CASTLE, castle_type_id: 'CT-INTERNAL-INVENTORY-V001' });
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin', castle_type_id: 'CT-INTERNAL-INVENTORY-V001' });
    const castles = await listCastlesForCastleType('CT-INTERNAL-INVENTORY-V001');
    expect(castles).toHaveLength(2);
  });

  it('listCastlesForCastleType returns empty when no castles use the type', async () => {
    await createCastleType(BASE_CASTLE_TYPE);
    expect(await listCastlesForCastleType('CT-INTERNAL-INVENTORY-V001')).toEqual([]);
  });
});

// --- Relationship: Castle → Blueprint ---

describe('Castle → Blueprint relationship', () => {
  it('sets and reads blueprint_id via setBlueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createCastle(BASE_CASTLE);
    await setBlueprint('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'BP-INVENTORY-INTERNAL-TENANT-V001');
    const castle = await getCastleById('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(castle!.blueprint_id).toBe('BP-INVENTORY-INTERNAL-TENANT-V001');
  });

  it('listCastlesForBlueprint returns all castles using a blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createCastle({ ...BASE_CASTLE, blueprint_id: 'BP-INVENTORY-INTERNAL-TENANT-V001' });
    const castles = await listCastlesForBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(castles).toHaveLength(1);
    expect(castles[0]!.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
  });

  it('listCastlesForBlueprint returns empty when no castles use the blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    expect(await listCastlesForBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001')).toEqual([]);
  });
});

// --- Relationship: Castle ↔ CastleUnit ---

describe('Castle ↔ CastleUnit relationship', () => {
  it('adds a castle unit to a castle', async () => {
    await createCastle(BASE_CASTLE);
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    const units = await listCastleUnitsForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(units).toHaveLength(1);
    expect(units[0]!.castle_unit_id).toBe('CU-WAREHOUSING-INVENTORY-V001');
  });

  it('returns empty array when castle has no units', async () => {
    await createCastle(BASE_CASTLE);
    expect(await listCastleUnitsForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001')).toEqual([]);
  });

  it('removes a castle unit from a castle', async () => {
    await createCastle(BASE_CASTLE);
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    await removeCastleUnitFromCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    expect(await listCastleUnitsForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001')).toHaveLength(0);
  });

  it('listCastlesForCastleUnit returns all castles using a unit (back-ref)', async () => {
    await createCastle(BASE_CASTLE);
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin' });
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    await addCastleUnitToCastle('CSTL-STRUT-ADMIN-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    const castles = await listCastlesForCastleUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(castles).toHaveLength(2);
    const ids = castles.map((c) => c.castle_record_id);
    expect(ids).toContain('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(ids).toContain('CSTL-STRUT-ADMIN-V001');
  });

  it('listCastlesForCastleUnit returns empty when no castles use the unit', async () => {
    await createCastleUnit(BASE_UNIT);
    expect(await listCastlesForCastleUnit('CU-WAREHOUSING-INVENTORY-V001')).toEqual([]);
  });
});

// --- Relationship: Castle ↔ CastleService ---

describe('Castle ↔ CastleService relationship', () => {
  it('adds a castle service to a castle', async () => {
    await createCastle(BASE_CASTLE);
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-INVENTORY-V001');
    const services = await listCastleServicesForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(services).toHaveLength(1);
    expect(services[0]!.castle_service_id).toBe('CS-INVENTORY-V001');
  });

  it('returns empty array when castle has no services', async () => {
    await createCastle(BASE_CASTLE);
    expect(await listCastleServicesForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001')).toEqual([]);
  });

  it('removes a castle service from a castle', async () => {
    await createCastle(BASE_CASTLE);
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-INVENTORY-V001');
    await removeCastleServiceFromCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-INVENTORY-V001');
    expect(await listCastleServicesForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001')).toHaveLength(0);
  });

  it('listCastlesForCastleService returns all castles using a service (back-ref)', async () => {
    await createCastle(BASE_CASTLE);
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin' });
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001', 'CS-INVENTORY-V001');
    await addCastleServiceToCastle('CSTL-STRUT-ADMIN-V001', 'CS-INVENTORY-V001');
    const castles = await listCastlesForCastleService('CS-INVENTORY-V001');
    expect(castles).toHaveLength(2);
    const ids = castles.map((c) => c.castle_record_id);
    expect(ids).toContain('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(ids).toContain('CSTL-STRUT-ADMIN-V001');
  });

  it('listCastlesForCastleService returns empty when no castles use the service', async () => {
    await createCastleService(BASE_SERVICE);
    expect(await listCastlesForCastleService('CS-INVENTORY-V001')).toEqual([]);
  });
});

// --- Local Modification CRUD ---

describe('createLocalModification', () => {
  it('creates a local modification scoped to a castle', async () => {
    await createCastle(BASE_CASTLE);
    const mod = await createLocalModification(BASE_LMOD);
    expect(mod.modification_id).toBe('LMOD-STRUT-SUPERVISOR-APPROVAL-V001');
    expect(mod.castle_record_id).toBe('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(mod.review_status).toBe('Pending');
    expect(mod.promotion_recommendation).toBe('RemainLocal');
  });

  it('creates a local modification with all optional fields', async () => {
    await createCastle(BASE_CASTLE);
    const mod = await createLocalModification({
      ...BASE_LMOD,
      related_asset_id: 'CS-STOCK-ADJUSTMENT-V001',
      related_asset_type: 'CastleService',
      review_status: 'Approved',
      promotion_recommendation: 'PromoteToService',
      testing_notes: 'Tested in staging',
    });
    expect(mod.review_status).toBe('Approved');
    expect(mod.promotion_recommendation).toBe('PromoteToService');
    expect(mod.related_asset_id).toBe('CS-STOCK-ADJUSTMENT-V001');
    expect(mod.related_asset_type).toBe('CastleService');
  });

  it('rejects an invalid modification_id format', async () => {
    await createCastle(BASE_CASTLE);
    await expect(
      createLocalModification({ ...BASE_LMOD, modification_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid modification_id');
  });

  it('rejects an invalid review_status', async () => {
    await createCastle(BASE_CASTLE);
    await expect(
      createLocalModification({ ...BASE_LMOD, review_status: 'BOGUS' as never }),
    ).rejects.toThrow('Invalid review_status');
  });

  it('rejects an invalid promotion_recommendation', async () => {
    await createCastle(BASE_CASTLE);
    await expect(
      createLocalModification({ ...BASE_LMOD, promotion_recommendation: 'BOGUS' as never }),
    ).rejects.toThrow('Invalid promotion_recommendation');
  });

  it('rejects a duplicate modification_id', async () => {
    await createCastle(BASE_CASTLE);
    await createLocalModification(BASE_LMOD);
    await expect(createLocalModification(BASE_LMOD)).rejects.toThrow();
  });
});

describe('getLocalModificationById', () => {
  it('returns null for an unknown ID', async () => {
    expect(await getLocalModificationById('LMOD-NONEXISTENT-V001')).toBeNull();
  });

  it('returns the modification for a known ID', async () => {
    await createCastle(BASE_CASTLE);
    await createLocalModification(BASE_LMOD);
    const mod = await getLocalModificationById('LMOD-STRUT-SUPERVISOR-APPROVAL-V001');
    expect(mod).not.toBeNull();
    expect(mod!.modified_item).toBe('Stock Adjustment Approval');
  });
});

describe('listLocalModificationsForCastle', () => {
  it('returns all modifications for a castle', async () => {
    await createCastle(BASE_CASTLE);
    await createLocalModification(BASE_LMOD);
    await createLocalModification({
      ...BASE_LMOD,
      modification_id: 'LMOD-STRUT-NAMING-SCHEME-V001',
      modified_item: 'Warehouse Location Naming',
      change_description: 'Custom naming scheme for warehouse locations',
      reason: 'Legacy system compatibility',
    });
    const mods = await listLocalModificationsForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001');
    expect(mods).toHaveLength(2);
  });

  it('returns empty array when castle has no modifications', async () => {
    await createCastle(BASE_CASTLE);
    expect(await listLocalModificationsForCastle('CSTL-STRUT-WAREHOUSE-INVENTORY-V001')).toEqual([]);
  });

  it('does not return modifications from a different castle', async () => {
    await createCastle(BASE_CASTLE);
    await createCastle({ ...BASE_CASTLE, castle_record_id: 'CSTL-STRUT-ADMIN-V001', castle_name: 'Admin' });
    await createLocalModification(BASE_LMOD);
    const mods = await listLocalModificationsForCastle('CSTL-STRUT-ADMIN-V001');
    expect(mods).toHaveLength(0);
  });
});

describe('updateLocalModification', () => {
  it('updates the review_status field', async () => {
    await createCastle(BASE_CASTLE);
    await createLocalModification(BASE_LMOD);
    const updated = await updateLocalModification('LMOD-STRUT-SUPERVISOR-APPROVAL-V001', {
      review_status: 'Approved',
    });
    expect(updated.review_status).toBe('Approved');
  });

  it('updates promotion_recommendation', async () => {
    await createCastle(BASE_CASTLE);
    await createLocalModification(BASE_LMOD);
    const updated = await updateLocalModification('LMOD-STRUT-SUPERVISOR-APPROVAL-V001', {
      promotion_recommendation: 'PromoteToCompound',
    });
    expect(updated.promotion_recommendation).toBe('PromoteToCompound');
  });

  it('rejects an invalid review_status on update', async () => {
    await createCastle(BASE_CASTLE);
    await createLocalModification(BASE_LMOD);
    await expect(
      updateLocalModification('LMOD-STRUT-SUPERVISOR-APPROVAL-V001', { review_status: 'BAD' as never }),
    ).rejects.toThrow('Invalid review_status');
  });
});

describe('deleteLocalModification', () => {
  it('deletes a local modification by ID', async () => {
    await createCastle(BASE_CASTLE);
    await createLocalModification(BASE_LMOD);
    await deleteLocalModification('LMOD-STRUT-SUPERVISOR-APPROVAL-V001');
    expect(await getLocalModificationById('LMOD-STRUT-SUPERVISOR-APPROVAL-V001')).toBeNull();
  });
});
