import { Router, Request, Response } from 'express';
import {
  createCastleUnit,
  getCastleUnitById,
  listCastleUnits,
  updateCastleUnit,
  archiveCastleUnit,
  addServiceToUnit,
  removeServiceFromUnit,
  listServicesInUnit,
  addCompositeToUnit,
  removeCompositeFromUnit,
  listCompositesInUnit,
  listUnitsForService,
  listUnitsForComposite,
  CastleUnitFilters,
} from './castleUnit';
import { Status } from '../lib/enums';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const unit = await createCastleUnit(req.body);
    res.status(201).json(unit);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: CastleUnitFilters = {};
    if (req.query['status']) filters.status = req.query['status'] as Status;
    const units = await listCastleUnits(filters);
    res.json(units);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const unit = await getCastleUnitById((req.params['id'] as string) ?? '');
    if (!unit) return res.status(404).json({ error: 'Not found' });
    res.json(unit);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const unit = await updateCastleUnit((req.params['id'] as string) ?? '', req.body);
    res.json(unit);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code = err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const unit = await archiveCastleUnit((req.params['id'] as string) ?? '');
    res.json(unit);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-units/:id/services
router.get('/:id/services', async (req: Request, res: Response) => {
  try {
    const services = await listServicesInUnit((req.params['id'] as string) ?? '');
    res.json(services);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-units/:id/services  body: { castle_service_id }
router.post('/:id/services', async (req: Request, res: Response) => {
  try {
    const { castle_service_id } = req.body as { castle_service_id: string };
    if (!castle_service_id)
      return res.status(400).json({ error: 'castle_service_id is required' });
    await addServiceToUnit((req.params['id'] as string) ?? '', castle_service_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-units/:id/services/:serviceId
router.delete('/:id/services/:serviceId', async (req: Request, res: Response) => {
  try {
    await removeServiceFromUnit((req.params['id'] as string) ?? '', (req.params['serviceId'] as string) ?? '');
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-units/:id/composites
router.get('/:id/composites', async (req: Request, res: Response) => {
  try {
    const composites = await listCompositesInUnit((req.params['id'] as string) ?? '');
    res.json(composites);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-units/:id/composites  body: { composite_id }
router.post('/:id/composites', async (req: Request, res: Response) => {
  try {
    const { composite_id } = req.body as { composite_id: string };
    if (!composite_id) return res.status(400).json({ error: 'composite_id is required' });
    await addCompositeToUnit((req.params['id'] as string) ?? '', composite_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-units/:id/composites/:compositeId
router.delete('/:id/composites/:compositeId', async (req: Request, res: Response) => {
  try {
    await removeCompositeFromUnit(
      (req.params['id'] as string) ?? '',
      (req.params['compositeId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export { listUnitsForService, listUnitsForComposite };
export default router;
