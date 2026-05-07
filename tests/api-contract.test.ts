/**
 * Frontend ↔ Backend contract tests.
 *
 * Verifies that every API path, HTTP method, request body field, and response
 * shape the frontend (client/src/api.ts + client/src/config.ts) depends on
 * actually exists and behaves correctly in the backend.
 *
 * Scope: route mounting, status codes, request/response shapes, relationship
 * endpoints. Business logic is covered by the service-layer test suites.
 */
import express from 'express';
import request from 'supertest';
import prisma from '../src/lib/prisma';
import atomicAssetRouter from '../src/entities/atomicAssetRouter';
import compoundRouter from '../src/entities/compoundRouter';
import compositeRouter from '../src/entities/compositeRouter';
import castleServiceRouter from '../src/entities/castleServiceRouter';
import castleUnitRouter from '../src/entities/castleUnitRouter';
import blueprintRouter from '../src/entities/blueprintRouter';
import castleTypeRouter from '../src/entities/castleTypeRouter';
import castleRouter from '../src/entities/castleRouter';
import bomRouter from '../src/bom/bomRouter';
import retrievalRouter from '../src/retrieval/retrievalRouter';
import reportsRouter from '../src/reports/reportsRouter';

// Minimal entity creators used to seed preconditions
import { createAtomicAsset } from '../src/entities/atomicAsset';
import { createCompound } from '../src/entities/compound';
import { createComposite } from '../src/entities/composite';
import { createCastleService } from '../src/entities/castleService';
import { createCastleUnit } from '../src/entities/castleUnit';
import { createBlueprint } from '../src/entities/blueprint';
import { createCastleType } from '../src/entities/castleType';
import { createCastle } from '../src/entities/castle';

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/atomic-assets', atomicAssetRouter);
app.use('/compounds', compoundRouter);
app.use('/composites', compositeRouter);
app.use('/castle-services', castleServiceRouter);
app.use('/castle-units', castleUnitRouter);
app.use('/blueprints', blueprintRouter);
app.use('/castle-types', castleTypeRouter);
app.use('/castles', castleRouter);
app.use('/bom', bomRouter);
app.use('/retrieval', retrievalRouter);
app.use('/reports', reportsRouter);

// ─── Cleanup ──────────────────────────────────────────────────────────────────

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

// ─── 1. All entity list routes return 200 + array ─────────────────────────────
// Verifies all 8 entity routers are mounted at the paths client/src/config.ts expects.

