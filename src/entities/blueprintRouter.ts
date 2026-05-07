import { Router, Request, Response } from 'express';
import {
  createBlueprint,
  getBlueprintById,
  listBlueprints,
  updateBlueprint,
  archiveBlueprint,
  addCastleUnitToBlueprint,
  removeCastleUnitFromBlueprint,
  listCastleUnitsInBlueprint,
  addCastleServiceToBlueprint,
  removeCastleServiceFromBlueprint,
  listCastleServicesInBlueprint,
  addCompositeToBlueprint,
  removeCompositeFromBlueprint,
  listCompositesInBlueprint,
  listBlueprintsForCastleUnit,
  listBlueprintsForCastleService,
  listBlueprintsForComposite,
  BlueprintFilters,
} from './blueprint';
import { Status } from '../lib/enums';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const blueprint = await createBlueprint(req.body);
    res.status(201).json(blueprint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: BlueprintFilters = {};
    if (req.query['status']) filters.status = req.query['status'] as Status;
    if (req.query['category']) filters.category = req.query['category'] as string;
    const blueprints = await listBlueprints(filters);
    res.json(blueprints);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const blueprint = await getBlueprintById((req.params['id'] as string) ?? '');
    if (!blueprint) return res.status(404).json({ error: 'Not found' });
    res.json(blueprint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const blueprint = await updateBlueprint((req.params['id'] as string) ?? '', req.body);
    res.json(blueprint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code = err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const blueprint = await archiveBlueprint((req.params['id'] as string) ?? '');
    res.json(blueprint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /blueprints/:id/castle-units
router.get('/:id/castle-units', async (req: Request, res: Response) => {
  try {
    const units = await listCastleUnitsInBlueprint((req.params['id'] as string) ?? '');
    res.json(units);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /blueprints/:id/castle-units  body: { castle_unit_id }
router.post('/:id/castle-units', async (req: Request, res: Response) => {
  try {
    const { castle_unit_id } = req.body as { castle_unit_id: string };
    if (!castle_unit_id) return res.status(400).json({ error: 'castle_unit_id is required' });
    await addCastleUnitToBlueprint((req.params['id'] as string) ?? '', castle_unit_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /blueprints/:id/castle-units/:unitId
router.delete('/:id/castle-units/:unitId', async (req: Request, res: Response) => {
  try {
    await removeCastleUnitFromBlueprint((req.params['id'] as string) ?? '', (req.params['unitId'] as string) ?? '');
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /blueprints/:id/castle-services
router.get('/:id/castle-services', async (req: Request, res: Response) => {
  try {
    const services = await listCastleServicesInBlueprint((req.params['id'] as string) ?? '');
    res.json(services);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /blueprints/:id/castle-services  body: { castle_service_id }
router.post('/:id/castle-services', async (req: Request, res: Response) => {
  try {
    const { castle_service_id } = req.body as { castle_service_id: string };
    if (!castle_service_id)
      return res.status(400).json({ error: 'castle_service_id is required' });
    await addCastleServiceToBlueprint((req.params['id'] as string) ?? '', castle_service_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /blueprints/:id/castle-services/:serviceId
router.delete('/:id/castle-services/:serviceId', async (req: Request, res: Response) => {
  try {
    await removeCastleServiceFromBlueprint(
      (req.params['id'] as string) ?? '',
      (req.params['serviceId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /blueprints/:id/composites
router.get('/:id/composites', async (req: Request, res: Response) => {
  try {
    const composites = await listCompositesInBlueprint((req.params['id'] as string) ?? '');
    res.json(composites);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /blueprints/:id/composites  body: { composite_id }
router.post('/:id/composites', async (req: Request, res: Response) => {
  try {
    const { composite_id } = req.body as { composite_id: string };
    if (!composite_id) return res.status(400).json({ error: 'composite_id is required' });
    await addCompositeToBlueprint((req.params['id'] as string) ?? '', composite_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /blueprints/:id/composites/:compositeId
router.delete('/:id/composites/:compositeId', async (req: Request, res: Response) => {
  try {
    await removeCompositeFromBlueprint(
      (req.params['id'] as string) ?? '',
      (req.params['compositeId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export { listBlueprintsForCastleUnit, listBlueprintsForCastleService, listBlueprintsForComposite };
export default router;
