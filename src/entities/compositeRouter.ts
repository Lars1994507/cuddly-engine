import { Router, Request, Response } from 'express';
import {
  createComposite,
  getCompositeById,
  listComposites,
  updateComposite,
  archiveComposite,
  addCompoundToComposite,
  removeCompoundFromComposite,
  listCompoundsInComposite,
  addAtomicAssetToComposite,
  removeAtomicAssetFromComposite,
  listAtomicAssetsInComposite,
  listCompositesForCompound,
  listCompositesForAtomicAsset,
  CompositeFilters,
} from './composite';
import { Status, UiBackendScope } from '../lib/enums';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const composite = await createComposite(req.body);
    res.status(201).json(composite);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: CompositeFilters = {};
    if (req.query['status']) filters.status = req.query['status'] as Status;
    if (req.query['ui_backend_scope'])
      filters.ui_backend_scope = req.query['ui_backend_scope'] as UiBackendScope;
    const composites = await listComposites(filters);
    res.json(composites);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const composite = await getCompositeById((req.params['id'] as string) ?? '');
    if (!composite) return res.status(404).json({ error: 'Not found' });
    res.json(composite);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const composite = await updateComposite((req.params['id'] as string) ?? '', req.body);
    res.json(composite);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code =
      err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const composite = await archiveComposite((req.params['id'] as string) ?? '');
    res.json(composite);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /composites/:id/compounds
router.get('/:id/compounds', async (req: Request, res: Response) => {
  try {
    const compounds = await listCompoundsInComposite((req.params['id'] as string) ?? '');
    res.json(compounds);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /composites/:id/compounds  body: { compound_id }
router.post('/:id/compounds', async (req: Request, res: Response) => {
  try {
    const { compound_id } = req.body as { compound_id: string };
    if (!compound_id) return res.status(400).json({ error: 'compound_id is required' });
    await addCompoundToComposite((req.params['id'] as string) ?? '', compound_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /composites/:id/compounds/:compoundId
router.delete('/:id/compounds/:compoundId', async (req: Request, res: Response) => {
  try {
    await removeCompoundFromComposite(
      (req.params['id'] as string) ?? '',
      (req.params['compoundId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /composites/:id/atomic-assets
router.get('/:id/atomic-assets', async (req: Request, res: Response) => {
  try {
    const assets = await listAtomicAssetsInComposite((req.params['id'] as string) ?? '');
    res.json(assets);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /composites/:id/atomic-assets  body: { atomic_asset_id }
router.post('/:id/atomic-assets', async (req: Request, res: Response) => {
  try {
    const { atomic_asset_id } = req.body as { atomic_asset_id: string };
    if (!atomic_asset_id)
      return res.status(400).json({ error: 'atomic_asset_id is required' });
    await addAtomicAssetToComposite((req.params['id'] as string) ?? '', atomic_asset_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /composites/:id/atomic-assets/:assetId
router.delete('/:id/atomic-assets/:assetId', async (req: Request, res: Response) => {
  try {
    await removeAtomicAssetFromComposite(
      (req.params['id'] as string) ?? '',
      (req.params['assetId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export { listCompositesForCompound, listCompositesForAtomicAsset };
export default router;
