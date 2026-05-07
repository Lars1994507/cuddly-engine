import prisma from '../src/lib/prisma';
import {
  createCompound,
  getCompoundById,
  listCompounds,
  updateCompound,
  archiveCompound,
  addAtomicAssetToCompound,
  removeAtomicAssetFromCompound,
  listAtomicAssetsInCompound,
  listCompoundsForAtomicAsset,
} from '../src/entities/compound';
import { createAtomicAsset } from '../src/entities/atomicAsset';

beforeEach(async () => {
  await prisma.compoundAtomicAsset.deleteMany({});
  await prisma.compound.deleteMany({});
  await prisma.atomicAsset.deleteMany({});
});

afterAll(async () => {
  await prisma.compoundAtomicAsset.deleteMany({});
  await prisma.compound.deleteMany({});
  await prisma.atomicAsset.deleteMany({});
  await prisma.$disconnect();
});

const BASE_COMPOUND = {
  compound_id: 'CMPD-QUANTITY-VALIDATION-V001',
  name: 'Quantity Validation Compound',
  description: 'Validates and formats quantity values',
  version: '1.0.0',
};

const BASE_ASSET = {
  atomic_asset_id: 'AA-VALIDATE-POSITIVE-NUMBER-V001',
  name: 'validatePositiveNumber()',
  asset_type: 'Validator' as const,
  description: 'Validates that a number is positive',
  code_location: 'src/lib/validators.ts',
  version: '1.0.0',
};

// --- CRUD ---

describe('createCompound', () => {
  it('creates a record with valid input', async () => {
    const compound = await createCompound(BASE_COMPOUND);
    expect(compound.compound_id).toBe('CMPD-QUANTITY-VALIDATION-V001');
    expect(compound.status).toBe('Draft');
    expect(compound.testing_notes).toBeNull();
  });

  it('accepts an explicit status', async () => {
    const compound = await createCompound({ ...BASE_COMPOUND, status: 'Active' });
    expect(compound.status).toBe('Active');
  });

  it('stores testing_notes when provided', async () => {
    const compound = await createCompound({
      ...BASE_COMPOUND,
      testing_notes: 'All edge cases covered',
    });
    expect(compound.testing_notes).toBe('All edge cases covered');
  });

  it('rejects an invalid ID format', async () => {
    await expect(
      createCompound({ ...BASE_COMPOUND, compound_id: 'INVALID-ID' }),
    ).rejects.toThrow('Invalid compound_id');
  });

  it('rejects an invalid status', async () => {
    await expect(
      createCompound({ ...BASE_COMPOUND, status: 'BadStatus' as never }),
    ).rejects.toThrow('Invalid status');
  });

  it('rejects duplicate IDs', async () => {
    await createCompound(BASE_COMPOUND);
    await expect(createCompound(BASE_COMPOUND)).rejects.toThrow();
  });
});

describe('getCompoundById', () => {
  it('returns the compound by ID', async () => {
    await createCompound(BASE_COMPOUND);
    const found = await getCompoundById('CMPD-QUANTITY-VALIDATION-V001');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Quantity Validation Compound');
  });

  it('returns null for unknown ID', async () => {
    const found = await getCompoundById('CMPD-DOES-NOT-EXIST-V001');
    expect(found).toBeNull();
  });
});

describe('listCompounds', () => {
  beforeEach(async () => {
    await createCompound(BASE_COMPOUND);
    await createCompound({
      compound_id: 'CMPD-DATE-RANGE-FILTER-V001',
      name: 'Date Range Filter',
      description: 'Filters data by date range',
      version: '1.0.0',
      status: 'Active',
    });
    await createCompound({
      compound_id: 'CMPD-PAGINATION-V001',
      name: 'Pagination Compound',
      description: 'Handles pagination logic',
      version: '1.0.0',
      status: 'Active',
    });
  });

  it('lists all compounds', async () => {
    const compounds = await listCompounds();
    expect(compounds).toHaveLength(3);
  });

  it('filters by status', async () => {
    const compounds = await listCompounds({ status: 'Active' });
    expect(compounds).toHaveLength(2);
  });

  it('returns empty when no match', async () => {
    const compounds = await listCompounds({ status: 'Deprecated' });
    expect(compounds).toHaveLength(0);
  });

  it('rejects invalid status filter', async () => {
    await expect(listCompounds({ status: 'Bad' as never })).rejects.toThrow(
      'Invalid status filter',
    );
  });
});

describe('updateCompound', () => {
  it('updates writable fields', async () => {
    await createCompound(BASE_COMPOUND);
    const updated = await updateCompound('CMPD-QUANTITY-VALIDATION-V001', {
      name: 'Qty Validation',
      version: '1.1.0',
      status: 'Active',
    });
    expect(updated.name).toBe('Qty Validation');
    expect(updated.version).toBe('1.1.0');
    expect(updated.status).toBe('Active');
  });

  it('rejects an invalid status on update', async () => {
    await createCompound(BASE_COMPOUND);
    await expect(
      updateCompound('CMPD-QUANTITY-VALIDATION-V001', { status: 'Bad' as never }),
    ).rejects.toThrow('Invalid status');
  });
});

