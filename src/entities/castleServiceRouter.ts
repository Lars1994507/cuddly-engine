import { Router, Request, Response } from 'express';
import {
  createCastleService,
  getCastleServiceById,
  listCastleServices,
  updateCastleService,
  archiveCastleService,
  addCompositeToService,
  removeCompositeFromService,
  listCompositesInService,
  addCompoundToService,
  removeCompoundFromService,
  listCompoundsInService,
  addAtomicAssetToService,
  removeAtomicAssetFromService,
  listAtomicAssetsInService,
  listServicesForComposite,
  listServicesForCompound,
  listServicesForAtomicAsset,
  CastleServiceFilters,
} from './castleService';
import { Status } from '../lib/enums';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const service = await createCastleService(req.body);
    res.status(201).json(service);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: CastleServiceFilters = {};
    if (req.query['status']) filters.status = req.query['status'] as Status;
    const services = await listCastleServices(filters);
    res.json(services);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = await getCastleServiceById((req.params['id'] as string) ?? '');
    if (!service) return res.status(404).json({ error: 'Not found' });
    res.json(service);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const service = await updateCastleService((req.params['id'] as string) ?? '', req.body);
    res.json(service);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code = err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const service = await archiveCastleService((req.params['id'] as string) ?? '');
    res.json(service);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-services/:id/composites
router.get('/:id/composites', async (req: Request, res: Response) => {
  try {
    const composites = await listCompositesInService((req.params['id'] as string) ?? '');
    res.json(composites);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-services/:id/composites  body: { composite_id }
router.post('/:id/composites', async (req: Request, res: Response) => {
  try {
    const { composite_id } = req.body as { composite_id: string };
    if (!composite_id) return res.status(400).json({ error: 'composite_id is required' });
    await addCompositeToService((req.params['id'] as string) ?? '', composite_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-services/:id/composites/:compositeId
router.delete('/:id/composites/:compositeId', async (req: Request, res: Response) => {
  try {
    await removeCompositeFromService(
      (req.params['id'] as string) ?? '',
      (req.params['compositeId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-services/:id/compounds
router.get('/:id/compounds', async (req: Request, res: Response) => {
  try {
    const compounds = await listCompoundsInService((req.params['id'] as string) ?? '');
    res.json(compounds);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-services/:id/compounds  body: { compound_id }
router.post('/:id/compounds', async (req: Request, res: Response) => {
  try {
    const { compound_id } = req.body as { compound_id: string };
    if (!compound_id) return res.status(400).json({ error: 'compound_id is required' });
    await addCompoundToService((req.params['id'] as string) ?? '', compound_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-services/:id/compounds/:compoundId
router.delete('/:id/compounds/:compoundId', async (req: Request, res: Response) => {
  try {
    await removeCompoundFromService(
      (req.params['id'] as string) ?? '',
      (req.params['compoundId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-services/:id/atomic-assets
router.get('/:id/atomic-assets', async (req: Request, res: Response) => {
  try {
    const assets = await listAtomicAssetsInService((req.params['id'] as string) ?? '');
    res.json(assets);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-services/:id/atomic-assets  body: { atomic_asset_id }
router.post('/:id/atomic-assets', async (req: Request, res: Response) => {
  try {
    const { atomic_asset_id } = req.body as { atomic_asset_id: string };
    if (!atomic_asset_id)
      return res.status(400).json({ error: 'atomic_asset_id is required' });
    await addAtomicAssetToService((req.params['id'] as string) ?? '', atomic_asset_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-services/:id/atomic-assets/:assetId
router.delete('/:id/atomic-assets/:assetId', async (req: Request, res: Response) => {
  try {
    await removeAtomicAssetFromService(
      (req.params['id'] as string) ?? '',
      (req.params['assetId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export { listServicesForComposite, listServicesForCompound, listServicesForAtomicAsset };
export default router;
