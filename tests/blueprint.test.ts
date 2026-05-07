import prisma from '../src/lib/prisma';
import {
  createBlueprint,
  getBlueprintById,
  listBlueprints,
  updateBlueprint,
  archiveBlueprint,
  addCastleUnitToBlueprint,
  removeCastleUnitFromBlueprint,
  listCastleUnitsInBlueprint,
  listBlueprintsForCastleUnit,
  addCastleServiceToBlueprint,
  removeCastleServiceFromBlueprint,
  listCastleServicesInBlueprint,
  listBlueprintsForCastleService,
  addCompositeToBlueprint,
  removeCompositeFromBlueprint,
  listCompositesInBlueprint,
  listBlueprintsForComposite,
} from '../src/entities/blueprint';
import { createCastleUnit } from '../src/entities/castleUnit';
import { createCastleService } from '../src/entities/castleService';
import { createComposite } from '../src/entities/composite';

beforeEach(async () => {
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

const BASE_COMPOSITE = {
  composite_id: 'COMP-INVENTORY-TABLE-V001',
  name: 'Inventory Table',
  description: 'Displays inventory items in a paginated table',
  version: '1.0.0',
  ui_backend_scope: 'UI' as const,
};

// --- createBlueprint ---

describe('createBlueprint', () => {
  it('creates a blueprint with required fields and defaults to Draft', async () => {
    const bp = await createBlueprint(BASE_BLUEPRINT);
    expect(bp.blueprint_id).toBe('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(bp.name).toBe('Inventory Application - Internal Tenant');
    expect(bp.status).toBe('Draft');
    expect(bp.default_pages).toEqual([]);
    expect(bp.default_components).toEqual([]);
    expect(bp.required_review_steps).toEqual([]);
  });

  it('creates a blueprint with all optional fields', async () => {
    const bp = await createBlueprint({
      ...BASE_BLUEPRINT,
      status: 'Active',
      frontend_structure: 'React SPA with sidebar nav',
      auth_assumptions: 'JWT-based authentication',
      default_pages: ['Dashboard', 'Inventory List'],
      required_review_steps: ['QA review', 'Security review'],
    });
    expect(bp.status).toBe('Active');
    expect(bp.frontend_structure).toBe('React SPA with sidebar nav');
    expect(bp.default_pages).toEqual(['Dashboard', 'Inventory List']);
    expect(bp.required_review_steps).toEqual(['QA review', 'Security review']);
  });

  it('rejects an invalid blueprint_id format', async () => {
    await expect(
      createBlueprint({ ...BASE_BLUEPRINT, blueprint_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid blueprint_id');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createBlueprint({ ...BASE_BLUEPRINT, status: 'BOGUS' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects a duplicate blueprint_id', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await expect(createBlueprint(BASE_BLUEPRINT)).rejects.toThrow();
  });
});

// --- getBlueprintById ---

describe('getBlueprintById', () => {
  it('returns null for an unknown ID', async () => {
    const result = await getBlueprintById('BP-NONEXISTENT-V001');
    expect(result).toBeNull();
  });

  it('returns the blueprint record for a known ID', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const bp = await getBlueprintById('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(bp).not.toBeNull();
    expect(bp!.name).toBe('Inventory Application - Internal Tenant');
  });
});

// --- listBlueprints ---

describe('listBlueprints', () => {
  it('returns an empty array when no blueprints exist', async () => {
    const results = await listBlueprints();
    expect(results).toEqual([]);
  });

  it('returns all blueprints', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createBlueprint({
      ...BASE_BLUEPRINT,
      blueprint_id: 'BP-REPORTING-V001',
      name: 'Reporting Blueprint',
      category: 'Reporting',
    });
    const results = await listBlueprints();
    expect(results).toHaveLength(2);
  });

  it('filters by status', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createBlueprint({
      ...BASE_BLUEPRINT,
      blueprint_id: 'BP-REPORTING-V001',
      name: 'Reporting Blueprint',
      category: 'Reporting',
      status: 'Active',
    });
    const drafts = await listBlueprints({ status: 'Draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.blueprint_id).toBe('BP-INVENTORY-INTERNAL-TENANT-V001');
  });

  it('filters by category', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createBlueprint({
      ...BASE_BLUEPRINT,
      blueprint_id: 'BP-REPORTING-V001',
      name: 'Reporting Blueprint',
      category: 'Reporting',
    });
    const results = await listBlueprints({ category: 'Inventory' });
    expect(results).toHaveLength(1);
    expect(results[0]!.category).toBe('Inventory');
  });

  it('rejects an invalid status filter', async () => {
    await expect(listBlueprints({ status: 'JUNK' as never })).rejects.toThrow(
      'Invalid status filter',
    );
  });
});

// --- updateBlueprint ---

describe('updateBlueprint', () => {
  it('updates the name field', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const updated = await updateBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', {
      name: 'Updated Inventory Blueprint',
    });
    expect(updated.name).toBe('Updated Inventory Blueprint');
    expect(updated.category).toBe(BASE_BLUEPRINT.category);
  });

  it('updates status to a valid value', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const updated = await updateBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', {
      status: 'Active',
    });
    expect(updated.status).toBe('Active');
  });

  it('updates array fields', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const updated = await updateBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', {
      default_pages: ['Home', 'Inventory'],
    });
    expect(updated.default_pages).toEqual(['Home', 'Inventory']);
  });

  it('rejects an invalid status on update', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await expect(
      updateBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', { status: 'BAD' as never }),
    ).rejects.toThrow('Invalid status');
  });
});

// --- archiveBlueprint ---

describe('archiveBlueprint', () => {
  it('sets status to Archived', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const archived = await archiveBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(archived.status).toBe('Archived');
  });
});

