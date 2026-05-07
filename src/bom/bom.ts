import db from '../lib/db';

export type EntityType =
  | 'AtomicAsset'
  | 'Compound'
  | 'Composite'
  | 'CastleService'
  | 'CastleUnit';

// --- Shared node type ---

export interface BOMNode {
  id: string;
  name: string;
  version?: string;
  status: string;
  warning?: string;
}

// --- generateBOM output types ---

export interface BOMAtomicAsset extends BOMNode {
  asset_type: string;
}

export interface BOMCompound extends BOMNode {
  atomic_assets: BOMAtomicAsset[];
}

export interface BOMComposite extends BOMNode {
  ui_backend_scope: string;
  compounds: BOMCompound[];
  atomic_assets: BOMAtomicAsset[];
}

export interface BOMCastleService extends BOMNode {
  capability: string;
  composites: BOMComposite[];
  compounds: BOMCompound[];
  atomic_assets: BOMAtomicAsset[];
}

export interface BOMCastleUnit extends BOMNode {
  castle_services: BOMCastleService[];
}

export interface BOMLocalModification {
  modification_id: string;
  modified_item: string;
  change_description: string;
  reason: string;
  review_status: string;
  promotion_recommendation: string;
}

export interface BOMResult {
  castle_record_id: string;
  castle_name: string;
  version: string;
  status: string;
  warning?: string;
  castle_type: BOMNode | null;
  blueprint: BOMNode | null;
  castle_units: BOMCastleUnit[];
  local_modifications: BOMLocalModification[];
}

// --- traceImpact output type ---

export interface ImpactResult {
  entity_id: string;
  entity_type: EntityType;
  compounds?: BOMNode[];
  composites?: BOMNode[];
  castle_services?: BOMNode[];
  castle_units?: BOMNode[];
  castles: BOMNode[];
}

// --- Helpers ---

function warn(status: string): string | undefined {
  return status === 'Deprecated' || status === 'Archived'
    ? `Status is ${status}`
    : undefined;
}

// --- generateBOM ---

