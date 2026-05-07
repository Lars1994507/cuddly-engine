import { Router, Request, Response } from 'express';
import {
  createCompound,
  getCompoundById,
  listCompounds,
  updateCompound,
  archiveCompound,
  addAtomicAssetToCompound,
  removeAtomicAssetFromCompound,
  listAtomicAssetsInCompound,
  listCompoundsForAtomicAsset,
  CompoundFilters,
} from './compound';
import { Status } from '../lib/enums';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const compound = await createCompound(req.body);
    res.status(201).json(compound);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: CompoundFilters = {};
    if (req.query['status']) filters.status = req.query['status'] as Status;
    const compounds = await listCompounds(filters);
    res.json(compounds);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const compound = await getCompoundById((req.params['id'] as string) ?? '');
    if (!compound) return res.status(404).json({ error: 'Not found' });
    res.json(compound);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const compound = await updateCompound((req.params['id'] as string) ?? '', req.body);
    res.json(compound);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code =
      err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const compound = await archiveCompound((req.params['id'] as string) ?? '');
    res.json(compound);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /compounds/:id/atomic-assets
router.get('/:id/atomic-assets', async (req: Request, res: Response) => {
  try {
    const assets = await listAtomicAssetsInCompound((req.params['id'] as string) ?? '');
    res.json(assets);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /compounds/:id/atomic-assets  body: { atomic_asset_id }
router.post('/:id/atomic-assets', async (req: Request, res: Response) => {
  try {
    const { atomic_asset_id } = req.body as { atomic_asset_id: string };
    if (!atomic_asset_id) {
      return res.status(400).json({ error: 'atomic_asset_id is required' });
    }
    await addAtomicAssetToCompound((req.params['id'] as string) ?? '', atomic_asset_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /compounds/:id/atomic-assets/:assetId
router.delete('/:id/atomic-assets/:assetId', async (req: Request, res: Response) => {
  try {
    await removeAtomicAssetFromCompound(
      (req.params['id'] as string) ?? '',
      (req.params['assetId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export { listCompoundsForAtomicAsset };
export default router;
