import { Router, Request, Response } from 'express';
import {
  createAtomicAsset,
  getAtomicAssetById,
  listAtomicAssets,
  updateAtomicAsset,
  archiveAtomicAsset,
  AtomicAssetFilters,
} from './atomicAsset';
import { AssetType, Status } from '../lib/enums';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const asset = await createAtomicAsset(req.body);
    res.status(201).json(asset);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: AtomicAssetFilters = {};
    if (req.query['asset_type'])
      filters.asset_type = req.query['asset_type'] as AssetType;
    if (req.query['status']) filters.status = req.query['status'] as Status;
    const assets = await listAtomicAssets(filters);
    res.json(assets);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await getAtomicAssetById((req.params['id'] as string) ?? '');
    if (!asset) return res.status(404).json({ error: 'Not found' });
    res.json(asset);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await updateAtomicAsset((req.params['id'] as string) ?? '', req.body);
    res.json(asset);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code =
      err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const asset = await archiveAtomicAsset((req.params['id'] as string) ?? '');
    res.json(asset);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export default router;
