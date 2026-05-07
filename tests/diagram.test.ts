/**
 * Tests for GET /diagram/castle/:id
 *
 * Verifies response shape, node counts against seed data,
 * edge correctness, deduplication, and edge-case handling.
 */
import express from 'express';
import request from 'supertest';
import { seed, clearAll } from '../src/seed/seed';
import db from '../src/lib/db';
import diagramRouter from '../src/diagram/diagramRouter';
import type { DiagramNode, DiagramEdge } from '../src/diagram/diagramRouter';

const app = express();
app.use(express.json());
app.use('/diagram', diagramRouter);

const CASTLE_ID = 'CSTL-STRUT-WAREHOUSE-INVENTORY-V001';

// Seed once for the whole suite — seed() calls clearAll() internally
beforeAll(async () => {
  await seed();
}, 60_000);

afterAll(async () => {
  await clearAll();
});

// ─── Response shape ───────────────────────────────────────────────────────────

describe('response shape', () => {
  it('returns 200 with castle_record_id, castle_name, nodes[], and edges[]', async () => {
    const res = await request(app).get(`/diagram/castle/${CASTLE_ID}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      castle_record_id: CASTLE_ID,
      castle_name: expect.any(String),
    });
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.edges)).toBe(true);
  });

  it('returns 500 with an error field for a non-existent castle', async () => {
    const res = await request(app).get('/diagram/castle/NONEXISTENT-CASTLE-V001');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ─── Shared fetch for node/edge tests ────────────────────────────────────────

let nodes: DiagramNode[];
let edges: DiagramEdge[];

beforeAll(async () => {
  const res = await request(app).get(`/diagram/castle/${CASTLE_ID}`);
  nodes = res.body.nodes as DiagramNode[];
  edges = res.body.edges as DiagramEdge[];
}, 30_000);

// ─── Node correctness ─────────────────────────────────────────────────────────

describe('nodes', () => {
  it('every node has id, label, type, and status', () => {
    for (const n of nodes) {
      expect(typeof n.id).toBe('string');
      expect(n.id.length).toBeGreaterThan(0);
      expect(typeof n.label).toBe('string');
      expect(n.label.length).toBeGreaterThan(0);
      expect(typeof n.type).toBe('string');
      expect(typeof n.status).toBe('string');
    }
  });

  it('has no duplicate node IDs', () => {
    const ids = nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes exactly 1 Castle node with the correct id', () => {
    const cn = nodes.filter((n) => n.type === 'Castle');
    expect(cn).toHaveLength(1);
    expect(cn[0].id).toBe(CASTLE_ID);
  });

  it('includes 1 CastleType node', () => {
    expect(nodes.filter((n) => n.type === 'CastleType')).toHaveLength(1);
  });

  it('includes 1 Blueprint node', () => {
    expect(nodes.filter((n) => n.type === 'Blueprint')).toHaveLength(1);
  });

  it('includes 4 CastleUnit nodes', () => {
    expect(nodes.filter((n) => n.type === 'CastleUnit')).toHaveLength(4);
  });

  it('includes 7 CastleService nodes', () => {
    expect(nodes.filter((n) => n.type === 'CastleService')).toHaveLength(7);
  });

  it('includes 5 Composite nodes', () => {
    expect(nodes.filter((n) => n.type === 'Composite')).toHaveLength(5);
  });

  it('includes 5 Compound nodes', () => {
    expect(nodes.filter((n) => n.type === 'Compound')).toHaveLength(5);
  });

  it('includes 7 AtomicAsset nodes — InventoryStatusEnum appears once despite being in 3 compounds', () => {
    expect(nodes.filter((n) => n.type === 'AtomicAsset')).toHaveLength(7);
    const aaIds = nodes.filter((n) => n.type === 'AtomicAsset').map((n) => n.id);
    expect(new Set(aaIds).size).toBe(7);
  });

  it('includes 5 LocalMod nodes', () => {
    expect(nodes.filter((n) => n.type === 'LocalMod')).toHaveLength(5);
  });

  it('CastleService nodes carry a subLabel set to their capability', () => {
    for (const n of nodes.filter((n) => n.type === 'CastleService')) {
      expect(typeof n.subLabel).toBe('string');
      expect((n.subLabel as string).length).toBeGreaterThan(0);
    }
  });

  it('AtomicAsset nodes carry a subLabel set to their asset_type', () => {
    for (const n of nodes.filter((n) => n.type === 'AtomicAsset')) {
      expect(typeof n.subLabel).toBe('string');
      expect((n.subLabel as string).length).toBeGreaterThan(0);
    }
  });

  it('Composite nodes carry a subLabel set to their ui_backend_scope', () => {
    for (const n of nodes.filter((n) => n.type === 'Composite')) {
      expect(typeof n.subLabel).toBe('string');
    }
  });
});

// ─── Edge correctness ────────────────────────────────────────────────────────

describe('edges', () => {
  it('every edge has source and target strings', () => {
    for (const e of edges) {
      expect(typeof e.source).toBe('string');
      expect(typeof e.target).toBe('string');
    }
  });

  it('no duplicate edges (same source→target pair)', () => {
    const keys = edges.map((e) => `${e.source}→${e.target}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all edge sources reference valid node IDs', () => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(nodeIds.has(e.source)).toBe(true);
    }
  });

  it('all edge targets reference valid node IDs', () => {
    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(nodeIds.has(e.target)).toBe(true);
    }
  });

  it('Castle has an edge to its CastleType', () => {
    const typeNode = nodes.find((n) => n.type === 'CastleType')!;
    expect(edges.some((e) => e.source === CASTLE_ID && e.target === typeNode.id)).toBe(true);
  });

  it('Castle has an edge to its Blueprint', () => {
    const bpNode = nodes.find((n) => n.type === 'Blueprint')!;
    expect(edges.some((e) => e.source === CASTLE_ID && e.target === bpNode.id)).toBe(true);
  });

  it('Castle has an edge to each of the 4 CastleUnits', () => {
    const unitIds = nodes.filter((n) => n.type === 'CastleUnit').map((n) => n.id);
    for (const uid of unitIds) {
      expect(edges.some((e) => e.source === CASTLE_ID && e.target === uid)).toBe(true);
    }
  });

  it('Castle has an edge to each of the 5 LocalMods', () => {
    const modIds = nodes.filter((n) => n.type === 'LocalMod').map((n) => n.id);
    for (const mid of modIds) {
      expect(edges.some((e) => e.source === CASTLE_ID && e.target === mid)).toBe(true);
    }
  });

  it('InventoryStatusEnum node has exactly 3 incoming edges — one from each compound that uses it', () => {
    // AA-INVENTORY-STATUS-ENUM-V001 is in:
    //   CMPD-DATE-RANGE-FILTER-V001, CMPD-QUANTITY-VALIDATION-V001, CMPD-STOCK-STATUS-FILTER-V001
    const aaId = 'AA-INVENTORY-STATUS-ENUM-V001';
    const incoming = edges.filter((e) => e.target === aaId);
    expect(incoming).toHaveLength(3);
    const sources = incoming.map((e) => e.source);
    expect(sources).toContain('CMPD-DATE-RANGE-FILTER-V001');
    expect(sources).toContain('CMPD-QUANTITY-VALIDATION-V001');
    expect(sources).toContain('CMPD-STOCK-STATUS-FILTER-V001');
  });
});

