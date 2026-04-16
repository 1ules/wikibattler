import type { Request, Response, NextFunction } from 'express';
import { getPackState, openPack, openPityPack } from './packs.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { PityTier } from './packs.service.js';

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

export async function postOpenPity(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, 'Unauthorized', 'Authentication required.');
    const { tier } = req.body as { tier?: string };
    if (tier !== 'SR' && tier !== 'UR') {
      throw new AppError(400, 'BadRequest', 'tier must be "SR" or "UR".');
    }
    const result = await openPityPack(req.user.sub, tier as PityTier);
    res.json({ data: result });
  } catch (e) { next(e); }
}
