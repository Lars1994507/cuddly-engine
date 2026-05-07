import prisma from '../src/lib/prisma';
import {
  createComposite,
  getCompositeById,
  listComposites,
  updateComposite,
  archiveComposite,
  addCompoundToComposite,
  removeCompoundFromComposite,
  listCompoundsInComposite,
  listCompositesForCompound,
  addAtomicAssetToComposite,
  removeAtomicAssetFromComposite,
  listAtomicAssetsInComposite,
  listCompositesForAtomicAsset,
} from '../src/entities/composite';
import { createCompound } from '../src/entities/compound';
import { createAtomicAsset } from '../src/entities/atomicAsset';

beforeEach(async () => {
  await prisma.compositeAtomicAsset.deleteMany({});
  await prisma.compositeCompound.deleteMany({});
  await prisma.composite.deleteMany({});
  await prisma.compoundAtomicAsset.deleteMany({});
  await prisma.compound.deleteMany({});
  await prisma.atomicAsset.deleteMany({});
});

afterAll(async () => {
  await prisma.compositeAtomicAsset.deleteMany({});
  await prisma.compositeCompound.deleteMany({});
  await prisma.composite.deleteMany({});
  await prisma.compoundAtomicAsset.deleteMany({});
  await prisma.compound.deleteMany({});
  await prisma.atomicAsset.deleteMany({});
  await prisma.$disconnect();
});

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

// --- CRUD ---