// ─── Castle without type or blueprint ────────────────────────────────────────

describe('castle without type or blueprint', () => {
  const BARE_ID = 'CSTL-BARE-DIAGRAM-TEST-V001';

  beforeAll(async () => {
    await db.query(
      `INSERT INTO "Castle" (castle_record_id, castle_name, version, status, primary_purpose)
       VALUES ($1, $2, $3, $4, $5)`,
      [BARE_ID, 'Bare Test Castle', '1.0.0', 'Draft', 'Testing'],
    );
  });

  afterAll(async () => {
    await db.query(`DELETE FROM "Castle" WHERE castle_record_id = $1`, [BARE_ID]);
  });

  it('returns 200', async () => {
    const res = await request(app).get(`/diagram/castle/${BARE_ID}`);
    expect(res.status).toBe(200);
  });

  it('returns exactly 1 node — the Castle itself', async () => {
    const res = await request(app).get(`/diagram/castle/${BARE_ID}`);
    expect(res.body.nodes).toHaveLength(1);
    expect(res.body.nodes[0].type).toBe('Castle');
    expect(res.body.nodes[0].id).toBe(BARE_ID);
  });

  it('returns no edges', async () => {
    const res = await request(app).get(`/diagram/castle/${BARE_ID}`);
    expect(res.body.edges).toHaveLength(0);
  });
});
