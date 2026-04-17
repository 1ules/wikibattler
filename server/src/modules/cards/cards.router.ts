import { Router } from 'express';
import type { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { getCollection, getCard } from './cards.controller.js';
import { backfillQidChains } from '../wikipedia/backfill.service.js';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';

export const cardsRouter: ExpressRouter = Router();

cardsRouter.get('/', requireAuth, getCollection);

// Check whether specific cards have had their qidChain populated by background enrichment
cardsRouter.get('/qids-ready', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = String(req.query['ids'] ?? '').split(',').filter(Boolean).slice(0, 20);
    if (ids.length === 0) {
      res.json({ data: { allReady: true, qidData: {} } });
      return;
    }
    const cards = await prisma.card.findMany({
      where: { id: { in: ids } },
      select: { id: true, qidChain: true },
    });
    const qidData: Record<string, unknown> = {};
    let readyCount = 0;
    for (const card of cards) {
      const chain = card.qidChain as unknown[];
      qidData[card.id] = chain;
      if (chain.length > 0) readyCount++;
    }
    res.json({ data: { allReady: readyCount === ids.length, qidData } });
  } catch (e) { next(e); }
});

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
