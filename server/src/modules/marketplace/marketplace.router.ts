import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { requireRegistered } from '../../middleware/auth.js';
import { z } from 'zod';
import { listCard, buyCard, getListings } from './marketplace.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

export const marketplaceRouter: ExpressRouter = Router();

marketplaceRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query['page'] ?? 1);
    const result = await getListings(page);
    res.json({ data: result });
  } catch (e) { next(e); }
});

marketplaceRouter.post('/list', requireRegistered, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const { userCardId, price } = z.object({
      userCardId: z.string().uuid(),
      price: z.number().int().positive(),
    }).parse(req.body);
    const listing = await listCard(req.user.sub, userCardId, price);
    res.status(201).json({ data: listing });
  } catch (e) { next(e); }
});

marketplaceRouter.post('/buy/:listingId', requireRegistered, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const result = await buyCard(req.user.sub, String(req.params['listingId'] ?? ''));
    res.json({ data: result });
  } catch (e) { next(e); }
});
