import type { Request, Response, NextFunction } from 'express';
import { getPackState, openPack } from './packs.service.js';
import { AppError } from '../../middleware/errorHandler.js';

export async function getState(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const state = await getPackState(req.user.sub);
    res.json({ data: state });
  } catch (e) { next(e); }
}

export async function postOpen(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const result = await openPack(req.user.sub);
    res.json({ data: result });
  } catch (e) { next(e); }
}