export async function generateBOM(castle_record_id: string): Promise<BOMResult> {
  const castleRes = await db.query(
    `SELECT * FROM "Castle" WHERE "castle_record_id" = $1`,
    [castle_record_id],
  );
  if (!castleRes.rows[0]) throw new Error(`Castle "${castle_record_id}" not found`);
  const castle = castleRes.rows[0];

  // Fetch side data + CU join rows
  const [ctRes, bpRes, lmodRes, cuJoinRes] = await Promise.all([
    castle.castle_type_id
      ? db.query(`SELECT * FROM "CastleType" WHERE "castle_type_id" = $1`, [castle.castle_type_id])
      : Promise.resolve({ rows: [] as any[] }),
    castle.blueprint_id
      ? db.query(`SELECT * FROM "Blueprint" WHERE "blueprint_id" = $1`, [castle.blueprint_id])
      : Promise.resolve({ rows: [] as any[] }),
    db.query(
      `SELECT * FROM "LocalModification" WHERE "castle_record_id" = $1`,
      [castle_record_id],
    ),
    db.query(
      `SELECT castle_unit_id FROM castle_castle_units WHERE castle_record_id = $1`,
      [castle_record_id],
    ),
  ]);

  const cuIds: string[] = cuJoinRes.rows.map((r: any) => r.castle_unit_id);

  // Adjacency maps filled as we query each level
  const cuToCs = new Map<string, string[]>();
  const csToComp = new Map<string, string[]>();
  const csToCpd = new Map<string, string[]>();
  const csToAa = new Map<string, string[]>();
  const compToCpd = new Map<string, string[]>();
  const compToAa = new Map<string, string[]>();
  const cpdToAa = new Map<string, string[]>();

  let cuRows: any[] = [];
  let csIds: string[] = [];
  let csRows: any[] = [];
  let compIds: string[] = [];
  let compositeRows: any[] = [];
  let compoundRows: any[] = [];
  const aaMap = new Map<string, any>();

  // Level 2: castle units
  if (cuIds.length > 0) {
    const [cuRes, cuCsJoin] = await Promise.all([
      db.query(`SELECT * FROM "CastleUnit" WHERE "castle_unit_id" = ANY($1::text[])`, [cuIds]),
      db.query(
        `SELECT castle_unit_id, castle_service_id FROM castle_unit_services WHERE castle_unit_id = ANY($1::text[])`,
        [cuIds],
      ),
    ]);
    cuRows = cuRes.rows;
    for (const r of cuCsJoin.rows) {
      if (!cuToCs.has(r.castle_unit_id)) cuToCs.set(r.castle_unit_id, []);
      cuToCs.get(r.castle_unit_id)!.push(r.castle_service_id);
    }
    csIds = [...new Set<string>(cuCsJoin.rows.map((r: any) => r.castle_service_id as string))];
  }

  // Level 3: castle services
  if (csIds.length > 0) {
    const [csRes, csCompJoin, csCpdJoin, csAaJoin] = await Promise.all([
      db.query(
        `SELECT * FROM "CastleService" WHERE "castle_service_id" = ANY($1::text[])`,
        [csIds],
      ),
      db.query(
        `SELECT castle_service_id, composite_id FROM castle_service_composites WHERE castle_service_id = ANY($1::text[])`,
        [csIds],
      ),
      db.query(
        `SELECT castle_service_id, compound_id FROM castle_service_compounds WHERE castle_service_id = ANY($1::text[])`,
        [csIds],
      ),
      db.query(
        `SELECT castle_service_id, atomic_asset_id FROM castle_service_atomic_assets WHERE castle_service_id = ANY($1::text[])`,
        [csIds],
      ),
    ]);
    csRows = csRes.rows;
    for (const r of csCompJoin.rows) {
      if (!csToComp.has(r.castle_service_id)) csToComp.set(r.castle_service_id, []);
      csToComp.get(r.castle_service_id)!.push(r.composite_id);
    }
    for (const r of csCpdJoin.rows) {
      if (!csToCpd.has(r.castle_service_id)) csToCpd.set(r.castle_service_id, []);
      csToCpd.get(r.castle_service_id)!.push(r.compound_id);
    }
    for (const r of csAaJoin.rows) {
      if (!csToAa.has(r.castle_service_id)) csToAa.set(r.castle_service_id, []);
      csToAa.get(r.castle_service_id)!.push(r.atomic_asset_id);
    }
    compIds = [...new Set<string>(csCompJoin.rows.map((r: any) => r.composite_id as string))];
  }

  // Level 4: composites
  const allCpdIds = new Set<string>();
  for (const ids of csToCpd.values()) ids.forEach((id) => allCpdIds.add(id));

  if (compIds.length > 0) {
    const [compRes, compCpdJoin, compAaJoin] = await Promise.all([
      db.query(
        `SELECT * FROM "Composite" WHERE "composite_id" = ANY($1::text[])`,
        [compIds],
      ),
      db.query(
        `SELECT composite_id, compound_id FROM composite_compounds WHERE composite_id = ANY($1::text[])`,
        [compIds],
      ),
      db.query(
        `SELECT composite_id, atomic_asset_id FROM composite_atomic_assets WHERE composite_id = ANY($1::text[])`,
        [compIds],
      ),
    ]);
    compositeRows = compRes.rows;
    for (const r of compCpdJoin.rows) {
      if (!compToCpd.has(r.composite_id)) compToCpd.set(r.composite_id, []);
      compToCpd.get(r.composite_id)!.push(r.compound_id);
      allCpdIds.add(r.compound_id);
    }
    for (const r of compAaJoin.rows) {
      if (!compToAa.has(r.composite_id)) compToAa.set(r.composite_id, []);
      compToAa.get(r.composite_id)!.push(r.atomic_asset_id);
    }
  }

  // Level 5: compounds
  const cpdIdsArr = [...allCpdIds];
  if (cpdIdsArr.length > 0) {
    const [cpdRes, cpdAaJoin] = await Promise.all([
      db.query(
        `SELECT * FROM "Compound" WHERE "compound_id" = ANY($1::text[])`,
        [cpdIdsArr],
      ),
      db.query(
        `SELECT compound_id, atomic_asset_id FROM compound_atomic_assets WHERE compound_id = ANY($1::text[])`,
        [cpdIdsArr],
      ),
    ]);
    compoundRows = cpdRes.rows;
    for (const r of cpdAaJoin.rows) {
      if (!cpdToAa.has(r.compound_id)) cpdToAa.set(r.compound_id, []);
      cpdToAa.get(r.compound_id)!.push(r.atomic_asset_id);
    }
  }

  // Level 6: atomic assets (deduplicated)
  const allAaIdsSet = new Set<string>();
  for (const ids of csToAa.values()) ids.forEach((id) => allAaIdsSet.add(id));
  for (const ids of compToAa.values()) ids.forEach((id) => allAaIdsSet.add(id));
  for (const ids of cpdToAa.values()) ids.forEach((id) => allAaIdsSet.add(id));

  const aaIdsArr = [...allAaIdsSet];
  if (aaIdsArr.length > 0) {
    const aaRes = await db.query(
      `SELECT * FROM "AtomicAsset" WHERE "atomic_asset_id" = ANY($1::text[])`,
      [aaIdsArr],
    );
    for (const aa of aaRes.rows) aaMap.set(aa.atomic_asset_id, aa);
  }

  // Build lookup maps
  const cuMap = new Map<string, any>();
  for (const u of cuRows) cuMap.set(u.castle_unit_id, u);
  const csMap = new Map<string, any>();
  for (const s of csRows) csMap.set(s.castle_service_id, s);
  const compositeMap = new Map<string, any>();
  for (const c of compositeRows) compositeMap.set(c.composite_id, c);
  const cpdMap = new Map<string, any>();
  for (const c of compoundRows) cpdMap.set(c.compound_id, c);

  // Assemblers
  function toAANode(id: string): BOMAtomicAsset {
    const aa = aaMap.get(id)!;
    return {
      id: aa.atomic_asset_id,
      name: aa.name,
      asset_type: aa.asset_type,
      version: aa.version,
      status: aa.status,
      warning: warn(aa.status),
    };
  }

  function toCpdNode(id: string): BOMCompound {
    const c = cpdMap.get(id)!;
    return {
      id: c.compound_id,
      name: c.name,
      version: c.version,
      status: c.status,
      warning: warn(c.status),
      atomic_assets: (cpdToAa.get(id) ?? []).map(toAANode),
    };
  }

  function toCompNode(id: string): BOMComposite {
    const c = compositeMap.get(id)!;
    return {
      id: c.composite_id,
      name: c.name,
      version: c.version,
      ui_backend_scope: c.ui_backend_scope,
      status: c.status,
      warning: warn(c.status),
      compounds: (compToCpd.get(id) ?? []).map(toCpdNode),
      atomic_assets: (compToAa.get(id) ?? []).map(toAANode),
    };
  }

  function toSvcNode(id: string): BOMCastleService {
    const s = csMap.get(id)!;
    return {
      id: s.castle_service_id,
      name: s.name,
      status: s.status,
      capability: s.capability,
      warning: warn(s.status),
      composites: (csToComp.get(id) ?? []).map(toCompNode),
      compounds: (csToCpd.get(id) ?? []).map(toCpdNode),
      atomic_assets: (csToAa.get(id) ?? []).map(toAANode),
    };
  }

  const castle_units: BOMCastleUnit[] = cuIds
    .filter((cuId) => cuMap.has(cuId))
    .map((cuId) => {
      const u = cuMap.get(cuId)!;
      return {
        id: u.castle_unit_id,
        name: u.name,
        status: u.status,
        warning: warn(u.status),
        castle_services: (cuToCs.get(cuId) ?? []).map(toSvcNode),
      };
    });

  return {
    castle_record_id: castle.castle_record_id,
    castle_name: castle.castle_name,
    version: castle.version,
    status: castle.status,
    warning: warn(castle.status),
    castle_type: ctRes.rows[0]
      ? {
          id: ctRes.rows[0].castle_type_id,
          name: ctRes.rows[0].name,
          status: ctRes.rows[0].status,
          warning: warn(ctRes.rows[0].status),
        }
      : null,
    blueprint: bpRes.rows[0]
      ? {
          id: bpRes.rows[0].blueprint_id,
          name: bpRes.rows[0].name,
          version: bpRes.rows[0].version,
          status: bpRes.rows[0].status,
          warning: warn(bpRes.rows[0].status),
        }
      : null,
    castle_units,
    local_modifications: lmodRes.rows.map((m: any) => ({
      modification_id: m.modification_id,
      modified_item: m.modified_item,
      change_description: m.change_description,
      reason: m.reason,
      review_status: m.review_status,
      promotion_recommendation: m.promotion_recommendation,
    })),
  };
}

