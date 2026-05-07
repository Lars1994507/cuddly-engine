/**
 * HTTP layer tests — verifies status codes, error shapes, and route wiring via supertest.
 * Business logic is covered by the service-layer tests; these tests focus on what the
 * service-layer tests cannot: HTTP status codes, JSON error bodies, and correct routing.
 *
 * Composes its own Express app from the individual routers to avoid calling app.listen().
 */
import express from 'express';
import request from 'supertest';
import prisma from '../src/lib/prisma';
import atomicAssetRouter from '../src/entities/atomicAssetRouter';
import compoundRouter from '../src/entities/compoundRouter';
import castleRouter from '../src/entities/castleRouter';
import bomRouter from '../src/bom/bomRouter';
import retrievalRouter from '../src/retrieval/retrievalRouter';
import reportsRouter from '../src/reports/reportsRouter';
import { createAtomicAsset } from '../src/entities/atomicAsset';
import { createCastle } from '../src/entities/castle';

const app = express();
app.use(express.json());
app.use('/atomic-assets', atomicAssetRouter);
app.use('/compounds', compoundRouter);
app.use('/castles', castleRouter);
app.use('/bom', bomRouter);
app.use('/retrieval', retrievalRouter);
app.use('/reports', reportsRouter);

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

const VALID_ASSET = {
  atomic_asset_id: 'AA-FORMAT-QUANTITY-V001',
  name: 'formatQuantity()',
  asset_type: 'FormattingFunction' as const,
  description: 'Formats a quantity number for display',
  code_location: 'src/lib/formatters.ts',
  version: '1.0.0',
};

// ─── POST /atomic-assets ─────────────────────────────────────────────────────