describe('createComposite', () => {
  it('creates a record with valid input', async () => {
    const composite = await createComposite(BASE_COMPOSITE);
    expect(composite.composite_id).toBe('COMP-INVENTORY-TABLE-V001');
    expect(composite.status).toBe('Draft');
    expect(composite.ui_backend_scope).toBe('UI');
    expect(composite.usage_references).toEqual([]);
  });

  it('accepts an explicit status', async () => {
    const composite = await createComposite({ ...BASE_COMPOSITE, status: 'Active' });
    expect(composite.status).toBe('Active');
  });

  it('stores usage_references as JSON', async () => {
    const composite = await createComposite({
      ...BASE_COMPOSITE,
      usage_references: ['warehouse-page', 'dashboard'],
    });
    expect(composite.usage_references).toEqual(['warehouse-page', 'dashboard']);
  });

  it('accepts Backend scope', async () => {
    const composite = await createComposite({
      ...BASE_COMPOSITE,
      composite_id: 'COMP-STOCK-CALCULATOR-V001',
      ui_backend_scope: 'Backend',
    });
    expect(composite.ui_backend_scope).toBe('Backend');
  });

  it('accepts Both scope', async () => {
    const composite = await createComposite({
      ...BASE_COMPOSITE,
      composite_id: 'COMP-QUANTITY-ADJUSTMENT-V001',
      ui_backend_scope: 'Both',
    });
    expect(composite.ui_backend_scope).toBe('Both');
  });

  it('rejects an invalid ID format', async () => {
    await expect(
      createComposite({ ...BASE_COMPOSITE, composite_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid composite_id');
  });

  it('rejects an invalid ui_backend_scope', async () => {
    await expect(
      createComposite({ ...BASE_COMPOSITE, ui_backend_scope: 'Frontend' as never }),
    ).rejects.toThrow('Invalid ui_backend_scope');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createComposite({ ...BASE_COMPOSITE, status: 'BadStatus' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects duplicate IDs', async () => {
    await createComposite(BASE_COMPOSITE);
    await expect(createComposite(BASE_COMPOSITE)).rejects.toThrow();
  });
});

describe('getCompositeById', () => {
  it('returns the composite by ID', async () => {
    await createComposite(BASE_COMPOSITE);
    const found = await getCompositeById('COMP-INVENTORY-TABLE-V001');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Inventory Table');
  });

  it('returns null for unknown ID', async () => {
    const found = await getCompositeById('COMP-DOES-NOT-EXIST-V001');
    expect(found).toBeNull();
  });
});

describe('listComposites', () => {
  beforeEach(async () => {
    await createComposite(BASE_COMPOSITE);
    await createComposite({
      composite_id: 'COMP-ITEM-DETAIL-V001',
      name: 'Item Detail Page',
      description: 'Shows item detail',
      version: '1.0.0',
      ui_backend_scope: 'UI',
      status: 'Active',
    });
    await createComposite({
      composite_id: 'COMP-STOCK-ADJUSTMENT-V001',
      name: 'Stock Adjustment Drawer',
      description: 'Handles stock adjustments',
      version: '1.0.0',
      ui_backend_scope: 'Both',
      status: 'Active',
    });
  });

  it('lists all composites', async () => {
    const composites = await listComposites();
    expect(composites).toHaveLength(3);
  });

  it('filters by status', async () => {
    const composites = await listComposites({ status: 'Active' });
    expect(composites).toHaveLength(2);
  });

  it('filters by ui_backend_scope', async () => {
    const composites = await listComposites({ ui_backend_scope: 'UI' });
    expect(composites).toHaveLength(2);
  });

  it('filters by both status and ui_backend_scope', async () => {
    const composites = await listComposites({ status: 'Active', ui_backend_scope: 'Both' });
    expect(composites).toHaveLength(1);
    expect(composites[0]?.composite_id).toBe('COMP-STOCK-ADJUSTMENT-V001');
  });

  it('returns empty when no match', async () => {
    const composites = await listComposites({ status: 'Deprecated' });
    expect(composites).toHaveLength(0);
  });

  it('rejects invalid status filter', async () => {
    await expect(listComposites({ status: 'Bad' as never })).rejects.toThrow('Invalid status filter');
  });

  it('rejects invalid ui_backend_scope filter', async () => {
    await expect(listComposites({ ui_backend_scope: 'Bad' as never })).rejects.toThrow(
      'Invalid ui_backend_scope filter',
    );
  });
});

describe('updateComposite', () => {
  it('updates writable fields', async () => {
    await createComposite(BASE_COMPOSITE);
    const updated = await updateComposite('COMP-INVENTORY-TABLE-V001', {
      name: 'Inventory Grid',
      version: '1.1.0',
      status: 'Active',
      ui_backend_scope: 'Both',
    });
    expect(updated.name).toBe('Inventory Grid');
    expect(updated.version).toBe('1.1.0');
    expect(updated.status).toBe('Active');
    expect(updated.ui_backend_scope).toBe('Both');
  });

  it('updates usage_references', async () => {
    await createComposite(BASE_COMPOSITE);
    const updated = await updateComposite('COMP-INVENTORY-TABLE-V001', {
      usage_references: ['admin-page'],
    });
    expect(updated.usage_references).toEqual(['admin-page']);
  });

  it('rejects an invalid status on update', async () => {
    await createComposite(BASE_COMPOSITE);
    await expect(
      updateComposite('COMP-INVENTORY-TABLE-V001', { status: 'Bad' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects an invalid ui_backend_scope on update', async () => {
    await createComposite(BASE_COMPOSITE);
    await expect(
      updateComposite('COMP-INVENTORY-TABLE-V001', { ui_backend_scope: 'Bad' as never }),
    ).rejects.toThrow('Invalid ui_backend_scope');
  });
});

describe('archiveComposite (soft delete)', () => {
  it('sets status to Archived', async () => {
    await createComposite(BASE_COMPOSITE);
    const archived = await archiveComposite('COMP-INVENTORY-TABLE-V001');
    expect(archived.status).toBe('Archived');
  });

  it('does not hard-delete the record', async () => {
    await createComposite(BASE_COMPOSITE);
    await archiveComposite('COMP-INVENTORY-TABLE-V001');
    const found = await getCompositeById('COMP-INVENTORY-TABLE-V001');
    expect(found).not.toBeNull();
    expect(found?.status).toBe('Archived');
  });
});

// --- Composite ↔ Compound relationships ---

describe('addCompoundToComposite', () => {
  it('links a Compound to a Composite', async () => {
    await createComposite(BASE_COMPOSITE);
    await createCompound(BASE_COMPOUND);
    await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001');
    const compounds = await listCompoundsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(compounds).toHaveLength(1);
    expect(compounds[0]?.compound_id).toBe('CMPD-PAGINATION-V001');
  });

  it('rejects duplicate links', async () => {
    await createComposite(BASE_COMPOSITE);
    await createCompound(BASE_COMPOUND);
    await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001');
    await expect(
      addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001'),
    ).rejects.toThrow();
  });
});

describe('removeCompoundFromComposite', () => {
  it('removes the link', async () => {
    await createComposite(BASE_COMPOSITE);
    await createCompound(BASE_COMPOUND);
    await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001');
    await removeCompoundFromComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001');
    const compounds = await listCompoundsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(compounds).toHaveLength(0);
  });
});

describe('listCompoundsInComposite', () => {
  it('returns all Compounds linked to a Composite', async () => {
    await createComposite(BASE_COMPOSITE);
    await createCompound(BASE_COMPOUND);
    await createCompound({
      compound_id: 'CMPD-DATE-RANGE-FILTER-V001',
      name: 'Date Range Filter',
      description: 'Filters by date range',
      version: '1.0.0',
    });
    await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001');
    await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-DATE-RANGE-FILTER-V001');
    const compounds = await listCompoundsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(compounds).toHaveLength(2);
  });

  it('returns empty array when Composite has no Compounds', async () => {
    await createComposite(BASE_COMPOSITE);
    const compounds = await listCompoundsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(compounds).toHaveLength(0);
  });
});

describe('listCompositesForCompound (back-reference)', () => {
  it('returns all Composites that use a given Compound', async () => {
    await createCompound(BASE_COMPOUND);
    await createComposite(BASE_COMPOSITE);
    await createComposite({
      composite_id: 'COMP-ITEM-DETAIL-V001',
      name: 'Item Detail Page',
      description: 'Shows item detail',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addCompoundToComposite('COMP-INVENTORY-TABLE-V001', 'CMPD-PAGINATION-V001');
    await addCompoundToComposite('COMP-ITEM-DETAIL-V001', 'CMPD-PAGINATION-V001');
    const composites = await listCompositesForCompound('CMPD-PAGINATION-V001');
    expect(composites).toHaveLength(2);
    const ids = composites.map((c) => c.composite_id);
    expect(ids).toContain('COMP-INVENTORY-TABLE-V001');
    expect(ids).toContain('COMP-ITEM-DETAIL-V001');
  });

  it('returns empty when Compound is not used by any Composite', async () => {
    await createCompound(BASE_COMPOUND);
    const composites = await listCompositesForCompound('CMPD-PAGINATION-V001');
    expect(composites).toHaveLength(0);
  });
});

// --- Composite ↔ Atomic Asset relationships (direct) ---

describe('addAtomicAssetToComposite', () => {
  it('links an Atomic Asset to a Composite', async () => {
    await createComposite(BASE_COMPOSITE);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToComposite('COMP-INVENTORY-TABLE-V001', 'AA-FORMAT-QUANTITY-V001');
    const assets = await listAtomicAssetsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(assets).toHaveLength(1);
    expect(assets[0]?.atomic_asset_id).toBe('AA-FORMAT-QUANTITY-V001');
  });

  it('rejects duplicate links', async () => {
    await createComposite(BASE_COMPOSITE);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToComposite('COMP-INVENTORY-TABLE-V001', 'AA-FORMAT-QUANTITY-V001');
    await expect(
      addAtomicAssetToComposite('COMP-INVENTORY-TABLE-V001', 'AA-FORMAT-QUANTITY-V001'),
    ).rejects.toThrow();
  });
});

describe('removeAtomicAssetFromComposite', () => {
  it('removes the link', async () => {
    await createComposite(BASE_COMPOSITE);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToComposite('COMP-INVENTORY-TABLE-V001', 'AA-FORMAT-QUANTITY-V001');
    await removeAtomicAssetFromComposite(
      'COMP-INVENTORY-TABLE-V001',
      'AA-FORMAT-QUANTITY-V001',
    );
    const assets = await listAtomicAssetsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(assets).toHaveLength(0);
  });
});

describe('listAtomicAssetsInComposite', () => {
  it('returns all Atomic Assets directly linked to a Composite', async () => {
    await createComposite(BASE_COMPOSITE);
    await createAtomicAsset(BASE_ASSET);
    await createAtomicAsset({
      atomic_asset_id: 'AA-INVENTORY-STATUS-ENUM-V001',
      name: 'InventoryStatusEnum',
      asset_type: 'Enum',
      description: 'Enum for inventory status values',
      code_location: 'src/lib/enums.ts',
      version: '1.0.0',
    });
    await addAtomicAssetToComposite('COMP-INVENTORY-TABLE-V001', 'AA-FORMAT-QUANTITY-V001');
    await addAtomicAssetToComposite(
      'COMP-INVENTORY-TABLE-V001',
      'AA-INVENTORY-STATUS-ENUM-V001',
    );
    const assets = await listAtomicAssetsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(assets).toHaveLength(2);
  });

  it('returns empty array when Composite has no direct Atomic Assets', async () => {
    await createComposite(BASE_COMPOSITE);
    const assets = await listAtomicAssetsInComposite('COMP-INVENTORY-TABLE-V001');
    expect(assets).toHaveLength(0);
  });
});

describe('listCompositesForAtomicAsset (back-reference)', () => {
  it('returns all Composites that directly use a given Atomic Asset', async () => {
    await createAtomicAsset(BASE_ASSET);
    await createComposite(BASE_COMPOSITE);
    await createComposite({
      composite_id: 'COMP-ITEM-DETAIL-V001',
      name: 'Item Detail Page',
      description: 'Shows item detail',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addAtomicAssetToComposite('COMP-INVENTORY-TABLE-V001', 'AA-FORMAT-QUANTITY-V001');
    await addAtomicAssetToComposite('COMP-ITEM-DETAIL-V001', 'AA-FORMAT-QUANTITY-V001');
    const composites = await listCompositesForAtomicAsset('AA-FORMAT-QUANTITY-V001');
    expect(composites).toHaveLength(2);
    const ids = composites.map((c) => c.composite_id);
    expect(ids).toContain('COMP-INVENTORY-TABLE-V001');
    expect(ids).toContain('COMP-ITEM-DETAIL-V001');
  });

  it('returns empty when Atomic Asset is not directly used by any Composite', async () => {
    await createAtomicAsset(BASE_ASSET);
    const composites = await listCompositesForAtomicAsset('AA-FORMAT-QUANTITY-V001');
    expect(composites).toHaveLength(0);
  });
});
