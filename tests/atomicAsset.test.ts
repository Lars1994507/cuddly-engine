import prisma from '../src/lib/prisma';
import {
  createAtomicAsset,
  getAtomicAssetById,
  listAtomicAssets,
  updateAtomicAsset,
  archiveAtomicAsset,
} from '../src/entities/atomicAsset';

beforeEach(async () => {
  await prisma.atomicAsset.deleteMany({});
});

afterAll(async () => {
  await prisma.atomicAsset.deleteMany({});
  await prisma.$disconnect();
});

const BASE = {
  atomic_asset_id: 'AA-FORMAT-QUANTITY-V001',
  name: 'formatQuantity()',
  asset_type: 'FormattingFunction' as const,
  description: 'Formats a quantity number for display',
  code_location: 'src/lib/formatters.ts',
  version: '1.0.0',
};

describe('createAtomicAsset', () => {
  it('creates a record with valid input', async () => {
    const asset = await createAtomicAsset(BASE);
    expect(asset.atomic_asset_id).toBe('AA-FORMAT-QUANTITY-V001');
    expect(asset.status).toBe('Draft');
    expect(asset.dependencies).toEqual([]);
  });

  it('serializes and deserializes dependencies', async () => {
    const asset = await createAtomicAsset({
      ...BASE,
      dependencies: ['AA-OTHER-UTIL-V001', 'AA-HELPER-FOO-V002'],
    });
    expect(asset.dependencies).toEqual(['AA-OTHER-UTIL-V001', 'AA-HELPER-FOO-V002']);
  });

  it('rejects an invalid ID format', async () => {
    await expect(
      createAtomicAsset({ ...BASE, atomic_asset_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid atomic_asset_id');
  });

  it('rejects an invalid asset_type', async () => {
    await expect(
      createAtomicAsset({ ...BASE, asset_type: 'BadType' as never }),
    ).rejects.toThrow('Invalid asset_type');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createAtomicAsset({ ...BASE, status: 'BadStatus' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects duplicate IDs', async () => {
    await createAtomicAsset(BASE);
    await expect(createAtomicAsset(BASE)).rejects.toThrow();
  });
});

describe('getAtomicAssetById', () => {
  it('returns the asset by ID', async () => {
    await createAtomicAsset(BASE);
    const found = await getAtomicAssetById('AA-FORMAT-QUANTITY-V001');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('formatQuantity()');
  });

  it('returns null for unknown ID', async () => {
    const found = await getAtomicAssetById('AA-DOES-NOT-EXIST-V001');
    expect(found).toBeNull();
  });
});

describe('listAtomicAssets', () => {
  beforeEach(async () => {
    await createAtomicAsset(BASE);
    await createAtomicAsset({
      atomic_asset_id: 'AA-VALIDATE-POSITIVE-NUMBER-V001',
      name: 'validatePositiveNumber()',
      asset_type: 'Validator',
      description: 'Validates that a number is positive',
      code_location: 'src/lib/validators.ts',
      version: '1.0.0',
      status: 'Active',
    });
    await createAtomicAsset({
      atomic_asset_id: 'AA-INVENTORY-STATUS-ENUM-V001',
      name: 'InventoryStatusEnum',
      asset_type: 'Enum',
      description: 'Enum of inventory statuses',
      code_location: 'src/types/inventory.ts',
      version: '1.0.0',
      status: 'Active',
    });
  });

  it('lists all assets', async () => {
    const assets = await listAtomicAssets();
    expect(assets).toHaveLength(3);
  });

  it('filters by asset_type', async () => {
    const assets = await listAtomicAssets({ asset_type: 'Validator' });
    expect(assets).toHaveLength(1);
    expect(assets[0]?.name).toBe('validatePositiveNumber()');
  });

  it('filters by status', async () => {
    const assets = await listAtomicAssets({ status: 'Active' });
    expect(assets).toHaveLength(2);
  });

  it('filters by both asset_type and status', async () => {
    const assets = await listAtomicAssets({ asset_type: 'Enum', status: 'Active' });
    expect(assets).toHaveLength(1);
    expect(assets[0]?.name).toBe('InventoryStatusEnum');
  });

  it('rejects invalid asset_type filter', async () => {
    await expect(listAtomicAssets({ asset_type: 'Bad' as never })).rejects.toThrow(
      'Invalid asset_type filter',
    );
  });
});

describe('updateAtomicAsset', () => {
  it('updates writable fields', async () => {
    await createAtomicAsset(BASE);
    const updated = await updateAtomicAsset('AA-FORMAT-QUANTITY-V001', {
      name: 'formatQty()',
      version: '1.1.0',
      status: 'Active',
    });
    expect(updated.name).toBe('formatQty()');
    expect(updated.version).toBe('1.1.0');
    expect(updated.status).toBe('Active');
  });

  it('updates dependencies', async () => {
    await createAtomicAsset(BASE);
    const updated = await updateAtomicAsset('AA-FORMAT-QUANTITY-V001', {
      dependencies: ['AA-HELPER-V001'],
    });
    expect(updated.dependencies).toEqual(['AA-HELPER-V001']);
  });

  it('rejects an invalid status on update', async () => {
    await createAtomicAsset(BASE);
    await expect(
      updateAtomicAsset('AA-FORMAT-QUANTITY-V001', { status: 'Bad' as never }),
    ).rejects.toThrow('Invalid status');
  });
});

describe('archiveAtomicAsset (soft delete)', () => {
  it('sets status to Archived', async () => {
    await createAtomicAsset(BASE);
    const archived = await archiveAtomicAsset('AA-FORMAT-QUANTITY-V001');
    expect(archived.status).toBe('Archived');
  });

  it('does not hard-delete the record', async () => {
    await createAtomicAsset(BASE);
    await archiveAtomicAsset('AA-FORMAT-QUANTITY-V001');
    const found = await getAtomicAssetById('AA-FORMAT-QUANTITY-V001');
    expect(found).not.toBeNull();
    expect(found?.status).toBe('Archived');
  });
});