describe('POST /atomic-assets', () => {
  it('returns 201 and the created record for valid input', async () => {
    const res = await request(app).post('/atomic-assets').send(VALID_ASSET);
    expect(res.status).toBe(201);
    expect(res.body.atomic_asset_id).toBe('AA-FORMAT-QUANTITY-V001');
    expect(res.body.status).toBe('Draft');
    expect(Array.isArray(res.body.dependencies)).toBe(true);
  });

  it('returns 400 for an invalid ID format', async () => {
    const res = await request(app)
      .post('/atomic-assets')
      .send({ ...VALID_ASSET, atomic_asset_id: 'INVALID-ID' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid atomic_asset_id/);
  });

  it('returns 400 for an invalid asset_type', async () => {
    const res = await request(app)
      .post('/atomic-assets')
      .send({ ...VALID_ASSET, asset_type: 'BadType' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid asset_type/);
  });

  it('returns 400 for an invalid status', async () => {
    const res = await request(app)
      .post('/atomic-assets')
      .send({ ...VALID_ASSET, status: 'Enabled' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid status/);
  });

  it('returns 400 for a duplicate ID', async () => {
    await createAtomicAsset(VALID_ASSET);
    const res = await request(app).post('/atomic-assets').send(VALID_ASSET);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── GET /atomic-assets ───────────────────────────────────────────────────────

describe('GET /atomic-assets', () => {
  it('returns 200 and empty array when no assets exist', async () => {
    const res = await request(app).get('/atomic-assets');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 and all assets', async () => {
    await createAtomicAsset(VALID_ASSET);
    const res = await request(app).get('/atomic-assets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].atomic_asset_id).toBe('AA-FORMAT-QUANTITY-V001');
  });

  it('filters by asset_type query param', async () => {
    await createAtomicAsset(VALID_ASSET);
    await createAtomicAsset({
      atomic_asset_id: 'AA-VALIDATE-POSITIVE-V001',
      name: 'validatePositive()',
      asset_type: 'Validator',
      description: 'Validates positives',
      code_location: 'src/validators/positive.ts',
      version: '1.0.0',
    });
    const res = await request(app).get('/atomic-assets?asset_type=Validator');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].asset_type).toBe('Validator');
  });

  it('returns 400 for an invalid asset_type filter', async () => {
    const res = await request(app).get('/atomic-assets?asset_type=BadType');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('filters by status query param', async () => {
    await createAtomicAsset(VALID_ASSET);
    await createAtomicAsset({
      atomic_asset_id: 'AA-VALIDATE-POSITIVE-V001',
      name: 'validatePositive()',
      asset_type: 'Validator',
      description: 'Validates positives',
      code_location: 'src/validators/positive.ts',
      version: '1.0.0',
      status: 'Active',
    });
    const res = await request(app).get('/atomic-assets?status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('Active');
  });
});

// ─── GET /atomic-assets/:id ───────────────────────────────────────────────────

describe('GET /atomic-assets/:id', () => {
  it('returns 200 and the asset when found', async () => {
    await createAtomicAsset(VALID_ASSET);
    const res = await request(app).get('/atomic-assets/AA-FORMAT-QUANTITY-V001');
    expect(res.status).toBe(200);
    expect(res.body.atomic_asset_id).toBe('AA-FORMAT-QUANTITY-V001');
    expect(res.body.name).toBe('formatQuantity()');
  });

  it('returns 404 when not found', async () => {
    const res = await request(app).get('/atomic-assets/AA-DOES-NOT-EXIST-V001');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── PATCH /atomic-assets/:id ─────────────────────────────────────────────────

describe('PATCH /atomic-assets/:id', () => {
  it('returns 200 and the updated record', async () => {
    await createAtomicAsset(VALID_ASSET);
    const res = await request(app)
      .patch('/atomic-assets/AA-FORMAT-QUANTITY-V001')
      .send({ name: 'formatQty()', status: 'Active' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('formatQty()');
    expect(res.body.status).toBe('Active');
  });

  it('returns 400 for an invalid status value', async () => {
    await createAtomicAsset(VALID_ASSET);
    const res = await request(app)
      .patch('/atomic-assets/AA-FORMAT-QUANTITY-V001')
      .send({ status: 'Published' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 404 when the asset does not exist', async () => {
    const res = await request(app)
      .patch('/atomic-assets/AA-DOES-NOT-EXIST-V001')
      .send({ name: 'new name' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── DELETE /atomic-assets/:id (archive) ─────────────────────────────────────

describe('DELETE /atomic-assets/:id', () => {
  it('returns 200 and sets status to Archived', async () => {
    await createAtomicAsset(VALID_ASSET);
    const res = await request(app).delete('/atomic-assets/AA-FORMAT-QUANTITY-V001');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Archived');
  });

  it('returns 404 when the asset does not exist', async () => {
    const res = await request(app).delete('/atomic-assets/AA-DOES-NOT-EXIST-V001');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── GET /compounds ───────────────────────────────────────────────────────────

describe('GET /compounds', () => {
  it('returns 200 and an empty array on clean DB', async () => {
    const res = await request(app).get('/compounds');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /compounds', () => {
  it('returns 201 for valid input', async () => {
    const res = await request(app).post('/compounds').send({
      compound_id: 'CMPD-PAGINATION-V001',
      name: 'Pagination Compound',
      description: 'Handles pagination',
      version: '1.0.0',
    });
    expect(res.status).toBe(201);
    expect(res.body.compound_id).toBe('CMPD-PAGINATION-V001');
  });

  it('returns 400 for an invalid compound_id format', async () => {
    const res = await request(app).post('/compounds').send({
      compound_id: 'INVALID',
      name: 'Bad Compound',
      description: 'Bad',
      version: '1.0.0',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── GET /castles ─────────────────────────────────────────────────────────────

describe('GET /castles', () => {
  it('returns 200 and an empty array when no castles exist', async () => {
    const res = await request(app).get('/castles');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('GET /castles/:id', () => {
  it('returns 200 and the castle when found', async () => {
    await createCastle({
      castle_record_id: 'CSTL-HTTP-TEST-V001',
      castle_name: 'HTTP Test Castle',
      version: '1.0.0',
      primary_purpose: 'HTTP layer testing',
    });
    const res = await request(app).get('/castles/CSTL-HTTP-TEST-V001');
    expect(res.status).toBe(200);
    expect(res.body.castle_record_id).toBe('CSTL-HTTP-TEST-V001');
  });

  it('returns 404 when not found', async () => {
    const res = await request(app).get('/castles/CSTL-NONEXISTENT-V001');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── GET /bom/:castle_record_id ───────────────────────────────────────────────

describe('GET /bom/:castle_record_id', () => {
  it('returns 404 when castle does not exist', async () => {
    const res = await request(app).get('/bom/CSTL-NONEXISTENT-V001');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 200 with BOM for an existing castle', async () => {
    await createCastle({
      castle_record_id: 'CSTL-BOM-TEST-V001',
      castle_name: 'BOM Test Castle',
      version: '1.0.0',
      primary_purpose: 'BOM HTTP test',
    });
    const res = await request(app).get('/bom/CSTL-BOM-TEST-V001');
    expect(res.status).toBe(200);
    expect(res.body.castle_record_id).toBe('CSTL-BOM-TEST-V001');
    expect(Array.isArray(res.body.castle_units)).toBe(true);
    expect(Array.isArray(res.body.local_modifications)).toBe(true);
  });
});

// ─── GET /bom/impact/:entity_type/:entity_id ─────────────────────────────────

describe('GET /bom/impact/:entity_type/:entity_id', () => {
  it('returns 400 for an invalid entity_type', async () => {
    const res = await request(app).get('/bom/impact/InvalidType/AA-FOO-V001');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid entity_type/);
  });

  it('returns 200 for a valid entity_type even when ID has no relationships', async () => {
    await createAtomicAsset({
      atomic_asset_id: 'AA-IMPACT-ORPHAN-V001',
      name: 'orphan()',
      asset_type: 'Constant',
      description: 'Unused asset',
      code_location: 'src/orphan.ts',
      version: '1.0.0',
    });
    const res = await request(app).get('/bom/impact/AtomicAsset/AA-IMPACT-ORPHAN-V001');
    expect(res.status).toBe(200);
    expect(res.body.entity_id).toBe('AA-IMPACT-ORPHAN-V001');
    expect(res.body.entity_type).toBe('AtomicAsset');
    expect(Array.isArray(res.body.castles)).toBe(true);
  });
});

// ─── GET /retrieval/context ───────────────────────────────────────────────────

describe('GET /retrieval/context', () => {
  it('returns 400 when castle_type_id is missing', async () => {
    const res = await request(app).get('/retrieval/context?blueprint_id=BP-FOO-V001');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/castle_type_id/);
  });

  it('returns 400 when blueprint_id is missing', async () => {
    const res = await request(app).get('/retrieval/context?castle_type_id=CT-FOO-V001');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/blueprint_id/);
  });

  it('returns 400 when both params are missing', async () => {
    const res = await request(app).get('/retrieval/context');
    expect(res.status).toBe(400);
  });

  it('returns 200 with empty context when IDs exist but have no relationships', async () => {
    const res = await request(app).get(
      '/retrieval/context?castle_type_id=CT-EMPTY-V001&blueprint_id=BP-EMPTY-V001',
    );
    expect(res.status).toBe(200);
    expect(res.body.castle_units).toEqual([]);
    expect(res.body.castle_services).toEqual([]);
    expect(res.body.composites).toEqual([]);
    expect(res.body.compounds).toEqual([]);
    expect(res.body.atomic_assets).toEqual([]);
  });
});

// ─── GET /retrieval/castle/:castle_record_id ──────────────────────────────────

describe('GET /retrieval/castle/:castle_record_id', () => {
  it('returns 404 when castle does not exist', async () => {
    const res = await request(app).get('/retrieval/castle/CSTL-NONEXISTENT-V001');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 500 when castle has no castle_type_id or blueprint_id', async () => {
    await createCastle({
      castle_record_id: 'CSTL-NO-TYPE-V001',
      castle_name: 'Typeless Castle',
      version: '1.0.0',
      primary_purpose: 'No type test',
    });
    const res = await request(app).get('/retrieval/castle/CSTL-NO-TYPE-V001');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── Reports — empty-state smoke tests ───────────────────────────────────────

describe('Reports — empty-state smoke tests', () => {
  const emptyArrayRoutes = [
    '/reports/castles',
    '/reports/blueprints',
    '/reports/castle-types',
    '/reports/castle-units',
    '/reports/castle-services',
    '/reports/composites',
    '/reports/compounds',
    '/reports/atomic-assets',
    '/reports/local-modifications',
    '/reports/promotion-candidates',
    '/reports/duplicates',
  ];

  for (const route of emptyArrayRoutes) {
    it(`GET ${route} returns 200 and empty array on clean DB`, async () => {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(0);
    });
  }

  it('GET /reports/reuse returns 200 with expected shape', async () => {
    const res = await request(app).get('/reports/reuse');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.castle_units)).toBe(true);
    expect(Array.isArray(res.body.castle_services)).toBe(true);
    expect(Array.isArray(res.body.compounds)).toBe(true);
    expect(Array.isArray(res.body.atomic_assets)).toBe(true);
  });

  it('GET /reports/deprecated returns 200 with expected shape', async () => {
    const res = await request(app).get('/reports/deprecated');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.atomic_assets)).toBe(true);
    expect(Array.isArray(res.body.castles)).toBe(true);
  });

  it('GET /reports/approval-status returns 200 with expected shape', async () => {
    const res = await request(app).get('/reports/approval-status');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(Array.isArray(res.body.atomic_assets)).toBe(true);
  });
});

// ─── Reports — status code for non-existent entity ───────────────────────────

describe('Reports — build-readiness error handling', () => {
  it('returns 500 when castle does not exist', async () => {
    const res = await request(app).get('/reports/build-readiness/CSTL-NONEXISTENT-V001');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 200 with ready:true for a castle with no deprecated nodes', async () => {
    await createCastle({
      castle_record_id: 'CSTL-READY-TEST-V001',
      castle_name: 'Ready Castle',
      version: '1.0.0',
      primary_purpose: 'Build readiness HTTP test',
    });
    const res = await request(app).get('/reports/build-readiness/CSTL-READY-TEST-V001');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
    expect(res.body.castle_record_id).toBe('CSTL-READY-TEST-V001');
  });
});
