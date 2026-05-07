import { Router, Request, Response } from 'express';
import { generateBOM, traceImpact, EntityType } from './bom';

const router = Router();

const VALID_ENTITY_TYPES: EntityType[] = [
  'AtomicAsset',
  'Compound',
  'Composite',
  'CastleService',
  'CastleUnit',
];

// GET /bom/:castle_record_id
router.get('/:castle_record_id', async (req: Request, res: Response) => {
  try {
    const bom = await generateBOM((req.params['castle_record_id'] as string) ?? '');
    res.json(bom);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const code = msg.includes('not found') ? 404 : 500;
    res.status(code).json({ error: msg });
  }
});

// GET /bom/impact/:entity_type/:entity_id
router.get('/impact/:entity_type/:entity_id', async (req: Request, res: Response) => {
  try {
    const entity_type = (req.params['entity_type'] as string) as EntityType;
    if (!VALID_ENTITY_TYPES.includes(entity_type)) {
      return res.status(400).json({
        error: `Invalid entity_type "${entity_type}". Valid types: ${VALID_ENTITY_TYPES.join(', ')}`,
      });
    }
    const impact = await traceImpact((req.params['entity_id'] as string) ?? '', entity_type);
    res.json(impact);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: msg });
  }
});

export default router;