describe('archiveCompound (soft delete)', () => {
  it('sets status to Archived', async () => {
    await createCompound(BASE_COMPOUND);
    const archived = await archiveCompound('CMPD-QUANTITY-VALIDATION-V001');
    expect(archived.status).toBe('Archived');
  });

  it('does not hard-delete the record', async () => {
    await createCompound(BASE_COMPOUND);
    await archiveCompound('CMPD-QUANTITY-VALIDATION-V001');
    const found = await getCompoundById('CMPD-QUANTITY-VALIDATION-V001');
    expect(found).not.toBeNull();
    expect(found?.status).toBe('Archived');
  });
});

// --- Relationships ---

describe('addAtomicAssetToCompound', () => {
  it('links an Atomic Asset to a Compound', async () => {
    await createCompound(BASE_COMPOUND);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToCompound(
      'CMPD-QUANTITY-VALIDATION-V001',
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    const assets = await listAtomicAssetsInCompound('CMPD-QUANTITY-VALIDATION-V001');
    expect(assets).toHaveLength(1);
    expect(assets[0]?.atomic_asset_id).toBe('AA-VALIDATE-POSITIVE-NUMBER-V001');
  });

  it('rejects duplicate links', async () => {
    await createCompound(BASE_COMPOUND);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToCompound(
      'CMPD-QUANTITY-VALIDATION-V001',
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    await expect(
      addAtomicAssetToCompound(
        'CMPD-QUANTITY-VALIDATION-V001',
        'AA-VALIDATE-POSITIVE-NUMBER-V001',
      ),
    ).rejects.toThrow();
  });
});

describe('removeAtomicAssetFromCompound', () => {
  it('removes the link', async () => {
    await createCompound(BASE_COMPOUND);
    await createAtomicAsset(BASE_ASSET);
    await addAtomicAssetToCompound(
      'CMPD-QUANTITY-VALIDATION-V001',
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    await removeAtomicAssetFromCompound(
      'CMPD-QUANTITY-VALIDATION-V001',
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    const assets = await listAtomicAssetsInCompound('CMPD-QUANTITY-VALIDATION-V001');
    expect(assets).toHaveLength(0);
  });
});

describe('listAtomicAssetsInCompound', () => {
  it('returns all Atomic Assets linked to a Compound', async () => {
    await createCompound(BASE_COMPOUND);
    await createAtomicAsset(BASE_ASSET);
    await createAtomicAsset({
      atomic_asset_id: 'AA-FORMAT-QUANTITY-V001',
      name: 'formatQuantity()',
      asset_type: 'FormattingFunction',
      description: 'Formats quantity for display',
      code_location: 'src/lib/formatters.ts',
      version: '1.0.0',
    });
    await addAtomicAssetToCompound(
      'CMPD-QUANTITY-VALIDATION-V001',
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    await addAtomicAssetToCompound(
      'CMPD-QUANTITY-VALIDATION-V001',
      'AA-FORMAT-QUANTITY-V001',
    );
    const assets = await listAtomicAssetsInCompound('CMPD-QUANTITY-VALIDATION-V001');
    expect(assets).toHaveLength(2);
  });

  it('returns empty array for compound with no assets', async () => {
    await createCompound(BASE_COMPOUND);
    const assets = await listAtomicAssetsInCompound('CMPD-QUANTITY-VALIDATION-V001');
    expect(assets).toHaveLength(0);
  });
});

describe('listCompoundsForAtomicAsset (back-reference)', () => {
  it('returns all Compounds that use a given Atomic Asset', async () => {
    await createAtomicAsset(BASE_ASSET);
    await createCompound(BASE_COMPOUND);
    await createCompound({
      compound_id: 'CMPD-ROLE-CHECK-V001',
      name: 'Role Check Compound',
      description: 'Checks user roles',
      version: '1.0.0',
    });
    await addAtomicAssetToCompound(
      'CMPD-QUANTITY-VALIDATION-V001',
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    await addAtomicAssetToCompound(
      'CMPD-ROLE-CHECK-V001',
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    const compounds = await listCompoundsForAtomicAsset(
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    expect(compounds).toHaveLength(2);
    const ids = compounds.map((c) => c.compound_id);
    expect(ids).toContain('CMPD-QUANTITY-VALIDATION-V001');
    expect(ids).toContain('CMPD-ROLE-CHECK-V001');
  });

  it('returns empty array when Atomic Asset is not used by any Compound', async () => {
    await createAtomicAsset(BASE_ASSET);
    const compounds = await listCompoundsForAtomicAsset(
      'AA-VALIDATE-POSITIVE-NUMBER-V001',
    );
    expect(compounds).toHaveLength(0);
  });
});
