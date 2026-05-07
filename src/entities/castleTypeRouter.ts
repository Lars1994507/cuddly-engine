import { Router, Request, Response } from 'express';
import {
  createCastleType,
  getCastleTypeById,
  listCastleTypes,
  updateCastleType,
  archiveCastleType,
  addBlueprintToCastleType,
  removeBlueprintFromCastleType,
  listBlueprintsForCastleType,
  addCastleUnitToCastleType,
  removeCastleUnitFromCastleType,
  listCastleUnitsForCastleType,
  addCastleServiceToCastleType,
  removeCastleServiceFromCastleType,
  listCastleServicesForCastleType,
  listCastleTypesForBlueprint,
  listCastleTypesForCastleUnit,
  listCastleTypesForCastleService,
  CastleTypeFilters,
} from './castleType';
import { Status } from '../lib/enums';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const castleType = await createCastleType(req.body);
    res.status(201).json(castleType);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: CastleTypeFilters = {};
    if (req.query['status']) filters.status = req.query['status'] as Status;
    const castleTypes = await listCastleTypes(filters);
    res.json(castleTypes);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const castleType = await getCastleTypeById((req.params['id'] as string) ?? '');
    if (!castleType) return res.status(404).json({ error: 'Not found' });
    res.json(castleType);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const castleType = await updateCastleType((req.params['id'] as string) ?? '', req.body);
    res.json(castleType);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code = err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const castleType = await archiveCastleType((req.params['id'] as string) ?? '');
    res.json(castleType);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-types/:id/blueprints
router.get('/:id/blueprints', async (req: Request, res: Response) => {
  try {
    const blueprints = await listBlueprintsForCastleType((req.params['id'] as string) ?? '');
    res.json(blueprints);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-types/:id/blueprints  body: { blueprint_id }
router.post('/:id/blueprints', async (req: Request, res: Response) => {
  try {
    const { blueprint_id } = req.body as { blueprint_id: string };
    if (!blueprint_id) return res.status(400).json({ error: 'blueprint_id is required' });
    await addBlueprintToCastleType((req.params['id'] as string) ?? '', blueprint_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-types/:id/blueprints/:blueprintId
router.delete('/:id/blueprints/:blueprintId', async (req: Request, res: Response) => {
  try {
    await removeBlueprintFromCastleType((req.params['id'] as string) ?? '', (req.params['blueprintId'] as string) ?? '');
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-types/:id/castle-units
router.get('/:id/castle-units', async (req: Request, res: Response) => {
  try {
    const units = await listCastleUnitsForCastleType((req.params['id'] as string) ?? '');
    res.json(units);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-types/:id/castle-units  body: { castle_unit_id }
router.post('/:id/castle-units', async (req: Request, res: Response) => {
  try {
    const { castle_unit_id } = req.body as { castle_unit_id: string };
    if (!castle_unit_id) return res.status(400).json({ error: 'castle_unit_id is required' });
    await addCastleUnitToCastleType((req.params['id'] as string) ?? '', castle_unit_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-types/:id/castle-units/:unitId
router.delete('/:id/castle-units/:unitId', async (req: Request, res: Response) => {
  try {
    await removeCastleUnitFromCastleType((req.params['id'] as string) ?? '', (req.params['unitId'] as string) ?? '');
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// GET /castle-types/:id/castle-services
router.get('/:id/castle-services', async (req: Request, res: Response) => {
  try {
    const services = await listCastleServicesForCastleType((req.params['id'] as string) ?? '');
    res.json(services);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

// POST /castle-types/:id/castle-services  body: { castle_service_id }
router.post('/:id/castle-services', async (req: Request, res: Response) => {
  try {
    const { castle_service_id } = req.body as { castle_service_id: string };
    if (!castle_service_id)
      return res.status(400).json({ error: 'castle_service_id is required' });
    await addCastleServiceToCastleType((req.params['id'] as string) ?? '', castle_service_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// DELETE /castle-types/:id/castle-services/:serviceId
router.delete('/:id/castle-services/:serviceId', async (req: Request, res: Response) => {
  try {
    await removeCastleServiceFromCastleType(
      (req.params['id'] as string) ?? '',
      (req.params['serviceId'] as string) ?? '',
    );
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export { listCastleTypesForBlueprint, listCastleTypesForCastleUnit, listCastleTypesForCastleService };
export default router;