describe('GET / — all entity list routes are mounted and return 200', () => {
  const routes = [
    '/castles',
    '/castle-types',
    '/blueprints',
    '/castle-units',
    '/castle-services',
    '/composites',
    '/compounds',
    '/atomic-assets',
  ];

  for (const route of routes) {
    it(`GET ${route} → 200 []`, async () => {
      const res = await request(app).get(route);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  }
});

// ─── 2. All entity CRUD — every router supports POST / GET /:id PATCH /:id DELETE /:id ──

describe('POST + GET/:id + PATCH/:id + DELETE/:id for each entity', () => {
  it('composites full CRUD cycle', async () => {
    const post = await request(app).post('/composites').send({
      composite_id: 'COMP-CONTRACT-V001',
      name: 'Contract Composite',
      description: 'Contract test',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    expect(post.status).toBe(201);
    expect(post.body.composite_id).toBe('COMP-CONTRACT-V001');

    const get = await request(app).get('/composites/COMP-CONTRACT-V001');
    expect(get.status).toBe(200);
    expect(get.body.composite_id).toBe('COMP-CONTRACT-V001');

    const patch = await request(app)
      .patch('/composites/COMP-CONTRACT-V001')
      .send({ name: 'Updated Composite' });
    expect(patch.status).toBe(200);
    expect(patch.body.name).toBe('Updated Composite');

    const del = await request(app).delete('/composites/COMP-CONTRACT-V001');
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('Archived');
  });

  it('castle-services full CRUD cycle', async () => {
    const post = await request(app).post('/castle-services').send({
      castle_service_id: 'CS-CONTRACT-V001',
      name: 'Contract Service',
      capability: 'Contract testing',
    });
    expect(post.status).toBe(201);
    expect(post.body.castle_service_id).toBe('CS-CONTRACT-V001');

    const get = await request(app).get('/castle-services/CS-CONTRACT-V001');
    expect(get.status).toBe(200);

    const patch = await request(app)
      .patch('/castle-services/CS-CONTRACT-V001')
      .send({ capability: 'Updated capability' });
    expect(patch.status).toBe(200);
    expect(patch.body.capability).toBe('Updated capability');

    const del = await request(app).delete('/castle-services/CS-CONTRACT-V001');
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('Archived');
  });

  it('castle-units full CRUD cycle', async () => {
    const post = await request(app).post('/castle-units').send({
      castle_unit_id: 'CU-CONTRACT-V001',
      name: 'Contract Unit',
      description: 'Contract test',
      permission_scope: 'test:read',
    });
    expect(post.status).toBe(201);
    expect(post.body.castle_unit_id).toBe('CU-CONTRACT-V001');

    const get = await request(app).get('/castle-units/CU-CONTRACT-V001');
    expect(get.status).toBe(200);

    const patch = await request(app)
      .patch('/castle-units/CU-CONTRACT-V001')
      .send({ name: 'Updated Unit' });
    expect(patch.status).toBe(200);
    expect(patch.body.name).toBe('Updated Unit');

    const del = await request(app).delete('/castle-units/CU-CONTRACT-V001');
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('Archived');
  });

  it('blueprints full CRUD cycle', async () => {
    const post = await request(app).post('/blueprints').send({
      blueprint_id: 'BP-CONTRACT-V001',
      name: 'Contract Blueprint',
      category: 'Test',
      version: '1.0.0',
      purpose: 'Contract testing',
    });
    expect(post.status).toBe(201);
    expect(post.body.blueprint_id).toBe('BP-CONTRACT-V001');

    const get = await request(app).get('/blueprints/BP-CONTRACT-V001');
    expect(get.status).toBe(200);

    const patch = await request(app)
      .patch('/blueprints/BP-CONTRACT-V001')
      .send({ name: 'Updated Blueprint' });
    expect(patch.status).toBe(200);
    expect(patch.body.name).toBe('Updated Blueprint');

    const del = await request(app).delete('/blueprints/BP-CONTRACT-V001');
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('Archived');
  });

  it('castle-types full CRUD cycle', async () => {
    const post = await request(app).post('/castle-types').send({
      castle_type_id: 'CT-CONTRACT-V001',
      name: 'Contract Castle Type',
      description: 'Contract test',
      common_purpose: 'Contract testing',
    });
    expect(post.status).toBe(201);
    expect(post.body.castle_type_id).toBe('CT-CONTRACT-V001');

    const get = await request(app).get('/castle-types/CT-CONTRACT-V001');
    expect(get.status).toBe(200);

    const patch = await request(app)
      .patch('/castle-types/CT-CONTRACT-V001')
      .send({ name: 'Updated Castle Type' });
    expect(patch.status).toBe(200);
    expect(patch.body.name).toBe('Updated Castle Type');

    const del = await request(app).delete('/castle-types/CT-CONTRACT-V001');
    expect(del.status).toBe(200);
    expect(del.body.status).toBe('Archived');
  });
});

// ─── 3. GET /:id → 404 for all entity types ───────────────────────────────────

describe('GET /:id → 404 for all entity types', () => {
  const cases = [
    ['/composites/COMP-MISSING-V001'],
    ['/castle-services/CS-MISSING-V001'],
    ['/castle-units/CU-MISSING-V001'],
    ['/blueprints/BP-MISSING-V001'],
    ['/castle-types/CT-MISSING-V001'],
  ] as const;

  for (const [path] of cases) {
    it(`GET ${path} → 404`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  }
});

// ─── 4. Relationship endpoints — compounds ↔ atomic-assets ───────────────────
// Frontend: addRelationship('compounds', id, 'atomic-assets', { atomic_asset_id })
//           removeRelationship('compounds', id, 'atomic-assets', assetId)
//           fetchRelationship('compounds', id, 'atomic-assets')

describe('Relationship: compounds ↔ atomic-assets', () => {
  it('POST /compounds/:id/atomic-assets with { atomic_asset_id } → 204, then GET returns it, then DELETE → 204', async () => {
    const aa = await createAtomicAsset({
      atomic_asset_id: 'AA-REL-TEST-V001',
      name: 'rel test()',
      asset_type: 'Constant',
      description: 'Rel test',
      code_location: 'src/rel.ts',
      version: '1.0.0',
    });
    const cpd = await createCompound({
      compound_id: 'CMPD-REL-TEST-V001',
      name: 'Rel Test Compound',
      description: 'Rel test',
      version: '1.0.0',
    });

    const add = await request(app)
      .post(`/compounds/${cpd.compound_id}/atomic-assets`)
      .send({ atomic_asset_id: aa.atomic_asset_id });
    expect(add.status).toBe(204);

    const list = await request(app).get(`/compounds/${cpd.compound_id}/atomic-assets`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].atomic_asset_id).toBe(aa.atomic_asset_id);

    const remove = await request(app).delete(
      `/compounds/${cpd.compound_id}/atomic-assets/${aa.atomic_asset_id}`,
    );
    expect(remove.status).toBe(204);

    const listAfter = await request(app).get(`/compounds/${cpd.compound_id}/atomic-assets`);
    expect(listAfter.body).toHaveLength(0);
  });

  it('POST /compounds/:id/atomic-assets → 400 when atomic_asset_id missing', async () => {
    const cpd = await createCompound({
      compound_id: 'CMPD-REL-BAD-V001',
      name: 'Bad Rel Compound',
      description: 'Bad',
      version: '1.0.0',
    });
    const res = await request(app)
      .post(`/compounds/${cpd.compound_id}/atomic-assets`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── 5. Relationship endpoints — composites ↔ compounds ──────────────────────

describe('Relationship: composites ↔ compounds', () => {
  it('POST /composites/:id/compounds with { compound_id } → 204, GET lists it, DELETE removes it', async () => {
    const cpd = await createCompound({
      compound_id: 'CMPD-COMP-REL-V001',
      name: 'Comp Rel Compound',
      description: 'Rel',
      version: '1.0.0',
    });
    const cmp = await createComposite({
      composite_id: 'COMP-REL-TEST-V001',
      name: 'Rel Test Composite',
      description: 'Rel',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });

    const add = await request(app)
      .post(`/composites/${cmp.composite_id}/compounds`)
      .send({ compound_id: cpd.compound_id });
    expect(add.status).toBe(204);

    const list = await request(app).get(`/composites/${cmp.composite_id}/compounds`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].compound_id).toBe(cpd.compound_id);

    const remove = await request(app).delete(
      `/composites/${cmp.composite_id}/compounds/${cpd.compound_id}`,
    );
    expect(remove.status).toBe(204);
  });
});

// ─── 6. Relationship endpoints — castle-services ↔ composites ────────────────

describe('Relationship: castle-services ↔ composites', () => {
  it('POST /castle-services/:id/composites with { composite_id } → 204', async () => {
    const cmp = await createComposite({
      composite_id: 'COMP-SVC-REL-V001',
      name: 'Svc Rel Composite',
      description: 'Rel',
      version: '1.0.0',
      ui_backend_scope: 'Backend',
    });
    const svc = await createCastleService({
      castle_service_id: 'CS-REL-TEST-V001',
      name: 'Rel Test Service',
      capability: 'Rel test',
    });

    const add = await request(app)
      .post(`/castle-services/${svc.castle_service_id}/composites`)
      .send({ composite_id: cmp.composite_id });
    expect(add.status).toBe(204);

    const list = await request(app).get(`/castle-services/${svc.castle_service_id}/composites`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const remove = await request(app).delete(
      `/castle-services/${svc.castle_service_id}/composites/${cmp.composite_id}`,
    );
    expect(remove.status).toBe(204);
  });
});

// ─── 7. Relationship endpoints — castle-units ↔ services ─────────────────────
// Frontend sends: { castle_service_id } via apiSuffix 'services'

describe('Relationship: castle-units ↔ services', () => {
  it('POST /castle-units/:id/services with { castle_service_id } → 204, GET, DELETE', async () => {
    const svc = await createCastleService({
      castle_service_id: 'CS-UNIT-REL-V001',
      name: 'Unit Rel Service',
      capability: 'Rel test',
    });
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-REL-TEST-V001',
      name: 'Rel Test Unit',
      description: 'Rel',
      permission_scope: 'rel:read',
    });

    const add = await request(app)
      .post(`/castle-units/${unit.castle_unit_id}/services`)
      .send({ castle_service_id: svc.castle_service_id });
    expect(add.status).toBe(204);

    const list = await request(app).get(`/castle-units/${unit.castle_unit_id}/services`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const remove = await request(app).delete(
      `/castle-units/${unit.castle_unit_id}/services/${svc.castle_service_id}`,
    );
    expect(remove.status).toBe(204);
  });
});

// ─── 8. Relationship endpoints — blueprints ↔ castle-units ───────────────────

describe('Relationship: blueprints ↔ castle-units', () => {
  it('POST /blueprints/:id/castle-units with { castle_unit_id } → 204, GET, DELETE', async () => {
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-BP-REL-V001',
      name: 'BP Rel Unit',
      description: 'Rel',
      permission_scope: 'bp:read',
    });
    const bp = await createBlueprint({
      blueprint_id: 'BP-REL-TEST-V001',
      name: 'Rel Test Blueprint',
      category: 'Test',
      version: '1.0.0',
      purpose: 'Rel test',
    });

    const add = await request(app)
      .post(`/blueprints/${bp.blueprint_id}/castle-units`)
      .send({ castle_unit_id: unit.castle_unit_id });
    expect(add.status).toBe(204);

    const list = await request(app).get(`/blueprints/${bp.blueprint_id}/castle-units`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const remove = await request(app).delete(
      `/blueprints/${bp.blueprint_id}/castle-units/${unit.castle_unit_id}`,
    );
    expect(remove.status).toBe(204);
  });
});

// ─── 9. Relationship endpoints — castle-types ↔ blueprints ───────────────────

describe('Relationship: castle-types ↔ blueprints', () => {
  it('POST /castle-types/:id/blueprints with { blueprint_id } → 204, GET, DELETE', async () => {
    const bp = await createBlueprint({
      blueprint_id: 'BP-CT-REL-V001',
      name: 'CT Rel Blueprint',
      category: 'Test',
      version: '1.0.0',
      purpose: 'Rel test',
    });
    const ct = await createCastleType({
      castle_type_id: 'CT-REL-TEST-V001',
      name: 'Rel Test Castle Type',
      description: 'Rel',
      common_purpose: 'Rel test',
    });

    const add = await request(app)
      .post(`/castle-types/${ct.castle_type_id}/blueprints`)
      .send({ blueprint_id: bp.blueprint_id });
    expect(add.status).toBe(204);

    const list = await request(app).get(`/castle-types/${ct.castle_type_id}/blueprints`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const remove = await request(app).delete(
      `/castle-types/${ct.castle_type_id}/blueprints/${bp.blueprint_id}`,
    );
    expect(remove.status).toBe(204);
  });
});

// ─── 10. Relationship endpoints — castles ↔ castle-units ─────────────────────

describe('Relationship: castles ↔ castle-units', () => {
  it('POST /castles/:id/castle-units with { castle_unit_id } → 204, GET, DELETE', async () => {
    const unit = await createCastleUnit({
      castle_unit_id: 'CU-CASTLE-REL-V001',
      name: 'Castle Rel Unit',
      description: 'Rel',
      permission_scope: 'castle:read',
    });
    const castle = await createCastle({
      castle_record_id: 'CSTL-REL-TEST-V001',
      castle_name: 'Rel Test Castle',
      version: '1.0.0',
      primary_purpose: 'Rel test',
    });

    const add = await request(app)
      .post(`/castles/${castle.castle_record_id}/castle-units`)
      .send({ castle_unit_id: unit.castle_unit_id });
    expect(add.status).toBe(204);

    const list = await request(app).get(`/castles/${castle.castle_record_id}/castle-units`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);

    const remove = await request(app).delete(
      `/castles/${castle.castle_record_id}/castle-units/${unit.castle_unit_id}`,
    );
    expect(remove.status).toBe(204);
  });
});

// ─── 11. Castle-specific PATCH endpoints ─────────────────────────────────────
// Frontend: setCastleType(castleId, castleTypeId) → PATCH /castles/:id/castle-type { castle_type_id }
//           setCastleBlueprint(castleId, blueprintId) → PATCH /castles/:id/blueprint { blueprint_id }

describe('PATCH /castles/:id/castle-type and /blueprint', () => {
  it('PATCH /castles/:id/castle-type with { castle_type_id } → 200 and sets the field', async () => {
    const ct = await createCastleType({
      castle_type_id: 'CT-SET-TEST-V001',
      name: 'Set Test Castle Type',
      description: 'Set test',
      common_purpose: 'Set test',
    });
    const castle = await createCastle({
      castle_record_id: 'CSTL-SET-TYPE-V001',
      castle_name: 'Set Type Castle',
      version: '1.0.0',
      primary_purpose: 'Set type test',
    });

    const res = await request(app)
      .patch(`/castles/${castle.castle_record_id}/castle-type`)
      .send({ castle_type_id: ct.castle_type_id });
    expect(res.status).toBe(200);
    expect(res.body.castle_type_id).toBe(ct.castle_type_id);
  });

  it('PATCH /castles/:id/castle-type with { castle_type_id: null } clears the field', async () => {
    const castle = await createCastle({
      castle_record_id: 'CSTL-CLEAR-TYPE-V001',
      castle_name: 'Clear Type Castle',
      version: '1.0.0',
      primary_purpose: 'Clear type test',
    });

    const res = await request(app)
      .patch(`/castles/${castle.castle_record_id}/castle-type`)
      .send({ castle_type_id: null });
    expect(res.status).toBe(200);
    expect(res.body.castle_type_id).toBeNull();
  });

  it('PATCH /castles/:id/blueprint with { blueprint_id } → 200 and sets the field', async () => {
    const bp = await createBlueprint({
      blueprint_id: 'BP-SET-TEST-V001',
      name: 'Set Test Blueprint',
      category: 'Test',
      version: '1.0.0',
      purpose: 'Set test',
    });
    const castle = await createCastle({
      castle_record_id: 'CSTL-SET-BP-V001',
      castle_name: 'Set Blueprint Castle',
      version: '1.0.0',
      primary_purpose: 'Set blueprint test',
    });

    const res = await request(app)
      .patch(`/castles/${castle.castle_record_id}/blueprint`)
      .send({ blueprint_id: bp.blueprint_id });
    expect(res.status).toBe(200);
    expect(res.body.blueprint_id).toBe(bp.blueprint_id);
  });
});

// ─── 12. Local modifications CRUD ────────────────────────────────────────────
// Frontend: createLocalMod, updateLocalMod, deleteLocalMod

describe('Local modifications CRUD via /castles/:id/local-modifications', () => {
  it('POST creates a local modification and returns 201', async () => {
    const castle = await createCastle({
      castle_record_id: 'CSTL-LMOD-TEST-V001',
      castle_name: 'LMod Test Castle',
      version: '1.0.0',
      primary_purpose: 'Local mod test',
    });

    const res = await request(app)
      .post(`/castles/${castle.castle_record_id}/local-modifications`)
      .send({
        modification_id: 'LMOD-CONTRACT-TEST-V001',
        modified_item: 'Custom naming scheme',
        change_description: 'Custom changes',
        reason: 'Business requirement',
      });
    expect(res.status).toBe(201);
    expect(res.body.modification_id).toBe('LMOD-CONTRACT-TEST-V001');
    expect(res.body.castle_record_id).toBe(castle.castle_record_id);
  });

  it('GET lists local modifications for a castle → 200 array', async () => {
    const castle = await createCastle({
      castle_record_id: 'CSTL-LMOD-LIST-V001',
      castle_name: 'LMod List Castle',
      version: '1.0.0',
      primary_purpose: 'List mods test',
    });
    await request(app)
      .post(`/castles/${castle.castle_record_id}/local-modifications`)
      .send({
        modification_id: 'LMOD-LIST-TEST-V001',
        modified_item: 'Item A',
        change_description: 'Change A',
        reason: 'Reason A',
      });

    const res = await request(app).get(`/castles/${castle.castle_record_id}/local-modifications`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].modification_id).toBe('LMOD-LIST-TEST-V001');
  });

  it('PATCH /castles/:id/local-modifications/:modId updates and returns 200', async () => {
    const castle = await createCastle({
      castle_record_id: 'CSTL-LMOD-PATCH-V001',
      castle_name: 'LMod Patch Castle',
      version: '1.0.0',
      primary_purpose: 'Patch mod test',
    });
    await request(app)
      .post(`/castles/${castle.castle_record_id}/local-modifications`)
      .send({
        modification_id: 'LMOD-PATCH-TEST-V001',
        modified_item: 'Before',
        change_description: 'Original',
        reason: 'Original reason',
      });

    const res = await request(app)
      .patch(`/castles/${castle.castle_record_id}/local-modifications/LMOD-PATCH-TEST-V001`)
      .send({ change_description: 'Updated description' });
    expect(res.status).toBe(200);
    expect(res.body.change_description).toBe('Updated description');
  });

  it('DELETE /castles/:id/local-modifications/:modId → 204', async () => {
    const castle = await createCastle({
      castle_record_id: 'CSTL-LMOD-DEL-V001',
      castle_name: 'LMod Delete Castle',
      version: '1.0.0',
      primary_purpose: 'Delete mod test',
    });
    await request(app)
      .post(`/castles/${castle.castle_record_id}/local-modifications`)
      .send({
        modification_id: 'LMOD-DEL-TEST-V001',
        modified_item: 'To delete',
        change_description: 'Will be deleted',
        reason: 'Test',
      });

    const del = await request(app).delete(
      `/castles/${castle.castle_record_id}/local-modifications/LMOD-DEL-TEST-V001`,
    );
    expect(del.status).toBe(204);

    const listAfter = await request(app).get(
      `/castles/${castle.castle_record_id}/local-modifications`,
    );
    expect(listAfter.body).toHaveLength(0);
  });
});

// ─── 13. Query parameter filters pass through correctly ───────────────────────
// Verifies that the filter params the frontend sends (via fetchList) are wired up.

describe('Query param filters reach the backend correctly', () => {
  it('/composites?ui_backend_scope=UI filters correctly', async () => {
    await createComposite({
      composite_id: 'COMP-UI-FILTER-V001',
      name: 'UI Composite',
      description: 'UI scope',
      version: '1.0.0',
      ui_backend_scope: 'UI',
    });
    await createComposite({
      composite_id: 'COMP-BE-FILTER-V001',
      name: 'Backend Composite',
      description: 'Backend scope',
      version: '1.0.0',
      ui_backend_scope: 'Backend',
    });

    const res = await request(app).get('/composites?ui_backend_scope=UI');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].composite_id).toBe('COMP-UI-FILTER-V001');
  });

  it('/blueprints?category=SaaS filters correctly', async () => {
    await createBlueprint({
      blueprint_id: 'BP-SAAS-V001',
      name: 'SaaS Blueprint',
      category: 'SaaS',
      version: '1.0.0',
      purpose: 'SaaS apps',
    });
    await createBlueprint({
      blueprint_id: 'BP-ECOMMERCE-V001',
      name: 'E-Commerce Blueprint',
      category: 'E-Commerce',
      version: '1.0.0',
      purpose: 'E-commerce apps',
    });

    const res = await request(app).get('/blueprints?category=SaaS');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].blueprint_id).toBe('BP-SAAS-V001');
  });

  it('/castle-services?status=Active filters correctly', async () => {
    await createCastleService({
      castle_service_id: 'CS-ACTIVE-V001',
      name: 'Active Service',
      capability: 'Active',
      status: 'Active',
    });
    await createCastleService({
      castle_service_id: 'CS-DRAFT-V001',
      name: 'Draft Service',
      capability: 'Draft',
      status: 'Draft',
    });

    const res = await request(app).get('/castle-services?status=Active');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].castle_service_id).toBe('CS-ACTIVE-V001');
  });
});
