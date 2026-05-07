import { Router, Request, Response } from 'express';
import {
  getRelevantContext,
  getFullContext,
  getContextForCastle,
  getFullContextForCastle,
  getFullInventory,
} from './retrieval';

const router = Router();

// GET /retrieval/context?castle_type_id=...&blueprint_id=...
// Add ?full=true to receive all DB fields instead of compact records.
router.get('/context', async (req: Request, res: Response) => {
  const { castle_type_id, blueprint_id, full } = req.query;
  if (!castle_type_id || !blueprint_id) {
    return res.status(400).json({ error: 'castle_type_id and blueprint_id are required' });
  }
  try {
    const context = full === 'true'
      ? await getFullContext(castle_type_id as string, blueprint_id as string)
      : await getRelevantContext(castle_type_id as string, blueprint_id as string);
    return res.json(context);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// GET /retrieval/castle/:castle_record_id
// Add ?full=true for all DB fields.
router.get('/castle/:castle_record_id', async (req: Request, res: Response) => {
  const { full } = req.query;
  try {
    const context = full === 'true'
      ? await getFullContextForCastle(req.params['castle_record_id'] as string)
      : await getContextForCastle(req.params['castle_record_id'] as string);
    return res.json(context);
  } catch (err) {
    const msg = (err as Error).message;
    const status = msg.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: msg });
  }
});

// GET /retrieval/scan
// Full inventory scan — all active assets, all entity types, all DB fields.
// Excludes Deprecated and Archived. Intended for AI agents that need the
// complete asset landscape before deciding what to reuse vs. create.
router.get('/scan', async (_req: Request, res: Response) => {
  try {
    const inventory = await getFullInventory();
    return res.json(inventory);
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
