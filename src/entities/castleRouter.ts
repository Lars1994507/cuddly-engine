import { Router, Request, Response } from 'express';
import {
  createCastle,
  getCastleById,
  listCastles,
  updateCastle,
  archiveCastle,
  setCastleType,
  listCastlesForCastleType,
  setBlueprint,
  listCastlesForBlueprint,
  addCastleUnitToCastle,
  removeCastleUnitFromCastle,
  listCastleUnitsForCastle,
  listCastlesForCastleUnit,
  addCastleServiceToCastle,
  removeCastleServiceFromCastle,
  listCastleServicesForCastle,
  listCastlesForCastleService,
  createLocalModification,
  getLocalModificationById,
  listLocalModificationsForCastle,
  updateLocalModification,
  deleteLocalModification,
  CastleFilters,
} from './castle';
import { Status } from '../lib/enums';

const router = Router();

// --- Castle CRUD ---

router.post('/', async (req: Request, res: Response) => {
  try {
    const castle = await createCastle(req.body);
    res.status(201).json(castle);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters: CastleFilters = {};
    if (req.query['status']) filters.status = req.query['status'] as Status;
    if (req.query['castle_type_id']) filters.castle_type_id = req.query['castle_type_id'] as string;
    if (req.query['blueprint_id']) filters.blueprint_id = req.query['blueprint_id'] as string;
    const castles = await listCastles(filters);
    res.json(castles);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const castle = await getCastleById((req.params['id'] as string) ?? '');
    if (!castle) return res.status(404).json({ error: 'Not found' });
    res.json(castle);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const castle = await updateCastle((req.params['id'] as string) ?? '', req.body);
    res.json(castle);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code = err instanceof Error && err.message.includes('not found') ? 404 : 400;
    res.status(code).json({ error: msg });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const castle = await archiveCastle((req.params['id'] as string) ?? '');
    res.json(castle);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// --- Castle → Castle Type ---

router.patch('/:id/castle-type', async (req: Request, res: Response) => {
  try {
    const { castle_type_id } = req.body as { castle_type_id: string | null };
    const castle = await setCastleType((req.params['id'] as string) ?? '', castle_type_id ?? null);
    res.json(castle);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// --- Castle → Blueprint ---

router.patch('/:id/blueprint', async (req: Request, res: Response) => {
  try {
    const { blueprint_id } = req.body as { blueprint_id: string | null };
    const castle = await setBlueprint((req.params['id'] as string) ?? '', blueprint_id ?? null);
    res.json(castle);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

// --- Castle ↔ CastleUnit ---

router.get('/:id/castle-units', async (req: Request, res: Response) => {
  try {
    const units = await listCastleUnitsForCastle((req.params['id'] as string) ?? '');
    res.json(units);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.post('/:id/castle-units', async (req: Request, res: Response) => {
  try {
    const { castle_unit_id } = req.body as { castle_unit_id: string };
    if (!castle_unit_id) return res.status(400).json({ error: 'castle_unit_id is required' });
    await addCastleUnitToCastle((req.params['id'] as string) ?? '', castle_unit_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.delete('/:id/castle-units/:unitId', async (req: Request, res: Response) => {
  try {
    await removeCastleUnitFromCastle((req.params['id'] as string) ?? '', (req.params['unitId'] as string) ?? '');
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// --- Castle ↔ CastleService ---

router.get('/:id/castle-services', async (req: Request, res: Response) => {
  try {
    const services = await listCastleServicesForCastle((req.params['id'] as string) ?? '');
    res.json(services);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.post('/:id/castle-services', async (req: Request, res: Response) => {
  try {
    const { castle_service_id } = req.body as { castle_service_id: string };
    if (!castle_service_id)
      return res.status(400).json({ error: 'castle_service_id is required' });
    await addCastleServiceToCastle((req.params['id'] as string) ?? '', castle_service_id);
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.delete('/:id/castle-services/:serviceId', async (req: Request, res: Response) => {
  try {
    await removeCastleServiceFromCastle((req.params['id'] as string) ?? '', (req.params['serviceId'] as string) ?? '');
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

// --- Local Modifications ---

router.get('/:id/local-modifications', async (req: Request, res: Response) => {
  try {
    const mods = await listLocalModificationsForCastle((req.params['id'] as string) ?? '');
    res.json(mods);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.post('/:id/local-modifications', async (req: Request, res: Response) => {
  try {
    const mod = await createLocalModification({
      ...req.body,
      castle_record_id: (req.params['id'] as string) ?? '',
    });
    res.status(201).json(mod);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.get('/:id/local-modifications/:modId', async (req: Request, res: Response) => {
  try {
    const mod = await getLocalModificationById((req.params['modId'] as string) ?? '');
    if (!mod) return res.status(404).json({ error: 'Not found' });
    res.json(mod);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

router.patch('/:id/local-modifications/:modId', async (req: Request, res: Response) => {
  try {
    const mod = await updateLocalModification((req.params['modId'] as string) ?? '', req.body);
    res.json(mod);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).json({ error: msg });
  }
});

router.delete('/:id/local-modifications/:modId', async (req: Request, res: Response) => {
  try {
    await deleteLocalModification((req.params['modId'] as string) ?? '');
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(404).json({ error: msg });
  }
});

export { listCastlesForCastleType, listCastlesForBlueprint, listCastlesForCastleUnit, listCastlesForCastleService };
export default router;
