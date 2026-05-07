/**
 * Tests that JSON array fields are properly deserialized in both CRUD functions and
 * relationship query functions. These are integration tests against the real SQLite DB.
 *
 * Entities with JSON-stored arrays that require deserialization:
 *   - AtomicAsset.dependencies  → string[]
 *   - CastleService.backend_modules → string[]
 *
 * Entities with JSON-stored arrays that remain as raw strings by design (no deserialize fn):
 *   - Composite.usage_references
 *   - Blueprint.default_pages / default_components / required_review_steps
 *   - CastleType.typical_use_cases
 */

import prisma from '../src/lib/prisma';
import { createAtomicAsset, getAtomicAssetById, listAtomicAssets, updateAtomicAsset } from '../src/entities/atomicAsset';
import { createCompound, listAtomicAssetsInCompound } from '../src/entities/compound';
import { createComposite, listAtomicAssetsInComposite } from '../src/entities/composite';
import {
  createCastleService,
  getCastleServiceById,
  listCastleServices,
  updateCastleService,
  addAtomicAssetToService,
  listAtomicAssetsInService,
  addCompositeToService,
  listCompositesInService,
  listServicesForComposite,
} from '../src/entities/castleService';
import { addAtomicAssetToCompound } from '../src/entities/compound';
import { addAtomicAssetToComposite } from '../src/entities/composite';
import { createCastleUnit, addServiceToUnit, listServicesInUnit } from '../src/entities/castleUnit';
import { createBlueprint, addCastleServiceToBlueprint, listCastleServicesInBlueprint } from '../src/entities/blueprint';
import { createCastleType, addCastleServiceToCastleType, listCastleServicesForCastleType } from '../src/entities/castleType';
import { createCastle, addCastleServiceToCastle, listCastleServicesForCastle } from '../src/entities/castle';

