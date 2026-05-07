import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import db from '../lib/db';
import { createAtomicAsset } from '../entities/atomicAsset';
import { createCompound, addAtomicAssetToCompound } from '../entities/compound';
import {
  createComposite,
  addCompoundToComposite,
  addAtomicAssetToComposite,
} from '../entities/composite';
import { createCastleService, addCompositeToService } from '../entities/castleService';
import { createCastleUnit, addServiceToUnit } from '../entities/castleUnit';
import {
  createBlueprint,
  addCastleUnitToBlueprint,
  addCastleServiceToBlueprint,
  addCompositeToBlueprint,
} from '../entities/blueprint';
import {
  createCastleType,
  addBlueprintToCastleType,
  addCastleUnitToCastleType,
  addCastleServiceToCastleType,
} from '../entities/castleType';
import {
  createCastle,
  addCastleUnitToCastle,
  addCastleServiceToCastle,
  createLocalModification,
} from '../entities/castle';

const router = Router();

const CSV_PATH = path.resolve(__dirname, '../../db/demo/demo-data.csv');

// ─── CSV Parser ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

type Section = { headers: string[]; rows: string[][] };

function parseDemoCSV(content: string): Map<string, Section> {
  const sections = new Map<string, Section>();
  let current: Section | null = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('[') && line.endsWith(']')) {
      const name = line.slice(1, -1);
      current = { headers: [], rows: [] };
      sections.set(name, current);
    } else if (current) {
      const cells = parseCSVLine(line);
      if (current.headers.length === 0) {
        current.headers = cells;
      } else {
        current.rows.push(cells);
      }
    }
  }

  return sections;
}

function field(row: string[], headers: string[], name: string): string {
  const idx = headers.indexOf(name);
  return idx >= 0 ? (row[idx] ?? '').trim() : '';
}

// ─── Targeted clear ───────────────────────────────────────────────────────────

async function clearDemo() {
  // Delete in top-down order; ON DELETE CASCADE handles all join tables
  await db.query(`DELETE FROM "Castle"      WHERE castle_record_id LIKE '%-DEMO-%'`);
  await db.query(`DELETE FROM "CastleType"  WHERE castle_type_id   LIKE '%-DEMO-%'`);
  await db.query(`DELETE FROM "Blueprint"   WHERE blueprint_id     LIKE '%-DEMO-%'`);
  await db.query(`DELETE FROM "CastleUnit"  WHERE castle_unit_id   LIKE '%-DEMO-%'`);
  await db.query(`DELETE FROM "CastleService" WHERE castle_service_id LIKE '%-DEMO-%'`);
  await db.query(`DELETE FROM "Composite"   WHERE composite_id     LIKE '%-DEMO-%'`);
  await db.query(`DELETE FROM "Compound"    WHERE compound_id      LIKE '%-DEMO-%'`);
  await db.query(`DELETE FROM "AtomicAsset" WHERE atomic_asset_id  LIKE '%-DEMO-%'`);
}

// ─── Loader ───────────────────────────────────────────────────────────────────