// --- traceImpact ---

function toNode(r: {
  compound_id?: string;
  composite_id?: string;
  castle_service_id?: string;
  castle_unit_id?: string;
  castle_record_id?: string;
  castle_name?: string;
  name?: string;
  version?: string;
  status: string;
}): BOMNode {
  const id =
    r.compound_id ?? r.composite_id ?? r.castle_service_id ??
    r.castle_unit_id ?? r.castle_record_id ?? '';
  const name = r.castle_name ?? r.name ?? '';
  return { id, name, version: r.version, status: r.status, warning: warn(r.status) };
}

export async function traceImpact(
  entity_id: string,
  entity_type: EntityType,
): Promise<ImpactResult> {
  const compoundIds = new Set<string>();
  const compositeIds = new Set<string>();
  const castleServiceIds = new Set<string>();
  const castleUnitIds = new Set<string>();
  const castleIds = new Set<string>();

  if (entity_type === 'AtomicAsset') {
    const [r1, r2, r3] = await Promise.all([
      db.query('SELECT compound_id FROM compound_atomic_assets WHERE atomic_asset_id = $1', [entity_id]),
      db.query('SELECT composite_id FROM composite_atomic_assets WHERE atomic_asset_id = $1', [entity_id]),
      db.query('SELECT castle_service_id FROM castle_service_atomic_assets WHERE atomic_asset_id = $1', [entity_id]),
    ]);
    r1.rows.forEach((r) => compoundIds.add(r.compound_id));
    r2.rows.forEach((r) => compositeIds.add(r.composite_id));
    r3.rows.forEach((r) => castleServiceIds.add(r.castle_service_id));
  }

  if (entity_type === 'Compound') {
    const [r1, r2] = await Promise.all([
      db.query('SELECT composite_id FROM composite_compounds WHERE compound_id = $1', [entity_id]),
      db.query('SELECT castle_service_id FROM castle_service_compounds WHERE compound_id = $1', [entity_id]),
    ]);
    r1.rows.forEach((r) => compositeIds.add(r.composite_id));
    r2.rows.forEach((r) => castleServiceIds.add(r.castle_service_id));
  }

  // From compounds found (AtomicAsset path): composites and services via compounds
  if (compoundIds.size > 0) {
    const ids = [...compoundIds];
    const [r1, r2] = await Promise.all([
      db.query('SELECT composite_id FROM composite_compounds WHERE compound_id = ANY($1::text[])', [ids]),
      db.query('SELECT castle_service_id FROM castle_service_compounds WHERE compound_id = ANY($1::text[])', [ids]),
    ]);
    r1.rows.forEach((r) => compositeIds.add(r.composite_id));
    r2.rows.forEach((r) => castleServiceIds.add(r.castle_service_id));
  }

  if (entity_type === 'Composite') {
    const [r1, r2] = await Promise.all([
      db.query('SELECT castle_service_id FROM castle_service_composites WHERE composite_id = $1', [entity_id]),
      db.query('SELECT castle_unit_id FROM castle_unit_composites WHERE composite_id = $1', [entity_id]),
    ]);
    r1.rows.forEach((r) => castleServiceIds.add(r.castle_service_id));
    r2.rows.forEach((r) => castleUnitIds.add(r.castle_unit_id));
  }

  // From composites found: services and units via composites
  if (compositeIds.size > 0) {
    const ids = [...compositeIds];
    const [r1, r2] = await Promise.all([
      db.query('SELECT castle_service_id FROM castle_service_composites WHERE composite_id = ANY($1::text[])', [ids]),
      db.query('SELECT castle_unit_id FROM castle_unit_composites WHERE composite_id = ANY($1::text[])', [ids]),
    ]);
    r1.rows.forEach((r) => castleServiceIds.add(r.castle_service_id));
    r2.rows.forEach((r) => castleUnitIds.add(r.castle_unit_id));
  }

  if (entity_type === 'CastleService') {
    const [r1, r2] = await Promise.all([
      db.query('SELECT castle_unit_id FROM castle_unit_services WHERE castle_service_id = $1', [entity_id]),
      db.query('SELECT castle_record_id FROM castle_castle_services WHERE castle_service_id = $1', [entity_id]),
    ]);
    r1.rows.forEach((r) => castleUnitIds.add(r.castle_unit_id));
    r2.rows.forEach((r) => castleIds.add(r.castle_record_id));
  }

  // From castle services: units and castles via services
  if (castleServiceIds.size > 0) {
    const ids = [...castleServiceIds];
    const [r1, r2] = await Promise.all([
      db.query('SELECT castle_unit_id FROM castle_unit_services WHERE castle_service_id = ANY($1::text[])', [ids]),
      db.query('SELECT castle_record_id FROM castle_castle_services WHERE castle_service_id = ANY($1::text[])', [ids]),
    ]);
    r1.rows.forEach((r) => castleUnitIds.add(r.castle_unit_id));
    r2.rows.forEach((r) => castleIds.add(r.castle_record_id));
  }

  if (entity_type === 'CastleUnit') {
    const r1 = await db.query(
      'SELECT castle_record_id FROM castle_castle_units WHERE castle_unit_id = $1',
      [entity_id],
    );
    r1.rows.forEach((r) => castleIds.add(r.castle_record_id));
  }

  // From castle units: castles via units
  if (castleUnitIds.size > 0) {
    const r1 = await db.query(
      'SELECT castle_record_id FROM castle_castle_units WHERE castle_unit_id = ANY($1::text[])',
      [[...castleUnitIds]],
    );
    r1.rows.forEach((r) => castleIds.add(r.castle_record_id));
  }

  const result: ImpactResult = { entity_id, entity_type, castles: [] };

  const [cpdRes, compRes, csRes, cuRes, castleRes] = await Promise.all([
    entity_type === 'AtomicAsset' && compoundIds.size > 0
      ? db.query(`SELECT * FROM "Compound" WHERE "compound_id" = ANY($1::text[])`, [[...compoundIds]])
      : Promise.resolve({ rows: [] as any[] }),
    (entity_type === 'AtomicAsset' || entity_type === 'Compound') && compositeIds.size > 0
      ? db.query(`SELECT * FROM "Composite" WHERE "composite_id" = ANY($1::text[])`, [[...compositeIds]])
      : Promise.resolve({ rows: [] as any[] }),
    entity_type !== 'CastleUnit' && castleServiceIds.size > 0
      ? db.query(`SELECT * FROM "CastleService" WHERE "castle_service_id" = ANY($1::text[])`, [[...castleServiceIds]])
      : Promise.resolve({ rows: [] as any[] }),
    entity_type !== 'CastleUnit' && castleUnitIds.size > 0
      ? db.query(`SELECT * FROM "CastleUnit" WHERE "castle_unit_id" = ANY($1::text[])`, [[...castleUnitIds]])
      : Promise.resolve({ rows: [] as any[] }),
    castleIds.size > 0
      ? db.query(`SELECT * FROM "Castle" WHERE "castle_record_id" = ANY($1::text[])`, [[...castleIds]])
      : Promise.resolve({ rows: [] as any[] }),
  ]);

  if (entity_type === 'AtomicAsset') {
    result.compounds = cpdRes.rows.map(toNode);
  }
  if (entity_type === 'AtomicAsset' || entity_type === 'Compound') {
    result.composites = compRes.rows.map(toNode);
  }
  if (entity_type === 'AtomicAsset' || entity_type === 'Compound' || entity_type === 'Composite') {
    result.castle_services = csRes.rows.map(toNode);
  }
  if (entity_type !== 'CastleUnit') {
    result.castle_units = cuRes.rows.map(toNode);
  }
  result.castles = castleRes.rows.map((r: any) => ({
    id: r.castle_record_id,
    name: r.castle_name,
    version: r.version,
    status: r.status,
    warning: warn(r.status),
  }));

  return result;
}