beforeEach(async () => {
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

const ASSET = {
  atomic_asset_id: 'AA-PARSE-QUANTITY-V001',
  name: 'parseQuantity()',
  asset_type: 'FormattingFunction' as const,
  description: 'Parses a raw quantity string',
  code_location: 'src/lib/parsers.ts',
  version: '1.0.0',
  dependencies: ['AA-UNIT-ENUM-V001', 'AA-LOCALE-HELPER-V001'],
};

const ASSET_EMPTY_DEPS = {
  atomic_asset_id: 'AA-UNIT-ENUM-V001',
  name: 'UnitEnum',
  asset_type: 'Enum' as const,
  description: 'Unit of measure enum',
  code_location: 'src/lib/enums.ts',
  version: '1.0.0',
};

const SERVICE = {
  castle_service_id: 'CS-QUANTITY-V001',
  name: 'Quantity Service',
  capability: 'Manages quantity conversions',
  backend_modules: ['quantity.module.ts', 'converter.module.ts'],
};

// ─── AtomicAsset.dependencies deserialization ────────────────────────────────

describe('AtomicAsset.dependencies — CRUD deserialization', () => {
  it('createAtomicAsset returns dependencies as string[]', async () => {
    const asset = await createAtomicAsset(ASSET);
    expect(Array.isArray(asset.dependencies)).toBe(true);
    expect(asset.dependencies).toEqual(['AA-UNIT-ENUM-V001', 'AA-LOCALE-HELPER-V001']);
  });

  it('createAtomicAsset with no dependencies returns empty string[]', async () => {
    const asset = await createAtomicAsset(ASSET_EMPTY_DEPS);
    expect(Array.isArray(asset.dependencies)).toBe(true);
    expect(asset.dependencies).toEqual([]);
  });

  it('getAtomicAssetById returns dependencies as string[]', async () => {
    await createAtomicAsset(ASSET);
    const found = await getAtomicAssetById(ASSET.atomic_asset_id);
    expect(Array.isArray(found!.dependencies)).toBe(true);
    expect(found!.dependencies).toEqual(['AA-UNIT-ENUM-V001', 'AA-LOCALE-HELPER-V001']);
  });

  it('listAtomicAssets returns dependencies as string[] for each record', async () => {
    await createAtomicAsset(ASSET);
    await createAtomicAsset(ASSET_EMPTY_DEPS);
    const assets = await listAtomicAssets();
    for (const a of assets) {
      expect(Array.isArray(a.dependencies)).toBe(true);
    }
  });

  it('updateAtomicAsset returns updated dependencies as string[]', async () => {
    await createAtomicAsset(ASSET_EMPTY_DEPS);
    const updated = await updateAtomicAsset(ASSET_EMPTY_DEPS.atomic_asset_id, {
      dependencies: ['AA-PARSE-QUANTITY-V001'],
    });
    expect(Array.isArray(updated.dependencies)).toBe(true);
    expect(updated.dependencies).toEqual(['AA-PARSE-QUANTITY-V001']);
  });
});

describe('AtomicAsset.dependencies — relationship query deserialization', () => {
  it('listAtomicAssetsInCompound returns dependencies as string[]', async () => {
    await createAtomicAsset(ASSET);
    const compound = await createCompound({
      compound_id: 'CMPD-QUANTITY-PARSER-V001',
      name: 'Quantity Parser',
      description: 'Handles quantity parsing',
      version: '1.0.0',
    });
    await addAtomicAssetToCompound(compound.compound_id, ASSET.atomic_asset_id);
    const assets = await listAtomicAssetsInCompound(compound.compound_id);
    expect(assets).toHaveLength(1);
    expect(Array.isArray(assets[0]!.dependencies)).toBe(true);
    expect(assets[0]!.dependencies).toEqual(['AA-UNIT-ENUM-V001', 'AA-LOCALE-HELPER-V001']);
  });

  it('listAtomicAssetsInComposite returns dependencies as string[]', async () => {
    await createAtomicAsset(ASSET);
    const composite = await createComposite({
      composite_id: 'COMP-QUANTITY-DISPLAY-V001',
      name: 'Quantity Display',
      description: 'Displays quantities',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addAtomicAssetToComposite(composite.composite_id, ASSET.atomic_asset_id);
    const assets = await listAtomicAssetsInComposite(composite.composite_id);
    expect(assets).toHaveLength(1);
    expect(Array.isArray(assets[0]!.dependencies)).toBe(true);
    expect(assets[0]!.dependencies).toEqual(['AA-UNIT-ENUM-V001', 'AA-LOCALE-HELPER-V001']);
  });

  it('listAtomicAssetsInService returns dependencies as string[]', async () => {
    await createAtomicAsset(ASSET);
    await createCastleService({ castle_service_id: 'CS-QUANTITY-V001', name: 'Q Svc', capability: 'Q' });
    await addAtomicAssetToService('CS-QUANTITY-V001', ASSET.atomic_asset_id);
    const assets = await listAtomicAssetsInService('CS-QUANTITY-V001');
    expect(assets).toHaveLength(1);
    expect(Array.isArray(assets[0]!.dependencies)).toBe(true);
    expect(assets[0]!.dependencies).toEqual(['AA-UNIT-ENUM-V001', 'AA-LOCALE-HELPER-V001']);
  });
});

// ─── CastleService.backend_modules deserialization ───────────────────────────

describe('CastleService.backend_modules — CRUD deserialization', () => {
  it('createCastleService returns backend_modules as string[]', async () => {
    const svc = await createCastleService(SERVICE);
    expect(Array.isArray(svc.backend_modules)).toBe(true);
    expect(svc.backend_modules).toEqual(['quantity.module.ts', 'converter.module.ts']);
  });

  it('createCastleService with no backend_modules returns empty string[]', async () => {
    const svc = await createCastleService({
      castle_service_id: 'CS-EMPTY-MODS-V001',
      name: 'Minimal Service',
      capability: 'Does minimal things',
    });
    expect(Array.isArray(svc.backend_modules)).toBe(true);
    expect(svc.backend_modules).toEqual([]);
  });

  it('getCastleServiceById returns backend_modules as string[]', async () => {
    await createCastleService(SERVICE);
    const found = await getCastleServiceById(SERVICE.castle_service_id);
    expect(Array.isArray(found!.backend_modules)).toBe(true);
    expect(found!.backend_modules).toEqual(['quantity.module.ts', 'converter.module.ts']);
  });

  it('listCastleServices returns backend_modules as string[] for each record', async () => {
    await createCastleService(SERVICE);
    const svcs = await listCastleServices();
    for (const s of svcs) {
      expect(Array.isArray(s.backend_modules)).toBe(true);
    }
  });

  it('updateCastleService returns updated backend_modules as string[]', async () => {
    await createCastleService(SERVICE);
    const updated = await updateCastleService(SERVICE.castle_service_id, {
      backend_modules: ['new.module.ts'],
    });
    expect(Array.isArray(updated.backend_modules)).toBe(true);
    expect(updated.backend_modules).toEqual(['new.module.ts']);
  });
});

describe('CastleService.backend_modules — relationship query deserialization', () => {
  it('listServicesForComposite returns backend_modules as string[]', async () => {
    await createCastleService(SERVICE);
    const composite = await createComposite({
      composite_id: 'COMP-QUANTITY-DISPLAY-V001',
      name: 'Quantity Display',
      description: 'Displays quantities',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await addCompositeToService(SERVICE.castle_service_id, composite.composite_id);
    const svcs = await listServicesForComposite(composite.composite_id);
    expect(svcs).toHaveLength(1);
    expect(Array.isArray(svcs[0]!.backend_modules)).toBe(true);
    expect(svcs[0]!.backend_modules).toEqual(['quantity.module.ts', 'converter.module.ts']);
  });

  it('listCompositesInService returns composite records (usage_references is a raw JSON string — no deserialization for Composite)', async () => {
    await createCastleService(SERVICE);
    const composite = await createComposite({
      composite_id: 'COMP-QUANTITY-DISPLAY-V001',
      name: 'Quantity Display',
      description: 'Displays quantities',
      version: '1.0.0',
      ui_backend_scope: 'UI',
      usage_references: ['admin-page'],
    });
    await addCompositeToService(SERVICE.castle_service_id, composite.composite_id);
    const composites = await listCompositesInService(SERVICE.castle_service_id);
    expect(composites).toHaveLength(1);
    expect(Array.isArray(composites[0]!.usage_references)).toBe(true);
    expect(composites[0]!.usage_references).toEqual(['admin-page']);
  });

  it('listServicesInUnit returns backend_modules as string[]', async () => {
    await createCastleService(SERVICE);
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-QUANTITY-MANAGEMENT-V001',
      name: 'Quantity Management',
      description: 'Manages quantities',
      permission_scope: 'inventory:write',
    });
    await addServiceToUnit(unit.castle_unit_id, SERVICE.castle_service_id);
    const svcs = await listServicesInUnit(unit.castle_unit_id);
    expect(svcs).toHaveLength(1);
    expect(Array.isArray(svcs[0]!.backend_modules)).toBe(true);
    expect(svcs[0]!.backend_modules).toEqual(['quantity.module.ts', 'converter.module.ts']);
  });

  it('listCastleServicesInBlueprint returns backend_modules as string[]', async () => {
    await createCastleService(SERVICE);
    const bp = await createBlueprint({
      blueprint_id: 'BP-INVENTORY-INTERNAL-V001',
      name: 'Internal Inventory Blueprint',
      category: 'Internal',
      version: '1.0.0',
      purpose: 'Standard internal inventory setup',
    });
    await addCastleServiceToBlueprint(bp.blueprint_id, SERVICE.castle_service_id);
    const svcs = await listCastleServicesInBlueprint(bp.blueprint_id);
    expect(svcs).toHaveLength(1);
    expect(Array.isArray(svcs[0]!.backend_modules)).toBe(true);
    expect(svcs[0]!.backend_modules).toEqual(['quantity.module.ts', 'converter.module.ts']);
  });

  it('listCastleServicesForCastleType returns backend_modules as string[]', async () => {
    await createCastleService(SERVICE);
    const ct = await createCastleType({
      castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
      name: 'Internal Inventory',
      description: 'Internal inventory castle type',
      common_purpose: 'Manages internal inventory',
    });
    await addCastleServiceToCastleType(ct.castle_type_id, SERVICE.castle_service_id);
    const svcs = await listCastleServicesForCastleType(ct.castle_type_id);
    expect(svcs).toHaveLength(1);
    expect(Array.isArray(svcs[0]!.backend_modules)).toBe(true);
    expect(svcs[0]!.backend_modules).toEqual(['quantity.module.ts', 'converter.module.ts']);
  });

  it('listCastleServicesForCastle returns backend_modules as string[]', async () => {
    await createCastleService(SERVICE);
    const castle = await createCastle({
      castle_record_id: 'CSTL-QUANTITY-INTERNAL-V001',
      castle_name: 'Quantity Castle',
      version: '1.0.0',
      primary_purpose: 'Quantity management',
    });
    await addCastleServiceToCastle(castle.castle_record_id, SERVICE.castle_service_id);
    const svcs = await listCastleServicesForCastle(castle.castle_record_id);
    expect(svcs).toHaveLength(1);
    expect(Array.isArray(svcs[0]!.backend_modules)).toBe(true);
    expect(svcs[0]!.backend_modules).toEqual(['quantity.module.ts', 'converter.module.ts']);
  });
});

// ─── Entities with native PostgreSQL array fields ────────────────────────────

describe('Composite.usage_references — native string[]', () => {
  it('createComposite returns usage_references as string[]', async () => {
    const composite = await createComposite({
      composite_id: 'COMP-QUANTITY-DISPLAY-V001',
      name: 'Quantity Display',
      description: 'Displays quantities',
      version: '1.0.0',
      ui_backend_scope: 'UI',
      usage_references: ['page-a', 'page-b'],
    });
    expect(Array.isArray(composite.usage_references)).toBe(true);
    expect(composite.usage_references).toEqual(['page-a', 'page-b']);
  });

  it('createComposite with no usage_references returns empty string[]', async () => {
    const composite = await createComposite({
      composite_id: 'COMP-QUANTITY-DISPLAY-V001',
      name: 'Quantity Display',
      description: 'Displays quantities',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    expect(Array.isArray(composite.usage_references)).toBe(true);
    expect(composite.usage_references).toEqual([]);
  });
});

describe('Blueprint array fields — native string[]', () => {
  it('createBlueprint returns default_pages, default_components, required_review_steps as string[]', async () => {
    const bp = await createBlueprint({
      blueprint_id: 'BP-INVENTORY-INTERNAL-V001',
      name: 'Internal Inventory Blueprint',
      category: 'Internal',
      version: '1.0.0',
      purpose: 'Standard internal inventory setup',
      default_pages: ['dashboard', 'items'],
      default_components: ['NavBar', 'ItemTable'],
      required_review_steps: ['security-review', 'qa-sign-off'],
    });
    expect(Array.isArray(bp.default_pages)).toBe(true);
    expect(Array.isArray(bp.default_components)).toBe(true);
    expect(Array.isArray(bp.required_review_steps)).toBe(true);
    expect(bp.default_pages).toEqual(['dashboard', 'items']);
    expect(bp.default_components).toEqual(['NavBar', 'ItemTable']);
    expect(bp.required_review_steps).toEqual(['security-review', 'qa-sign-off']);
  });

  it('createBlueprint with no array fields returns empty string[]', async () => {
    const bp = await createBlueprint({
      blueprint_id: 'BP-INVENTORY-INTERNAL-V001',
      name: 'Internal Inventory Blueprint',
      category: 'Internal',
      version: '1.0.0',
      purpose: 'Standard internal inventory setup',
    });
    expect(bp.default_pages).toEqual([]);
    expect(bp.default_components).toEqual([]);
    expect(bp.required_review_steps).toEqual([]);
  });
});

describe('CastleType.typical_use_cases — native string[]', () => {
  it('createCastleType returns typical_use_cases as string[]', async () => {
    const ct = await createCastleType({
      castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
      name: 'Internal Inventory',
      description: 'Internal inventory castle type',
      common_purpose: 'Manages internal inventory',
      typical_use_cases: ['warehousing', 'stock-management'],
    });
    expect(Array.isArray(ct.typical_use_cases)).toBe(true);
    expect(ct.typical_use_cases).toEqual(['warehousing', 'stock-management']);
  });

  it('createCastleType with no typical_use_cases returns empty string[]', async () => {
    const ct = await createCastleType({
      castle_type_id: 'CT-INTERNAL-INVENTORY-V001',
      name: 'Internal Inventory',
      description: 'Internal inventory castle type',
      common_purpose: 'Manages internal inventory',
    });
    expect(ct.typical_use_cases).toEqual([]);
  });
});