async function loadDemoCSV(): Promise<Record<string, number>> {
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const s = parseDemoCSV(content);

  const counts: Record<string, number> = {};

  // AtomicAssets
  const aaSec = s.get('AtomicAsset');
  if (aaSec) {
    for (const row of aaSec.rows) {
      const h = aaSec.headers;
      await createAtomicAsset({
        atomic_asset_id: field(row, h, 'id'),
        name: field(row, h, 'name'),
        asset_type: field(row, h, 'asset_type') as never,
        description: field(row, h, 'description'),
        code_location: field(row, h, 'code_location'),
        version: field(row, h, 'version'),
        status: field(row, h, 'status') as never,
      });
    }
    counts['atomic_assets'] = aaSec.rows.length;
  }

  // Compounds
  const cpdSec = s.get('Compound');
  if (cpdSec) {
    for (const row of cpdSec.rows) {
      const h = cpdSec.headers;
      await createCompound({
        compound_id: field(row, h, 'id'),
        name: field(row, h, 'name'),
        description: field(row, h, 'description'),
        version: field(row, h, 'version'),
        status: field(row, h, 'status') as never,
      });
    }
    counts['compounds'] = cpdSec.rows.length;
  }

  // Compound → AtomicAsset relationships
  const cpdAASec = s.get('CompoundAtomicAsset');
  if (cpdAASec) {
    for (const row of cpdAASec.rows) {
      const h = cpdAASec.headers;
      await addAtomicAssetToCompound(field(row, h, 'compound_id'), field(row, h, 'atomic_asset_id'));
    }
  }

  // Composites
  const compSec = s.get('Composite');
  if (compSec) {
    for (const row of compSec.rows) {
      const h = compSec.headers;
      await createComposite({
        composite_id: field(row, h, 'id'),
        name: field(row, h, 'name'),
        description: field(row, h, 'description'),
        version: field(row, h, 'version'),
        ui_backend_scope: field(row, h, 'ui_backend_scope') as never,
        status: field(row, h, 'status') as never,
      });
    }
    counts['composites'] = compSec.rows.length;
  }

  // Composite → Compound relationships
  const compCpdSec = s.get('CompositeCompound');
  if (compCpdSec) {
    for (const row of compCpdSec.rows) {
      const h = compCpdSec.headers;
      await addCompoundToComposite(field(row, h, 'composite_id'), field(row, h, 'compound_id'));
    }
  }

  // Composite → AtomicAsset relationships
  const compAASec = s.get('CompositeAtomicAsset');
  if (compAASec) {
    for (const row of compAASec.rows) {
      const h = compAASec.headers;
      await addAtomicAssetToComposite(field(row, h, 'composite_id'), field(row, h, 'atomic_asset_id'));
    }
  }

  // CastleServices
  const csSec = s.get('CastleService');
  if (csSec) {
    for (const row of csSec.rows) {
      const h = csSec.headers;
      await createCastleService({
        castle_service_id: field(row, h, 'id'),
        name: field(row, h, 'name'),
        capability: field(row, h, 'capability'),
        status: field(row, h, 'status') as never,
      });
    }
    counts['castle_services'] = csSec.rows.length;
  }

  // CastleService → Composite relationships
  const csCompSec = s.get('CastleServiceComposite');
  if (csCompSec) {
    for (const row of csCompSec.rows) {
      const h = csCompSec.headers;
      await addCompositeToService(field(row, h, 'castle_service_id'), field(row, h, 'composite_id'));
    }
  }

  // CastleUnits
  const cuSec = s.get('CastleUnit');
  if (cuSec) {
    for (const row of cuSec.rows) {
      const h = cuSec.headers;
      await createCastleUnit({
        castle_unit_id: field(row, h, 'id'),
        name: field(row, h, 'name'),
        description: field(row, h, 'description'),
        permission_scope: field(row, h, 'permission_scope'),
        status: field(row, h, 'status') as never,
      });
    }
    counts['castle_units'] = cuSec.rows.length;
  }

  // CastleUnit → CastleService relationships
  const cuSvcSec = s.get('CastleUnitService');
  if (cuSvcSec) {
    for (const row of cuSvcSec.rows) {
      const h = cuSvcSec.headers;
      await addServiceToUnit(field(row, h, 'castle_unit_id'), field(row, h, 'castle_service_id'));
    }
  }

  // Blueprints
  const bpSec = s.get('Blueprint');
  if (bpSec) {
    for (const row of bpSec.rows) {
      const h = bpSec.headers;
      await createBlueprint({
        blueprint_id: field(row, h, 'id'),
        name: field(row, h, 'name'),
        category: field(row, h, 'category'),
        version: field(row, h, 'version'),
        purpose: field(row, h, 'purpose'),
        status: field(row, h, 'status') as never,
      });
    }
    counts['blueprints'] = bpSec.rows.length;
  }

  // Blueprint → CastleUnit
  const bpCuSec = s.get('BlueprintCastleUnit');
  if (bpCuSec) {
    for (const row of bpCuSec.rows) {
      const h = bpCuSec.headers;
      await addCastleUnitToBlueprint(field(row, h, 'blueprint_id'), field(row, h, 'castle_unit_id'));
    }
  }

  // Blueprint → CastleService
  const bpCsSec = s.get('BlueprintCastleService');
  if (bpCsSec) {
    for (const row of bpCsSec.rows) {
      const h = bpCsSec.headers;
      await addCastleServiceToBlueprint(field(row, h, 'blueprint_id'), field(row, h, 'castle_service_id'));
    }
  }

  // Blueprint → Composite
  const bpCompSec = s.get('BlueprintComposite');
  if (bpCompSec) {
    for (const row of bpCompSec.rows) {
      const h = bpCompSec.headers;
      await addCompositeToBlueprint(field(row, h, 'blueprint_id'), field(row, h, 'composite_id'));
    }
  }

  // CastleTypes
  const ctSec = s.get('CastleType');
  if (ctSec) {
    for (const row of ctSec.rows) {
      const h = ctSec.headers;
      await createCastleType({
        castle_type_id: field(row, h, 'id'),
        name: field(row, h, 'name'),
        description: field(row, h, 'description'),
        common_purpose: field(row, h, 'common_purpose'),
        status: field(row, h, 'status') as never,
      });
    }
    counts['castle_types'] = ctSec.rows.length;
  }

  // CastleType → CastleUnit
  const ctCuSec = s.get('CastleTypeCastleUnit');
  if (ctCuSec) {
    for (const row of ctCuSec.rows) {
      const h = ctCuSec.headers;
      await addCastleUnitToCastleType(field(row, h, 'castle_type_id'), field(row, h, 'castle_unit_id'));
    }
  }

  // CastleType → CastleService
  const ctCsSec = s.get('CastleTypeCastleService');
  if (ctCsSec) {
    for (const row of ctCsSec.rows) {
      const h = ctCsSec.headers;
      await addCastleServiceToCastleType(field(row, h, 'castle_type_id'), field(row, h, 'castle_service_id'));
    }
  }

  // CastleType → Blueprint
  const ctBpSec = s.get('CastleTypeBlueprint');
  if (ctBpSec) {
    for (const row of ctBpSec.rows) {
      const h = ctBpSec.headers;
      await addBlueprintToCastleType(field(row, h, 'castle_type_id'), field(row, h, 'blueprint_id'));
    }
  }

  // Castles
  const castleSec = s.get('Castle');
  if (castleSec) {
    for (const row of castleSec.rows) {
      const h = castleSec.headers;
      const typeId = field(row, h, 'castle_type_id');
      const bpId = field(row, h, 'blueprint_id');
      await createCastle({
        castle_record_id: field(row, h, 'id'),
        castle_name: field(row, h, 'castle_name'),
        version: field(row, h, 'version'),
        primary_purpose: field(row, h, 'primary_purpose'),
        status: field(row, h, 'status') as never,
        castle_type_id: typeId || undefined,
        blueprint_id: bpId || undefined,
      });
    }
    counts['castles'] = castleSec.rows.length;
  }

  // Castle → CastleUnit
  const castCuSec = s.get('CastleCastleUnit');
  if (castCuSec) {
    for (const row of castCuSec.rows) {
      const h = castCuSec.headers;
      await addCastleUnitToCastle(field(row, h, 'castle_record_id'), field(row, h, 'castle_unit_id'));
    }
  }

  // Castle → CastleService
  const castCsSec = s.get('CastleCastleService');
  if (castCsSec) {
    for (const row of castCsSec.rows) {
      const h = castCsSec.headers;
      await addCastleServiceToCastle(field(row, h, 'castle_record_id'), field(row, h, 'castle_service_id'));
    }
  }

  // LocalModifications
  const lmodSec = s.get('LocalModification');
  if (lmodSec) {
    for (const row of lmodSec.rows) {
      const h = lmodSec.headers;
      await createLocalModification({
        modification_id: field(row, h, 'id'),
        castle_record_id: field(row, h, 'castle_record_id'),
        modified_item: field(row, h, 'modified_item'),
        change_description: field(row, h, 'change_description'),
        reason: field(row, h, 'reason'),
        review_status: field(row, h, 'review_status') as never,
        promotion_recommendation: field(row, h, 'promotion_recommendation') as never,
      });
    }
    counts['local_modifications'] = lmodSec.rows.length;
  }

  return counts;
}

