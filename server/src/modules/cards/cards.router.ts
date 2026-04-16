import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getCollection, getCard } from './cards.controller.js';
import { backfillQidChains } from '../wikipedia/backfill.service.js';
import { env } from '../../config/env.js';

export const cardsRouter: ExpressRouter = Router();

cardsRouter.get('/', requireAuth, getCollection);
cardsRouter.get('/:id', requireAuth, getCard);

// Admin-only backfill — requires ADMIN_SECRET header
cardsRouter.post('/admin/backfill-qids', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.headers['x-admin-secret'] !== env.ADMIN_SECRET) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    // Fire-and-forget — returns immediately, runs in background
    backfillQidChains().then(r => console.log('QID backfill done:', r)).catch(console.error);
    res.json({ ok: true, message: 'Backfill started in background' });
  } catch (e) { next(e); }
});