// --- Relationship: Blueprint ↔ CastleUnit ---

describe('Blueprint ↔ CastleUnit relationship', () => {
  it('adds a castle unit to a blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'CU-WAREHOUSING-INVENTORY-V001',
    );
    const list = await listCastleUnitsInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.castle_unit_id).toBe('CU-WAREHOUSING-INVENTORY-V001');
  });

  it('returns empty array when blueprint has no castle units', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const list = await listCastleUnitsInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toEqual([]);
  });

  it('removes a castle unit from a blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'CU-WAREHOUSING-INVENTORY-V001',
    );
    await removeCastleUnitFromBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'CU-WAREHOUSING-INVENTORY-V001',
    );
    const list = await listCastleUnitsInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toHaveLength(0);
  });

  it('listBlueprintsForCastleUnit returns all blueprints using a unit (back-ref)', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createBlueprint({
      ...BASE_BLUEPRINT,
      blueprint_id: 'BP-REPORTING-V001',
      name: 'Reporting Blueprint',
      category: 'Reporting',
    });
    await createCastleUnit(BASE_UNIT);
    await addCastleUnitToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'CU-WAREHOUSING-INVENTORY-V001',
    );
    await addCastleUnitToBlueprint('BP-REPORTING-V001', 'CU-WAREHOUSING-INVENTORY-V001');
    const bps = await listBlueprintsForCastleUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(bps).toHaveLength(2);
    const ids = bps.map((b) => b.blueprint_id);
    expect(ids).toContain('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(ids).toContain('BP-REPORTING-V001');
  });

  it('listBlueprintsForCastleUnit returns empty when no blueprints use the unit', async () => {
    await createCastleUnit(BASE_UNIT);
    const bps = await listBlueprintsForCastleUnit('CU-WAREHOUSING-INVENTORY-V001');
    expect(bps).toEqual([]);
  });
});

// --- Relationship: Blueprint ↔ CastleService ---

describe('Blueprint ↔ CastleService relationship', () => {
  it('adds a castle service to a blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'CS-INVENTORY-V001',
    );
    const list = await listCastleServicesInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.castle_service_id).toBe('CS-INVENTORY-V001');
  });

  it('returns empty array when blueprint has no castle services', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const list = await listCastleServicesInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toEqual([]);
  });

  it('removes a castle service from a blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'CS-INVENTORY-V001',
    );
    await removeCastleServiceFromBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'CS-INVENTORY-V001',
    );
    const list = await listCastleServicesInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toHaveLength(0);
  });

  it('listBlueprintsForCastleService returns all blueprints using a service (back-ref)', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createBlueprint({
      ...BASE_BLUEPRINT,
      blueprint_id: 'BP-REPORTING-V001',
      name: 'Reporting Blueprint',
      category: 'Reporting',
    });
    await createCastleService(BASE_SERVICE);
    await addCastleServiceToBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001', 'CS-INVENTORY-V001');
    await addCastleServiceToBlueprint('BP-REPORTING-V001', 'CS-INVENTORY-V001');
    const bps = await listBlueprintsForCastleService('CS-INVENTORY-V001');
    expect(bps).toHaveLength(2);
    const ids = bps.map((b) => b.blueprint_id);
    expect(ids).toContain('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(ids).toContain('BP-REPORTING-V001');
  });

  it('listBlueprintsForCastleService returns empty when no blueprints use the service', async () => {
    await createCastleService(BASE_SERVICE);
    const bps = await listBlueprintsForCastleService('CS-INVENTORY-V001');
    expect(bps).toEqual([]);
  });
});

// --- Relationship: Blueprint ↔ Composite ---

describe('Blueprint ↔ Composite relationship', () => {
  it('adds a composite to a blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createComposite(BASE_COMPOSITE);
    await addCompositeToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'COMP-INVENTORY-TABLE-V001',
    );
    const list = await listCompositesInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.composite_id).toBe('COMP-INVENTORY-TABLE-V001');
  });

  it('returns empty array when blueprint has no composites', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    const list = await listCompositesInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toEqual([]);
  });

  it('removes a composite from a blueprint', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createComposite(BASE_COMPOSITE);
    await addCompositeToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'COMP-INVENTORY-TABLE-V001',
    );
    await removeCompositeFromBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'COMP-INVENTORY-TABLE-V001',
    );
    const list = await listCompositesInBlueprint('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(list).toHaveLength(0);
  });

  it('listBlueprintsForComposite returns all blueprints using a composite (back-ref)', async () => {
    await createBlueprint(BASE_BLUEPRINT);
    await createBlueprint({
      ...BASE_BLUEPRINT,
      blueprint_id: 'BP-REPORTING-V001',
      name: 'Reporting Blueprint',
      category: 'Reporting',
    });
    await createComposite(BASE_COMPOSITE);
    await addCompositeToBlueprint(
      'BP-INVENTORY-INTERNAL-TENANT-V001',
      'COMP-INVENTORY-TABLE-V001',
    );
    await addCompositeToBlueprint('BP-REPORTING-V001', 'COMP-INVENTORY-TABLE-V001');
    const bps = await listBlueprintsForComposite('COMP-INVENTORY-TABLE-V001');
    expect(bps).toHaveLength(2);
    const ids = bps.map((b) => b.blueprint_id);
    expect(ids).toContain('BP-INVENTORY-INTERNAL-TENANT-V001');
    expect(ids).toContain('BP-REPORTING-V001');
  });

  it('listBlueprintsForComposite returns empty when no blueprints use the composite', async () => {
    await createComposite(BASE_COMPOSITE);
    const bps = await listBlueprintsForComposite('COMP-INVENTORY-TABLE-V001');
    expect(bps).toEqual([]);
  });
});
