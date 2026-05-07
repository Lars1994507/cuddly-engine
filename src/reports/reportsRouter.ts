import { Router } from 'express';
import {
  listCastles,
  listBlueprints,
  listCastleTypes,
  listCastleUnits,
  listCastleServices,
  listComposites,
  listCompounds,
  listAtomicAssets,
  getDependencyMap,
  getReuseReport,
  getDeprecatedAssets,
  findDuplicates,
  getLocalModifications,
  getPromotionCandidates,
  getBuildReadiness,
  getApprovalStatus,
  type DependencyEntityType,
} from './reports';

const router = Router();

router.get('/castles', async (req, res) => {
  try {
    const { status, castle_type_id, blueprint_id } = req.query as Record<string, string | undefined>;
    res.json(await listCastles({ status, castle_type_id, blueprint_id }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/blueprints', async (req, res) => {
  try {
    const { status, category } = req.query as Record<string, string | undefined>;
    res.json(await listBlueprints({ status, category }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/castle-types', async (req, res) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    res.json(await listCastleTypes({ status }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/castle-units', async (req, res) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    res.json(await listCastleUnits({ status }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/castle-services', async (req, res) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    res.json(await listCastleServices({ status }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/composites', async (req, res) => {
  try {
    const { status, ui_backend_scope } = req.query as Record<string, string | undefined>;
    res.json(await listComposites({ status, ui_backend_scope }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/compounds', async (req, res) => {
  try {
    const { status } = req.query as Record<string, string | undefined>;
    res.json(await listCompounds({ status }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/atomic-assets', async (req, res) => {
  try {
    const { status, asset_type } = req.query as Record<string, string | undefined>;
    res.json(await listAtomicAssets({ status, asset_type }));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/dependency-map/:entity_type/:entity_id', async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params as Record<string, string>;
    res.json(await getDependencyMap(entity_id, entity_type as DependencyEntityType));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/reuse', async (_req, res) => {
  try {
    res.json(await getReuseReport());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/deprecated', async (_req, res) => {
  try {
    res.json(await getDeprecatedAssets());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/duplicates', async (_req, res) => {
  try {
    res.json(await findDuplicates());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/local-modifications', async (req, res) => {
  try {
    const { castle_record_id } = req.query as Record<string, string | undefined>;
    res.json(await getLocalModifications(castle_record_id));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/promotion-candidates', async (_req, res) => {
  try {
    res.json(await getPromotionCandidates());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/build-readiness/:castle_record_id', async (req, res) => {
  try {
    res.json(await getBuildReadiness((req.params as Record<string, string>).castle_record_id));
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

router.get('/approval-status', async (_req, res) => {
  try {
    res.json(await getApprovalStatus());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
