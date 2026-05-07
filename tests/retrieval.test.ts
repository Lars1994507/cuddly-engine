import prisma from '../src/lib/prisma';
import { getRelevantContext, getContextForCastle } from '../src/retrieval/retrieval';
import { createAtomicAsset } from '../src/entities/atomicAsset';
import { createCompound, addAtomicAssetToCompound } from '../src/entities/compound';
import {
  createComposite,
  addCompoundToComposite,
} from '../src/entities/composite';
import { createCastleService, addCompositeToService } from '../src/entities/castleService';
import { createCastleUnit, addServiceToUnit } from '../src/entities/castleUnit';
import {
  createBlueprint,
  addCastleUnitToBlueprint,
  addCastleServiceToBlueprint,
  addCompositeToBlueprint,
} from '../src/entities/blueprint';
import {
  createCastleType,
  addCastleUnitToCastleType,
  addCastleServiceToCastleType,
} from '../src/entities/castleType';
import { createCastle } from '../src/entities/castle';

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

// ─── Seed helpers ─────────────────────────────────────────────────────────────

async function buildRetrievalFixture() {
  // Atomic Assets
  const aaA = await createAtomicAsset({
    atomic_asset_id: 'AA-VALIDATE-POSITIVE-V001',
    name: 'validatePositive()',
    asset_type: 'Validator',
    description: 'Validates positive numbers',
    code_location: 'src/validators/positive.ts',
    version: '1.0.0',
    status: 'Active',
  });
  const aaDeprecated = await createAtomicAsset({
    atomic_asset_id: 'AA-OLD-HELPER-V001',
    name: 'oldHelper()',
    asset_type: 'HelperFunction',
    description: 'Deprecated helper',
    code_location: 'src/helpers/old.ts',
    version: '0.9.0',
    status: 'Deprecated',
  });

  // Compounds
  const cpdA = await createCompound({
    compound_id: 'CMPD-VALIDATION-A-V001',
    name: 'Validation Compound A',
    description: 'Compound A',
    version: '1.0.0',
    status: 'Active',
  });
  await addAtomicAssetToCompound(cpdA.compound_id, aaA.atomic_asset_id);
  await addAtomicAssetToCompound(cpdA.compound_id, aaDeprecated.atomic_asset_id);

  const cpdArchived = await createCompound({
    compound_id: 'CMPD-ARCHIVED-V001',
    name: 'Archived Compound',
    description: 'Archived compound',
    version: '1.0.0',
    status: 'Archived',
  });

  // Composites
  const compA = await createComposite({
    composite_id: 'COMP-DETAIL-A-V001',
    name: 'Detail Page A Composite',
    description: 'Detail page',
    version: '1.0.0',
    ui_backend_scope: 'Both',
    status: 'Active',
  });
  await addCompoundToComposite(compA.composite_id, cpdA.compound_id);
  await addCompoundToComposite(compA.composite_id, cpdArchived.compound_id);

  const compB = await createComposite({
    composite_id: 'COMP-DASHBOARD-B-V001',
    name: 'Dashboard B Composite',
    description: 'Dashboard widget',
    version: '1.0.0',
    ui_backend_scope: 'UI',
    status: 'Active',
  });
  await addCompoundToComposite(compB.composite_id, cpdA.compound_id);

  // Castle Services
  const svcA = await createCastleService({
    castle_service_id: 'CS-INVENTORY-A-V001',
    name: 'Inventory Castle Service',
    capability: 'Manages inventory records',
    status: 'Active',
  });
  await addCompositeToService(svcA.castle_service_id, compA.composite_id);

  const svcB = await createCastleService({
    castle_service_id: 'CS-REPORTING-B-V001',
    name: 'Reporting Castle Service',
    capability: 'Generates reports',
    status: 'Active',
  });
  await addCompositeToService(svcB.castle_service_id, compA.composite_id); // shared composite — test dedup

  const svcDeprecated = await createCastleService({
    castle_service_id: 'CS-DEPRECATED-V001',
    name: 'Deprecated Castle Service',
    capability: 'Old service',
    status: 'Deprecated',
  });

  // Castle Units
  const unitA = await createCastleUnit({
    castle_unit_id: 'CU-WAREHOUSING-A-V001',
    name: 'Warehousing Castle Unit',
    description: 'Core warehousing ops',
    permission_scope: 'inventory:read',
    status: 'Active',
  });
  await addServiceToUnit(unitA.castle_unit_id, svcA.castle_service_id);

  const unitB = await createCastleUnit({
    castle_unit_id: 'CU-REPORTING-B-V001',
    name: 'Reporting Castle Unit',
    description: 'Reporting operations',
    permission_scope: 'reports:read',
    status: 'Active',
  });

  const unitArchived = await createCastleUnit({
    castle_unit_id: 'CU-ARCHIVED-V001',
    name: 'Archived Castle Unit',
    description: 'Old unit',
    permission_scope: 'none',
    status: 'Archived',
  });

  // Castle Type — has unitA + svcA (unitA is also on the Blueprint → dedup test)
  const ct = await createCastleType({
    castle_type_id: 'CT-RETRIEVAL-TEST-V001',
    name: 'Retrieval Test Castle Type',
    description: 'Used for retrieval tests',
    common_purpose: 'Testing retrieval',
    status: 'Active',
  });
  await addCastleUnitToCastleType(ct.castle_type_id, unitA.castle_unit_id);
  await addCastleUnitToCastleType(ct.castle_type_id, unitArchived.castle_unit_id);
  await addCastleServiceToCastleType(ct.castle_type_id, svcA.castle_service_id);
  await addCastleServiceToCastleType(ct.castle_type_id, svcDeprecated.castle_service_id);

  // Blueprint — has unitA (dup with CT), unitB, svcB, compB (direct from blueprint)
  const bp = await createBlueprint({
    blueprint_id: 'BP-RETRIEVAL-TEST-V001',
    name: 'Retrieval Test Blueprint',
    category: 'Test',
    version: '1.0.0',
    purpose: 'Testing retrieval context',
    status: 'Active',
  });
  await addCastleUnitToBlueprint(bp.blueprint_id, unitA.castle_unit_id); // dup with CT
  await addCastleUnitToBlueprint(bp.blueprint_id, unitB.castle_unit_id);
  await addCastleServiceToBlueprint(bp.blueprint_id, svcB.castle_service_id);
  await addCompositeToBlueprint(bp.blueprint_id, compB.composite_id);

  return { ct, bp, unitA, unitB, unitArchived, svcA, svcB, svcDeprecated, compA, compB, cpdA, cpdArchived, aaA, aaDeprecated };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('getRelevantContext', () => {
  test('returns castle units from both castle type and blueprint, deduplicated', async () => {
    const { ct, bp, unitA, unitB } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.castle_units.map((u) => u.id);
    expect(ids).toContain(unitA.castle_unit_id);
    expect(ids).toContain(unitB.castle_unit_id);
    // unitA appears in both CT and BP — should appear exactly once
    expect(ids.filter((id) => id === unitA.castle_unit_id)).toHaveLength(1);
  });

  test('excludes archived and deprecated castle units', async () => {
    const { ct, bp, unitArchived } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.castle_units.map((u) => u.id);
    expect(ids).not.toContain(unitArchived.castle_unit_id);
  });

  test('returns castle services from both castle type and blueprint', async () => {
    const { ct, bp, svcA, svcB } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.castle_services.map((s) => s.id);
    expect(ids).toContain(svcA.castle_service_id);
    expect(ids).toContain(svcB.castle_service_id);
  });

  test('excludes deprecated castle services', async () => {
    const { ct, bp, svcDeprecated } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.castle_services.map((s) => s.id);
    expect(ids).not.toContain(svcDeprecated.castle_service_id);
  });

  test('returns castle service capability in compact record', async () => {
    const { ct, bp, svcA } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const svc = ctx.castle_services.find((s) => s.id === svcA.castle_service_id);
    expect(svc).toBeDefined();
    expect(svc!.capability).toBe('Manages inventory records');
  });

  test('returns composites from blueprint direct + from castle services, deduplicated', async () => {
    const { ct, bp, compA, compB } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.composites.map((c) => c.id);
    // compA is referenced by svcA and svcB (both active services) — dedup to one
    expect(ids.filter((id) => id === compA.composite_id)).toHaveLength(1);
    // compB is direct from blueprint
    expect(ids).toContain(compB.composite_id);
  });

  test('composites include ui_backend_scope in compact record', async () => {
    const { ct, bp, compA } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const comp = ctx.composites.find((c) => c.id === compA.composite_id);
    expect(comp).toBeDefined();
    expect(comp!.ui_backend_scope).toBe('Both');
  });

  test('returns compounds from active composites', async () => {
    const { ct, bp, cpdA } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.compounds.map((c) => c.id);
    expect(ids).toContain(cpdA.compound_id);
    // cpdA referenced by compA and compB — dedup to one
    expect(ids.filter((id) => id === cpdA.compound_id)).toHaveLength(1);
  });

  test('excludes archived compounds even when referenced by active composites', async () => {
    const { ct, bp, cpdArchived } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.compounds.map((c) => c.id);
    expect(ids).not.toContain(cpdArchived.compound_id);
  });

  test('returns atomic assets from active compounds', async () => {
    const { ct, bp, aaA } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.atomic_assets.map((a) => a.id);
    expect(ids).toContain(aaA.atomic_asset_id);
  });

  test('excludes deprecated atomic assets', async () => {
    const { ct, bp, aaDeprecated } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const ids = ctx.atomic_assets.map((a) => a.id);
    expect(ids).not.toContain(aaDeprecated.atomic_asset_id);
  });

  test('atomic assets include asset_type in compact record', async () => {
    const { ct, bp, aaA } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const asset = ctx.atomic_assets.find((a) => a.id === aaA.atomic_asset_id);
    expect(asset).toBeDefined();
    expect(asset!.asset_type).toBe('Validator');
  });

  test('each category is sorted by name', async () => {
    const { ct, bp } = await buildRetrievalFixture();
    const ctx = await getRelevantContext(ct.castle_type_id, bp.blueprint_id);

    const isSorted = (arr: { name: string }[]) =>
      arr.every((item, i) => i === 0 || arr[i - 1].name.localeCompare(item.name) <= 0);

    expect(isSorted(ctx.castle_units)).toBe(true);
    expect(isSorted(ctx.castle_services)).toBe(true);
    expect(isSorted(ctx.composites)).toBe(true);
    expect(isSorted(ctx.compounds)).toBe(true);
    expect(isSorted(ctx.atomic_assets)).toBe(true);
  });

  test('returns empty arrays when castle type and blueprint have no relationships', async () => {
    await createCastleType({
      castle_type_id: 'CT-EMPTY-V001',
      name: 'Empty Castle Type',
      description: 'Has no relationships',
      common_purpose: 'Testing empty state',
      status: 'Active',
    });
    await createBlueprint({
      blueprint_id: 'BP-EMPTY-V001',
      name: 'Empty Blueprint',
      category: 'Test',
      version: '1.0.0',
      purpose: 'Testing empty state',
      status: 'Active',
    });

    const ctx = await getRelevantContext('CT-EMPTY-V001', 'BP-EMPTY-V001');
    expect(ctx.castle_units).toHaveLength(0);
    expect(ctx.castle_services).toHaveLength(0);
    expect(ctx.composites).toHaveLength(0);
    expect(ctx.compounds).toHaveLength(0);
    expect(ctx.atomic_assets).toHaveLength(0);
  });
});

describe('getContextForCastle', () => {
  test('derives context from castle castle_type_id and blueprint_id', async () => {
    const { ct, bp, unitA, svcA, compA, cpdA, aaA } = await buildRetrievalFixture();

    const castle = await createCastle({
      castle_record_id: 'CSTL-RETRIEVAL-TEST-V001',
      castle_name: 'Retrieval Test Castle',
      version: '1.0.0',
      primary_purpose: 'Test retrieval via castle',
      status: 'Active',
      castle_type_id: ct.castle_type_id,
      blueprint_id: bp.blueprint_id,
    });

    const ctx = await getContextForCastle(castle.castle_record_id);

    expect(ctx.castle_units.map((u) => u.id)).toContain(unitA.castle_unit_id);
    expect(ctx.castle_services.map((s) => s.id)).toContain(svcA.castle_service_id);
    expect(ctx.composites.map((c) => c.id)).toContain(compA.composite_id);
    expect(ctx.compounds.map((c) => c.id)).toContain(cpdA.compound_id);
    expect(ctx.atomic_assets.map((a) => a.id)).toContain(aaA.atomic_asset_id);
  });

  test('throws when castle not found', async () => {
    await expect(getContextForCastle('CSTL-DOES-NOT-EXIST-V001')).rejects.toThrow('not found');
  });

  test('throws when castle has no castle_type_id or blueprint_id', async () => {
    await createCastle({
      castle_record_id: 'CSTL-NO-TYPE-V001',
      castle_name: 'Castle Without Type',
      version: '1.0.0',
      primary_purpose: 'No type assigned',
      status: 'Draft',
    });

    await expect(getContextForCastle('CSTL-NO-TYPE-V001')).rejects.toThrow(
      'must have both castle_type_id and blueprint_id',
    );
  });

  test('returns same result as getRelevantContext for same CT + BP', async () => {
    const { ct, bp } = await buildRetrievalFixture();

    const castle = await createCastle({
      castle_record_id: 'CSTL-EQUIV-TEST-V001',
      castle_name: 'Equivalence Test Castle',
      version: '1.0.0',
      primary_purpose: 'Test equivalence',
      status: 'Active',
      castle_type_id: ct.castle_type_id,
      blueprint_id: bp.blueprint_id,
    });

    const [directCtx, castleCtx] = await Promise.all([
      getRelevantContext(ct.castle_type_id, bp.blueprint_id),
      getContextForCastle(castle.castle_record_id),
    ]);

    expect(castleCtx).toEqual(directCtx);
  });
});
