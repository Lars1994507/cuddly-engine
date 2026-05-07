import { Router } from 'express';
import { generateBOM, BOMResult, BOMCastleUnit, BOMCastleService, BOMComposite, BOMCompound } from '../bom/bom';

const router = Router();

export interface DiagramNode {
  id: string;
  label: string;
  type: string;
  status: string;
  subLabel?: string;
}

export interface DiagramEdge {
  source: string;
  target: string;
}

export interface DiagramResult {
  castle_record_id: string;
  castle_name: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

router.get('/castle/:castle_record_id', async (req, res) => {
  try {
    const bom = await generateBOM(req.params['castle_record_id']);
    res.json(bomToGraph(bom));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

function bomToGraph(bom: BOMResult): DiagramResult {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const seenNodes = new Set<string>();
  const seenEdges = new Set<string>();

  function node(id: string, label: string, type: string, status: string, subLabel?: string) {
    if (!seenNodes.has(id)) {
      seenNodes.add(id);
      nodes.push({ id, label, type, status, subLabel });
    }
  }

  function edge(source: string, target: string) {
    const key = `${source}→${target}`;
    if (!seenEdges.has(key)) {
      seenEdges.add(key);
      edges.push({ source, target });
    }
  }

  const castleId = bom.castle_record_id;
  node(castleId, bom.castle_name, 'Castle', bom.status);

  if (bom.castle_type) {
    node(bom.castle_type.id, bom.castle_type.name, 'CastleType', bom.castle_type.status);
    edge(castleId, bom.castle_type.id);
  }

  if (bom.blueprint) {
    node(bom.blueprint.id, bom.blueprint.name, 'Blueprint', bom.blueprint.status);
    edge(castleId, bom.blueprint.id);
  }

  for (const unit of bom.castle_units) {
    addUnit(unit, castleId);
  }

  for (const mod of bom.local_modifications) {
    node(mod.modification_id, mod.modified_item, 'LocalMod', mod.review_status, mod.promotion_recommendation);
    edge(castleId, mod.modification_id);
  }

  return { castle_record_id: bom.castle_record_id, castle_name: bom.castle_name, nodes, edges };

  function addUnit(unit: BOMCastleUnit, parentId: string) {
    node(unit.id, unit.name, 'CastleUnit', unit.status);
    edge(parentId, unit.id);
    for (const svc of unit.castle_services) addService(svc, unit.id);
  }

  function addService(svc: BOMCastleService, parentId: string) {
    node(svc.id, svc.name, 'CastleService', svc.status, svc.capability);
    edge(parentId, svc.id);
    for (const comp of svc.composites) addComposite(comp, svc.id);
    for (const cpd of svc.compounds) addCompound(cpd, svc.id);
    for (const aa of svc.atomic_assets) {
      node(aa.id, aa.name, 'AtomicAsset', aa.status, aa.asset_type);
      edge(svc.id, aa.id);
    }
  }

  function addComposite(comp: BOMComposite, parentId: string) {
    node(comp.id, comp.name, 'Composite', comp.status, comp.ui_backend_scope);
    edge(parentId, comp.id);
    for (const cpd of comp.compounds) addCompound(cpd, comp.id);
    for (const aa of comp.atomic_assets) {
      node(aa.id, aa.name, 'AtomicAsset', aa.status, aa.asset_type);
      edge(comp.id, aa.id);
    }
  }

  function addCompound(cpd: BOMCompound, parentId: string) {
    node(cpd.id, cpd.name, 'Compound', cpd.status);
    edge(parentId, cpd.id);
    for (const aa of cpd.atomic_assets) {
      node(aa.id, aa.name, 'AtomicAsset', aa.status, aa.asset_type);
      edge(cpd.id, aa.id);
    }
  }
}

export default router;