// ─── Status helper ────────────────────────────────────────────────────────────

async function getDemoStatus() {
  const [castleRes, typeRes, bpRes, cuRes, csRes, compRes, cpdRes, aaRes, lmodRes] =
    await Promise.all([
      db.query(`SELECT COUNT(*)::int AS n FROM "Castle"        WHERE castle_record_id LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "CastleType"    WHERE castle_type_id   LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "Blueprint"     WHERE blueprint_id     LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "CastleUnit"    WHERE castle_unit_id   LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "CastleService" WHERE castle_service_id LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "Composite"     WHERE composite_id     LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "Compound"      WHERE compound_id      LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "AtomicAsset"   WHERE atomic_asset_id  LIKE '%-DEMO-%'`),
      db.query(`SELECT COUNT(*)::int AS n FROM "LocalModification" WHERE modification_id LIKE '%-DEMO-%'`),
    ]);

  const counts = {
    castles: castleRes.rows[0].n,
    castle_types: typeRes.rows[0].n,
    blueprints: bpRes.rows[0].n,
    castle_units: cuRes.rows[0].n,
    castle_services: csRes.rows[0].n,
    composites: compRes.rows[0].n,
    compounds: cpdRes.rows[0].n,
    atomic_assets: aaRes.rows[0].n,
    local_modifications: lmodRes.rows[0].n,
  };

  const loaded = counts.castles > 0;
  return { loaded, counts };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get('/status', async (_req, res) => {
  try {
    res.json(await getDemoStatus());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/load', async (_req, res) => {
  try {
    await clearDemo();
    const counts = await loadDemoCSV();
    res.json({ message: 'Demo data loaded successfully', counts });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/clear', async (_req, res) => {
  try {
    await clearDemo();
    res.json({ message: 'Demo data cleared' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/clear-all', async (_req, res) => {
  try {
    await db.query('DELETE FROM "Castle"');
    await db.query('DELETE FROM "CastleType"');
    await db.query('DELETE FROM "Blueprint"');
    await db.query('DELETE FROM "CastleUnit"');
    await db.query('DELETE FROM "CastleService"');
    await db.query('DELETE FROM "Composite"');
    await db.query('DELETE FROM "Compound"');
    await db.query('DELETE FROM "AtomicAsset"');
    res.json({ message: 'All data cleared' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/csv', (_req, res) => {
  try {
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="demo-data.csv"');
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
