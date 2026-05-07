import prisma from '../src/lib/prisma';
import {
  createCastleService,
  getCastleServiceById,
  listCastleServices,
  updateCastleService,
  archiveCastleService,
  addCompositeToService,
  removeCompositeFromService,
  listCompositesInService,
  listServicesForComposite,
  addCompoundToService,
  removeCompoundFromService,
  listCompoundsInService,
  listServicesForCompound,
  addAtomicAssetToService,
  removeAtomicAssetFromService,
  listAtomicAssetsInService,
  listServicesForAtomicAsset,
} from '../src/entities/castleService';
import { createComposite } from '../src/entities/composite';
import { createCompound } from '../src/entities/compound';
import { createAtomicAsset } from '../src/entities/atomicAsset';

beforeEach(async () => {
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

const BASE_COMPOUND = {
  compound_id: 'CMPD-PAGINATION-V001',
  name: 'Pagination Compound',
  description: 'Handles pagination logic',
  version: '1.0.0',
};

const BASE_ASSET = {
  atomic_asset_id: 'AA-FORMAT-QUANTITY-V001',
  name: 'formatQuantity()',
  asset_type: 'FormattingFunction' as const,
  description: 'Formats quantity for display',
  code_location: 'src/lib/formatters.ts',
  version: '1.0.0',
};

// --- createCastleService ---

describe('createCastleService', () => {
  it('creates a service with required fields and defaults', async () => {
    const svc = await createCastleService(BASE_SERVICE);
    expect(svc.castle_service_id).toBe('CS-INVENTORY-V001');
    expect(svc.name).toBe('Inventory Service');
    expect(svc.capability).toBe(BASE_SERVICE.capability);
    expect(svc.status).toBe('Draft');
    expect(svc.backend_modules).toEqual([]);
  });

  it('creates a service with all optional fields', async () => {
    const svc = await createCastleService({
      ...BASE_SERVICE,
      backend_modules: ['inventory.module.ts', 'stock.module.ts'],
      api_contracts: 'GET /inventory, POST /inventory/:id/adjust',
      database_interactions: 'inventory_items table',
      frontend_visibility: 'Inventory dashboard',
      admin_controls: 'Stock threshold settings',
      observability: 'StockAdjustmentEvent emitted',
      logging: 'Adjustment logs via AuditLog service',
      health_checks: 'DB ping, cache check',
      permission_rules: 'canAdjustInventory required',
      status: 'Active',
    });
    expect(svc.backend_modules).toEqual(['inventory.module.ts', 'stock.module.ts']);
    expect(svc.api_contracts).toBe('GET /inventory, POST /inventory/:id/adjust');
    expect(svc.status).toBe('Active');
  });

  it('rejects an invalid castle_service_id format', async () => {
    await expect(
      createCastleService({ ...BASE_SERVICE, castle_service_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid castle_service_id');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createCastleService({ ...BASE_SERVICE, status: 'BOGUS' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects a duplicate castle_service_id', async () => {
    await createCastleService(BASE_SERVICE);
    await expect(createCastleService(BASE_SERVICE)).rejects.toThrow();
  });

  it('deserializes backend_modules as an array, not a string', async () => {
    const svc = await createCastleService({
      ...BASE_SERVICE,
      backend_modules: ['mod-a.ts'],
    });
    expect(Array.isArray(svc.backend_modules)).toBe(true);
    expect(svc.backend_modules[0]).toBe('mod-a.ts');
  });
});

// --- getCastleServiceById ---

describe('getCastleServiceById', () => {
  it('returns null for an unknown ID', async () => {
    const result = await getCastleServiceById('CS-NONEXISTENT-V001');
    expect(result).toBeNull();
  });

  it('returns the service record for a known ID', async () => {
    await createCastleService(BASE_SERVICE);
    const svc = await getCastleServiceById('CS-INVENTORY-V001');
    expect(svc).not.toBeNull();
    expect(svc!.name).toBe('Inventory Service');
    expect(Array.isArray(svc!.backend_modules)).toBe(true);
  });
});

// --- listCastleServices ---

describe('listCastleServices', () => {
  it('returns an empty array when no services exist', async () => {
    const results = await listCastleServices();
    expect(results).toEqual([]);
  });

  it('returns all services', async () => {
    await createCastleService(BASE_SERVICE);
    await createCastleService({
      castle_service_id: 'CS-AUTH-V001',
      name: 'Auth Service',
      capability: 'Handles authentication',
    });
    const results = await listCastleServices();
    expect(results).toHaveLength(2);
  });

  it('filters by status', async () => {
    await createCastleService(BASE_SERVICE);
    await createCastleService({
      castle_service_id: 'CS-AUTH-V001',
      name: 'Auth Service',
      capability: 'Handles authentication',
      status: 'Active',
    });
    const drafts = await listCastleServices({ status: 'Draft' });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.castle_service_id).toBe('CS-INVENTORY-V001');
  });

  it('rejects an invalid status filter', async () => {
    await expect(listCastleServices({ status: 'JUNK' as never })).rejects.toThrow(
      'Invalid status filter',
    );
  });
});

// --- updateCastleService ---

describe('updateCastleService', () => {
  it('updates the name field', async () => {
    await createCastleService(BASE_SERVICE);
    const updated = await updateCastleService('CS-INVENTORY-V001', {
      name: 'Inventory Management Service',
    });
    expect(updated.name).toBe('Inventory Management Service');
    expect(updated.capability).toBe(BASE_SERVICE.capability);
  });

  it('updates backend_modules and deserializes as array', async () => {
    await createCastleService(BASE_SERVICE);
    const updated = await updateCastleService('CS-INVENTORY-V001', {
      backend_modules: ['mod-x.ts', 'mod-y.ts'],
    });
    expect(updated.backend_modules).toEqual(['mod-x.ts', 'mod-y.ts']);
  });

  it('updates status to a valid value', async () => {
    await createCastleService(BASE_SERVICE);
    const updated = await updateCastleService('CS-INVENTORY-V001', { status: 'Active' });
    expect(updated.status).toBe('Active');
  });

  it('rejects an invalid status on update', async () => {
    await createCastleService(BASE_SERVICE);
    await expect(
      updateCastleService('CS-INVENTORY-V001', { status: 'BAD' as never }),
    ).rejects.toThrow('Invalid status');
  });
});

// --- archiveCastleService ---

describe('archiveCastleService', () => {
  it('sets status to Archived', async () => {
    await createCastleService(BASE_SERVICE);
    const archived = await archiveCastleService('CS-INVENTORY-V001');
    expect(archived.status).toBe('Archived');
  });
});

// --- Relationship: CastleService ↔ Composite ---

describe('CastleService ↔ Composite relationship', () => {
  it('adds a composite to a service', async () => {
    await createCastleService(BASE_SERVICE);
    await createComposite(BASE_COMPOSITE);
    await addCompositeToService('CS-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
    const list = await listCompositesInService('CS-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.composite_id).toBe('COMP-INVENTORY-TABLE-V001');
  });

  it('returns empty array when service has no composites', async () => {
    await createCastleService(BASE_SERVICE);
    const list = await listCompositesInService('CS-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes a composite from a service', async () => {
    await createCastleService(BASE_SERVICE);
    await createComposite(BASE_COMPOSITE);
    await addCompositeToService('CS-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
    await removeCompositeFromService('CS-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
    const list = await listCompositesInService('CS-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listServicesForComposite returns all services using a composite (back-ref)', async () => {
    await createCastleService(BASE_SERVICE);
    await createCastleService({
      castle_service_id: 'CS-REPORTING-V001',
      name: 'Reporting Service',
      capability: 'Generates reports',
    });
    await createComposite(BASE_COMPOSITE);
    await addCompositeToService('CS-INVENTORY-V001', 'COMP-INVENTORY-TABLE-V001');
    await addCompositeToService('CS-REPORTING-V001', 'COMP-INVENTORY-TABLE-V001');
    const services = await listServicesForComposite('COMP-INVENTORY-TABLE-V001');
    expect(services).toHaveLength(2);
    const ids = services.map((s) => s.castle_service_id);
    expect(ids).toContain('CS-INVENTORY-V001');
    expect(ids).toContain('CS-REPORTING-V001');
  });

  it('listServicesForComposite returns empty when no services use the composite', async () => {
    await createComposite(BASE_COMPOSITE);
    const services = await listServicesForComposite('COMP-INVENTORY-TABLE-V001');
    expect(services).toEqual([]);
  });
});

// --- Relationship: CastleService ↔ Compound ---

describe('CastleService ↔ Compound relationship', () => {
  it('adds a compound to a service', async () => {
    await createCastleService(BASE_SERVICE);
    await createCompound(BASE_COMPOUND);
    await addCompoundToService('CS-INVENTORY-V001', 'CMPD-PAGINATION-V001');
    const list = await listCompoundsInService('CS-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.compound_id).toBe('CMPD-PAGINATION-V001');
  });

  it('returns empty array when service has no compounds', async () => {
    await createCastleService(BASE_SERVICE);
    const list = await listCompoundsInService('CS-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes a compound from a service', async () => {
    await createCastleService(BASE_SERVICE);
    await createCompound(BASE_COMPOUND);
    await addCompoundToService('CS-INVENTORY-V001', 'CMPD-PAGINATION-V001');
    await removeCompoundFromService('CS-INVENTORY-V001', 'CMPD-PAGINATION-V001');
    const list = await listCompoundsInService('CS-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listServicesForCompound returns all services using a compound (back-ref)', async () => {
    await createCastleService(BASE_SERVICE);
    await createCastleService({
      castle_service_id: 'CS-REPORTING-V001',
      name: 'Reporting Service',
      capability: 'Generates reports',
    });
    await createCompound(BASE_COMPOUND);
    await addCompoundToService('CS-INVENTORY-V001', 'CMPD-PAGINATION-V001');
    await addCompoundToService('CS-REPORTING-V001', 'CMPD-PAGINATION-V001');
    const services = await listServicesForCompound('CMPD-PAGINATION-V001');
    expect(services).toHaveLength(2);
  });
});

// --- Relationship: CastleService ↔ Atomic Asset ---

describe('CastleService ↔ Atomic Asset relationship', () => {
  it('adds an atomic asset to a service', async () => {
    await createCastleService(BASE_SERVICE);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToService('CS-INVENTORY-V001', 'AA-FORMAT-QUANTITY-V001');
    const list = await listAtomicAssetsInService('CS-INVENTORY-V001');
    expect(list).toHaveLength(1);
    expect(list[0]!.atomic_asset_id).toBe('AA-FORMAT-QUANTITY-V001');
  });

  it('returns empty array when service has no atomic assets', async () => {
    await createCastleService(BASE_SERVICE);
    const list = await listAtomicAssetsInService('CS-INVENTORY-V001');
    expect(list).toEqual([]);
  });

  it('removes an atomic asset from a service', async () => {
    await createCastleService(BASE_SERVICE);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToService('CS-INVENTORY-V001', 'AA-FORMAT-QUANTITY-V001');
    await removeAtomicAssetFromService('CS-INVENTORY-V001', 'AA-FORMAT-QUANTITY-V001');
    const list = await listAtomicAssetsInService('CS-INVENTORY-V001');
    expect(list).toHaveLength(0);
  });

  it('listServicesForAtomicAsset returns all services using an asset (back-ref)', async () => {
    await createCastleService(BASE_SERVICE);
    await createCastleService({
      castle_service_id: 'CS-AUTH-V001',
      name: 'Auth Service',
      capability: 'Handles authentication',
    });
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToService('CS-INVENTORY-V001', 'AA-FORMAT-QUANTITY-V001');
    await addAtomicAssetToService('CS-AUTH-V001', 'AA-FORMAT-QUANTITY-V001');
    const services = await listServicesForAtomicAsset('AA-FORMAT-QUANTITY-V001');
    expect(services).toHaveLength(2);
    const ids = services.map((s) => s.castle_service_id);
    expect(ids).toContain('CS-INVENTORY-V001');
    expect(ids).toContain('CS-AUTH-V001');
  });
});
