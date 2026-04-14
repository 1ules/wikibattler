import type { Request, Response, NextFunction } from 'express';
import { getUserCollection, getUserCard } from './cards.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function getCollection(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const page = Number(req.query['page'] ?? 1);
    const pageSize = Math.min(Number(req.query['pageSize'] ?? 20), 100);
    const result = await getUserCollection(req.user.sub, page, pageSize);
    res.json({ data: result });
  } catch (e) { next(e); }
}

export async function getCard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const card = await getUserCard(req.user.sub, String(req.params['id'] ?? ''));
    if (!card) throw new AppError(404, 'NotFound', 'Card not found.');
    res.json({ data: card });
  } catch (e) { next(e); }
}
